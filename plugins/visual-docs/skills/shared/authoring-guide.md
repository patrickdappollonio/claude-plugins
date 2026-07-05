# Visual Docs authoring guide

Documents are plain GitHub-flavored markdown files. The viewer renders standard
markdown (headings, tables, blockquotes, images, task lists) plus the special
code fences below. Anything the viewer cannot render degrades to a plain code
block, so a document is always readable — even in a bare text editor.

## Document conventions

- Start with a single `# H1` — it becomes the document title in the title block.
- Use `## H2` for sections — every H2 gets a comment pin readers can attach
  feedback to, so name sections meaningfully ("Rollout", not "Part 3").
- Ground every structured block in real code, real diffs, and real schemas.
  Never invent line numbers, file names, or API shapes. Redact secrets as
  `<redacted>` or `sk-•••`.
- **Put one sentence of intent directly above every structured fence** (diff,
  migration, api, openapi, mermaid, nomnoml, filetree) saying what it shows and
  why it matters — a bare fence makes the reader reverse-engineer intent.
  `visual-docs-lint` warns when this is missing. (Questions are self-describing
  and exempt.)
- Blockquotes starting with `**Decision needed:**` or `**Risk:**` are the
  idiom for calling out things the reader must weigh in on.
- **GitHub-style admonitions** render as coloured callouts: start a blockquote
  with `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, or
  `> [!CAUTION]` on its own line, then the content on the next `>` lines.

      > [!WARNING]
      > Enabling this in production sheds traffic immediately — stage it first.

## Special fences

### TL;DR summary — ` ```tldr ` (aliases: ` ```tl;dr `, ` ```summary `)

A prominent summary card for the **top of the document** — a "TL;DR" eyebrow over
a few sentences a reader can absorb in one glance before scrolling. The body is
regular markdown (bold, `code`, links, a short list all render), so keep it to
the essentials: what the change does and the one or two things that matter most.
Use it once, at the very top; it's not a general callout (use `> [!NOTE]` for
those).

    ```tldr
    Adds a **token-bucket** rate limiter in front of the public API — over-limit
    requests get `429` with `Retry-After`. Limits are per API key in Redis, with
    an in-memory fallback. Default is 100 req/min, behind a rollout flag.
    ```

### Mermaid diagrams — ` ```mermaid `

Any Mermaid diagram type (flowchart, sequence, state, ER, gantt):

    ```mermaid
    flowchart LR
        A[Client] --> B{Rate limiter}
        B -- allowed --> C[API]
        B -- rejected --> D[429]
    ```

### Sketch diagrams — ` ```nomnoml `

For a hand-drawn look, use nomnoml — a compact UML-ish text DSL rendered as a
sketchy SVG. Prefer it over Mermaid when you want an informal
whiteboard/napkin feel; prefer Mermaid for sequence/ER/gantt diagrams.

    ```nomnoml
    [<start> request] -> [check bucket]
    [check bucket] -> [<choice> tokens left?]
    [tokens left?] yes -> [serve request]
    [tokens left?] no -> [<state> 429]
    ```

Nomnoml syntax primer (it is NOT Mermaid — do not mix syntaxes):

- **Nodes** are square brackets: `[api server]`. The same text = the same
  node; new text = a new node. No quoting; avoid `]`, `|`, and `;` in names.
- **Edges**: `[a] -> [b]` (arrow), `[a] --> [b]` (dashed), `[a] - [b]`
  (plain line), `[a] <-> [b]` (both ways). Label an edge by putting text
  between the dashes and the bracket: `[a] label -> [b]`.
- **Node types** via a visual tag: `[<start> begin]`, `[<end> done]`,
  `[<choice> decision?]`, `[<state> waiting]`, `[<database> users db]`,
  `[<actor> user]`, `[<frame> group title]`, `[<note> remember this]`,
  `[<package> billing]`, `[<abstract> Base]`, `[<instance> obj]`.
- **Class-style compartments** with `|`:
  `[Customer|name: string; email: string|rename(); delete()]`.
- **Nesting** (boxes inside boxes):
  `[billing|[invoice] -> [payment gateway]]`.
- **Directives** (optional, first lines, one per line):
  `#direction: right` (or `down`), `#fontSize: 12`, `#lineWidth: 2`.
  Skip colors — the viewer's theme handles that.
- One edge per line. There are no sequence/gantt/ER modes — for those,
  use Mermaid.
- Known quirk: when a `[<choice>]` node has several labelled outgoing edges
  (`yes`/`no`), nomnoml tends to cluster the labels near the node rather than
  along each edge. If that reads ambiguously, use a Mermaid flowchart instead.

### File tree — ` ```filetree ` (aliases: ` ```files `, ` ```file-tree `)

A "what changed" file map, rendered as a **striped table with a collapsed
directory tree**. One line per file as `<flag> <path>  <note>`. Flags: `A` added
(green), `M` modified (amber), `D` deleted (red), `R` renamed (blue) — or the
words `added`/`modified`/`deleted`/`renamed`. This is the block for a recap's
`## What changed` — prefer it over a plain bullet list.

