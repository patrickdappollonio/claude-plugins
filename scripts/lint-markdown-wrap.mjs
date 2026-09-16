#!/usr/bin/env node
/**
 * Fail when a Markdown file hard-wraps prose.
 *
 * Paragraphs, headings, list items, and table rows must each sit on one line;
 * the editor wraps them for display. A paragraph or heading that spans several
 * source lines is a hard wrap and is reported with its file and line. Code
 * blocks, front matter, HTML blocks, and tables are not checked.
 *
 * Usage: node scripts/lint-markdown-wrap.mjs [file or directory ...]
 * With no arguments it checks every tracked .md file outside node_modules.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { remark } from "remark";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function listFiles(args) {
  if (args.length === 0) {
    return execFileSync("git", ["ls-files", "*.md"], { cwd: REPO, encoding: "utf8" })
      .split("\n")
      .filter((f) => f && !f.includes("node_modules"))
      .map((f) => path.join(REPO, f));
  }
  const out = [];
  for (const arg of args) {
    const p = path.resolve(arg);
    if (fs.statSync(p).isDirectory()) {
      for (const entry of fs.readdirSync(p, { recursive: true })) {
        if (entry.endsWith(".md") && !entry.includes("node_modules")) out.push(path.join(p, entry));
      }
    } else {
      out.push(p);
    }
  }
  return out;
}

/** Nodes whose own text must not span more than one source line. */
const PROSE = new Set(["paragraph", "heading"]);

/** Lines of YAML front matter at the top of the file, or 0. */
function frontMatterLines(lines) {
  if (lines[0] !== "---") return 0;
  const end = lines.indexOf("---", 1);
  return end === -1 ? 0 : end + 1;
}

/** A GitHub admonition: the `[!NOTE]` marker line plus one line of text. */
const ADMONITION = /^\[!\w+\]\s*$/;

function check(file) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const skip = frontMatterLines(lines);
  const body = lines.slice(skip).join("\n");
  const tree = remark().parse(body);
  const hits = [];
  const walk = (node) => {
    if (PROSE.has(node.type) && node.position) {
      const { start, end } = node.position;
      const own = lines.slice(skip + start.line - 1, skip + end.line).map((l) => l.replace(/^\s*(>\s?)*/, ""));
      const isTable = own.every((l) => l.trim().startsWith("|"));
      const allowed = ADMONITION.test(own[0]) ? start.line + 1 : start.line;
      if (end.line > allowed && !isTable) hits.push(skip + start.line);
    }
    for (const child of node.children ?? []) walk(child);
  };
  walk(tree);
  return hits;
}

let failed = 0;
for (const file of listFiles(process.argv.slice(2))) {
  const hits = check(file);
  if (hits.length === 0) continue;
  failed += 1;
  const rel = path.relative(REPO, file);
  for (const line of hits) {
    console.log(`::error file=${rel},line=${line}::hard-wrapped prose; keep each paragraph on one line`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} file(s) contain hard-wrapped prose.`);
  process.exit(1);
}
console.log("No hard-wrapped prose found.");
