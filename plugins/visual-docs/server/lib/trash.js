import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';

// A trashed document is recoverable for this many days; after that the sweep
// deletes the file, its manifest entry, and its comments for good.
export const TRASH_RETENTION_DAYS = 10;
const DAY_MS = 24 * 60 * 60 * 1000;
const RETENTION_MS = TRASH_RETENTION_DAYS * DAY_MS;

const trashDir = (root) => join(root, '.visual-docs', 'trash');
const manifestFile = (root) => join(root, '.visual-docs', 'trash.json');

/** Same policy as the comments store: an unreadable manifest is moved aside
    (never silently overwritten) and treated as empty. */
async function quarantine(file, why) {
  const dest = `${file}.corrupt-${Date.now()}`;
  try { await fs.rename(file, dest); } catch { /* best effort */ }
  console.error(`[visual-docs] trash manifest ${file} was unreadable (${why}); quarantined to ${dest}, starting from empty.`);
  return { entries: [] };
}

export async function readTrash(root) {
  let raw;
  try {
    raw = await fs.readFile(manifestFile(root), 'utf8');
  } catch (err) {
    if (err && err.code !== 'ENOENT') return quarantine(manifestFile(root), err.message);
    return { entries: [] };
  }
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return quarantine(manifestFile(root), 'invalid JSON'); }
  if (!parsed || !Array.isArray(parsed.entries)) return quarantine(manifestFile(root), 'unexpected shape (no entries array)');
  return parsed;
}

// Atomic replace, same as the comments store: temp file + rename so a crash
// mid-write can never truncate the manifest. Callers serialize writes
// (server.js wraps every mutation in withTrash), so no concurrency hash needed.
async function writeTrash(root, data) {
  const file = manifestFile(root);
  await fs.mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + '\n');
  await fs.rename(tmp, file);
}

export function daysLeft(trashedAt) {
  const at = Date.parse(trashedAt);
  if (Number.isNaN(at)) return 0;
  return Math.max(0, Math.ceil((RETENTION_MS - (Date.now() - at)) / DAY_MS));
}

export async function trashDoc(root, relPath, abs, title) {
  const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await fs.mkdir(trashDir(root), { recursive: true });
  await fs.rename(abs, join(trashDir(root), `${id}.md`));
  const data = await readTrash(root);
  const entry = { id, path: relPath, title, trashedAt: new Date().toISOString() };
  data.entries.push(entry);
  await writeTrash(root, data);
  return entry;
}

export async function restoreDoc(root, id) {
  const data = await readTrash(root);
  const entry = data.entries.find((e) => e.id === id);
  if (!entry) return null;
  const src = join(trashDir(root), `${id}.md`);
  // Restore to the original path; if something new occupies it, restore beside
  // it as "<stem> (restored).md" instead of clobbering.
  let restoredTo = null;
  for (let n = 0; n < 20; n++) {
    const candidate = n === 0 ? entry.path
      : entry.path.replace(/(\.(md|markdown))$/i, n === 1 ? ' (restored)$1' : ` (restored ${n})$1`);
    if (n > 0 && candidate === entry.path) break; // no extension to suffix — same path forever
    const dest = join(root, candidate);
    try { await fs.access(dest); continue; } catch { /* free */ }
    await fs.mkdir(dirname(dest), { recursive: true });
    await fs.rename(src, dest);
    restoredTo = candidate;
    break;
  }
  // Never drop the manifest entry unless the file actually moved back — a
  // failed restore must stay restorable, not become an invisible orphan.
  if (restoredTo === null) throw new Error(`no free path to restore ${entry.path}`);
  data.entries = data.entries.filter((e) => e.id !== id);
  await writeTrash(root, data);
  return { ...entry, restoredTo };
}

/** Delete entries past retention (an unparseable trashedAt counts as expired so
    a bad manifest edit can't make an entry immortal). Returns the purged
    entries so the server can also drop their comments. */
export async function sweepExpired(root) {
  const data = await readTrash(root);
  const now = Date.now();
  const expired = data.entries.filter((e) => {
    const at = Date.parse(e.trashedAt);
    return Number.isNaN(at) || now - at > RETENTION_MS;
  });
  if (!expired.length) return [];
  for (const e of expired) {
    await fs.rm(join(trashDir(root), `${e.id}.md`), { force: true });
  }
  data.entries = data.entries.filter((e) => !expired.includes(e));
  await writeTrash(root, data);
  return expired;
}
