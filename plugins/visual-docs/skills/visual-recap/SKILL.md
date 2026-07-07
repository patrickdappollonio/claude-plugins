---
name: visual-recap
description: Use when the user wants a visual summary of work that was done — "visual recap", "recap this PR/branch/commit visually", "show me what changed in the browser" — for a PR, branch, commit range, or uncommitted changes. Generates a markdown recap grounded in the real diff and serves it locally (bundled zero-dependency server) with Mermaid diagrams, annotated rich diffs, DB migration cards, API call cards, live reload, and a comment feedback loop. Fully local; no remote services.
---

# Visual Recap

Turn a change — a PR, branch, commit range, or the working tree — into an
interactive review document served entirely from the user's machine.

**Acknowledge first, then work quietly.** Before you do anything else, reply with
one short sentence that acknowledges the request and says you're gathering what
you need — e.g. *"On it — let me pull the diff together and build a visual recap
of PR 142."* This is the one message the user should get up front; never jump
straight into tool calls with no reply. Then **spend your tokens on the document,
not on narrating**: move through steps 1–4 without a play-by-play — no "Step 1:
capturing the diff…", no restating the captured diff or the inventory, no "here's
what I found." Your next message after the acknowledgement is the link (once
served) with a one-line pointer. Every token you'd spend describing the work,
spend instead making the document more complete.

**The sequence — do every step, in order; the last two are the ones agents skip:**

1. Capture the diff (once).
2. Inventory it (silently).
3. Write the recap file.
4. **Lint it and fix every finding** — required, not optional (§3).
5. **Self-review the rendered document** — required (§3): re-read it top to
   bottom against your inventory before anyone else sees it.
6. Serve it and hand over the link.
7. Read and act on comments.

## Workflow

### 1. Capture the change

Figure out what to recap, then capture the diff **once**:

