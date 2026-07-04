#!/usr/bin/env node
import { startServer } from '../lib/server.js';
import { resolve } from 'node:path';
import { statSync } from 'node:fs';
import { networkInterfaces } from 'node:os';

function usage() {
  console.log(`Usage: visual-docs-server [dir] [options]

Serves every markdown file under <dir> (default: current directory) as a
rendered visual document with Mermaid diagrams, highlighted code, rich
diffs, styled DB migrations, live reload, and reviewer comments.

Options:
  --port <n>       Port to listen on (default: random free port)
  --host           Bind 0.0.0.0 — all interfaces, including LAN/Tailscale.
                   No authentication, so only on networks you trust.
  --host=<addr>    Bind a specific address (default: 127.0.0.1)
  --no-watch       Disable live reload
  -h, --help       Show this help
`);
}

/** A token is a bind address only if it isn't a path and isn't an existing directory. */
function looksLikeHost(token) {
  if (!token || token.startsWith('.') || token.includes('/') || token.includes('\\')) return false;
  try {
    if (statSync(token).isDirectory()) return false;
  } catch {
    /* not a filesystem entry — fine */
  }
  return true;
}

const args = process.argv.slice(2);
const opts = { dir: process.cwd(), port: 0, host: '127.0.0.1', watch: true };

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '-h' || a === '--help') { usage(); process.exit(0); }
  else if (a === '--port') opts.port = Number(args[++i]);
  else if (a.startsWith('--host=')) opts.host = a.slice('--host='.length) || '0.0.0.0';
  else if (a === '--host') {
    // Astro-style: bare --host binds all interfaces. Only consume the next
    // token as an address when it actually looks like one — never swallow a
    // trailing directory argument (e.g. `--host ./docs`).
    const next = args[i + 1];
    if (next && !next.startsWith('-') && looksLikeHost(next)) opts.host = args[++i];
    else opts.host = '0.0.0.0';
  }
  else if (a === '--no-watch') opts.watch = false;
  else if (!a.startsWith('-')) opts.dir = resolve(a);
  else { console.error(`Unknown option: ${a}`); usage(); process.exit(1); }
}

if (Number.isNaN(opts.port) || opts.port < 0 || opts.port > 65535) {
  console.error('Invalid --port value');
  process.exit(1);
}

try {
  if (!statSync(opts.dir).isDirectory()) {
    console.error(`Not a directory: ${opts.dir}`);
    process.exit(1);
  }
} catch {
  console.error(`Directory not found: ${opts.dir}`);
  process.exit(1);
}

let started;
try {
  started = await startServer(opts);
} catch (err) {
  const reason = err && err.code === 'EADDRINUSE' ? `port ${opts.port} already in use`
    : err && err.code === 'EACCES' ? `permission denied binding ${opts.host}:${opts.port}`
    : (err && err.message) || String(err);
  console.error(`Failed to start server: ${reason}`);
  process.exit(1);
}
const { url, port } = started;
console.log(`Serving ${opts.dir}`);
console.log(`VISUAL_DOCS_URL=${url}`);
if (opts.host === '0.0.0.0' || opts.host === '::') {
  for (const ifaces of Object.values(networkInterfaces())) {
    for (const iface of ifaces || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`Network: http://${iface.address}:${port}/`);
      }
    }
  }
}
console.log('Press Ctrl+C to stop.');
