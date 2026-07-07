---
name: visual-plan
description: Use when the user wants to review an implementation plan visually — "visual plan", "show me the plan in the browser", "render this plan" — or when a plan involves architecture, schema, or API changes worth reviewing before code is written. Writes the plan as markdown and serves it locally (bundled zero-dependency server) with Mermaid diagrams, rich diffs, DB migration cards, API call cards, live reload, and a comment feedback loop. Fully local; no remote services.
---

# Visual Plan

Turn a plan into an interactive document the user reviews in their browser,
served entirely from their machine. The plan is a plain markdown file — the
bundled server renders it with diagrams, diffs, and styled blocks, live-reloads
as you edit it, and collects the user's comments for you to read back.

**Acknowledge first, then work quietly.** Before you do anything else, reply with
one short sentence that acknowledges the request and says you're gathering what
you need — e.g. *"Got it — let me dig into the code and put together a visual plan
for the rate-limiting change."* This is the one message the user should get up
front; never jump straight into tool calls with no reply. Then **spend your
tokens on the document, not on narrating**: do the research and inventory
silently — no step-by-step play-by-play, no restating what you found — and
surface next with the link (once served) and a one-line pointer. Put the budget
you'd spend narrating into the plan's coverage instead.

**The sequence — do every step, in order; the last two are the ones agents skip:**

1. Research the change and write the plan file.
2. Inventory it (silently).
3. **Lint it and fix every finding** — required, not optional (§3).
4. **Self-review the rendered document** — required (§3): re-read it top to
   bottom against your inventory before anyone else sees it.
5. Serve it and hand over the link.
6. Read and act on comments.

## Workflow

### 1. Research first, then write the plan file

Do the normal planning work first (read the code, understand the change). Then
write the plan as a single markdown file. Choose the directory:

- **Default (throwaway review):** let the server resolve a fresh, session-scoped
  temp directory for you — cross-platform (it uses the OS temp dir under the
  hood), unique per session so it starts empty every session and never overlaps
  another project's docs. Don't hand-build paths; run this, and it **prints the
  directory** — reuse that path (referred to below as `$DIR`) for the file you
  write and the serve/comments/status commands:
  ```
  node "${CLAUDE_PLUGIN_ROOT}/server/bin/visual-docs-server.js" --docdir
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
document. Use `${CLAUDE_PLUGIN_ROOT}/skills/shared/authoring-guide.md` for fence
syntax. The plan is where your tokens go: budget you didn't spend narrating
belongs here.

Author top to bottom against this skeleton; include a section when the inventory
has items, skip one only when it had nothing there:

1. `# Title` — one line, imperative. Directly under it, add a ` ```tldr `
   summary card (recommended for anything non-trivial): 2–4 sentences a reader
   absorbs in one glance before scrolling.
2. `## Summary` — birds-eye first: a plain-terms paragraph on what you'll do and
   *why*, **no code/symbol names**, then a `> [!IMPORTANT]` admonition (never a
   bold-keyword blockquote) for anything the user must decide.
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

**Then lint and self-review — both required, before you serve or share anything.
Do not write the file and stop.**

1. **Lint** and fix every finding — not optional:
   ```
   node "${CLAUDE_PLUGIN_ROOT}/server/bin/visual-docs-lint.js" "$DIR/<file>.md"
   ```
2. **Self-review**: re-read the whole plan top to bottom as the user will see it,
   and check: every inventory item maps to a block or has a one-clause omission
   reason; every fence is well-formed for its type (a ` ```diff ` has real
   `+`/`-` lines, a ` ```migration ` has `-- up`/`-- down`, an ` ```api ` has a
   request line, a ` ```mermaid ` is valid); no leftover placeholder or truncated
   block; secrets redacted. Fix what you find, then re-lint.

Grounding rule: every path, line, schema, and API shape must come from
the actual codebase or the proposed edit — don't invent detail. Redact secrets.

### 4. Serve it

Start the bundled server with `--serve`: it backgrounds itself and prints the
URL, then returns — cross-platform, no `nohup`/`&` (which don't exist on
Windows). It self-manages per directory via a lock file, so you can run this
unconditionally — if one is already serving `$DIR` (from an earlier plan this
session) it just prints the URL and exits, and new files appear in the sidebar
automatically:

```bash
node "${CLAUDE_PLUGIN_ROOT}/server/bin/visual-docs-server.js" --serve "$DIR"
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
open comments as a ready-formatted digest — plain text, nothing to parse:

```
node "${CLAUDE_PLUGIN_ROOT}/server/bin/visual-docs-server.js" --comments "$DIR"
```

(Append a file — `--comments "$DIR" <file>.md` — to scope to one document.) Each
comment is labelled with what it's anchored to (a section, a quoted snippet, or a
component) and carries an `id`. Address every open comment and edit the markdown
file in place (the browser reloads automatically).

Drive each comment's `status` with the same tool — no JSON, no hand-editing
`comments.json`:

```
node "${CLAUDE_PLUGIN_ROOT}/server/bin/visual-docs-server.js" --status "$DIR" <id> acknowledged
# …then `resolved` when done. Pass comma-separated ids (id1,id2) to update several.
```

It prints a plain confirmation (`Updated N comment(s) to "acknowledged".`). The
viewer shows the three states (`new` → `acknowledged` → `resolved`) and live-
updates. If the user pastes a "Copy as prompt" block into chat instead, treat it
identically.

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
