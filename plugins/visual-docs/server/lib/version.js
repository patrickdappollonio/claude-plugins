import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Resolved relative to THIS file, not cwd — so a running server/CLI always
// reads the manifest of the plugin it was actually loaded from, wherever it
// was invoked from.
const PLUGIN_JSON_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '.claude-plugin', 'plugin.json');

/** The visual-docs plugin's own version (e.g. "1.0.0"), or null if the
    manifest is missing/unreadable/malformed. Never throws. */
export function readPluginVersion() {
  try {
    const pkg = JSON.parse(readFileSync(PLUGIN_JSON_PATH, 'utf8'));
    return typeof pkg.version === 'string' ? pkg.version : null;
  } catch {
    return null;
  }
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
