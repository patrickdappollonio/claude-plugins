# CLAUDE.md — patrickdappollonio/claude-plugins

A Claude Code **plugin marketplace**. `.claude-plugin/marketplace.json` lists the
plugins under `plugins/`:

- **`plugins/adversarial-review`** — a skill that runs a hostile, bias-free review.
- **`plugins/visual-docs`** — the main body of work here: local visual plans &
  recaps (a bundled server renders agent-authored markdown in the browser).

## Hard rules

- **Never add Claude/AI attribution** to commits or PRs — no `Co-Authored-By:
  Claude`, no "Generated with Claude Code". This is a standing, non-negotiable
  constraint from the repo owner.
- **Commit/push only when asked.** Work on a branch, not `main`.
- The visual-docs server has **no authentication**. `--host` / `0.0.0.0` binding
  must stay opt-in and documented as trusted-network-only.

## visual-docs architecture

A zero-dependency reader you serve locally. Nothing is remote.

- **Server** (`server/`): plain `node:http`, no framework. `bin/…-server.js`
  self-manages via a lock file (`.visual-docs/server.json`) — supports
  `--restart`, `--stop`, bare `--host`. `lib/server.js` holds routing, SSE live
  reload, the single access gate (`resolveServable`: safeJoin + hidden-segment
  check + realpath + ext allowlist), image magic-byte sniffing, and the comments
  API. Only markdown + content-sniffed images are served.
- **Viewer** (`server/assets/`): **Preact 10 + htm, vendored, no build step**
  (`app.js` is loaded directly). Globals: `window.preact`, `window.preactHooks`,
  `window.htm`. The document body is a "Preact-owns-the-element-but-we-manage-it-
  imperatively" escape hatch — the `<article id="content">` is empty in the vdom
  and hydrated via `innerHTML` + hydrate passes in effects.
- **Vendored deps** (`server/assets/vendor/`) are pinned with **Subresource
  Integrity** and an SBOM. Regenerate with `node server/scripts/update-vendor.mjs`;
  verify with `--verify` (CI runs this — deps must be committed).

### Fences & components (all rendered client-side, then DOMPurify-sanitized)

`tldr`/`summary` (prominent top-of-doc summary card; markdown body),
`mermaid`, `nomnoml`, `diff`/`patch`, `migration` (up/down + unified/side-by-side
toggle), `api`/`http`, `openapi`/`swagger`, `filetree`/`files` (tree-table with
A/M/D/R + notes), `question`/`ask` (interactive; answers post as comments),
GitHub admonitions (`> [!NOTE]` …). Authoring reference:
`skills/shared/authoring-guide.md`; quality bar: `skills/shared/document-quality.md`.

**When you add a new fence/component, also:** register it in the gutter
`COMPONENTS` list (if commentable), document it in `authoring-guide.md` + the
README fence table, and **add a rule for it to the linter**
(`server/bin/visual-docs-lint.js`) — at minimum recognize its language(s) and
validate its shape, so `visual-docs-lint` covers every component.

### Comments

Stored in `<served-dir>/.visual-docs/comments.json`. **Agents use the `node` CLI
— never JSON:** `visual-docs-server.js --comments <dir>` prints the digest,
`--status <dir> <id[,…]> <state>` sets lifecycle state (plain-text confirmation).
Those wrap the HTTP API, which exists for the browser client / direct use: `GET
/agent/comments.md` (same markdown digest), `POST /api/comments/status`
(`{id|ids, status}`), `GET /api/comments` (raw JSON, browser only). Lifecycle
`status`: **new → acknowledged → resolved** (legacy `resolved:true` still
honored); hand-editing the JSON still works but the CLI/endpoint is supported.
Rule of thumb: **don't serve JSON to the agent — format it** (markdown digest,
`--docdir`/`--serve`/`--status` all print ready-to-read text).
Anchors: text (quote+prefix/suffix), component (type+stable-id+hint), or section
(heading). A best-effort `line` is resolved (client + server) by normalizing the
rendered quote and raw markdown to bare alphanumerics before matching, so
`path:line` survives bold/`code`/[links]/smart-quotes/soft-wraps.
The **gutter comment button** (Notion-style) is the single add-a-comment
affordance — it follows the hovered block into the right margin for every block
type (headings, paragraphs, lists, code, components).

## Gotchas (things that have bitten us)

- **DOMPurify's mXSS guard strips an attribute value that looks like it closes a
  comment/tag** (matches `/((--!?|])>)|<\/(style|title)/i` — e.g. mermaid's
  `-->`). Fence sources are therefore **base64-encoded** into `data-*` attrs
  (`blockAttrs`/`encodeSrc`). Don't put raw source in a data attribute.
- DOMPurify keeps inline `<svg>`, `<form>`/`<input>`, and `style` — verified.
  Icons are inline SVG (`ICON` map), never emoji (emoji render inconsistently).
- **`[hidden]` must win**: several affordances are `display:inline-flex` but
  toggled via the `hidden` attribute, so `[hidden]{display:none!important}` is in
  the reset. Don't remove it.
- **Scope top-level table CSS as `.markdown-body > table`** — a bare
  `.markdown-body table` clobbers diff2html's nested tables.
- Effects that render into `#content` guard stale async work with a `cancelled`
  flag; the SSE handlers re-check `currentRef` before `setDoc`.

## Running & testing

```bash
# serve a directory of markdown docs
node plugins/visual-docs/server/bin/visual-docs-server.js <dir>
node plugins/visual-docs/server/scripts/update-vendor.mjs --verify   # deps intact?
```

Headless verification uses `playwright-core` + a system Chromium (see prior test
scripts): load a doc, `waitUntil:'load'` (never `networkidle` — SSE keeps the
connection open), then assert rendered SVGs/blocks and screenshot. Always test
with external requests blocked to prove it works fully offline.
