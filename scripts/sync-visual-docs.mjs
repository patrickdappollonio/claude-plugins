#!/usr/bin/env node
/**
 * Keep the visual-docs renderer in step across the skills that ship it.
 *
 * The canonical copy lives in extras/visual-docs/ — outside every plugin, so it
 * is never itself installed and never has to be chosen between. Each skill that
 * needs the renderer carries its own real copy, because that is the only way the
 * files travel when a skill is installed by something other than Claude Code
 * (the `npx skills` CLI copies a skill directory and nothing above it, and a
 * symlink pointing outside that directory arrives as a text file on Windows).
 *
 * Usage:
 *   node scripts/sync-visual-docs.mjs            # report drift, exit 1 if any
 *   node scripts/sync-visual-docs.mjs --write     # make the copies match
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Directories every listed skill must carry a byte-identical copy of. */
const SOURCES = ["server", "shared"];

const CANONICAL = path.join(REPO, "extras", "visual-docs");
const SKILLS = [
  path.join(REPO, "plugins", "visual-docs", "skills", "visual-plan"),
  path.join(REPO, "plugins", "visual-docs", "skills", "visual-recap"),
];

const write = process.argv.includes("--write");

function walk(dir, base = dir, out = new Map()) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    // Runtime state (server locks, comments, review baselines) lands in dot
    // directories such as .visual-docs/ whenever someone serves examples/
    // locally. It is not source and must never be mirrored or reported as drift.
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) walk(full, base, out);
    else if (entry.isFile()) {
      out.set(
        path.relative(base, full).split(path.sep).join("/"),
        createHash("sha256").update(fs.readFileSync(full)).digest("hex"),
      );
    }
  }
  return out;
}

const drift = [];

for (const skillDir of SKILLS) {
  const skill = path.basename(skillDir);
  for (const source of SOURCES) {
    const from = path.join(CANONICAL, source);
    const to = path.join(skillDir, source);
    const want = walk(from);
    const have = walk(to);

    for (const [file, hash] of want) {
      if (!have.has(file)) drift.push({ skill, source, file, why: "missing" });
      else if (have.get(file) !== hash) drift.push({ skill, source, file, why: "differs" });
    }
    for (const file of have.keys()) {
      if (!want.has(file)) drift.push({ skill, source, file, why: "not in canonical" });
    }

    if (write) {
      fs.rmSync(to, { recursive: true, force: true });
      fs.cpSync(from, to, { recursive: true });
    }
  }
}

const total = SKILLS.length * SOURCES.length;

if (write) {
  console.log(`Synced ${total} director${total === 1 ? "y" : "ies"} from extras/visual-docs/ into:`);
  for (const skillDir of SKILLS) {
    console.log(`  ${path.relative(REPO, skillDir)}/{${SOURCES.join(",")}}`);
  }
  console.log(
    drift.length
      ? `Repaired ${drift.length} out-of-date file(s). Commit the result.`
      : "Everything was already up to date; nothing changed.",
  );
  process.exit(0);
}

if (!drift.length) {
  console.log(`visual-docs copies are in sync (${total} directories checked).`);
  process.exit(0);
}

console.error(`visual-docs copies have drifted from extras/visual-docs/ — ${drift.length} file(s):`);
console.error("");
for (const d of drift) {
  console.error(`  ${d.why.padEnd(16)} ${d.skill}/${d.source}/${d.file}`);
}
console.error("");
console.error("The canonical copy is extras/visual-docs/. Edit that one, never a copy.");
console.error("Repair with:");
console.error("");
console.error("  node scripts/sync-visual-docs.mjs --write");
console.error("");
process.exit(1);
