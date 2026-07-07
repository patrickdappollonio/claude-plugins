import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import os from 'node:os';

/** Single source of truth for every persisted viewer preference: the set of
    allowed keys and, for each, a validator for the value a client may set.
    GET /api/prefs only ever returns keys listed here (with a valid value);
    POST /api/prefs and `--prefs <key> <value>` reject any key not listed
    here, or any value that fails its validator — the store never accumulates
    junk. Add a new persisted preference by adding one line here (and a
    localStorage mirror entry in assets/app.js PREF_LOCAL_KEYS). */
export const PREF_SCHEMA = {
  viewMode: (v) => v === 'unified' || v === 'side-by-side',
  theme: (v) => v === 'light' || v === 'dark',
  navOpen: (v) => typeof v === 'boolean',
  sidebarTab: (v) => v === 'outline' || v === 'docs',
};

/** Per-user viewer preferences (diff/migration view mode, theme, sidebar
    state, ...), stored OUTSIDE the served dir so they persist across
    sessions/agents/docs. Deliberately not in .visual-docs/ (that lives
    inside the served directory and is per-project); this is a global,
    per-machine-user setting. */
export function prefsFile() {
  const configHome = process.env.XDG_CONFIG_HOME
    || (process.platform === 'win32' ? process.env.APPDATA : join(os.homedir(), '.config'));
  return join(configHome, 'visual-docs', 'prefs.json');
}

/** Tolerate a missing/corrupt prefs file as "no preference yet" rather than erroring. */
export async function readPrefs() {
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

/** Strip a raw prefs object down to only the keys PREF_SCHEMA recognizes and
    whose stored value still validates -- so a hand-edited or stale file can
    never leak a bad value back to the client. */
export function sanitizePrefs(raw) {
  const out = {};
  for (const key of Object.keys(PREF_SCHEMA)) {
    if (Object.prototype.hasOwnProperty.call(raw, key) && PREF_SCHEMA[key](raw[key])) out[key] = raw[key];
  }
  return out;
}

// All read-merge-write cycles go through one in-process chain: two concurrent
// updates (e.g. the browser fire-and-forgets theme and navOpen back to back)
// would otherwise both read the same snapshot, each merge only its own key,
// and the second rename would silently drop the first one's change.
let writeChain = Promise.resolve();

/** Merge `partial` (already validated against PREF_SCHEMA) into the prefs
    file, serialized against other in-process updates. Resolves with the full
    merged object. */
export function updatePrefs(partial) {
  const next = writeChain.then(async () => {
    const prefs = await readPrefs();
    Object.assign(prefs, partial);
    await writePrefs(prefs);
    return prefs;
  });
  writeChain = next.catch(() => {});
  return next;
}