- **Note** — separate it from the path with **2+ spaces** (clearest), a tab, or
  ` — `. It's optional, may be **as long as you need**, and supports inline
  markdown: `` `code` ``, **bold**, *italic*, and links. Use it to actually
  explain the change, not just label it. (A single space also works when the path
  has no spaces, but 2+ spaces reads best and never surprises.)
- **Paths shrink automatically** — shared directories collapse into folder rows
  and filenames show as basenames, so you always write the full path and the
  renderer builds the tree. Single-child chains (`a/b/c`) collapse into one row.
- **`#` heading** starts a group (e.g. `# Server`). Optional.

```
    ```filetree
    # Server
    A  internal/ratelimit/bucket.go      Core **token-bucket** with `Take(key)`; backs onto Redis, falling back to an in-memory store when it's down.
    M  internal/server/router.go         Wires the limiter in front of `/api/v1` *before* auth.
    D  internal/legacy/throttle.go       Replaced by the bucket limiter.
    R  internal/rl/old.go -> new.go      renamed for clarity

    # Tests
    A  internal/ratelimit/bucket_test.go Burst, refill, and Redis-down fallback cases.
    ```
```

### Questions — ` ```question ` (alias: ` ```ask `)

Ask the reader a question and get a structured answer back. Renders like the
agent's own question UI: the prompt, selectable options, and a free-text "write
your own" box. The first line is the question; `- ` lines are options; a lone
leading `multiple` line makes it multi-select (checkboxes instead of radios).
Options are optional — omit them for a pure free-text question. Any other
non-option line after the prompt becomes an optional **description** shown under
the title. The question, description, and option labels all support inline
markdown (`` `code` ``, **bold**, *italic*) for emphasis.

When the reader answers, the answer is saved as a **comment anchored to the
question** (it shows up in `/agent/comments.md` as `question … — <answer>`), so
you read it back exactly like any other feedback. Put these in an `## Open
questions` section (or wherever a decision is needed).

    ```question
    What should the default rate limit be?
    - 100 req/min (conservative)
    - 500 req/min
    - 1000 req/min (enterprise)
    ```

    ```question
    multiple
    Which regions should get it first?
    - us-east
    - eu-west
    - ap-south
    ```

### Diffs — ` ```diff ` (alias: ` ```patch `)

Rendered as a rich diff viewer with a unified / side-by-side toggle. Prefer
real unified diffs (with `--- a/…` / `+++ b/…` headers) taken from
`git diff`; the file name shown comes from those headers. Bare `+`/`-`
snippets also work — they are wrapped in a synthetic header.

    ```diff
    --- a/internal/server/router.go
    +++ b/internal/server/router.go
    @@ -12,6 +12,7 @@ func NewRouter(deps Deps) http.Handler {
     	r.Use(middleware.Logger)
    +	r.Use(ratelimit.RateLimit(deps.LimiterStore))
     	r.Mount("/api/v1", apiRoutes(deps))
    ```

### DB migrations — ` ```migration ` (aliases: ` ```sql-migration `, ` ```db-migration `)

Rendered as a migration card with green **up / apply** and red **down / roll
back** panes and a reversible/irreversible badge. Recognized section markers:
`-- up` / `-- down`, sql-migrate's `-- +migrate Up/Down`, and dbmate's
`-- migrate:up` / `-- migrate:down`. An optional leading `-- name: …` (or
`-- title: …`) line becomes the card title.

    ```migration
    -- name: add api_key_limits table
    -- up
    CREATE TABLE api_key_limits (…);

    -- down
    DROP TABLE api_key_limits;
    ```

Omit `-- down` and the card is badged **irreversible** — do that on purpose,
not by accident.

### API calls — ` ```api ` (alias: ` ```http `)

An HTTP exchange rendered as styled request/response cards with method and
status badges; JSON bodies are pretty-printed, headers are collapsed behind a
toggle. Write it in `curl -v` style (`>` request lines, `<` response lines) or
as plain HTTP messages:

    ```api
    > POST /api/v1/orders HTTP/1.1
    > authorization: Bearer sk-•••
    > content-type: application/json

    {"sku": "A-1001", "qty": 2}

    < HTTP/1.1 429 Too Many Requests
    < retry-after: 12

    {"error": "rate_limit_exceeded"}
    ```

### OpenAPI — ` ```openapi ` (alias: ` ```swagger `)

An OpenAPI 3.x document (YAML or JSON) rendered as a read-only, expandable
endpoint list: method badge, path, summary, and per-operation parameters,
request-body schema, and responses. Include only the paths relevant to the
document — this is a review aid, not the full spec dump.

