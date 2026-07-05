#!/usr/bin/env node

/*
 * visual-docs-lint — check a visual doc against the authoring guidelines.
 *
 *   node visual-docs-lint.js <file.md | dir> [more...]
 *
 * Reports errors (exit 1) and warnings (exit 0 unless --strict). Zero deps.
 * Rules mirror skills/shared/authoring-guide.md and document-quality.md:
 *   - exactly one H1, at the top
 *   - every structured fence has a one-sentence intent line directly above it
 *   - structured fences are non-empty and parse for their type
 *   - admonition markers are a known type
 *   - fences are balanced; obvious secrets are redacted
 */

import fs from 'node:fs';
import path from 'node:path';

// Keep in sync with the fence dispatch in assets/app.js (renderCodeFence): a new
// structured fence there needs adding here (and to NEEDS_INTENT if it wants an
// intent line) or the linter won't validate it.
const STRUCTURED = new Set([
  'diff', 'patch', 'migration', 'sql-migration', 'db-migration',
  'api', 'http', 'openapi', 'swagger', 'filetree', 'files', 'file-tree',
  'mermaid', 'nomnoml', 'question', 'ask', 'tldr', 'tl;dr', 'summary',
]);
const ADMONITIONS = new Set(['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION']);
const SECRET_RE = /\b(sk-[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,})\b/;
// Fences that should be introduced by a one-sentence intent line. Questions are
// self-describing (the prompt is the intent), so they're excluded.
const NEEDS_INTENT = new Set([
  'diff', 'patch', 'migration', 'sql-migration', 'db-migration',
  'api', 'http', 'openapi', 'swagger', 'filetree', 'files', 'file-tree',
  'mermaid', 'nomnoml',
]);

function lintText(text, file) {
  const findings = [];
  const add = (line, sev, msg) => findings.push({ file, line, sev, msg });
  const lines = text.split('\n');

  // --- one H1, at the top ---
  const h1s = [];
  let inFence = false;
  lines.forEach((l, i) => {
    if (/^```/.test(l)) inFence = !inFence;
    if (!inFence && /^#\s+\S/.test(l)) h1s.push(i + 1);
  });
  if (h1s.length === 0) {
    add(1, 'error', 'No H1 title — start the doc with a single "# Title".');
  } else if (h1s.length > 1) {
    add(h1s[1], 'error', `Multiple H1 headings (lines ${h1s.join(', ')}) — use one H1 as the title, H2/H3 for sections.`);
  } else {
    const firstContent = lines.findIndex((l) => l.trim());
    if (firstContent !== -1 && !/^#\s+/.test(lines[firstContent])) {
      add(firstContent + 1, 'warn', 'Content appears before the H1 title — the H1 should come first.');
    }
  }

  // --- walk the document, fence by fence ---
  let i = 0;
  while (i < lines.length) {
    const open = lines[i].match(/^```(\S*)/);
    if (open) {
      const lang = (open[1] || '').toLowerCase();
      const start = i;
      const body = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        // Secrets pasted inside a fence (curl examples, env vars) are the most
        // likely place — scan body lines too, not just prose.
        const s = lines[i].match(SECRET_RE);
        if (s) add(i + 1, 'warn', `Possible unredacted secret ("${s[0].slice(0, 10)}…") — redact as <redacted> or sk-•••.`);
        body.push(lines[i]);
        i++;
      }
      if (i >= lines.length) { add(start + 1, 'error', 'Unclosed code fence.'); break; }

      if (STRUCTURED.has(lang)) {
        // one-sentence intent directly above (not required for self-describing
        // question fences)
        if (NEEDS_INTENT.has(lang)) {
          let p = start - 1;
          while (p >= 0 && !lines[p].trim()) p--;
          const prev = p >= 0 ? lines[p] : '';
          if (!prev.trim() || /^#{1,6}\s/.test(prev) || /^```/.test(prev) || /^>/.test(prev)) {
            add(start + 1, 'warn', `\`${lang}\` fence has no one-sentence intent line directly above it (document-quality §4).`);
          }
        }
        if (!body.join('').trim()) add(start + 1, 'error', `Empty \`${lang}\` fence.`);
        else lintFence(lang, body, start, add);
      }
      i++; // move past closing ```
      continue;
    }

    // admonition marker
    const am = lines[i].match(/^>\s*\[!(\w+)\]/);
    if (am && !ADMONITIONS.has(am[1].toUpperCase())) {
      add(i + 1, 'warn', `Unknown admonition [!${am[1]}] — use NOTE, TIP, IMPORTANT, WARNING, or CAUTION.`);
    }
    // obvious unredacted secrets
    const sec = lines[i].match(SECRET_RE);
    if (sec) add(i + 1, 'warn', `Possible unredacted secret ("${sec[0].slice(0, 10)}…") — redact as <redacted> or sk-•••.`);

    i++;
  }
  return findings;
}

