# @patrickdappollonio/visual-docs-server

A zero-dependency local markdown viewer built for agent workflows. Point it at
a directory; every `.md` file in it becomes a rendered, live-reloading web
document with:

- **Mermaid diagrams** (` ```mermaid `)
- **Sketch-style diagrams** via nomnoml's text DSL (` ```nomnoml `) — chosen
  over Excalidraw because a text DSL is diffable and cheap for AI agents to
  write, unlike coordinate-based scene JSON
- **Rich diffs** with unified/side-by-side toggle (` ```diff `)
- **Database migration cards** with up/down panes (` ```migration `)
- **HTTP request/response cards**, `curl -v` style (` ```api `)
- **Read-only OpenAPI explorer** (` ```openapi `, YAML or JSON)
- Syntax highlighting for everything else
- **Live reload** (SSE + filesystem watch) — edits appear instantly
- **Comments**: readers pin feedback to sections; comments persist to
  `<dir>/.visual-docs/comments.json` and are exposed over a tiny JSON API so
  an agent can read and resolve them. A "Copy as prompt" fallback turns
  feedback into a pasteable message when the server isn't reachable.
- Light/dark themes.

No npm dependencies — the server is pure `node:http` (Node ≥ 18). Rendering
happens client-side with **vendored** renderer libraries (marked, mermaid,
highlight.js, diff2html, js-yaml, nomnoml) served from `assets/vendor/` —
the page makes zero external requests and works fully offline. Each vendored
file's version, source URL, license, size, and SHA-384 are recorded in an
SBOM-style manifest, [`assets/vendor/manifest.json`](assets/vendor/manifest.json):

```bash
node scripts/update-vendor.mjs --verify   # check files against the manifest
node scripts/update-vendor.mjs            # re-fetch and re-pin (upgrades)
```

## Usage

```bash
visual-docs-server [dir] [options]

  --port <n>     Port to listen on (default: random free port)
  --host <addr>  Address to bind (default: 127.0.0.1)
  --no-watch     Disable live reload
```

The process prints a machine-readable line for scripts and agents:

```
VISUAL_DOCS_URL=http://127.0.0.1:39257/
```

Open `/#/<file>.md` for a specific document; the sidebar lists everything.

Try the kitchen-sink example: `visual-docs-server examples/`.

## HTTP API

| Endpoint | Description |
| :------- | :---------- |
| `GET /api/docs` | List markdown files (path, title, mtime) |
| `GET /api/doc?path=<rel>` | Raw markdown + mtime for one file |
| `GET /api/comments[?path=<rel>]` | Reader comments (optionally per document) |
| `POST /api/comments` | Add a comment: `{path, section, text}` |
| `GET /api/events` | SSE stream: `{type: "change"\|"comment", path}` |
| `GET /files/<rel>` | Static files referenced by documents (images, …) |

Comments live in `<dir>/.visual-docs/comments.json`; mark one addressed by
setting `"resolved": true`.

## Security posture

Binds to `127.0.0.1` by default and refuses path traversal outside the served
directory. `--host 0.0.0.0` exposes it to your network — only do that on a
network you trust; there is no authentication.

## Credits

This package is part of the [`visual-docs` Claude Code plugin](https://github.com/patrickdappollonio/claude-plugins/tree/main/plugins/visual-docs),
a fully local reimplementation of the excellent
[`visual-plan` and `visual-recap` skills by Builder.io](https://github.com/BuilderIO/skills),
which pioneered the idea of agents communicating plans through rich visual
documents. Rendering is powered by [marked](https://github.com/markedjs/marked),
[mermaid](https://github.com/mermaid-js/mermaid),
[highlight.js](https://github.com/highlightjs/highlight.js),
[diff2html](https://github.com/rtfpessoa/diff2html),
[js-yaml](https://github.com/nodeca/js-yaml), and
[nomnoml](https://github.com/skanaar/nomnoml) — see
[`assets/vendor/manifest.json`](assets/vendor/manifest.json) for exact
versions and licenses.