**Reach for this (or ` ```api ` cards) whenever the change adds or modifies HTTP
endpoints — even without a formal spec file, hand-write the paths.** It shows the
endpoint contract, which a `diff` of the route handler does not; the block is the
headline for an API change, the handler diff is at most supporting evidence.

    ```openapi
    openapi: 3.0.3
    info: { title: Admin API, version: 1.0.0 }
    paths:
      /admin/limits/{id}:
        get:
          summary: Read the configured limit
          responses:
            "200": { description: Current limit }
    ```

### Everything else

Regular fences (` ```go `, ` ```python `, …) get syntax highlighting and a
language tag. Untyped fences are auto-detected.

## Linting a doc

Before serving, you can check a doc against these guidelines:

```bash
node "${CLAUDE_PLUGIN_ROOT}/server/bin/visual-docs-lint.js" path/to/doc.md
```

It flags: missing/duplicate H1, a structured fence with no one-sentence intent
above it, empty or malformed fences (e.g. an `openapi` with no `paths:`, a
`migration` with no `-- up`/`-- down`), unknown admonition types, and obvious
unredacted secrets. Errors exit non-zero; `--strict` also fails on warnings.

## Comments / feedback loop

Readers comment two ways: **select any text** to anchor a comment to that exact
snippet (this works inside text-preserving components too — diffs, migrations,
code, API exchanges — so a comment can land on a single line), or hover any
block (heading, paragraph, list, code, or a rendered component) and click the
margin ("Comment on …") button. Truly-transformed components (diagrams, the
OpenAPI explorer, the filetree table) are whole-block-only. Comments are stored
in `<served-dir>/.visual-docs/comments.json` and exposed at `GET /api/comments`
(and the digest at `GET /agent/comments.md`).

Each comment carries an `anchor` (what it's attached to) and a best-effort
`line` (the source line, so you can jump straight to `path:line`). The browser
resolves `line` when a reader comments; if you POST to `/api/comments` yourself
without a `line`, the server fills it in from the anchor's quoted text/heading —
so you don't have to compute it, though you may still pass one to override.

```json
{
  "id": "c-…",
  "path": "plan.md",
  "line": 42,
  "section": "rollout",
  "title": "Rollout",
  "anchor": { "kind": "text", "quote": "token-bucket rate limiter", "prefix": "…", "suffix": "…" },
  "text": "Enable per-region only after the metric exists",
  "createdAt": "2026-07-04T08:00:31.804Z",
  "status": "new"
}
```

The `/agent/comments.md` digest leads each entry with `` `path:line` `` and what
it's anchored to (`on “quoted text”`, `on migration [id … · "…"]`, `on
Heading`), then the comment body — so you never have to guess what a comment
refers to.

**Comment lifecycle.** Every comment has a `status`: `new` (just written by the
reader), `acknowledged` (you've read it and are working on it), or `resolved`
(you've addressed it). New comments start as `new`. As you work, POST to the
status endpoint — **don't hand-edit `comments.json` or write a script for it:**

```bash
curl -sX POST <url>api/comments/status \
  -H 'content-type: application/json' \
  -d '{"id":"<comment-id>","status":"acknowledged"}'   # then "resolved" when done
```

Pass `{"ids":["…","…"],"status":"…"}` to update several at once. Each comment's
`id` is printed in the digest alongside this exact command. The viewer shows
each state distinctly and live-updates. (The legacy `"resolved": true` boolean
is still honoured and treated as `resolved`; editing the JSON directly also
still works, but the endpoint is the supported path.) The reader's "Copy as
prompt" button copies only the `new` comments, so acknowledging promptly keeps
that clean.

`anchor` is `{kind:"text", quote, prefix, suffix}` for a selection,
`{kind:"component", type, label, id, hint}` for a diagram/diff/etc, or absent
for a heading/document comment.

For a **component** comment, `id` is a stable hash of that block's fence source
and `hint` is its first line — so you can find the exact block it refers to.
The digest shows both, e.g. `mermaid diagram [id a3f9c2 · "flowchart LR"]`; to
locate it, find the fence in the markdown whose first line matches the hint
(the `id` disambiguates if several match). The digest at `/agent/comments.md`
labels every comment by its anchor, so you always know exactly what a comment
refers to.

Agent obligations:

1. **Before every revision**, read open comments as a formatted digest:
   `curl -s <url>agent/comments.md` (add `?path=<file>` to scope to one doc).
   Each entry is labelled with its `[status]` and what it's anchored to — a
   section, a quoted snippet, or a component. `<url>api/comments` gives JSON.
2. Drive the lifecycle via the status endpoint: `POST <url>api/comments/status`
   with `{"id":"<id>","status":"acknowledged"}` when you start on a comment and
   `"resolved"` when done (or `{"ids":[…],"status":…}` for several). The viewer
   live-updates and distinguishes the three states. Don't hand-edit the JSON.
3. The viewer also offers "Copy as prompt" — users may paste feedback directly
   into chat instead; treat pasted prompts and stored comments the same way.

## Agent endpoints (`/agent/…`)

A read-only endpoint that returns formatted data an agent can `curl` directly,
so no JSON parsing or scripting is needed:

- `GET /agent/comments.md` — open comments as a readable markdown digest,
  each labelled with what it's anchored to (section, quoted text, or a
  component and its id) and carrying its own `id`. Accepts `?path=<file>` to
  scope to one document.
- `POST /api/comments/status` — update a comment's lifecycle state without
  editing `comments.json`. Body: `{"id":"<id>","status":"acknowledged"}` (or
  `{"ids":[…],"status":…}`); valid statuses `new`/`acknowledged`/`resolved`.
- Structured JSON (for programmatic use) is at `GET /api/comments`.
