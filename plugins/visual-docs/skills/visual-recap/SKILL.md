---
name: visual-recap
description: Use when the user wants a visual summary of work that was done — "visual recap", "recap this PR/branch/commit visually", "show me what changed in the browser" — for a PR, branch, commit range, or uncommitted changes. Generates a markdown recap grounded in the real diff and serves it locally (bundled zero-dependency server) with Mermaid diagrams, annotated rich diffs, DB migration cards, API call cards, live reload, and a comment feedback loop. Fully local; no remote services.
---

# Visual Recap

Turn a change — a PR, branch, commit range, or the working tree — into an
interactive review document served entirely from the user's machine.

## Workflow

### 1. Capture the change

Figure out what to recap, then capture the diff **once**:

- **PR:** `gh pr diff <n>` and `gh pr view <n> --json title,body,commits`
- **Branch:** `git diff <base>...HEAD` (find the base with
  `git merge-base origin/main HEAD` or the user's stated base)
- **Commit(s):** `git show <sha>` / `git diff <a>..<b>`
- **Uncommitted work:** `git diff HEAD` plus `git status --porcelain`
- **Ambiguous** (e.g. both an open PR and local changes): ask the user which.

Also capture `--name-status` for the file list. Everything in the document
must be derived from this captured diff — that is what makes the recap
trustworthy.

### 2. Take inventory before writing

A thin recap is the common failure. Prevent it: before authoring, scan the
captured diff and **list every meaningful item** it touches —

- changed **files**, grouped by area, with their change flag;
- new/changed **schema, tables, migrations**;
- new/changed **API endpoints, routes, actions, message shapes**;
- new/changed **components, flows, or data paths** (anything that moved);
- new/changed **UI surfaces or states**;
- the **load-bearing code hunks** a reviewer must actually read;
- **risks**: compatibility breaks, unhandled cases, follow-ups.

The finished recap must **represent each meaningful item with a block, or
intentionally omit it** because it's tiny, redundant, or not reviewer-facing.
This inventory is your coverage checklist — work down it as you author. Recap
the **whole work unit** (all the thread's commits/changes), not just the latest
fix.

### 3. Write the recap file

Directory selection and serving are identical to the visual-plan skill:
default to `DIR="${TMPDIR:-/tmp}/visual-docs-$(basename "$PWD")"` (create
once, reuse), or a user-chosen repo path if they want it kept. Name the file
after the change, e.g. `$DIR/recap-pr-142.md`.

Follow `${CLAUDE_PLUGIN_ROOT}/skills/shared/authoring-guide.md` for fence
syntax. **Substantial ≠ verbose:** be lean in prose but complete in coverage —
a reviewer should be able to understand the whole change from the recap without
opening the raw diff. Author top to bottom against this skeleton; include a
section when the inventory has items for it, and when you skip one, it's because
the inventory had nothing there — not because you didn't look.

1. `# Title` — what the change accomplished, past tense
   ("Added rate limiting to the public API").
2. `## Outcome` — the **birds-eye view first**: 1–3 short paragraphs a
   non-author could follow — what this change accomplishes and *why*, in plain
   terms, before any code. Then what reviewers should scrutinize. Flag risky or
   surprising parts with `> **Risk:** …`. This is the part that makes a recap
   feel comprehensive; don't shortchange it.
3. `## What changed` — the full file list with change flags (path,
   added/modified/deleted/renamed, one-line purpose each), grouped by area. A
   reviewer should see the footprint at a glance.
4. `## Architecture` — a ` ```mermaid ` (or sketch-style ` ```nomnoml `)
   diagram when the change moved components, flows, or data paths. Prefer a
   two-dimensional shape (before/after, layered, swimlane) over a flat chain.
5. `## Data & schema` — ` ```migration ` fences for schema/migration changes,
   reflecting the actual migration files.
6. `## API` — ` ```api ` exchange examples for changed behaviour and/or an
   ` ```openapi ` fence for added or modified endpoints. Give each distinct
   message shape its own example.
7. `## Key changes` — 3–8 H3 subsections, each introduced by a sentence saying
   what to look at and *why it matters*, then a focused ` ```diff ` fence
   (~150 lines max) with real hunks. Cover the load-bearing hunks from the
   inventory, not an arbitrary sample. Fewer than 3 on a large change
   under-serves the reviewer; more than 8 stops being a summary — summarize or
   link the rest.
8. `## Risks & follow-ups` — bullets: what wasn't done, what to watch after
   merge/deploy, suggested next steps.

**Diff → block coverage.** Map each kind of change to the block that carries
it, so nothing in the inventory is dropped: schema/migration → ` ```migration `;
endpoint/route → ` ```api ` / ` ```openapi `; architecture/flow shift →
` ```mermaid ` / ` ```nomnoml `; any load-bearing code hunk → ` ```diff `;
files → the `## What changed` list; a UI change → embed a screenshot image
(referenced via `/files/…`) or diagram the flow. Prose (`## Outcome`, risk
notes) is the only place you write freely.

Grounding rule: structured blocks are only true if derived from the actual
changed lines — real paths, real fields, real method/path, real before/after
text. Never infer content that isn't in the diff; when the diff doesn't contain
a fact, leave it out or mark it as inferred. Redact secrets as
`<redacted>` / `sk-•••`.

### 4. Serve and share

```bash
nohup node "${CLAUDE_PLUGIN_ROOT}/server/bin/visual-docs-server.js" "$DIR" \
  > "$DIR/.server.log" 2>&1 &
echo $! > "$DIR/.server.pid"
sleep 1 && grep VISUAL_DOCS_URL "$DIR/.server.log"
```

Skip the start if a server for `$DIR` is already running (e.g. from a
visual-plan earlier in the session) — new files just appear in the sidebar.
Give the user `http://127.0.0.1:<port>/#/<file>.md` and mention: live reload;
they can **select any text** to comment on that exact snippet, hover a heading
or a rendered component (diagram, diff, …) to pin a comment there, or use "Copy
as prompt" for chat-style feedback.

### 5. Respond to review

Before revising the recap (or acting on review feedback), read open comments as
a ready-to-read digest — no JSON parsing needed:

```bash
curl -s http://127.0.0.1:<port>/agent/comments.md
```

Each comment is labelled with what it's anchored to: a section, a quoted
snippet of the document, or a component (e.g. "mermaid diagram"). Use
`/api/comments` if you want the structured JSON, or add `?path=<file>` to
scope to one document. Comments on a recap often request code changes, not
document changes — when a comment asks for a fix, confirm scope with the user
before editing code. After handling a comment, set its `"resolved": true` in
`$DIR/.visual-docs/comments.json` (the viewer live-updates). Treat pasted
"Copy as prompt" blocks exactly like stored comments.

## Cleanup

Stop the server this session started using the recorded PID, when the session
is done:

```bash
kill "$(cat "$DIR/.server.pid")" 2>/dev/null && rm -f "$DIR/.server.pid"
```

Avoid `pkill -f visual-docs-server` — it kills every instance on the machine.
