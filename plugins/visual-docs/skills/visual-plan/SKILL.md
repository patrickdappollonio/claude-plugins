---
name: visual-plan
description: Use when the user wants to review an implementation plan visually — "visual plan", "show me the plan in the browser", "render this plan" — or when a plan involves architecture, schema, or API changes worth reviewing before code is written. Writes the plan as markdown and serves it locally (bundled zero-dependency server) with Mermaid diagrams, rich diffs, DB migration cards, API call cards, live reload, and a comment feedback loop. Fully local; no remote services.
---

# Visual Plan

Turn a plan into an interactive document the user reviews in their browser,
served entirely from their machine. The plan is a plain markdown file — the
bundled server renders it with diagrams, diffs, and styled blocks, live-reloads
as you edit it, and collects the user's comments for you to read back.

## Workflow

### 1. Research first, then write the plan file

Do the normal planning work first (read the code, understand the change). Then
write the plan as a single markdown file. Choose the directory:

- **Default (throwaway review):** a stable temp directory, created once and
  reused for the whole session:
  ```bash
  DIR="${TMPDIR:-/tmp}/visual-docs-$(basename "$PWD")"
  mkdir -p "$DIR"
  ```
- **User wants the plan kept:** write it where they say (e.g. `docs/plans/`)
  and serve that directory instead.

Name the file after the task, e.g. `$DIR/add-rate-limiting.md`.

### 2. Author the document

Follow `${CLAUDE_PLUGIN_ROOT}/skills/shared/authoring-guide.md` for the full
fence syntax. Recommended plan skeleton (include what applies, in this order):

1. `# Title` — one line, imperative ("Add rate limiting to the public API").
2. `## Summary` — what and why in a short paragraph, plus a
   `> **Decision needed:** …` blockquote for anything the user must decide.
3. `## Architecture` — a ` ```mermaid ` diagram (or sketch-style ` ```nomnoml `)
   when components or flows change.
4. `## Key changes` — one H3 per meaningful change: real code in normal fences,
   proposed edits as ` ```diff ` fences (real `git diff`-style hunks with file
   headers, ~150 lines max per fence).
5. `## Database changes` — ` ```migration ` fences with `-- up` / `-- down`.
6. `## API behavior` / `## API surface` — ` ```api ` request/response examples
   and/or an ` ```openapi ` fence for new or changed endpoints.
7. `## Rollout` — ordered steps, flags, sequencing.
8. `## Open questions` — bullets the user should answer in comments.

Grounding rule: every file path, line, schema, and API shape must come from
the actual codebase or the actual proposed edit. Do not decorate with invented
detail. Redact secrets.

### 3. Serve it

Start the bundled server **once per directory** (check it isn't already
running from an earlier plan in this session — if it is, just write the new
file; the sidebar and live reload pick it up):

```bash
nohup node "${CLAUDE_PLUGIN_ROOT}/server/bin/visual-docs-server.js" "$DIR" \
  > "$DIR/.server.log" 2>&1 &
sleep 1 && grep VISUAL_DOCS_URL "$DIR/.server.log"
```

The output contains `VISUAL_DOCS_URL=http://127.0.0.1:<port>/`. The server
binds to localhost on a random free port and needs no dependencies. Note: the
page loads its renderer libraries (Mermaid, highlighting, diff viewer) from a
CDN; without internet those blocks degrade to plain code but the page still
works.

### 4. Hand the user the link

Give the user the direct document URL:

```
http://127.0.0.1:<port>/#/<file>.md
```

Tell them, briefly: the page live-reloads as you edit, they can hover any
section heading to pin a comment, and "Copy as prompt" turns their feedback
into a pasteable message if they prefer chat.

### 5. Read feedback before revising — every time

Before any revision (user asks for changes, or you're checking in):

```bash
curl -s http://127.0.0.1:<port>/api/comments
```

(or read `$DIR/.visual-docs/comments.json`). Address every open comment, edit
the markdown file in place (the browser reloads automatically), then mark the
comments you handled with `"resolved": true` in the JSON file. If the user
pastes a "Copy as prompt" block into chat instead, treat it identically.

### 6. Approval gate

The plan is approved when the user says so (in chat or via a comment). Only
then move on to implementation. Keep the server running during implementation
if a recap will follow — the same server can serve both documents.

## Cleanup

The server is a single `node` process; when the session is done, kill it
(`pkill -f visual-docs-server` or the recorded PID). Temp-dir plans need no
other cleanup.
