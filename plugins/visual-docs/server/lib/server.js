import http from 'node:http';
import { promises as fs, watch } from 'node:fs';
import { join, resolve, relative, extname, dirname, sep, isAbsolute, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import os from 'node:os';

const ASSETS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

const MIME = {
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.md': 'text/markdown; charset=utf-8',
};

const IGNORED_DIRS = new Set(['node_modules', '.git', '.visual-docs']);

// Extensions the plugin's own /assets/ dir may serve (our vendored renderer libs).
const ASSET_EXTS = new Set(['.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.woff', '.woff2', '.ttf', '.otf', '.ico', '.md']);
// A document may reference only images via /files/ (markdown is served through
// /api/doc). The extension is a fast pre-filter; the real gate is content
// sniffing below, so a mislabeled non-image file is never served.
const FILE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg', '.ico', '.bmp']);

/** Detect an image type from magic bytes; returns a MIME string or null. SVG is
    XML text, so it's matched by leading token. This is what actually decides
    whether a /files/ response is served — the extension only narrows the set. */
function sniffImage(buf) {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 6) {
    const g = buf.toString('latin1', 0, 6);
    if (g === 'GIF87a' || g === 'GIF89a') return 'image/gif';
  }
  if (buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'image/webp';
  if (buf.length >= 12 && buf.toString('latin1', 4, 8) === 'ftyp' && /avif|avis/.test(buf.toString('latin1', 8, 12))) return 'image/avif';
  // BMP: "BM" + the two reserved fields (bfReserved1/bfReserved2, bytes 6-9, both
  // must be zero — read here as one uint32) — more than the 2-byte magic so an
  // arbitrary file starting with "BM" isn't accepted.
  if (buf.length >= 14 && buf[0] === 0x42 && buf[1] === 0x4d && buf.readUInt32LE(6) === 0) return 'image/bmp';
  if (buf.length >= 4 && buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00) return 'image/x-icon';
  // SVG is XML text; allow an optional XML declaration, DOCTYPE, and comments
  // before the root <svg> (common in Illustrator/Inkscape exports).
  const head = buf.slice(0, 1024).toString('utf8').replace(/^﻿/, '');
  if (/^\s*(<\?xml\b[^>]*\?>\s*)?(<!DOCTYPE\b[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(head)) return 'image/svg+xml';
  return null;
}

// Guardrails for the on-disk comment store.
const MAX_COMMENT_LEN = 8000;
const MAX_COMMENTS = 2000;
const MAX_SSE_CLIENTS = 64;
// A single markdown doc is read whole into memory + JSON; cap it so a stray huge
// file can't balloon the response.
const MAX_DOC_BYTES = 8 * 1024 * 1024;

function isInside(baseReal, p) {
  const rel = relative(baseReal, p);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

/** Lexically resolve a URL path against base, refusing `..` escapes and absolute paths. */
function safeJoin(base, relPath) {
  let cleaned;
  try {
    cleaned = decodeURIComponent(relPath);
  } catch {
    return null;
  }
  cleaned = cleaned.replace(/^\/+/, '');
  const abs = resolve(base, cleaned);
  if (!isInside(base, abs)) return null;
  return abs;
}

/** True if any path segment between baseReal and abs is a dotfile or an ignored directory. */
function hasHiddenSegment(baseReal, abs) {
  const rel = relative(baseReal, abs);
  if (!rel) return false;
  return rel.split(sep).some((seg) => seg.startsWith('.') || IGNORED_DIRS.has(seg));
}

/**
 * Resolve a request path to a real file inside baseReal, or null if it escapes,
 * hides behind a dotfile/ignored dir, resolves through a symlink pointing outside,
 * or has a disallowed extension. This is the single access gate for served files.
 */
async function resolveServable(baseReal, relPath, exts) {
  const absLex = safeJoin(baseReal, relPath);
  if (!absLex) return null;
  if (hasHiddenSegment(baseReal, absLex)) return null;
  if (exts && !exts.has(extname(absLex).toLowerCase())) return null;
  let real;
  try {
    real = await fs.realpath(absLex);
  } catch {
    return null;
  }
  if (!isInside(baseReal, real)) return null;
  // Re-check the RESOLVED path: a symlink with a non-hidden name could point at a
  // dotfile or ignored dir (e.g. .visual-docs, .git) that the lexical check on the
  // requested path could not see.
  if (hasHiddenSegment(baseReal, real)) return null;
  return real;
}

/** First real H1 title, skipping any `#` line inside a fenced code block. */
function firstH1(text) {
  let inFence = false;
  for (const line of text.split('\n')) {
    if (/^```/.test(line)) { inFence = !inFence; continue; }
    if (!inFence) {
      const m = line.match(/^#\s+(.+)$/);
      if (m) return m[1].trim();
    }
  }
  return null;
}

/** Read only the first `bytes` of a file (enough to find the H1) instead of the whole thing. */
async function readHead(file, bytes = 8192) {
  const fh = await fs.open(file, 'r');
  try {
    const buf = Buffer.alloc(bytes);
    const { bytesRead } = await fh.read(buf, 0, bytes, 0);
    return buf.subarray(0, bytesRead).toString('utf8');
  } finally {
    await fh.close();
  }
}

/** Best-effort 1-based source line for a comment, found by searching the current
    doc for a representative string (quote / fence hint / heading). Lets a caller
    that POSTs to /api/comments without a `line` (e.g. an agent, not the browser)
    still get path:line context in the digest. */
// Reduce a string to lowercase alphanumeric words so a *rendered* quote can be
// matched against *raw* markdown — bold/italic/`code`/[links]/smart-quotes and
// other syntax collapse away on both sides. (Mirrors normalizeForLineMatch in
// the client; keep the two in sync.)
function normalizeForLineMatch(s) {
  return (s || '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // [text](url) / ![alt](url) -> visible text only
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/^ | $/g, '');
}
async function resolveCommentLine(baseReal, path, comment) {
  if (!path || !/\.(md|markdown)$/i.test(path)) return null;
  const a = comment.anchor;
  let raw = '';
  if (a && a.kind === 'text') raw = a.quote;
  else if (a && a.kind === 'component') raw = a.hint;
  else if (comment.title || comment.section) raw = comment.title || comment.section;
  const needle = normalizeForLineMatch(raw).slice(0, 40).trim();
  if (needle.length < 3) return null;
  try {
    const abs = await resolveServable(baseReal, path, null);
    if (!abs) return null;
    const norm = (await fs.readFile(abs, 'utf8')).split('\n').map(normalizeForLineMatch);
    for (let i = 0; i < norm.length; i++) {
      if (norm[i].includes(needle)) return i + 1;
    }
    // The quote may straddle a source line break (soft-wrapped prose); retry
    // across a two-line sliding window before giving up.
    for (let i = 0; i < norm.length - 1; i++) {
      if (`${norm[i]} ${norm[i + 1]}`.includes(needle)) return i + 1;
    }
  } catch { /* ignore */ }
  return null;
}

async function serveStatic(res, baseReal, relPath, exts, { verifyImage = false } = {}) {
  const abs = await resolveServable(baseReal, relPath, exts);
  if (!abs) { res.writeHead(404); return res.end('not found'); }
  let content;
  try {
    content = await fs.readFile(abs);
  } catch {
    res.writeHead(404);
    return res.end('not found');
  }
  const headers = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
  if (verifyImage) {
    // The file must actually BE an image, not just be named like one.
    const mime = sniffImage(content);
    if (!mime) { res.writeHead(404); return res.end('not found'); }
    headers['content-type'] = mime;
    // A directly-navigated SVG could otherwise run inline script; lock it down.
    if (mime === 'image/svg+xml') headers['content-security-policy'] = "default-src 'none'; style-src 'unsafe-inline'";
  } else {
    headers['content-type'] = MIME[extname(abs).toLowerCase()] || 'application/octet-stream';
  }
  res.writeHead(200, headers);
  return res.end(content);
}

async function listMarkdownFiles(root, dir = root, out = []) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith('.') || IGNORED_DIRS.has(e.name)) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      await listMarkdownFiles(root, full, out);
    } else if (e.isFile() && /\.(md|markdown)$/i.test(e.name)) {
      // One unreadable/just-deleted file must not sink the whole listing.
      try {
        const stat = await fs.stat(full);
        const head = await readHead(full);
        out.push({
          path: relative(root, full).split(sep).join('/'),
          title: firstH1(head) || e.name,
          mtime: stat.mtimeMs,
        });
      } catch {
        continue;
      }
    }
  }
  out.sort((a, b) => b.mtime - a.mtime);
  return out;
}

function commentsFile(root) {
  return join(root, '.visual-docs', 'comments.json');
}

/** Move an unreadable comments file aside so it isn't silently overwritten, and
    say so on stderr (the operator's terminal) instead of vanishing the data. */
async function quarantineComments(file, why) {
  const dest = `${file}.corrupt-${Date.now()}`;
  try { await fs.rename(file, dest); } catch { /* best effort */ }
  console.error(`[visual-docs] comments store ${file} was unreadable (${why}); quarantined to ${dest}, starting from empty.`);
  return { data: { comments: [] }, hash: null };
}

/** Read + validate the comment store, returning the parsed data and a hash of
    the on-disk bytes (null if absent) for optimistic-concurrency writes. A file
    that is missing is normal; one that is unparseable OR the wrong shape (a bad
    hand-edit) is quarantined and treated as empty. */
async function readCommentsRaw(root) {
  const file = commentsFile(root);
  let raw;
  try {
    raw = await fs.readFile(file, 'utf8');
  } catch (err) {
    if (err && err.code !== 'ENOENT') return quarantineComments(file, err.message);
    return { data: { comments: [] }, hash: null };
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return quarantineComments(file, 'invalid JSON');
  }
  if (!parsed || !Array.isArray(parsed.comments)) {
    return quarantineComments(file, 'unexpected shape (no comments array)');
  }
  return { data: parsed, hash: createHash('sha1').update(raw).digest('hex') };
}

async function readComments(root) {
  return (await readCommentsRaw(root)).data;
}

/** Atomically replace the comment store. When `expectedHash` is given, bail
    (return false) if the file changed since it was read — so a server write can't
    clobber a concurrent hand-edit by the agent, and vice-versa. */
async function writeComments(root, data, expectedHash) {
  const file = commentsFile(root);
  await fs.mkdir(dirname(file), { recursive: true });
  if (expectedHash !== undefined) {
    let currentHash = null;
    try { currentHash = createHash('sha1').update(await fs.readFile(file, 'utf8')).digest('hex'); } catch { currentHash = null; }
    if (currentHash !== expectedHash) return false;
  }
  // Atomic replace: write to a temp file, then rename over the target so a
  // crash mid-write can never truncate the real file.
  const tmp = `${file}.tmp-${process.pid}`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + '\n');
  await fs.rename(tmp, file);
  return true;
}

const VIEW_MODES = ['unified', 'side-by-side'];

/** Per-user viewer preferences (currently just the diff/migration view mode),
    stored OUTSIDE the served dir so they persist across sessions/agents/docs.
    Deliberately not in .visual-docs/ (that lives inside the served directory
    and is per-project); this is a global, per-machine-user setting. */
function prefsFile() {
  const configHome = process.env.XDG_CONFIG_HOME
    || (process.platform === 'win32' ? process.env.APPDATA : join(os.homedir(), '.config'));
  return join(configHome, 'visual-docs', 'prefs.json');
}

/** Tolerate a missing/corrupt prefs file as "no preference yet" rather than erroring. */
async function readPrefs() {
  try {
    const raw = await fs.readFile(prefsFile(), 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Atomic replace (tmp file + rename), same idiom as writeComments. */
async function writePrefs(data) {
  const file = prefsFile();
  await fs.mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + '\n');
  await fs.rename(tmp, file);
}

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(body);
}

async function readBody(req, limit = 1024 * 1024) {
  return new Promise((resolveBody, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** Accept only the anchor shapes the viewer produces, clamped to safe sizes,
    so a client can't stuff arbitrary data into the store. */
function sanitizeAnchor(a) {
  if (!a || typeof a !== 'object') return null;
  const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
  if (a.kind === 'text') {
    const quote = str(a.quote, 2000);
    if (!quote) return null;
    return { kind: 'text', quote, prefix: str(a.prefix, 200), suffix: str(a.suffix, 200) };
  }
  if (a.kind === 'component') {
    const type = str(a.type, 60);
    if (!type) return null;
    return { kind: 'component', type, label: str(a.label, 120) || type, id: str(a.id, 32), hint: str(a.hint, 120) };
  }
  return null;
}

/** A short human label for what a comment is anchored to (section, quoted text,
    or a component), for the agent-facing markdown digest. */
function anchorLabel(c) {
  if (c.anchor && c.anchor.kind === 'text' && c.anchor.quote) {
    const q = c.anchor.quote.replace(/\s+/g, ' ').trim();
    return `“${q.length > 100 ? q.slice(0, 100) + '…' : q}”`;
  }
  if (c.anchor && c.anchor.kind === 'component') {
    const a = c.anchor;
    const base = a.label || a.type || 'component';
    const ref = [a.id && `id ${a.id}`, a.hint && `“${a.hint}”`].filter(Boolean).join(' · ');
    return ref ? `${base} [${ref}]` : base;
  }
  return c.title || c.section || 'document';
}

const COMMENT_STATUSES = ['new', 'acknowledged', 'resolved'];

/** A comment's lifecycle state. Prefers an explicit `status`; falls back to the
    legacy `resolved` boolean so older comments.json files keep working.
    NOTE: duplicated in assets/app.js (commentStatus) — no shared module across
    the Node/browser split; keep the two in sync. */
function commentStatus(c) {
  if (c && COMMENT_STATUSES.includes(c.status)) return c.status;
  return c && c.resolved ? 'resolved' : 'new';
}

/** Render a comment list as a ready-to-read markdown digest, grouped by document
    with open comments first. Served at /agent/comments.md so an agent can read
    feedback with a plain `curl` instead of parsing JSON. */
function renderCommentsMarkdown(comments, scopePath, base = 'http://127.0.0.1') {
  if (!comments.length) {
    return `# Comments${scopePath ? ` for ${scopePath}` : ''}\n\n_No comments yet._\n`;
  }
  const open = comments.filter((c) => commentStatus(c) !== 'resolved');
  const resolved = comments.length - open.length;
  const byPath = new Map();
  for (const c of open) {
    const key = c.path || '(document)';
    if (!byPath.has(key)) byPath.set(key, []);
    byPath.get(key).push(c);
  }
  let out = `# Open comments (${open.length})\n`;
  // Tool-neutral: the skill runs a `--status` CLI command; direct API/curl users
  // get the endpoint. Either way, never hand-edit comments.json.
  out += '\n_Lifecycle: mark a comment `acknowledged` when you start it and `resolved` when done — set status with your skill\'s status command (each comment\'s id is shown below), or `POST /api/comments/status` with `{"id":"<id>","status":"<state>"}` (pass `"ids":[…]` for several). Valid statuses: `new`, `acknowledged`, `resolved`. Don\'t hand-edit `.visual-docs/comments.json`._\n';
  if (!open.length) out += '\n_No open comments._\n';
  for (const [p, list] of byPath) {
    out += `\n## ${p}\n`;
    for (const c of list) {
      const loc = `${p}${c.line ? `:${c.line}` : ''}`;
      out += `\n- \`${loc}\` — [${commentStatus(c)}] \`${c.id}\` — on ${anchorLabel(c)}\n  > ${String(c.text || '').replace(/\n+/g, ' ')}`;
    }
    out += '\n';
  }
  if (resolved) out += `\n---\n_${resolved} resolved comment(s) not shown._\n`;
  return out;
}

/** Reject a state-changing request whose Origin is a different host than the one it hit. */
function crossOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false; // non-browser client (curl, the agent) — allowed
  try {
    return new URL(origin).host !== req.headers.host;
  } catch {
    return true; // unparseable Origin → treat as cross-origin
  }
}

export async function startServer({ dir, port = 0, host = '127.0.0.1', watch: enableWatch = true }) {
  const root = resolve(dir);
  const rootReal = await fs.realpath(root).catch(() => root);
  const assetsReal = await fs.realpath(ASSETS_DIR).catch(() => ASSETS_DIR);
  const sseClients = new Set();
  const shellHTML = await fs.readFile(join(ASSETS_DIR, 'index.html'), 'utf8');

  // Serialize comment read-modify-write so concurrent POSTs can't clobber each other.
  let commentsChain = Promise.resolve();
  function withComments(fn) {
    const run = commentsChain.then(fn, fn);
    commentsChain = run.then(() => {}, () => {});
    return run;
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pathname = url.pathname;

      if (pathname === '/api/docs' && req.method === 'GET') {
        return sendJSON(res, 200, { docs: await listMarkdownFiles(root) });
      }

      if (pathname === '/api/doc' && req.method === 'GET') {
        const p = url.searchParams.get('path') || '';
        if (!/\.(md|markdown)$/i.test(p)) return sendJSON(res, 400, { error: 'invalid path' });
        const abs = await resolveServable(rootReal, p, null);
        if (!abs) return sendJSON(res, 404, { error: 'not found' });
        try {
          const stat = await fs.stat(abs);
          if (stat.size > MAX_DOC_BYTES) return sendJSON(res, 413, { error: `document exceeds ${MAX_DOC_BYTES} bytes` });
          const content = await fs.readFile(abs, 'utf8');
          return sendJSON(res, 200, { path: p, content, mtime: stat.mtimeMs });
        } catch {
          return sendJSON(res, 404, { error: 'not found' });
        }
      }

      if (pathname === '/api/comments' && req.method === 'GET') {
        const data = await readComments(root);
        const p = url.searchParams.get('path');
        const comments = p ? data.comments.filter((c) => c.path === p) : data.comments;
        return sendJSON(res, 200, { comments });
      }

      if (pathname === '/api/comments' && req.method === 'POST') {
        if (crossOrigin(req)) return sendJSON(res, 403, { error: 'cross-origin request refused' });
        let payload;
        try {
          payload = JSON.parse(await readBody(req));
        } catch {
          return sendJSON(res, 400, { error: 'invalid JSON body' });
        }
        if (!payload || typeof payload !== 'object') return sendJSON(res, 400, { error: 'body must be a JSON object' });
        const text = typeof payload.text === 'string' ? payload.text.trim() : '';
        if (!text) return sendJSON(res, 400, { error: 'text is required' });
        if (text.length > MAX_COMMENT_LEN) return sendJSON(res, 413, { error: `text exceeds ${MAX_COMMENT_LEN} chars` });
        // A comment is anchored to exactly one thing. A text/component anchor
        // wins; only a section/heading comment carries section/title.
        const anchor = sanitizeAnchor(payload.anchor);
        // An anchor was sent but didn't survive validation — reject rather than
        // silently degrade the comment to document-level.
        if (payload.anchor && typeof payload.anchor === 'object' && !anchor) {
          return sendJSON(res, 400, { error: 'invalid anchor' });
        }
        const clamp = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
        const comment = {
          id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          path: clamp(payload.path, 1024),
          section: anchor ? '' : clamp(payload.section, 300),
          title: anchor ? '' : clamp(payload.title, 300),
          anchor,
          // Best-effort 1-based source line the client resolved from the doc,
          // so the digest can point the agent at path:line.
          line: Number.isInteger(payload.line) && payload.line > 0 ? payload.line : null,
          text,
          createdAt: new Date().toISOString(),
          status: 'new',
          resolved: false,
        };
        // The browser resolves `line` client-side; a direct API caller may not,
        // so fill it in from the current doc when it's missing.
        if (comment.line === null) comment.line = await resolveCommentLine(rootReal, comment.path, comment);

        const result = await withComments(async () => {
          // Optimistic-concurrency retry: if the file changed under us (e.g. the
          // agent hand-edited a status), re-read and re-append instead of
          // clobbering that edit.
          for (let attempt = 0; attempt < 2; attempt++) {
            const { data, hash } = await readCommentsRaw(root);
            if (data.comments.length >= MAX_COMMENTS) return { error: 'comment limit reached' };
            data.comments.push(comment);
            if (await writeComments(root, data, hash)) return { comment };
          }
          return { error: 'write conflict — please retry' };
        });
        if (result.error) return sendJSON(res, 409, { error: result.error });
        broadcast({ type: 'comment', path: result.comment.path });
        return sendJSON(res, 201, { comment: result.comment });
      }

      // Agent-facing status endpoint: flip a comment's lifecycle state without
      // hand-editing comments.json. Accepts { id } or { ids: [...] } plus a
      // target { status }. Keeps the legacy `resolved` boolean in sync.
      if (pathname === '/api/comments/status' && req.method === 'POST') {
        if (crossOrigin(req)) return sendJSON(res, 403, { error: 'cross-origin request refused' });
        let payload;
        try {
          payload = JSON.parse(await readBody(req));
        } catch {
          return sendJSON(res, 400, { error: 'invalid JSON body' });
        }
        if (!payload || typeof payload !== 'object') return sendJSON(res, 400, { error: 'body must be a JSON object' });
        if (!COMMENT_STATUSES.includes(payload.status)) {
          return sendJSON(res, 400, { error: `status must be one of: ${COMMENT_STATUSES.join(', ')}` });
        }
        const idSet = new Set();
        if (typeof payload.id === 'string') idSet.add(payload.id);
        if (Array.isArray(payload.ids)) for (const x of payload.ids) if (typeof x === 'string') idSet.add(x);
        if (!idSet.size) return sendJSON(res, 400, { error: 'id or ids is required' });

        const result = await withComments(async () => {
          // Same optimistic-concurrency retry as the POST path: re-read on a
          // hash miss so a concurrent write (or hand edit) isn't clobbered.
          for (let attempt = 0; attempt < 3; attempt++) {
            const { data, hash } = await readCommentsRaw(root);
            const updated = [];
            for (const c of data.comments) {
              if (!idSet.has(c.id)) continue;
              c.status = payload.status;
              c.resolved = payload.status === 'resolved'; // keep legacy flag in sync
              updated.push(c);
            }
            if (!updated.length) return { notFound: true };
            if (await writeComments(root, data, hash)) return { updated };
          }
          return { error: 'write conflict — please retry' };
        });
        if (result.notFound) return sendJSON(res, 404, { error: 'no comment matched the given id(s)' });
        if (result.error) return sendJSON(res, 409, { error: result.error });
        broadcast({ type: 'comment', path: result.updated[0].path });
        return sendJSON(res, 200, { updated: result.updated.length, comments: result.updated });
      }

      // Agent-facing read endpoint: comments as a ready-to-read markdown digest
      // an agent can curl directly (structured JSON already lives at /api/comments).
      if (pathname === '/agent/comments.md' && req.method === 'GET') {
        const data = await readComments(root);
        const p = url.searchParams.get('path');
        const comments = p ? data.comments.filter((c) => c.path === p) : data.comments;
        const base = `http://${req.headers.host || '127.0.0.1'}`;
        res.writeHead(200, { 'content-type': 'text/markdown; charset=utf-8', 'cache-control': 'no-store' });
        return res.end(renderCommentsMarkdown(comments, p, base));
      }

      // Global, per-machine-user viewer preference (currently: diff/migration
      // view mode). Stored outside the served dir — see prefsFile().
      if (pathname === '/api/prefs' && req.method === 'GET') {
        const prefs = await readPrefs();
        return sendJSON(res, 200, { viewMode: VIEW_MODES.includes(prefs.viewMode) ? prefs.viewMode : null });
      }

      if (pathname === '/api/prefs' && req.method === 'POST') {
        if (crossOrigin(req)) return sendJSON(res, 403, { error: 'cross-origin request refused' });
        let payload;
        try {
          payload = JSON.parse(await readBody(req));
        } catch {
          return sendJSON(res, 400, { error: 'invalid JSON body' });
        }
        if (!payload || typeof payload !== 'object') return sendJSON(res, 400, { error: 'body must be a JSON object' });
        if (!VIEW_MODES.includes(payload.viewMode)) {
          return sendJSON(res, 400, { error: `viewMode must be one of: ${VIEW_MODES.join(', ')}` });
        }
        const prefs = await readPrefs();
        prefs.viewMode = payload.viewMode;
        try {
          await writePrefs(prefs);
        } catch (err) {
          return sendJSON(res, 500, { error: `failed to persist preference: ${err.message}` });
        }
        return sendJSON(res, 200, { viewMode: prefs.viewMode });
      }

      if (pathname === '/api/events' && req.method === 'GET') {
        if (sseClients.size >= MAX_SSE_CLIENTS) {
          res.writeHead(503, { 'content-type': 'text/plain' });
          return res.end('too many live-reload clients');
        }
        res.writeHead(200, {
          'content-type': 'text/event-stream',
          'cache-control': 'no-store',
          connection: 'keep-alive',
        });
        res.write(': connected\n\n');
        sseClients.add(res);
        const ping = setInterval(() => res.write(': ping\n\n'), 25000);
        const drop = () => { clearInterval(ping); sseClients.delete(res); };
        req.on('close', drop);
        res.on('error', drop); // a reset socket must not throw an unhandled 'error'
        return;
      }

      if (pathname.startsWith('/assets/') && req.method === 'GET') {
        return serveStatic(res, assetsReal, pathname.slice('/assets/'.length), ASSET_EXTS);
      }

      // Serve images referenced by docs (content-verified; never source/secrets).
      if (pathname.startsWith('/files/') && req.method === 'GET') {
        return serveStatic(res, rootReal, pathname.slice('/files/'.length), FILE_EXTS, { verifyImage: true });
      }

      // Everything else gets the single-page shell; the client routes.
      if (req.method === 'GET') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        return res.end(shellHTML);
      }

      res.writeHead(405);
      res.end('method not allowed');
    } catch (err) {
      // Log to the operator's terminal — the 500 body alone is invisible unless
      // they happen to have DevTools open.
      console.error(`[visual-docs] request error on ${req.method} ${req.url}:`, err);
      res.writeHead(500, { 'content-type': 'text/plain' });
      res.end(`internal error: ${err.message}`);
    }
  });

  function broadcast(event) {
    const msg = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(msg);
      } catch {
        sseClients.delete(client); // drop dead clients instead of throwing
      }
    }
  }

  if (enableWatch) {
    let debounce = null;
    const onChange = (eventType, filename) => {
      const name = filename ? String(filename) : '';
      // A direct edit to the comments store must reach live viewers too.
      if (name && basename(name) === 'comments.json') {
        broadcast({ type: 'comment', path: '' });
        return;
      }
      if (name && !/\.(md|markdown)$/i.test(name)) return;
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        broadcast({ type: 'change', path: name ? name.split(sep).join('/') : '' });
      }, 150);
    };
    try {
      watch(root, { recursive: true }, onChange);
    } catch {
      // Recursive watch unsupported on this platform/FS: watch top level only,
      // and say so — nested docs will list but won't live-reload.
      console.warn('[visual-docs] recursive file watching is unavailable here; live-reload only tracks top-level files.');
      watch(root, onChange);
    }
  }

  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolveListen);
  });

  const addr = server.address();
  const displayHost = host === '0.0.0.0' || host === '::' ? 'localhost' : host;
  const url = `http://${displayHost}:${addr.port}/`;
  return { server, url, port: addr.port };
}