- **PR:** `gh pr diff <n>` and `gh pr view <n> --json title,body,commits`
- **Branch:** `git diff <base>...HEAD` (find the base with
  `git merge-base origin/main HEAD` or the user's stated base)
- **Commit(s):** `git show <sha>` / `git diff <a>..<b>`
- **Uncommitted work:** `git diff HEAD` plus `git status --porcelain`
- **Ambiguous** (e.g. both an open PR and local changes): ask the user which.

Also capture `--name-status` for the file list. Everything in the document must
be derived from this captured diff — that's what makes the recap trustworthy.
Keep the captured output **out of chat**; it flows only into the document's
fences, never as a pasted block in your reply.

### 2. Take inventory before writing (silently)

A thin recap is the common failure. Prevent it by building — **as internal
reasoning, never a chat message** — a checklist of every meaningful item the
captured diff touches: each changed **file** (with its flag), **schema/table/
migration**, **endpoint/route/message shape**, **component/flow/data-path** that
moved, **UI surface or state** (incl. empty/loading/error/permission states),
**load-bearing code hunk**, and **risk**. Recap the whole work unit (all the
thread's changes), not just the latest fix.

Do not print this checklist into your reply — its only visible trace is the
coverage it produces inside the document. It's your coverage list for step 3's
audit.

### 3. Write the recap file

Directory selection and serving are identical to the visual-plan skill. Default
to a fresh, session-scoped temp directory resolved by the server itself —
cross-platform (OS temp dir under the hood), unique per session so it starts
empty every session and never overlaps another project's recaps. Don't hand-
build paths; run this, and it **prints the directory** — reuse that path
(referred to below as `$DIR`). Use a user-chosen repo path only if they want it
kept:

```
node "${CLAUDE_PLUGIN_ROOT}/server/bin/visual-docs-server.js" --docdir
```

Name the file after the change, e.g. `$DIR/recap-pr-142.md`.

**Always start fresh.** Write a new recap for this session — do **not** hunt
through `/tmp` for an existing `visual-docs*` directory or reuse a recap from an
earlier session. Only update a pre-existing recap when the user explicitly asks
you to update that specific one, and before editing it, confirm it describes
*this* change: a stale recap from a different PR or project can read as almost
the same, and updating it in place as if it were yours is precisely the mistake
to avoid.

**Read `${CLAUDE_PLUGIN_ROOT}/skills/shared/document-quality.md` once (silently)
before writing** — it is the standard for making the document comprehensive,
layered simple→complex, and terse. Use
`${CLAUDE_PLUGIN_ROOT}/skills/shared/authoring-guide.md` for fence syntax.
This document is where your tokens go: any budget you didn't spend narrating
steps 1–2 belongs here — prefer one more `## Key changes` hunk, one more grounded
`api`/`migration` example, or a fuller `## Risks` list over a shorter recap.

Author top to bottom against this skeleton; include a section when the inventory
has items for it, skip one only when the inventory had nothing there:

1. `# Title` — what the change accomplished, past tense. Directly under it, add
   a ` ```tldr ` summary card (recommended for anything non-trivial): 2–4
   sentences a reader absorbs in one glance before scrolling.
2. `## Outcome` — birds-eye first: 1–3 plain-terms paragraphs a non-author
   follows, **no code/symbol names**, then what to scrutinize; flag it with a
   `> [!WARNING]` or `> [!CAUTION]` admonition, never a bold-keyword blockquote.
3. `## What changed` — a ` ```filetree ` fence: every file with a change flag
   (A/M/D/R) and a one-line purpose, grouped by area with `#` headings.
4. `## Architecture` — a ` ```mermaid `/` ```nomnoml ` diagram when components,
   flows, or data paths moved (prefer a 2-D before/after or layered shape).
5. `## Data & schema` — ` ```migration ` fences for schema changes.
6. `## API` — ` ```api ` examples and/or an ` ```openapi ` fence per changed
   endpoint (each distinct message shape its own example).
7. `## Key changes` — 3–8 H3 subsections, each led by a *why-it-matters*
   sentence, then a trimmed ` ```diff ` (≤~150 lines) plus 2–4 annotation
   bullets on the lines that matter (see document-quality.md §5).
8. `## Risks & follow-ups` — what wasn't done, what to watch, next steps.

**Then lint and self-review — both required, before you serve or share anything.
Do not write the file and stop.**

1. **Lint** and fix every finding — not optional:
   ```
   node "${CLAUDE_PLUGIN_ROOT}/server/bin/visual-docs-lint.js" "$DIR/<file>.md"
   ```
2. **Self-review**: re-read the whole document top to bottom as the reviewer will
   see it, and check:
   - every inventory item maps to a block, or has a one-clause omission reason;
   - every fence is well-formed for its type — a ` ```diff ` has real `+`/`-`
     lines, a ` ```migration ` has `-- up` (and `-- down` unless deliberately
     irreversible), an ` ```api ` has a request line, a ` ```mermaid ` is valid;
   - no leftover placeholder, `TODO`, or truncated block;
   - secrets are redacted.
   Fix what you find, then re-lint. Only after this passes do you move on.

Grounding rule: structured blocks are only true if derived from the actual
changed lines — real paths, fields, method/path, before/after text. Never infer;
when the diff doesn't contain a fact, leave it out or mark it inferred. Redact
secrets as `<redacted>` / `sk-•••`.

### 4. Serve and share

`--serve` backgrounds the server and prints the URL, then returns — cross-
platform, no `nohup`/`&`:

```bash
node "${CLAUDE_PLUGIN_ROOT}/server/bin/visual-docs-server.js" --serve "$DIR"
```

The server self-manages via a lock file: if one is already serving `$DIR` (e.g.
from a visual-plan earlier in the session) this just prints its URL and exits —
new files appear in the sidebar automatically, no need to check first. To bind
differently later (e.g. add `--host` for Tailscale), re-run with `--restart`.
Give the user `http://127.0.0.1:<port>/#/<file>.md` and mention: live reload;
they can **select any text** to comment on that exact snippet, or hover a
heading or a rendered component (diagram, diff, …) and click the margin button
("Comment on …") to comment there; "Copy as prompt" gives chat-style feedback.

### 5. Respond to review

Before revising the recap (or acting on review feedback), read open comments as
a ready-formatted digest — plain text, nothing to parse:

```
node "${CLAUDE_PLUGIN_ROOT}/server/bin/visual-docs-server.js" --comments "$DIR"
```

(Append a file — `--comments "$DIR" <file>.md` — to scope to one document.) Each
comment is labelled with what it's anchored to (a section, a quoted snippet, or a
component like "mermaid diagram") and carries an `id`. Comments on a recap often
request code changes, not document changes — when a comment asks for a fix,
confirm scope with the user before editing code.

Drive each comment's `status` with the same tool — no JSON, no hand-editing
`comments.json`:

```
node "${CLAUDE_PLUGIN_ROOT}/server/bin/visual-docs-server.js" --status "$DIR" <id> acknowledged
# …then `resolved` when done. Pass comma-separated ids (id1,id2) to update several.
```

It prints a plain confirmation (`Updated N comment(s) to "acknowledged".`); the
viewer live-updates and shows the three states (`new` → `acknowledged` →
`resolved`). Treat pasted "Copy as prompt" blocks exactly like stored comments.

## Cleanup

When the session is done, stop the server for this directory:

```bash
node "${CLAUDE_PLUGIN_ROOT}/server/bin/visual-docs-server.js" "$DIR" --stop
```

It finds the instance from the lock file and stops just that one. Avoid
`pkill -f visual-docs-server` — it kills every instance on the machine.
