#!/usr/bin/env node
import { startServer } from '../lib/server.js';
import { readPluginVersion } from '../lib/version.js';
import { PREF_SCHEMA, prefsFile, readPrefs, sanitizePrefs, updatePrefs } from '../lib/prefs.js';
import { buildExportHtml, docStem } from '../lib/export.js';
import { resolve, join, dirname, basename } from 'node:path';
import { statSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { networkInterfaces, tmpdir } from 'node:os';

function usage() {
  console.log(`Usage: visual-docs-server [dir] [options]

Serves every markdown file under <dir> (default: current directory) as a
rendered visual document with Mermaid diagrams, highlighted code, rich
diffs, styled DB migrations, live reload, and reviewer comments.

The server records itself in <dir>/.visual-docs/server.json, so:
  - starting again for a dir that's already served just prints its URL;
  - --restart replaces the running instance (e.g. to change --host/--port);
  - --stop stops it. No manual PID juggling.

Options:
  --port <n>       Port to listen on (default: random free port)
  --host           Bind 0.0.0.0 — all interfaces, including LAN/Tailscale.
                   No authentication, so only on networks you trust.
  --host=<addr>    Bind a specific address (default: 127.0.0.1)
  --restart        Replace an instance already serving this dir
  --stop           Stop the instance serving this dir, then exit
  --no-watch       Disable live reload
  --docdir         Print a fresh, session-scoped docs directory and exit
                   (cross-platform temp dir; write your .md there, then serve it)
  --serve          Start in the background and print the URL, then return
                   (cross-platform; no nohup/& needed)
  --comments <dir> [<path.md>]
                   Print the open-comments digest for a served dir
  --status <dir> <id[,id2,…]> <state>
                   Set a comment's lifecycle state
                   (new|acknowledged|resolved|dismissed — dismiss only
                   while the comment is still new or acknowledged)
  --prefs [<key> <value>]
                   Print the persisted viewer preferences, or set one
                   (viewMode|theme|navOpen|sidebarTab; no server needed)
  --export <dir> <doc.md> [--out <file>]
                   Build one self-contained HTML file for a doc (no server
                   needed) — full rendering fidelity, works offline from
                   file://. Prints the output path and size.
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

/** Print a `Network: http://<ip>:<port>/` line per external IPv4 interface, when
    bound to all interfaces — so a LAN/Tailscale reviewer has an address to hit.
    Shared by the foreground path and --serve (which can't see the child's stdout). */
function printNetwork(host, port) {
  if (host !== '0.0.0.0' && host !== '::') return;
  for (const ifaces of Object.values(networkInterfaces())) {
    for (const iface of ifaces || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`Network: http://${iface.address}:${port}/`);
      }
    }
  }
}

const lockPath = (dir) => join(dir, '.visual-docs', 'server.json');

function readLock(dir) {
  try {
    return JSON.parse(readFileSync(lockPath(dir), 'utf8'));
  } catch {
    return null;
  }
}

function pidAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0); // signal 0 = existence check
    return true;
  } catch (err) {
    return err.code === 'EPERM'; // alive but not ours still counts as alive
  }
}

/** Whether `pid` is actually a visual-docs-server, not just some live process
    that reused a stale PID — so --stop/--restart never signal an unrelated
    process. On Linux we confirm via /proc/<pid>/cmdline; elsewhere /proc is
    absent, so we fall back to a plain existence check. */
function isOurServer(pid) {
  if (!pidAlive(pid)) return false;
  try {
    const cmd = readFileSync(`/proc/${pid}/cmdline`, 'utf8');
    return cmd.includes('visual-docs-server');
  } catch {
    return true; // /proc unavailable (non-Linux) — can't do better than existence
  }
}

/** The lock of a live server for this dir, or null (stale locks are cleared). */
function liveLock(dir) {
  const lock = readLock(dir);
  if (lock && isOurServer(lock.pid)) return lock;
  if (lock) { try { unlinkSync(lockPath(dir)); } catch { /* ignore */ } }
  return null;
}