function lintFence(lang, body, start, add) {
  const text = body.join('\n');
  const at = start + 1;
  if (lang === 'question' || lang === 'ask') {
    const ls = body.map((l) => l.trim()).filter(Boolean);
    let idx = 0;
    if (ls[0] && /^(multiple|multi|select all( that apply)?)$/i.test(ls[0])) idx = 1;
    if (!ls[idx]) add(at, 'error', 'question fence has no question text (the first non-directive line is the prompt).');
  } else if (lang === 'openapi' || lang === 'swagger') {
    if (!/(^|\n)\s*paths\s*:/.test(text) && !/"paths"\s*:/.test(text)) {
      add(at, 'warn', 'openapi fence has no `paths:` — include at least one path, or it falls back to a raw code block.');
    }
  } else if (lang === 'migration' || lang === 'sql-migration' || lang === 'db-migration') {
    const hasUp = /--\s*(\+migrate\s+up|migrate:up|up)\b/i.test(text);
    const hasDown = /--\s*(\+migrate\s+down|migrate:down|down)\b/i.test(text);
    if (!hasUp && !hasDown) add(at, 'warn', 'migration fence has no -- up / -- down markers; add them for apply/rollback panes.');
    else if (hasUp && !hasDown) add(at, 'warn', 'migration has -- up but no -- down — it will be badged irreversible (fine if intended).');
  } else if (lang === 'diff' || lang === 'patch') {
    if (!/^[+-]/m.test(text)) add(at, 'warn', 'diff fence has no +/- lines — is it really a diff?');
    // A `@@` line must be a real hunk header (`@@ -a,b +c,d @@`); a bare label
    // like `@@ someFunction` is passed to diff2html verbatim and renders wrong.
    // Omitting the `@@` line entirely is fine — the renderer synthesizes one.
    body.forEach((line, k) => {
      if (/^@@/.test(line) && !/^@@ -\d+(,\d+)? \+\d+(,\d+)? @@/.test(line)) {
        add(start + 2 + k, 'warn', `malformed hunk header \`${line.trim().slice(0, 30)}\` — use \`@@ -old,count +new,count @@\`, or drop the \`@@\` line and the renderer will synthesize one.`);
      }
    });
  } else if (lang === 'api' || lang === 'http') {
    if (!/\b(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/i.test(text)) add(at, 'warn', 'api fence has no request line (e.g. `POST /path`).');
  } else if (lang === 'filetree' || lang === 'files' || lang === 'file-tree') {
    const entries = body.map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    if (!entries.length) add(at, 'warn', 'filetree fence has no file entries.');
  }
  // tldr/tl;dr/summary need no extra shape check — the generic empty-fence guard
  // above already requires prose content.
}

// ---- CLI ----

function collectFiles(target) {
  const st = fs.statSync(target);
  if (st.isDirectory()) {
    return fs.readdirSync(target)
      .filter((n) => /\.(md|markdown)$/i.test(n))
      .map((n) => path.join(target, n));
  }
  return [target];
}

function main() {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const targets = args.filter((a) => !a.startsWith('--'));
  if (!targets.length) {
    console.error('usage: visual-docs-lint <file.md | dir> [more...] [--strict]');
    process.exit(2);
  }

  let files = [];
  for (const t of targets) {
    try { files = files.concat(collectFiles(t)); }
    catch { console.error(`cannot read ${t}`); process.exitCode = 2; }
  }

  let errors = 0;
  let warnings = 0;
  for (const f of files) {
    let findings;
    try { findings = lintText(fs.readFileSync(f, 'utf8'), f); }
    catch (e) { console.error(`${f}: cannot read (${e.message})`); process.exitCode = 2; continue; }
    findings.sort((a, b) => a.line - b.line);
    for (const x of findings) {
      if (x.sev === 'error') errors++; else warnings++;
      console.log(`${x.file}:${x.line}: ${x.sev === 'error' ? 'error' : 'warn '} ${x.msg}`);
    }
  }

  const total = errors + warnings;
  if (!total) {
    console.log(`✓ ${files.length} doc(s) clean.`);
  } else {
    console.log(`\n${total} problem(s): ${errors} error(s), ${warnings} warning(s).`);
  }
  if (errors > 0 || (strict && warnings > 0)) process.exit(1);
}

main();
