#!/usr/bin/env node
/* Downloads the pinned browser renderer libraries into assets/vendor/ and
   writes assets/vendor/manifest.json — an SBOM-style record of every vendored
   asset (version, source URL, license, size, SHA-384).

   Run with --verify to check the on-disk files against the hashes pinned in
   this script's ASSETS array (the trusted, code-reviewed anchor) instead of
   re-downloading. */

import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const VENDOR_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'vendor');
const MANIFEST = join(VENDOR_DIR, 'manifest.json');
const INDEX_HTML = join(VENDOR_DIR, '..', 'index.html');

/** Match the whole <script>/<link> tag that loads /assets/vendor/<file>. */
function vendorTagRe(file) {
  const esc = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`<(?:script|link)\\b[^>]*?\\b(?:src|href)="/assets/vendor/${esc}"[^>]*?>`, 'g');
}

/** Read a tag's real `integrity` attribute value, or null. The leading
    boundary (start-of-string or whitespace) is required so this does NOT
    match a decoy attribute like `data-integrity="…"`. */
function tagIntegrity(tag) {
  const m = tag.match(/(?:^|\s)integrity="([^"]*)"/);
  return m ? m[1] : null;
}

/** Return { file: integrity|null } for every vendored tag in index.html. */
function indexIntegrities(html) {
  const map = {};
  const re = /<(?:script|link)\b[^>]*?\b(?:src|href)="\/assets\/vendor\/([^"]+)"[^>]*?>/g;
  let m;
  while ((m = re.exec(html))) map[m[1]] = tagIntegrity(m[0]);
  return map;
}

