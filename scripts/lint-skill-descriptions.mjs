#!/usr/bin/env node
/**
 * Warn when a skill description is longer than it should be.
 *
 * The frontmatter schema already fails a description over the 1024-character
 * hard cap. This script covers the range below that: a description over
 * WARN_AT characters gets a warning, and the exit code stays 0, because a long
 * description still works and is sometimes justified.
 *
 * Usage: node scripts/lint-skill-descriptions.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const WARN_AT = 600;
const TARGET = 500;

const files = fs
  .globSync("plugins/*/skills/*/SKILL.md", { cwd: REPO })
  .sort();

let warned = 0;
for (const file of files) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(fs.readFileSync(path.join(REPO, file), "utf8"));
  const description = match ? parse(match[1])?.description : undefined;
  if (typeof description !== "string") continue;

  const length = [...description].length;
  if (length <= WARN_AT) continue;

  warned++;
  const message = `description is ${length} characters; aim for under ${TARGET} and keep only when to use the skill`;
  if (process.env.GITHUB_ACTIONS) {
    console.log(`::warning file=${file},line=1,title=Long skill description::${message}`);
  } else {
    console.log(`warning: ${file}: ${message}`);
  }
}

console.log(
  warned === 0
    ? `ok: ${files.length} skill descriptions, none over ${WARN_AT} characters`
    : `${warned} of ${files.length} skill descriptions are over ${WARN_AT} characters (warning only)`,
);
