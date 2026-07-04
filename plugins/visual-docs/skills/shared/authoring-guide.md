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
- Blockquotes starting with `**Decision needed:**` or `**Risk:**` are the
  idiom for calling out things the reader must weigh in on.

## Special fences

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

### Excalidraw scenes — ` ```excalidraw `

The contents of an `.excalidraw` file (scene JSON) render as a static SVG.
Use this only for pre-existing Excalidraw assets — when authoring a new
diagram yourself, a text DSL (mermaid or nomnoml) is far easier to get right
than hand-writing scene coordinates.

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

## Comments / feedback loop

Readers can pin comments to any H2 section (hover the heading) or leave
document-level comments. Comments are stored server-side in
`<served-dir>/.visual-docs/comments.json` and exposed at `GET /api/comments`.

Each comment looks like:

```json
{
  "id": "c-…",
  "path": "plan.md",
  "section": "Rollout",
  "text": "Enable per-region only after the metric exists",
  "createdAt": "2026-07-04T08:00:31.804Z",
  "resolved": false
}
```

Agent obligations:

1. **Before every revision**, fetch open comments
   (`curl -s <url>api/comments` or read the JSON file) and address them.
2. After addressing a comment, set its `"resolved": true` in
   `.visual-docs/comments.json` so the reader sees it cleared.
3. The viewer also offers "Copy as prompt" — users may paste feedback directly
   into chat instead; treat pasted prompts and stored comments the same way.