const ASSETS = [
  {
    name: 'marked',
    version: '12.0.2',
    license: 'MIT',
    homepage: 'https://github.com/markedjs/marked',
    url: 'https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js',
    file: 'marked.min.js',
    integrity: 'sha384-/TQbtLCAerC3jgaim+N78RZSDYV7ryeoBCVqTuzRrFec2akfBkHS7ACQ3PQhvMVi',
  },
  {
    name: 'dompurify',
    version: '3.1.6',
    license: '(MPL-2.0 OR Apache-2.0)',
    homepage: 'https://github.com/cure53/DOMPurify',
    url: 'https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',
    file: 'purify.min.js',
    integrity: 'sha384-+VfUPEb0PdtChMwmBcBmykRMDd+v6D/oFmB3rZM/puCMDYcIvF968OimRh4KQY9a',
  },
  {
    name: 'highlight.js',
    version: '11.9.0',
    license: 'BSD-3-Clause',
    homepage: 'https://github.com/highlightjs/highlight.js',
    url: 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/highlight.min.js',
    file: 'highlight.min.js',
    integrity: 'sha384-F/bZzf7p3Joyp5psL90p/p89AZJsndkSoGwRpXcZhleCWhd8SnRuoYo4d0yirjJp',
  },
  {
    name: 'highlight.js-theme-github',
    version: '11.9.0',
    license: 'BSD-3-Clause',
    homepage: 'https://github.com/highlightjs/highlight.js',
    url: 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/styles/github.min.css',
    file: 'hljs-github.min.css',
    integrity: 'sha384-eFTL69TLRZTkNfYZOLM+G04821K1qZao/4QLJbet1pP4tcF+fdXq/9CdqAbWRl/L',
  },
  {
    name: 'highlight.js-theme-github-dark',
    version: '11.9.0',
    license: 'BSD-3-Clause',
    homepage: 'https://github.com/highlightjs/highlight.js',
    url: 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/styles/github-dark.min.css',
    file: 'hljs-github-dark.min.css',
    integrity: 'sha384-wH75j6z1lH97ZOpMOInqhgKzFkAInZPPSPlZpYKYTOqsaizPvhQZmAtLcPKXpLyH',
  },
  {
    name: 'mermaid',
    version: '10.9.1',
    license: 'MIT',
    homepage: 'https://github.com/mermaid-js/mermaid',
    url: 'https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js',
    file: 'mermaid.min.js',
    integrity: 'sha384-WmdflGW9aGfoBdHc4rRyWzYuAjEmDwMdGdiPNacbwfGKxBW/SO6guzuQ76qjnSlr',
  },
  {
    name: 'diff2html',
    version: '3.4.48',
    license: 'MIT',
    homepage: 'https://github.com/rtfpessoa/diff2html',
    url: 'https://cdn.jsdelivr.net/npm/diff2html@3.4.48/bundles/js/diff2html.min.js',
    file: 'diff2html.min.js',
    integrity: 'sha384-1tVmtFdzvhqVP3vQWJmKYvD0uTtR0r+FhlLWw+vG6F/vNDS7yegNMNNHRS12fSyR',
  },
  {
    name: 'diff2html-css',
    version: '3.4.48',
    license: 'MIT',
    homepage: 'https://github.com/rtfpessoa/diff2html',
    url: 'https://cdn.jsdelivr.net/npm/diff2html@3.4.48/bundles/css/diff2html.min.css',
    file: 'diff2html.min.css',
    integrity: 'sha384-iBvSlI3tNrrSIy7s6mvLg+5B2Z/QXbR4L0Pzg1nRf8zkXrz5JF316MLm2igMIpi2',
  },
  {
    name: 'js-yaml',
    version: '4.1.0',
    license: 'MIT',
    homepage: 'https://github.com/nodeca/js-yaml',
    url: 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js',
    file: 'js-yaml.min.js',
    integrity: 'sha384-+pxiN6T7yvpryuJmE1gM9PX7yQit15auDb+ZwwvJOd/4be2Cie5/IuVXgQb/S9du',
  },
  {
    name: 'graphre',
    version: '0.1.3',
    license: 'MIT',
    homepage: 'https://github.com/skanaar/graphre',
    url: 'https://cdn.jsdelivr.net/npm/graphre@0.1.3/dist/graphre.js',
    file: 'graphre.js',
    integrity: 'sha384-+DSRvfJ8fTBtLU9W0M1kWQnn4Ck9VxqJPN5qYz2dFSrn7XP0yyFs/9my1a5vgCbq',
  },
  {
    name: 'nomnoml',
    version: '1.6.2',
    license: 'MIT',
    homepage: 'https://github.com/skanaar/nomnoml',
    url: 'https://cdn.jsdelivr.net/npm/nomnoml@1.6.2/dist/nomnoml.js',
    file: 'nomnoml.js',
    integrity: 'sha384-cQ6kIxrqYsimUdVijvas+DqrYHmHBewKrXNwm/CZzhk3MNRQ1GdsDDt4ZWo5ltIK',
  },
  {
    name: 'preact',
    version: '10.24.3',
    license: 'MIT',
    homepage: 'https://github.com/preactjs/preact',
    url: 'https://cdn.jsdelivr.net/npm/preact@10.24.3/dist/preact.min.js',
    file: 'preact.min.js',
    integrity: 'sha384-8lYmL2zoJxGedi/gyeSimJrBzBq9UP16Q3610f5ILM6krTe3Q3zUwEBjEwokLA0g',
  },
  {
    name: 'preact-hooks',
    version: '10.24.3',
    license: 'MIT',
    homepage: 'https://github.com/preactjs/preact',
    url: 'https://cdn.jsdelivr.net/npm/preact@10.24.3/hooks/dist/hooks.umd.js',
    file: 'preact-hooks.umd.js',
    integrity: 'sha384-3TOXhf2QfKuO2sx5nN6tX0tFWCkocWRxCUu1hkgFl0eIHD/9ZVPE1vF6haC1A+6y',
  },
  {
    name: 'htm',
    version: '3.1.1',
    license: 'Apache-2.0',
    homepage: 'https://github.com/developit/htm',
    url: 'https://cdn.jsdelivr.net/npm/htm@3.1.1/dist/htm.umd.js',
    file: 'htm.umd.js',
    integrity: 'sha384-toVdrLSMaw7Y55MowcKqkmFL/Ek6Sky62NOk0b5sDDZBu2wcoPyyQUt9unDVjXhL',
  },
];

function sha384(buf) {
  return `sha384-${createHash('sha384').update(buf).digest('base64')}`;
}

