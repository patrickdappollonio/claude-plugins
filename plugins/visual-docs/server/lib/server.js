import http from 'node:http';
import { promises as fs, watch, existsSync } from 'node:fs';
import { join, resolve, relative, extname, dirname, sep, isAbsolute } from 'node:path';
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
  '.md': 'text/markdown; charset=utf-8',
};

const IGNORED_DIRS = new Set(['node_modules', '.git', '.visual-docs']);

/** Resolve a URL-provided relative path against root, refusing escapes. */
function safeJoin(root, relPath) {
  let cleaned;
  try {
    cleaned = decodeURIComponent(relPath);
  } catch {
    return null;
  }
  cleaned = cleaned.replace(/^\/+/, '');
  const abs = resolve(root, cleaned);
  const rel = relative(resolve(root), abs);
  if (rel.startsWith('..') || isAbsolute(rel)) return null;
  return abs;
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
      const stat = await fs.stat(full);
      const content = await fs.readFile(full, 'utf8');
      const m = content.match(/^#\s+(.+)$/m);
      out.push({
        path: relative(root, full).split(sep).join('/'),
        title: m ? m[1].trim() : e.name,
        mtime: stat.mtimeMs,
        size: stat.size,
      });
    }
  }
  out.sort((a, b) => b.mtime - a.mtime);
  return out;
}

function commentsFile(root) {
  return join(root, '.visual-docs', 'comments.json');
}

async function readComments(root) {
  try {
    return JSON.parse(await fs.readFile(commentsFile(root), 'utf8'));
  } catch {
    return { comments: [] };
  }
}

async function writeComments(root, data) {
  const file = commentsFile(root);
  await fs.mkdir(dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2) + '\n');
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

export async function startServer({ dir, port = 0, host = '127.0.0.1', watch: enableWatch = true }) {
  const root = resolve(dir);
  const sseClients = new Set();
  let shellHTML = await fs.readFile(join(ASSETS_DIR, 'index.html'), 'utf8');

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pathname = url.pathname;

      if (pathname === '/api/docs' && req.method === 'GET') {
        return sendJSON(res, 200, { docs: await listMarkdownFiles(root) });
      }

      if (pathname === '/api/doc' && req.method === 'GET') {
        const p = url.searchParams.get('path') || '';
        const abs = safeJoin(root, p);
        if (!abs || !/\.(md|markdown)$/i.test(abs)) return sendJSON(res, 400, { error: 'invalid path' });
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
        let payload;
        try {
          payload = JSON.parse(await readBody(req));
        } catch {
          return sendJSON(res, 400, { error: 'invalid JSON body' });
        }
        const text = typeof payload.text === 'string' ? payload.text.trim() : '';
        if (!text) return sendJSON(res, 400, { error: 'text is required' });
        const data = await readComments(root);
        const comment = {
          id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          path: typeof payload.path === 'string' ? payload.path : '',
          section: typeof payload.section === 'string' ? payload.section : '',
          text,
          createdAt: new Date().toISOString(),
          resolved: false,
        };
        data.comments.push(comment);
        await writeComments(root, data);
        broadcast({ type: 'comment', path: comment.path });
        return sendJSON(res, 201, { comment });
      }

      if (pathname === '/api/events' && req.method === 'GET') {
        res.writeHead(200, {
          'content-type': 'text/event-stream',
          'cache-control': 'no-store',
          connection: 'keep-alive',
        });
        res.write(': connected\n\n');
        sseClients.add(res);
        const ping = setInterval(() => res.write(': ping\n\n'), 25000);
        req.on('close', () => {
          clearInterval(ping);
          sseClients.delete(res);
        });
        return;
      }

      if (pathname.startsWith('/assets/') && req.method === 'GET') {
        const abs = safeJoin(ASSETS_DIR, pathname.slice('/assets/'.length));
        if (!abs) { res.writeHead(400); return res.end('bad path'); }
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

      // Serve non-markdown files referenced by docs (images, etc.)
      if (pathname.startsWith('/files/') && req.method === 'GET') {
        const abs = safeJoin(root, pathname.slice('/files/'.length));
        if (!abs) { res.writeHead(400); return res.end('bad path'); }
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
    for (const client of sseClients) client.write(msg);
  }

  if (enableWatch) {
    let debounce = null;
    const onChange = (eventType, filename) => {
      if (filename && !/\.(md|markdown)$/i.test(filename)) return;
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        broadcast({ type: 'change', path: filename ? String(filename).split(sep).join('/') : '' });
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
