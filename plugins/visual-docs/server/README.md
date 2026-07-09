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
- **Export**: any doc as one self-contained HTML file (`--export <dir>
  <doc.md>`, or the toolbar's export button) — same rendering fidelity,
  works offline from `file://`, no server needed to view it.

No npm dependencies — the server is pure `node:http` (Node ≥ 18). The browser
UI is a small [Preact](https://preactjs.com/) app (with htm, no build step),
and rendering uses **vendored** libraries (marked, DOMPurify, mermaid,
highlight.js, diff2html, js-yaml, nomnoml, preact, htm) served from
`assets/vendor/` — the page makes zero external requests and works fully
offline. Each tag also carries a Subresource Integrity hash, so a tampered
vendored file is refused by the browser. Each vendored
file's version, source URL, license, size, and SHA-384 are recorded in an
SBOM-style manifest, [`assets/vendor/manifest.json`](assets/vendor/manifest.json):

```bash
node scripts/update-vendor.mjs --verify   # check files against the manifest
node scripts/update-vendor.mjs            # re-fetch and re-pin (upgrades)
```

## Usage

```bash
visual-docs-server [dir] [options]

  --port <n>      Port to listen on (default: random free port)
  --host [addr]   Address to bind (default: 127.0.0.1). Bare --host binds
                  0.0.0.0 (all interfaces) and prints per-interface
                  "Network:" URLs — handy for reviewing from another device
                  over LAN or Tailscale.
  --serve         Start in the background and print the URL, then return
                  (cross-platform; no nohup/& needed)
  --restart       Replace an instance already serving this dir
  --stop          Stop the instance serving this dir, then exit
  --no-watch      Disable live reload
```

Agent-facing commands — each prints ready-to-read text (no JSON to parse, no
shell glue), so an agent never has to write a script:

```bash
visual-docs-server --docdir                        # print a fresh, session-scoped docs dir
visual-docs-server --comments <dir> [<file>.md]    # open-comments digest (markdown)
visual-docs-server --status <dir> <id[,id2,…]> <state>   # set new|acknowledged|resolved
```

The server records itself in `<dir>/.visual-docs/server.json` (pid, port, url,
version), so starting again for an already-served directory just prints its URL
instead of failing on a port clash, `--restart` swaps options (e.g. add
`--host`) in one command, and `--stop` shuts down exactly that instance — no
manual PID handling. If the plugin on disk has moved past the version a running
server started with, `--comments`/`--status`/a plain reuse print a one-line
note recommending `--restart`; the browser shows the same nudge as a
dismissible banner.

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
| `POST /api/comments/status` | Set lifecycle state: `{id\|ids, status}` (`new`/`acknowledged`/`resolved`) |
| `GET /api/events` | SSE stream: `{type: "change"\|"comment", path}` |
| `GET /agent/comments.md[?path=<rel>]` | Open comments as a readable markdown digest |
| `GET /files/<rel>` | Images referenced by documents (content-verified by magic bytes) |

These endpoints exist for the browser client and direct use. **Agents should use
the `--comments` / `--status` commands above instead** — they return formatted
text, so there's no JSON to parse. Comments live in
`<dir>/.visual-docs/comments.json` (lifecycle `new → acknowledged → resolved`;
the legacy `"resolved": true` boolean is still honoured).

## Security posture

Binds to `127.0.0.1` by default and refuses path traversal outside the served
directory. `--host` (bare or with an address) exposes it to your network —
only do that on a network you trust (e.g. a Tailscale tailnet); there is no
authentication.

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
