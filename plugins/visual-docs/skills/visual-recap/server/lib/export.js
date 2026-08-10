// Build a single self-contained HTML file for one served document: the same
// vendored renderer libs used by the live viewer, inlined, plus a small export
// bootstrap in app.js (window.__VD_EXPORT__) that runs the SAME render/hydrate
// pipeline against the embedded markdown. No build step, no network requests —
// the output opens directly from file:// in any modern browser.
import { promises as fs } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveServable, sniffImage, firstH1, MAX_DOC_BYTES, FILE_EXTS } from './server.js';
import { readPluginVersion } from './version.js';

const ASSETS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

// Same order as the <script> tags in assets/index.html — later libs (mermaid,
// diff2html, nomnoml) assume earlier ones (marked, purify, highlight) already
// set their globals.
const VENDOR_JS = [
  'marked.min.js',
  'purify.min.js',
  'highlight.min.js',
  'mermaid.min.js',
  'diff2html.min.js',
  'js-yaml.min.js',
  'graphre.js',
  'nomnoml.js',
  'preact.min.js',
  'preact-hooks.umd.js',
  'htm.umd.js',
];

const IMG_MD_RE = /!\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*"|\s+'[^']*')?\s*\)/g;
const IMG_HTML_RE = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;

/** True for an image reference that's already absolute/off-disk (remote URL,
    data URI, root-relative /files/ path, or an in-page anchor) — none of these
    are candidates for gate-checked inlining. */
function isExternalOrRooted(href) {
  return /^([a-z][a-z0-9+.-]*:)?\/\//i.test(href) || href.startsWith('data:') || href.startsWith('/') || href.startsWith('#');
}

/** Every relative image reference in the raw markdown — both `![]()` syntax
    and literal `<img src>` HTML (marked passes inline HTML through
    untouched, so a doc author's raw `<img>` tags need the same treatment). */
function extractImageRefs(markdown) {
  const refs = new Set();
  let m;
  IMG_MD_RE.lastIndex = 0;
  while ((m = IMG_MD_RE.exec(markdown))) refs.add(m[1]);
  IMG_HTML_RE.lastIndex = 0;
  while ((m = IMG_HTML_RE.exec(markdown))) refs.add(m[1]);
  return [...refs].filter((h) => !isExternalOrRooted(h));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

/** The output filename stem for a doc path: "sub/dir/plan.md" -> "plan". */
export function docStem(docPath) {
  return basename(docPath).replace(/\.(md|markdown)$/i, '') || 'document';
}

/**
 * Build the exported HTML string for one document. Throws an Error with a
 * `.code` of ENOTFOUND (missing/outside the gate) or ETOOBIG (over
 * MAX_DOC_BYTES) on failure — callers map these to HTTP status / CLI exit.
 */
export async function buildExportHtml(rootDir, docPath) {
  const rootReal = await fs.realpath(rootDir);
  if (!/\.(md|markdown)$/i.test(docPath || '')) {
    throw Object.assign(new Error('not a markdown path'), { code: 'ENOTFOUND' });
  }
  const abs = await resolveServable(rootReal, docPath, null);
  if (!abs) throw Object.assign(new Error('document not found or not servable'), { code: 'ENOTFOUND' });
  const stat = await fs.stat(abs);
  if (stat.size > MAX_DOC_BYTES) throw Object.assign(new Error(`document exceeds ${MAX_DOC_BYTES} bytes`), { code: 'ETOOBIG' });
  const markdown = await fs.readFile(abs, 'utf8');
  const title = firstH1(markdown) || basename(abs);
  const version = readPluginVersion() || '0.0.0';

  // Inline every image the gate allows; note (as an HTML comment near the top
  // of the output) any reference the gate rejected instead of silently
  // dropping it — never inline anything outside resolveServable + sniffImage.
  const files = {};
  const rejected = [];
  for (const href of extractImageRefs(markdown)) {
    const imgAbs = await resolveServable(rootReal, href, FILE_EXTS);
    if (!imgAbs) { rejected.push(href); continue; }
    let buf;
    try {
      buf = await fs.readFile(imgAbs);
    } catch {
      rejected.push(href);
      continue;
    }
    const mime = sniffImage(buf);
    if (!mime) { rejected.push(href); continue; }
    const dataUri = `data:${mime};base64,${buf.toString('base64')}`;
    files[href] = dataUri;
    // marked/browsers may percent-encode the href when it lands in the DOM
    // (e.g. a space becomes %20) — index under both forms so the export
    // bootstrap's lookup matches either.
    try {
      const encoded = encodeURI(href);
      if (encoded !== href) files[encoded] = dataUri;
    } catch { /* malformed href — the raw key above is still there */ }
  }

  const [appCss, diffCss, hljsLight, hljsDark] = await Promise.all([
    fs.readFile(join(ASSETS_DIR, 'app.css'), 'utf8'),
    fs.readFile(join(ASSETS_DIR, 'vendor', 'diff2html.min.css'), 'utf8'),
    fs.readFile(join(ASSETS_DIR, 'vendor', 'hljs-github.min.css'), 'utf8'),
    fs.readFile(join(ASSETS_DIR, 'vendor', 'hljs-github-dark.min.css'), 'utf8'),
  ]);
  const vendorJs = await Promise.all(VENDOR_JS.map((f) => fs.readFile(join(ASSETS_DIR, 'vendor', f), 'utf8')));
  const appJs = await fs.readFile(join(ASSETS_DIR, 'app.js'), 'utf8');

  const exportData = {
    path: docPath,
    markdown: Buffer.from(markdown, 'utf8').toString('base64'),
    files,
    version,
  };
  // </script>-safe: none of the vendored/first-party sources contain a literal
  // "</script" (checked at write time), but the embedded JSON can legitimately
  // contain "<" inside markdown/image-path strings, so escape defensively.
  const dataJson = JSON.stringify(exportData).replace(/</g, '\\u003c');

  const warningComment = rejected.length
    ? `<!-- visual-docs export: ${rejected.length} image reference(s) not inlined (blocked by the access gate or unreadable): ${rejected.map(escapeHtml).join(', ')} -->\n`
    : '';

  const scriptTags = vendorJs.map((src) => `<script>\n${src}\n</script>`).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${appCss}</style>
<style>${diffCss}</style>
<style id="hljs-light">${hljsLight}</style>
<style id="hljs-dark" disabled>${hljsDark}</style>
${scriptTags}
</head>
<body>
<!-- generated by visual-docs v${version} -->
${warningComment}<div id="app"></div>
<script>window.__VD_EXPORT__ = ${dataJson};</script>
<script>
${appJs}
</script>
</body>
</html>
`;
}
