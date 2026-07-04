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

### 2. Write the recap file

Directory selection and serving are identical to the visual-plan skill:
default to `DIR="${TMPDIR:-/tmp}/visual-docs-$(basename "$PWD")"` (create
once, reuse), or a user-chosen repo path if they want it kept. Name the file
after the change, e.g. `$DIR/recap-pr-142.md`.

Follow `${CLAUDE_PLUGIN_ROOT}/skills/shared/authoring-guide.md` for fence
syntax. Recap skeleton (include what applies, in this order):

1. `# Title` — what the change accomplished, past tense
   ("Added rate limiting to the public API").
2. `## Outcome` — 1–3 paragraphs: what changed, why, and anything reviewers
   should scrutinize. Flag risky or surprising parts with `> **Risk:** …`.
3. `## What changed` — the file list with change flags, as a table or a plain
   fence: path, added/modified/deleted/renamed, and a one-line purpose each.
4. `## Architecture` — a ` ```mermaid ` (or sketch-style ` ```nomnoml `)
   diagram *only if* the change moved components, flows, or data paths.
5. `## Key changes` — 3–8 H3 subsections, each a focused ` ```diff ` fence
   (~150 lines max) with real hunks from the captured diff, introduced by a
   sentence saying what to look at and why it matters.
6. `## Database changes` — ` ```migration ` fences for any migrations the
   change added; reflect the actual migration files.
7. `## API changes` — ` ```api ` exchange examples for changed behavior and/or
   an ` ```openapi ` fence for added or modified endpoints.
8. `## Risks & follow-ups` — bullets: what wasn't done, what to watch after
   merge/deploy, suggested next steps.

Grounding rule: structured blocks are only true if derived from the actual
changed lines. Never infer content that isn't in the diff; redact secrets as
`<redacted>` / `sk-•••`.

### 3. Serve and share

```bash
nohup node "${CLAUDE_PLUGIN_ROOT}/server/bin/visual-docs-server.js" "$DIR" \
  > "$DIR/.server.log" 2>&1 &
sleep 1 && grep VISUAL_DOCS_URL "$DIR/.server.log"
```

Skip the start if a server for `$DIR` is already running (e.g. from a
visual-plan earlier in the session) — new files just appear in the sidebar.
Give the user `http://127.0.0.1:<port>/#/<file>.md` and mention: live reload,
hover a heading to pin a comment, "Copy as prompt" for chat-style feedback.

### 4. Respond to review

Before revising the recap (or acting on review feedback), read open comments:

```bash
curl -s http://127.0.0.1:<port>/api/comments
```

(or `$DIR/.visual-docs/comments.json`). Comments on a recap often request
code changes, not document changes — when a comment asks for a fix, confirm
scope with the user before editing code. After handling a comment, set its
`"resolved": true` in the JSON file. Treat pasted "Copy as prompt" blocks
exactly like stored comments.

## Cleanup

Kill the server when the session is done (`pkill -f visual-docs-server`).
