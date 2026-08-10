import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Searched upward from THIS file, not cwd — so a running server/CLI always
// reads the manifest of the plugin it was actually loaded from, wherever it was
// invoked from. The depth varies by install: the server sits at
// <plugin>/skills/<skill>/server/lib for a plugin install, and outside a plugin
// entirely for a skill-only install (npx skills), where there is no manifest to
// find and the version is simply unknown.
const SEARCH_ROOT = dirname(fileURLToPath(import.meta.url));
const MAX_LEVELS = 6;

function findPluginJson() {
  let dir = SEARCH_ROOT;
  for (let i = 0; i < MAX_LEVELS; i++) {
    const candidate = join(dir, '.claude-plugin', 'plugin.json');
    try {
      const pkg = JSON.parse(readFileSync(candidate, 'utf8'));
      if (typeof pkg.version === 'string') return pkg.version;
    } catch {
      // not here (or unreadable/malformed) — keep walking up
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/** The visual-docs plugin's own version (e.g. "1.0.0"), or null when the server
    was installed without a plugin manifest beside it. Never throws. */
export function readPluginVersion() {
  return findPluginJson();
}

/** A TTL-cached wrapper around readPluginVersion(), for hot request paths
    (e.g. /api/docs, /api/doc) that would otherwise stat+read+parse the
    manifest on every hit just to notice it hasn't changed. */
export function makeCachedVersionReader(ttlMs = 5000) {
  let cached = null;
  let readAt = 0;
  return () => {
    const now = Date.now();
    if (now - readAt >= ttlMs) {
      cached = readPluginVersion();
      readAt = now;
    }
    return cached;
  };
}