/** If the plugin on disk has moved on from the version a live server was
    started with, print one informational line so the agent (or a human
    reading the output) knows a --restart would pick up new capabilities.
    Never errors, never affects exit status — purely informational. */
function printVersionNote(lockVersion) {
  const current = readPluginVersion();
  if (current && lockVersion !== current) {
    console.log(`note: this server is running visual-docs v${lockVersion || 'unknown'} but v${current} is now installed — restart it (node visual-docs-server.js --restart <dir>) to pick up new capabilities.`);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function stopPid(pid) {
  try { process.kill(pid, 'SIGTERM'); } catch { return; }
  for (let i = 0; i < 30 && pidAlive(pid); i++) await sleep(100); // up to ~3s
  if (pidAlive(pid)) { try { process.kill(pid, 'SIGKILL'); } catch { /* ignore */ } }
}

const args = process.argv.slice(2);

// `--docdir`: print a fresh, session-scoped documents directory and exit. Cross-
// platform (os.tmpdir() → %TEMP% on Windows, /tmp or $TMPDIR on Unix), scoped by
// CLAUDE_CODE_SESSION_ID so it's unique per session (fresh each run, no overlap
// with other projects). Skills call this instead of hand-building /tmp paths.
if (args.includes('--docdir')) {
  const safe = (s) => String(s).replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  const sess = safe(process.env.CLAUDE_CODE_SESSION_ID) || String(process.pid);
  const name = `${safe(basename(process.cwd())) || 'docs'}-${sess}`;
  const dir = join(tmpdir(), 'visual-docs', name);
  mkdirSync(dir, { recursive: true });
  process.stdout.write(dir + '\n');
  process.exit(0);
}

// Viewer preferences — direct file access (lib/prefs.js), no server needed.
// Formatted text either way, so an agent never parses JSON:
//   --prefs                → print every persisted preference (and the file path)
//   --prefs <key> <value>  → set one (validated against PREF_SCHEMA)
if (args[0] === '--prefs') {
  const known = Object.keys(PREF_SCHEMA).join(' | ');
  if (args.length === 1) {
    const prefs = sanitizePrefs(await readPrefs());
    console.log(`Viewer preferences (${prefsFile()}):`);
    for (const key of Object.keys(PREF_SCHEMA)) {
      console.log(`  ${key.padEnd(11)} ${key in prefs ? prefs[key] : '(not set — viewer default)'}`);
    }
    process.exit(0);
  }
  const [, key, rawValue] = args;
  if (!key || rawValue === undefined) {
    console.error(`usage: --prefs [<key> <value>]  (keys: ${known})`);
    process.exit(2);
  }
  if (!Object.prototype.hasOwnProperty.call(PREF_SCHEMA, key)) {
    console.error(`Unknown preference "${key}". Known keys: ${known}.`);
    process.exit(2);
  }
  // navOpen is a boolean; everything else is a string enum.
  const value = rawValue === 'true' ? true : rawValue === 'false' ? false : rawValue;
  if (!PREF_SCHEMA[key](value)) {
    console.error(`Invalid value "${rawValue}" for ${key}.`);
    process.exit(2);
  }
  try {
    await updatePrefs({ [key]: value });
  } catch (err) {
    console.error(`Failed to persist preference: ${err.message}`);
    process.exit(1);
  }
  console.log(`${key} set to ${value}. Open viewer pages pick it up on their next load.`);
  process.exit(0);
}

// Export a single doc as one self-contained HTML file — no running server
// needed (direct file read + the same inlining GET /export/<doc> does on a
// live server). Prints plain, ready-to-read text: the absolute output path,
// its size, and a one-line reminder of what the file is.
//   --export <dir> <doc.md> [--out <file>]
if (args[0] === '--export') {
  const dir = resolve(args[1] || process.cwd());
  const docArg = args[2];
  if (!docArg) {
    console.error('usage: --export <dir> <doc.md> [--out <file>]');
    process.exit(2);
  }
  let outArg = null;
  for (let i = 3; i < args.length; i++) {
    if (args[i] === '--out') outArg = args[++i];
  }
  try {
    if (!statSync(dir).isDirectory()) throw new Error('not a directory');
  } catch {
    console.error(`Directory not found: ${dir}`);
    process.exit(1);
  }
  try {
    const html = await buildExportHtml(dir, docArg);
    const outPath = resolve(outArg || `${docStem(docArg)}.html`);
    writeFileSync(outPath, html);
    const bytes = Buffer.byteLength(html);
    const human = bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
    console.log(outPath);
    console.log(`${human} (${bytes.toLocaleString()} bytes)`);
    console.log('self-contained — open in any browser or attach anywhere.');
    process.exit(0);
  } catch (err) {
    const reason = err && (err.code === 'ENOTFOUND' ? `document not found or not servable: ${docArg}`
      : err.code === 'ETOOBIG' ? err.message
      : err.message) || String(err);
    console.error(`Export failed: ${reason}`);
    process.exit(1);
  }
}

// Agent comment helpers — thin Node wrappers over the running server's HTTP API
// so the whole review loop is `node …` (no curl, no shell). They locate the
// server via its lock file, so you pass the served directory, not a URL.
//   --comments <dir> [<path.md>]          → print the open-comments digest
//   --status   <dir> <id[,id2,…]> <state> → set lifecycle state (new|acknowledged|resolved|dismissed)
if (args[0] === '--comments' || args[0] === '--status') {
  const dir = resolve(args[1] || process.cwd());
  const lock = liveLock(dir);
  if (!lock || !lock.url) {
    console.error(`No visual-docs server is running for ${dir}. Start one with --serve first.`);
    process.exit(1);
  }
  const base = lock.url.replace(/\/+$/, '');
  try {
    if (args[0] === '--comments') {
      const p = args[2] && !args[2].startsWith('-') ? args[2] : '';
      const res = await fetch(`${base}/agent/comments.md${p ? `?path=${encodeURIComponent(p)}` : ''}`);
      process.stdout.write(await res.text());
      printVersionNote(lock.version);
      process.exit(res.ok ? 0 : 1);
    }
    // --status
    const ids = String(args[2] || '').split(',').map((s) => s.trim()).filter(Boolean);
    const status = args[3];
    if (!ids.length || !status) {
      console.error('usage: --status <dir> <comment-id[,id2,…]> <new-status>  (new | acknowledged | resolved | dismissed)');
      process.exit(2);
    }
    const res = await fetch(`${base}/api/comments/status`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(ids.length === 1 ? { id: ids[0], status } : { ids, status }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) { console.error(`Status update failed: ${body.error || res.status}`); process.exit(1); }
    console.log(`Updated ${body.updated} comment(s) to "${status}".`);
    printVersionNote(lock.version);
    process.exit(0);
  } catch (err) {
    console.error(`Request failed: ${err.message}`);
    process.exit(1);
  }
}

const opts = { dir: process.cwd(), port: 0, host: '127.0.0.1', watch: true };
let restart = false, stop = false;

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
  else if (a === '--restart') restart = true;
  else if (a === '--stop') stop = true;
  else if (a === '--serve') { /* handled after parsing; accepted here so the loop doesn't reject it */ }
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

// --serve: start in the background and print the URL, then return — cross-
// platform, so skills don't need `nohup … &` (which doesn't exist on Windows).
// Reuse a live instance; otherwise spawn a DETACHED child that runs the normal
// foreground path and poll the lock file for the URL it publishes once listening.
if (args.includes('--serve')) {
  const live = liveLock(opts.dir);
  if (live && !restart) {
    console.log(`Serving ${opts.dir}`);
    console.log(`VISUAL_DOCS_URL=${live.url}`);
    printNetwork(live.host, live.port);
    printVersionNote(live.version);
    process.exit(0);
  }
  const { spawn } = await import('node:child_process');
  const childArgs = args.filter((a) => a !== '--serve');
  const child = spawn(process.execPath, [process.argv[1], ...childArgs], {
    detached: true, stdio: 'ignore', windowsHide: true, env: process.env,
  });
  child.unref();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null && child.exitCode !== 0) break;
    const lock = readLock(opts.dir);
    // Wait for the child's OWN lock, finalized with a url (written only once it's
    // actually listening) — not a stale/other lock for this dir.
    if (lock && lock.url && lock.pid === child.pid) {
      console.log(`Serving ${opts.dir}`);
      console.log(`VISUAL_DOCS_URL=${lock.url}`);
      printNetwork(lock.host, lock.port);
      process.exit(0);
    }
    await sleep(150);
  }
  console.error(`Timed out starting the background server for ${opts.dir}.`);
  process.exit(1);
}

// --stop: stop whatever is serving this dir, then exit.
if (stop) {
  const lock = liveLock(opts.dir);
  if (lock) {
    await stopPid(lock.pid);
    try { unlinkSync(lockPath(opts.dir)); } catch { /* ignore */ }
    console.log(`Stopped visual-docs-server for ${opts.dir}`);
  } else {
    console.log(`No running visual-docs-server for ${opts.dir}`);
  }
  process.exit(0);
}

// An instance is already serving this dir: reuse it (idempotent) or replace it.
const existing = liveLock(opts.dir);
if (existing) {
  if (restart) {
    await stopPid(existing.pid);
    try { unlinkSync(lockPath(opts.dir)); } catch { /* ignore */ }
  } else {
    console.log(`Serving ${opts.dir}`);
    console.log(`VISUAL_DOCS_URL=${existing.url}`);
    console.log('(already running — use --restart to apply new options, --stop to stop)');
    printVersionNote(existing.version);
    process.exit(0);
  }
}

const startedAt = new Date().toISOString();
const runningVersion = readPluginVersion();
const writeLock = (extra, flag) =>
  writeFileSync(lockPath(opts.dir), JSON.stringify({ pid: process.pid, startedAt, version: runningVersion, ...extra }, null, 2) + '\n', flag ? { flag } : undefined);

// Claim this directory ATOMICALLY (O_EXCL) before starting, so two invocations
// racing for the same dir can't both bind — the loser sees the winner's lock.
let claimed = false;
try {
  mkdirSync(dirname(lockPath(opts.dir)), { recursive: true });
  writeLock({}, 'wx');
  claimed = true;
} catch (err) {
  if (err && err.code === 'EEXIST') {
    const other = liveLock(opts.dir);
    if (other && !restart) {
      console.log(`Serving ${opts.dir}`);
      console.log(`VISUAL_DOCS_URL=${other.url}`);
      console.log('(another process just claimed this directory — already running)');
      printVersionNote(other.version);
      process.exit(0);
    }
    if (other) { await stopPid(other.pid); }
    try { writeLock({}); claimed = true; } catch { /* proceed unmanaged */ }
  } // any other error: proceed without lifecycle management
}

let started;
try {
  started = await startServer(opts);
} catch (err) {
  if (claimed) { try { const l = readLock(opts.dir); if (l && l.pid === process.pid) unlinkSync(lockPath(opts.dir)); } catch { /* ignore */ } }
  const reason = err && err.code === 'EADDRINUSE' ? `port ${opts.port} already in use`
    : err && err.code === 'EACCES' ? `permission denied binding ${opts.host}:${opts.port}`
    : (err && err.message) || String(err);
  console.error(`Failed to start server: ${reason}`);
  process.exit(1);
}
const { url, port } = started;

// Finalize the claim with the real url/port so future invocations can find us.
try {
  writeLock({ port, host: opts.host, url });
} catch { /* non-fatal: lifecycle shortcuts just won't be available */ }

let cleaned = false;
const cleanup = () => {
  if (cleaned) return;
  cleaned = true;
  try {
    const lock = readLock(opts.dir);
    if (lock && lock.pid === process.pid) unlinkSync(lockPath(opts.dir));
  } catch { /* ignore */ }
};
process.on('exit', cleanup);
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => { cleanup(); process.exit(0); });

console.log(`Serving ${opts.dir}`);
console.log(`VISUAL_DOCS_URL=${url}`);
printNetwork(opts.host, port);
console.log('Press Ctrl+C to stop.');
