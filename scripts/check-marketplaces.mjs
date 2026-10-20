#!/usr/bin/env node
/**
 * Fail when the plugin lists drift apart.
 *
 * The Claude Code and Codex marketplaces must list the same plugins in the
 * same order, except the Claude-only `all` bundle. The bundle's dependencies
 * must name every other Claude Code plugin, so a new plugin cannot be left out
 * of "install everything".
 *
 * Usage: node scripts/check-marketplaces.mjs
 */

import fs from "node:fs";
import path from "node:path";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const BUNDLE = "all";

const readJSON = (rel) => JSON.parse(fs.readFileSync(path.join(REPO, rel), "utf8"));
const names = (rel) => readJSON(rel).plugins.map((p) => p.name);

const claude = names(".claude-plugin/marketplace.json");
const codex = names(".agents/plugins/marketplace.json");
const deps = readJSON(`plugins/${BUNDLE}/.claude-plugin/plugin.json`).dependencies;
const plugins = claude.filter((n) => n !== BUNDLE);

const errors = [];

if (!claude.includes(BUNDLE)) {
  errors.push(`.claude-plugin/marketplace.json has no "${BUNDLE}" entry`);
}
if (codex.includes(BUNDLE)) {
  errors.push(`.agents/plugins/marketplace.json lists "${BUNDLE}", but Codex has no plugin dependencies, so it would install nothing`);
}
if (plugins.join("\n") !== codex.join("\n")) {
  errors.push(`the marketplaces differ (ignoring "${BUNDLE}"):\n  Claude Code: ${plugins.join(", ")}\n  Codex:       ${codex.join(", ")}`);
}

const missing = plugins.filter((n) => !deps.includes(n));
const unknown = deps.filter((n) => !plugins.includes(n));
if (missing.length) {
  errors.push(`plugins/${BUNDLE}/.claude-plugin/plugin.json does not depend on: ${missing.join(", ")}`);
}
if (unknown.length) {
  errors.push(`plugins/${BUNDLE}/.claude-plugin/plugin.json depends on plugins not in the marketplace: ${unknown.join(", ")}`);
}

if (errors.length) {
  for (const e of errors) console.error(`error: ${e}`);
  process.exit(1);
}
console.log(`ok: ${plugins.length} plugins in both marketplaces, all listed in the "${BUNDLE}" bundle`);
