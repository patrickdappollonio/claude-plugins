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
  --port <n>      Port to listen on (default: random free port)
  --host [addr]   Address to bind (default: 127.0.0.1). Bare --host binds
                  0.0.0.0 — all interfaces, including LAN/Tailscale. There is
                  no authentication, so only do this on networks you trust.
  --no-watch      Disable live reload
  -h, --help      Show this help
`);
}

const args = process.argv.slice(2);
const opts = { dir: process.cwd(), port: 0, host: '127.0.0.1', watch: true };

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '-h' || a === '--help') { usage(); process.exit(0); }
  else if (a === '--port') opts.port = Number(args[++i]);
  else if (a === '--host') {
    // Astro-style: a bare --host (no value, or next token is another flag)
    // binds all interfaces so LAN/Tailscale peers can reach the server.
    const next = args[i + 1];
    if (next === undefined || next.startsWith('-')) opts.host = '0.0.0.0';
    else opts.host = args[++i];
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

const { url, port } = await startServer(opts);
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