async function verify() {
  const manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8'));
  const pinned = new Map(ASSETS.map((a) => [a.file, a.integrity]));
  let failed = 0;
  for (const a of manifest.assets) {
    // Anchor to the hash pinned in THIS script's source when present — that
    // value is code-reviewed independently of the generated manifest, so a
    // tampered download + regenerated manifest can't pass silently.
    const anchor = pinned.get(a.file) || a.integrity;
    const anchoredToSource = pinned.has(a.file);
    try {
      const buf = await fs.readFile(join(VENDOR_DIR, a.file));
      const ok = sha384(buf) === anchor;
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${a.file}${anchoredToSource ? '' : ' (manifest-only; add a source-pinned integrity)'}`);
      if (!ok) failed++;
    } catch {
      console.log(`MISS ${a.file}`);
      failed++;
    }
  }
  // Every vendored tag in index.html must carry the correct SRI hash, so a
  // tampered on-disk file is blocked by the browser even though it's same-origin.
  const html = await fs.readFile(INDEX_HTML, 'utf8');
  const inIndex = indexIntegrities(html);
  for (const [file, hash] of pinned) {
    if (!(file in inIndex)) continue; // CSS/JS not referenced in the shell is fine
    if (inIndex[file] !== hash) {
      console.log(`FAIL ${file} (index.html integrity ${inIndex[file] ? 'mismatched' : 'missing'})`);
      failed++;
    }
  }
  if (failed) {
    console.error(`${failed} problem(s) — re-run without --verify to fetch and re-sync index.html, or investigate tampering.`);
    process.exit(1);
  }
  console.log('All vendored assets match the source-pinned hashes (files + index.html SRI).');
}

/** Rewrite index.html so each vendored tag carries integrity="<pinned hash>".
    Strips any existing integrity attribute wherever it sits before re-adding,
    so a reordered tag can never end up with two integrity attributes. */
async function syncIndexIntegrity(byFile) {
  let html = await fs.readFile(INDEX_HTML, 'utf8');
  for (const [file, hash] of Object.entries(byFile)) {
    if (!html.includes(`/assets/vendor/${file}"`)) continue;
    html = html.replace(vendorTagRe(file), (tag) => {
      const stripped = tag.replace(/\s+integrity="[^"]*"/g, '').replace(/\s*>$/, '');
      return `${stripped} integrity="${hash}">`;
    });
  }
  await fs.writeFile(INDEX_HTML, html);
  console.log('Synced index.html SRI attributes.');
}

async function update() {
  await fs.mkdir(VENDOR_DIR, { recursive: true });
  const entries = [];
  for (const a of ASSETS) {
    const res = await fetch(a.url);
    if (!res.ok) {
      console.error(`FAIL ${a.url}: ${res.status}`);
      process.exit(1);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const hash = sha384(buf);
    // If a hash is pinned in source for this version, a mismatched download
    // means the upstream payload changed under a fixed version — refuse it.
    if (a.integrity && a.integrity !== hash) {
      console.error(`FAIL ${a.file}: downloaded payload does not match the source-pinned integrity for ${a.name}@${a.version}`);
      console.error(`  pinned:   ${a.integrity}`);
      console.error(`  received: ${hash}`);
      process.exit(1);
    }
    await fs.writeFile(join(VENDOR_DIR, a.file), buf);
    const entry = {
      name: a.name,
      version: a.version,
      license: a.license,
      homepage: a.homepage,
      source: a.url,
      file: a.file,
      sizeBytes: buf.length,
      integrity: hash,
    };
    entries.push(entry);
    console.log(`ok   ${a.file} (${(buf.length / 1024).toFixed(0)} KiB)`);
  }
  const manifest = {
    $schema: 'SBOM-style manifest of browser libraries vendored into assets/vendor/',
    generatedWith: 'scripts/update-vendor.mjs',
    generatedAt: new Date().toISOString(),
    assets: entries,
  };
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Wrote ${MANIFEST}`);
  await syncIndexIntegrity(Object.fromEntries(entries.map((e) => [e.file, e.integrity])));
}

if (process.argv.includes('--verify')) await verify();
else await update();
