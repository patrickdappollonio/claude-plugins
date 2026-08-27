#!/usr/bin/env node
import { startServer, readComments, renderCommentsMarkdown, setCommentStatus } from '../lib/server.js';
import { readPluginVersion } from '../lib/version.js';
import { PREF_SCHEMA, prefsFile, readPrefs, sanitizePrefs, updatePrefs } from '../lib/prefs.js';
import { buildExportHtml, docStem } from '../lib/export.js';
import { resolve, join, dirname, basename } from 'node:path';
import { statSync, readFileSync, writeFileSync, unlinkSync, mkdirSync, realpathSync, openSync, closeSync } from 'node:fs';
import { networkInterfaces, tmpdir } from 'node:os';
import { isIP } from 'node:net';

function usage() {
  console.log(`Usage: visual-docs-server [dir] [options]

Serves every markdown file under <dir> (default: current directory) as a
rendered visual document with Mermaid diagrams, highlighted code, rich
diffs, styled DB migrations, live reload, and reviewer comments.

The server records itself in <dir>/.visual-docs/server.json, so:
  - starting again for a dir that's already served just prints its URL
    (liveness is checked over HTTP, so it also works from a sandbox whose
    PID namespace can't see the server);
  - --restart replaces the running instance (e.g. to change --host) and a
    dead server is restarted on its previous port, so the URL stays stable;
  - --stop stops it. No manual PID juggling.

Options:
  --port <n>       Port to listen on (default: random free port)
  --host=<target>  Also listen on ONE extra address, alongside localhost.
                   <target> is an IP, an interface name (tailscale0, eth0),
                   or the word "tailscale" (your 100.64.0.0/10 address).
                   Prefer this: it never exposes the other interfaces.
  --host           Bind 0.0.0.0 — every interface at once. Only when a single
                   address won't do; there is no authentication.
                   (default without --host: 127.0.0.1 only)
  --restart        Replace an instance already serving this dir
  --stop           Stop the instance serving this dir, then exit
  --no-watch       Disable live reload
  --docdir         Print a fresh, session-scoped docs directory and exit
                   (cross-platform temp dir; write your .md there, then serve it)
  --serve          Start in the background and print the URL, then return
                   (cross-platform; no nohup/& needed)
  --comments <dir> [<path.md>]
                   Print the open-comments digest (reads the store directly;
                   no server needed)
  --status <dir> <id[,id2,…]> <state>
                   Set a comment's lifecycle state (no server needed)
                   (new|acknowledged|resolved|dismissed — dismiss only
                   while the comment is still new or acknowledged)
  --prefs [<key> <value>]
                   Print the persisted viewer preferences, or set one
                   (viewMode|theme|navOpen|sidebarTab|drawerOpen; no server needed)
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

const isLoopback = (a) => a === '127.0.0.1' || a === '::1' || a === 'localhost';
const isCgnat = (a) => {
  const m = /^100\.(\d+)\.\d+\.\d+$/.exec(a);
  return !!m && Number(m[1]) >= 64 && Number(m[1]) <= 127;
};

/** Turn a --host target into the bind list: loopback plus exactly one address.
    Accepts an IP, an interface name, or "tailscale" (the 100.64.0.0/10 address).
    Bare 0.0.0.0/:: is passed through as the all-interfaces wildcard. */
function resolveHosts(target) {
  if (target === '0.0.0.0' || target === '::') return [target];
  if (isLoopback(target)) return ['127.0.0.1'];
  const ifaces = networkInterfaces();
  let addr = target;
  if (isIP(target) === 0) {
    const all = Object.values(ifaces).flat().filter((i) => i && i.family === 'IPv4' && !i.internal);
    if (target.toLowerCase() === 'tailscale') {
      const ts = all.find((i) => isCgnat(i.address));
      if (!ts) {
        console.error('--host=tailscale: no Tailscale address (100.64.0.0/10) found on this machine — is Tailscale running?');
        process.exit(1);
      }
      addr = ts.address;
    } else if (ifaces[target]) {
      const v4 = (ifaces[target] || []).find((i) => i.family === 'IPv4');
      if (!v4) { console.error(`--host=${target}: that interface has no IPv4 address.`); process.exit(1); }
      addr = v4.address;
    } else {
      const names = Object.keys(ifaces).join(', ');
      console.error(`--host=${target}: not an IP address, an interface name (${names}), or "tailscale".`);
      process.exit(1);
    }
  }
  return ['127.0.0.1', addr];
}

/** Print a `Network: http://<ip>:<port>/` line for every non-loopback address
    the server is reachable on — so a LAN/Tailscale reviewer has an address to
    hit. Shared by the foreground path and --serve (which can't see the child's
    stdout). `host` is the bind list, or a single address from an older lock. */
function printNetwork(host, port) {
  const hosts = Array.isArray(host) ? host : [host];
  if (hosts.includes('0.0.0.0') || hosts.includes('::')) {
    for (const ifaces of Object.values(networkInterfaces())) {
      for (const iface of ifaces || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          console.log(`Network: http://${iface.address}:${port}/`);
        }
      }
    }
    return;
  }
  for (const h of hosts) if (!isLoopback(h)) console.log(`Network: http://${h}:${port}/`);
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

const realDir = (dir) => { try { return realpathSync(dir); } catch { return resolve(dir); } };

/** Ask the port in `lock` whether a visual-docs server for `dir` answers.
    'alive' / 'dead' when the probe is conclusive; 'unknown' when this process
    is not allowed to connect at all (a sandbox that blocks sockets) — in which
    case nothing can be concluded and the lock must be left alone. */
async function probeHealth(lock, dir) {
  if (!lock || !lock.url) return 'dead';
  let res;
  try {
    res = await fetch(`${lock.url.replace(/\/+$/, '')}/api/health`, { signal: AbortSignal.timeout(1500) });
  } catch (err) {
    const code = err && err.cause && err.cause.code;
    if (code === 'ECONNREFUSED' || code === 'ECONNRESET' || err.name === 'TimeoutError') return 'dead';
    return 'unknown';
  }
  if (!res.ok) return 'dead'; // something else owns that port now
  const body = await res.json().catch(() => null);
  if (!body || body.server !== 'visual-docs') return 'dead';
  return realDir(body.dir) === realDir(dir) ? 'alive' : 'dead';
}

/** The lock of a live server for this dir, or null (stale locks are cleared).
    Liveness is decided by an HTTP probe, not by the PID: sandboxed harnesses
    (Codex wraps every command in its own PID namespace) make a live server's
    PID invisible, and trusting the PID there deleted the lock and spawned a
    duplicate on a new port at every turn. The PID check is only the fallback
    when the probe cannot run. Records the port of a confirmed-dead lock in
    `liveLock.lastPort` so a restart can keep the URL stable. */
async function liveLock(dir) {
  const lock = readLock(dir);
  if (!lock) return null;
  const health = await probeHealth(lock, dir);
  if (health === 'alive') return lock;
  if (health === 'unknown') return lock; // can't verify — never discard a possibly live server
  if (!lock.url && isOurServer(lock.pid)) return lock; // claimed, still binding
  if (lock.port) liveLock.lastPort = lock.port;
  try { unlinkSync(lockPath(dir)); } catch { /* ignore */ }
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

/** Stop the server described by `lock`. Signals the PID when it is visible
    from here; otherwise (foreign PID namespace) asks the server to exit over
    HTTP and waits for the port to stop answering. */
async function stopServer(lock, dir) {
  const { pid } = lock;
  if (isOurServer(pid)) {
    try { process.kill(pid, 'SIGTERM'); } catch { return true; }
    for (let i = 0; i < 30 && pidAlive(pid); i++) await sleep(100); // up to ~3s
    if (pidAlive(pid)) { try { process.kill(pid, 'SIGKILL'); } catch { /* ignore */ } }
    return true;
  }
  if (!lock.url) return true;
  try {
    await fetch(`${lock.url.replace(/\/+$/, '')}/api/shutdown`, { method: 'POST', signal: AbortSignal.timeout(1500) });
  } catch {
    return false; // can't signal it and can't reach it: the caller must not pretend
  }
  for (let i = 0; i < 30 && (await probeHealth(lock, dir)) === 'alive'; i++) await sleep(100);
  return true;
}

const CANNOT_STOP = 'Cannot stop it from here: its PID is not visible and this process is not allowed to connect to it (a sandbox is blocking sockets). Run this exact command with elevated (outside-the-sandbox) execution.';

const args = process.argv.slice(2);

// `--docdir`: print a fresh, session-scoped documents directory and exit. Cross-
// platform (os.tmpdir() → %TEMP% on Windows, /tmp or $TMPDIR on Unix), scoped by
// VISUAL_DOCS_SESSION_ID (agent-agnostic — any platform can export one) so it's
// unique per session, else by pid (fresh each run, no overlap with other
// projects). Skills call this instead of hand-building /tmp paths.
if (args.includes('--docdir')) {
  const safe = (s) => String(s || '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  const sess = safe(process.env.VISUAL_DOCS_SESSION_ID) || String(process.pid);
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

// Agent comment helpers — plain file operations on <dir>/.visual-docs/
// comments.json through the same library code the server uses, so the whole
// review loop is `node …` (no curl, no shell) and needs no reachable server:
// sandboxed harnesses may forbid even a loopback connection. A running server
// watches the store and pushes the change to open viewers.
//   --comments <dir> [<path.md>]          → print the open-comments digest
//   --status   <dir> <id[,id2,…]> <state> → set lifecycle state (new|acknowledged|resolved|dismissed)
if (args[0] === '--comments' || args[0] === '--status') {
  const dir = resolve(args[1] || process.cwd());
  try { if (!statSync(dir).isDirectory()) throw new Error(); } catch {
    console.error(`${dir} is not a directory.`);
    process.exit(1);
  }
  const lock = readLock(dir); // only for the URL in the digest and the version note
  const base = lock && lock.url ? lock.url.replace(/\/+$/, '') : 'http://127.0.0.1';
  try {
    if (args[0] === '--comments') {
      const p = args[2] && !args[2].startsWith('-') ? args[2] : '';
      const data = await readComments(dir);
      const comments = p ? data.comments.filter((c) => c.path === p) : data.comments;
      process.stdout.write(renderCommentsMarkdown(comments, p, base));
      if (lock) printVersionNote(lock.version);
      process.exit(0);
    }
    // --status
    const ids = String(args[2] || '').split(',').map((s) => s.trim()).filter(Boolean);
    const status = args[3];
    if (!ids.length || !status) {
      console.error('usage: --status <dir> <comment-id[,id2,…]> <new-status>  (new | acknowledged | resolved | dismissed)');
      process.exit(2);
    }
    const result = await setCommentStatus(dir, ids, status);
    if (result.notFound) { console.error('Status update failed: no comment matched the given id(s)'); process.exit(1); }
    if (result.conflict || result.error) { console.error(`Status update failed: ${result.conflict || result.error}`); process.exit(1); }
    console.log(`Updated ${result.updated.length} comment(s) to "${status}".`);
    if (lock) printVersionNote(lock.version);
    process.exit(0);
  } catch (err) {
    console.error(`Failed: ${err.message}`);
    process.exit(1);
  }
}

const opts = { dir: process.cwd(), port: 0, host: ['127.0.0.1'], watch: true };
let restart = false, stop = false, preferPort = 0;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '-h' || a === '--help') { usage(); process.exit(0); }
  else if (a === '--port') opts.port = Number(args[++i]);
  else if (a === '--prefer-port') preferPort = Number(args[++i]); // internal: --serve → child
  else if (a.startsWith('--host=')) opts.host = resolveHosts(a.slice('--host='.length) || '0.0.0.0');
  else if (a === '--host') {
    // Astro-style: bare --host binds all interfaces. Only consume the next
    // token as an address when it actually looks like one — never swallow a
    // trailing directory argument (e.g. `--host ./docs`).
    const next = args[i + 1];
    if (next && !next.startsWith('-') && looksLikeHost(next)) opts.host = resolveHosts(args[++i]);
    else opts.host = ['0.0.0.0'];
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
  const live = await liveLock(opts.dir);
  if (live && !restart) {
    console.log(`Serving ${opts.dir}`);
    console.log(`VISUAL_DOCS_URL=${live.url}`);
    printNetwork(live.host, live.port);
    printVersionNote(live.version);
    process.exit(0);
  }
  const { spawn } = await import('node:child_process');
  const childArgs = args.filter((a) => a !== '--serve');
  // A replaced or dead server's port is handed to the child so the URL the
  // user already has keeps working (the child falls back to a free port).
  const keepPort = live ? live.port : liveLock.lastPort;
  if (!opts.port && keepPort && !args.includes('--prefer-port')) childArgs.push('--prefer-port', String(keepPort));
  // The child's stderr goes to a file so a failure to bind (a sandbox that
  // forbids listening sockets, a taken --port) is reported by name instead of
  // as an opaque timeout.
  const errFile = join(tmpdir(), `visual-docs-serve-${process.pid}.log`);
  let errFd = null;
  try { errFd = openSync(errFile, 'w'); } catch { /* fall back to discarding */ }
  const child = spawn(process.execPath, [process.argv[1], ...childArgs], {
    detached: true, stdio: ['ignore', 'ignore', errFd === null ? 'ignore' : errFd], windowsHide: true, env: process.env,
  });
  child.unref();
  if (errFd !== null) closeSync(errFd);
  const deadline = Date.now() + 20000;
  let failed = false;
  while (Date.now() < deadline) {
    if (child.exitCode !== null && child.exitCode !== 0) { failed = true; break; }
    const lock = readLock(opts.dir);
    // Wait for the child's OWN lock, finalized with a url (written only once it's
    // actually listening) — not a stale/other lock for this dir.
    if (lock && lock.url && lock.pid === child.pid) {
      console.log(`Serving ${opts.dir}`);
      console.log(`VISUAL_DOCS_URL=${lock.url}`);
      printNetwork(lock.host, lock.port);
      try { unlinkSync(errFile); } catch { /* ignore */ }
      process.exit(0);
    }
    await sleep(150);
  }
  let childError = '';
  try { childError = readFileSync(errFile, 'utf8').trim(); unlinkSync(errFile); } catch { /* ignore */ }
  console.error(failed
    ? `The background server for ${opts.dir} exited before it was listening.`
    : `Timed out starting the background server for ${opts.dir}.`);
  if (childError) console.error(childError);
  if (/EPERM|EACCES/.test(childError)) {
    console.error('This process is not allowed to open a listening socket — a sandbox is blocking it. Run this exact command with elevated (outside-the-sandbox) execution.');
  }
  process.exit(1);
}

// --stop: stop whatever is serving this dir, then exit.
if (stop) {
  const lock = await liveLock(opts.dir);
  if (lock) {
    if (!(await stopServer(lock, opts.dir))) {
      console.error(`A visual-docs-server for ${opts.dir} is recorded at ${lock.url}. ${CANNOT_STOP}`);
      process.exit(1);
    }
    try { unlinkSync(lockPath(opts.dir)); } catch { /* ignore */ }
    console.log(`Stopped visual-docs-server for ${opts.dir}`);
  } else {
    console.log(`No running visual-docs-server for ${opts.dir}`);
  }
  process.exit(0);
}

// An instance is already serving this dir: reuse it (idempotent) or replace it.
const existing = await liveLock(opts.dir);
if (existing) {
  if (restart) {
    if (!(await stopServer(existing, opts.dir))) {
      console.error(`A visual-docs-server for ${opts.dir} is recorded at ${existing.url}. ${CANNOT_STOP}`);
      process.exit(1);
    }
    try { unlinkSync(lockPath(opts.dir)); } catch { /* ignore */ }
    if (!preferPort && existing.port) preferPort = existing.port; // keep the URL stable
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
    const other = await liveLock(opts.dir);
    if (other && !restart) {
      console.log(`Serving ${opts.dir}`);
      console.log(`VISUAL_DOCS_URL=${other.url}`);
      console.log('(another process just claimed this directory — already running)');
      printVersionNote(other.version);
      process.exit(0);
    }
    if (other && !(await stopServer(other, opts.dir))) {
      console.error(`A visual-docs-server for ${opts.dir} is recorded at ${other.url}. ${CANNOT_STOP}`);
      process.exit(1);
    }
    try { writeLock({}); claimed = true; } catch { /* proceed unmanaged */ }
  } // any other error: proceed without lifecycle management
}

let started;
try {
  // Prefer the port a previous instance used (a restart, or a server that
  // died) so the URL already in the user's browser keeps working; if something
  // else took it meanwhile, fall back to a free port rather than fail.
  if (!opts.port && !preferPort && liveLock.lastPort) preferPort = liveLock.lastPort;
  if (!opts.port && preferPort) {
    try { started = await startServer({ ...opts, port: preferPort }); } catch (err) {
      if (!err || err.code !== 'EADDRINUSE') throw err;
    }
  }
  if (!started) started = await startServer(opts);
} catch (err) {
  if (claimed) { try { const l = readLock(opts.dir); if (l && l.pid === process.pid) unlinkSync(lockPath(opts.dir)); } catch { /* ignore */ } }
  const reason = err && err.code === 'EADDRINUSE' ? `port ${opts.port} already in use`
    : err && err.code === 'EACCES' ? `permission denied binding ${opts.host.join(', ')}:${opts.port}`
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
