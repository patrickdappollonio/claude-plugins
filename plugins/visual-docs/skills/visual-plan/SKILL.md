---
name: visual-plan
description: Use when the user wants to review an implementation plan visually — "visual plan", "show me the plan in the browser", "render this plan" — or when a plan involves architecture, schema, or API changes worth reviewing before code is written. Writes the plan as markdown and serves it locally (bundled zero-dependency server) with Mermaid diagrams, rich diffs, DB migration cards, API call cards, live reload, and a comment feedback loop. Fully local; no remote services.
---

# Visual Plan

Turn a plan into an interactive document the user reviews in their browser,
served entirely from their machine. The plan is a plain markdown file — the
bundled server renders it with diagrams, diffs, and styled blocks, live-reloads
as you edit it, and collects the user's comments for you to read back.

**Spend your tokens on the document, not on narrating.** Do the research and
inventory silently — no step-by-step play-by-play in chat, no restating what you
found. Surface for the first time in step 4/5 with the link and a one-line
pointer; put the budget you'd spend narrating into the plan's coverage instead.

## Workflow

### 1. Research first, then write the plan file

Do the normal planning work first (read the code, understand the change). Then
write the plan as a single markdown file. Choose the directory:

- **Default (throwaway review):** this session's own Claude scratchpad — it's
  auto-created, scoped to this session (and agent), and cleaned up for you, so it
  starts empty every session and never overlaps another project's docs. Find it
  by session id (this avoids depending on Claude's cwd→folder encoding) and fall
  back to a session-scoped temp dir if it isn't there:
  ```bash
  SCRATCH=$(ls -d /tmp/claude-$(id -u)/*/"${CLAUDE_CODE_SESSION_ID}"/scratchpad 2>/dev/null | head -1)
  DIR="${SCRATCH:-${TMPDIR:-/tmp}/visual-docs-${CLAUDE_CODE_SESSION_ID:-$$}}/visual-docs"
  mkdir -p "$DIR"
  ```
- **User wants the plan kept:** write it where they say (e.g. `docs/plans/`)
  and serve that directory instead.

Name the file after the task, e.g. `$DIR/add-rate-limiting.md`.

**Always start fresh.** Write a new file for this session's work — do **not**
search `/tmp` for an old `visual-docs*` directory or reuse a plan from an earlier
session. Only update a pre-existing file when the user explicitly points you at
one, and before you touch it, confirm it actually describes *this* change: a
stale doc from another task or project can look deceptively similar, and
overwriting it as if it were yours is the failure to avoid.

### 2. Take inventory before writing (silently)

A thin plan is the common failure. From your research, build — **as internal
reasoning, never a chat message** — a checklist of every part of the system the
plan will touch: components/modules, files to add or change, schema/tables/
migrations, endpoints/routes, flows or data-paths that shift, UI surfaces and
states, and the decisions or risks the user must weigh. Don't print it; its only
trace is the coverage it drives. It's your list for step 3's audit.

### 3. Author the document

**Read `${CLAUDE_PLUGIN_ROOT}/skills/shared/document-quality.md` once (silently)
before writing** — the standard for a comprehensive, simple→complex, terse
document. Use `authoring-guide.md` for fence syntax. The plan is where your
tokens go: budget you didn't spend narrating belongs here.

Author top to bottom against this skeleton; include a section when the inventory
has items, skip one only when it had nothing there:

1. `# Title` — one line, imperative. Directly under it, add a ` ```tldr `
   summary card (recommended for anything non-trivial): 2–4 sentences a reader
   absorbs in one glance before scrolling.
2. `## Summary` — birds-eye first: a plain-terms paragraph on what you'll do and
   *why*, **no code/symbol names**, then `> **Decision needed:** …` for anything
   the user must decide.
3. `## Architecture` — a ` ```mermaid `/` ```nomnoml ` diagram when components or
   flows change (prefer a 2-D shape over a chain).
4. `## Key changes` — one H3 per meaningful change, each led by a *why-it-matters*
   sentence: real code in normal fences, proposed edits as ` ```diff ` hunks,
   trimmed to the load-bearing lines with 2–4 annotation bullets (document-quality
   §5). 3–8 is healthy.
5. `## Database changes` — ` ```migration ` fences with `-- up` / `-- down`.
6. `## API behavior` / `## API surface` — ` ```api ` examples and/or ` ```openapi `.
7. `## Rollout` — ordered steps, flags, sequencing.
8. `## Open questions` — a ` ```question ` fence per decision (single/multi
   options + free-text); the user's answer comes back as a comment you read.

**Then audit** your inventory against the finished plan, item by item, before
serving; optionally lint it too:
`node "${CLAUDE_PLUGIN_ROOT}/server/bin/visual-docs-lint.js" "$DIR/<file>.md"`.
Grounding rule: every path, line, schema, and API shape must come from
the actual codebase or the proposed edit — don't invent detail. Redact secrets.

### 4. Serve it

Start the bundled server. It self-manages per directory via a lock file, so you
can run this unconditionally — if one is already serving `$DIR` (from an earlier
plan this session) it just prints the URL and exits, and new files appear in the
sidebar automatically:

```bash
nohup node "${CLAUDE_PLUGIN_ROOT}/server/bin/visual-docs-server.js" "$DIR" \
  > "$DIR/.server.log" 2>&1 &
sleep 1 && grep VISUAL_DOCS_URL "$DIR/.server.log"
```

The output contains `VISUAL_DOCS_URL=http://127.0.0.1:<port>/`. The server binds
to localhost on a random free port, has no dependencies, and serves the renderer
libraries from vendored local copies — the whole flow works offline.

If the user asks to review from another device (LAN, Tailscale), add a bare
`--host` flag (with `--restart` if a localhost-only instance is already up): the
server binds all interfaces and prints a `Network: http://<ip>:<port>/` line per
interface — share those. Only when asked; the server has no authentication.

### 5. Hand the user the link

Give the user the direct document URL:

```
http://127.0.0.1:<port>/#/<file>.md
```

Tell them, briefly: the page live-reloads as you edit; they can **select any
text** to comment on that snippet, or hover a section heading or a rendered
component (diagram, diff, …) and click the margin button to comment there;
"Copy as prompt" turns their feedback into a pasteable message if they prefer chat.

### 6. Read feedback before revising — every time

Before any revision (user asks for changes, or you're checking in), read the
open comments as a ready-to-read digest — no JSON parsing needed:

```bash
curl -s http://127.0.0.1:<port>/agent/comments.md
```

Each comment is labelled with what it's anchored to: a section, a quoted
snippet, or a component, and carries an `id`. Use `/api/comments` for the
structured JSON, or add `?path=<file>` to scope to one document. Address every
open comment and edit the markdown file in place (the browser reloads
automatically).

Drive each comment's `status` by POSTing to the status endpoint — do **not**
hand-edit `comments.json` or write a script for it:

```bash
curl -sX POST http://127.0.0.1:<port>/api/comments/status \
  -H 'content-type: application/json' \
  -d '{"id":"<comment-id>","status":"acknowledged"}'   # then "resolved" when done
```

Pass `{"ids":["…","…"],"status":"…"}` to update several at once. The digest
prints each comment's id and this exact command. The viewer shows the three
states (`new` → `acknowledged` → `resolved`) and live-updates. If the user
pastes a "Copy as prompt" block into chat instead, treat it identically.

### 7. Approval gate

The plan is approved when the user says so (in chat or via a comment). Only
then move on to implementation. Keep the server running during implementation
if a recap will follow — the same server can serve both documents.

## Cleanup

When the session is done, stop the server for this directory:

```bash
node "${CLAUDE_PLUGIN_ROOT}/server/bin/visual-docs-server.js" "$DIR" --stop
```

It reads the lock file and stops just that instance. Avoid
`pkill -f visual-docs-server` — it would kill every instance on the machine,
including other sessions' or other users'. Temp-dir plans need no other cleanup.
