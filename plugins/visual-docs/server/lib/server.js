import http from 'node:http';
import { promises as fs, watch } from 'node:fs';
import { join, resolve, relative, extname, dirname, sep, isAbsolute, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

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
// Extensions a document may reference via /files/ — images, fonts, stylesheets only.
// Deliberately excludes .js/.json/.md/dotfiles so the served repo's source and secrets stay private.
const FILE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg', '.ico', '.bmp', '.css', '.woff', '.woff2', '.ttf', '.otf']);

// Guardrails for the on-disk comment store.
const MAX_COMMENT_LEN = 8000;
const MAX_COMMENTS = 2000;
const MAX_SSE_CLIENTS = 64;

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
  return real;
}

async function serveStatic(res, baseReal, relPath, exts) {
  const abs = await resolveServable(baseReal, relPath, exts);
  if (!abs) { res.writeHead(404); return res.end('not found'); }
  try {
    const content = await fs.readFile(abs);
    res.writeHead(200, {
      'content-type': MIME[extname(abs).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    return res.end(content);
  } catch {
    res.writeHead(404);
    return res.end('not found');
  }
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
        const content = await fs.readFile(full, 'utf8');
        const m = content.match(/^#\s+(.+)$/m);
        out.push({
          path: relative(root, full).split(sep).join('/'),
          title: m ? m[1].trim() : e.name,
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

async function readComments(root) {
  const file = commentsFile(root);
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (err) {
    // ENOENT is normal (no comments yet). A parse error means the file is
    // corrupt — preserve it for recovery instead of silently overwriting.
    if (err && err.code !== 'ENOENT') {
      try { await fs.rename(file, `${file}.corrupt-${Date.now()}`); } catch { /* best effort */ }
    }
    return { comments: [] };
  }
}

async function writeComments(root, data) {
  const file = commentsFile(root);
  await fs.mkdir(dirname(file), { recursive: true });
  // Atomic replace: write to a temp file, then rename over the target so a
  // crash mid-write can never truncate the real file.
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
          const content = await fs.readFile(abs, 'utf8');
          const stat = await fs.stat(abs);
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
        const text = typeof payload.text === 'string' ? payload.text.trim() : '';
        if (!text) return sendJSON(res, 400, { error: 'text is required' });
        if (text.length > MAX_COMMENT_LEN) return sendJSON(res, 413, { error: `text exceeds ${MAX_COMMENT_LEN} chars` });

        const result = await withComments(async () => {
          const data = await readComments(root);
          if (data.comments.length >= MAX_COMMENTS) return { error: 'comment limit reached' };
          const comment = {
            id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            path: typeof payload.path === 'string' ? payload.path : '',
            section: typeof payload.section === 'string' ? payload.section : '',
            title: typeof payload.title === 'string' ? payload.title : '',
            text,
            createdAt: new Date().toISOString(),
            resolved: false,
          };
          data.comments.push(comment);
          await writeComments(root, data);
          return { comment };
        });
        if (result.error) return sendJSON(res, 409, { error: result.error });
        broadcast({ type: 'comment', path: result.comment.path });
        return sendJSON(res, 201, { comment: result.comment });
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

      // Serve image/font/style assets referenced by docs (never source or secrets).
      if (pathname.startsWith('/files/') && req.method === 'GET') {
        return serveStatic(res, rootReal, pathname.slice('/files/'.length), FILE_EXTS);
      }

      // Everything else gets the single-page shell; the client routes.
      if (req.method === 'GET') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        return res.end(shellHTML);
      }

      res.writeHead(405);
      res.end('method not allowed');
    } catch (err) {
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
      // Recursive watch unsupported on this platform/FS: watch top level only.
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
