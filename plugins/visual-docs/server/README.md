# @patrickdappollonio/visual-docs-server

A zero-dependency local markdown viewer built for agent workflows. Point it at
a directory; every `.md` file in it becomes a rendered, live-reloading web
document with:

- **Mermaid diagrams** (` ```mermaid `)
- **Sketch-style diagrams** via nomnoml's text DSL (` ```nomnoml `) and
  static rendering of Excalidraw scenes (` ```excalidraw `)
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
happens client-side; the viewer page loads pinned renderer libraries (marked,
mermaid, highlight.js, diff2html, js-yaml) from jsDelivr, and every special
block degrades to a plain code block when offline.

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

This package is part of the [`visual-docs` Claude Code plugin](https://github.com/patrickdappollonio/claude-plugins/tree/main/plugins/visual-docs).
