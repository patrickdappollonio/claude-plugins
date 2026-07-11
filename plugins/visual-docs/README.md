# visual-docs

Visual plans and visual recaps for coding agents — **fully local**. Your agent
writes a plan (or a summary of a change) as a markdown file, and a tiny bundled
web server renders it in your browser as a rich, interactive document: Mermaid
diagrams, syntax-highlighted code, side-by-side diffs, styled database
migrations, API request/response cards, and a read-only OpenAPI view.

Inspired by [BuilderIO's `/visual-plan` and `/visual-recap`](https://github.com/BuilderIO/skills),
but with one key difference: **nothing leaves your machine**. There is no
hosted service, no account, and no remote page trying to connect to your
localhost (the thing browsers like Brave block by default). The page you open
is served *by* the local server itself, so everything just works.

## Install

```
/plugin marketplace add patrickdappollonio/claude-plugins
/plugin install visual-docs@patrickdappollonio
```

That's it. The renderer ships inside the plugin — there is nothing else to
install, and the server has zero npm dependencies (any Node.js ≥ 18 runs it).

## What you get

Two skills your agent picks up automatically:

| Skill | What it does | Say things like |
| :---- | :----------- | :-------------- |
| `visual-plan` | Renders an implementation plan for review **before** code gets written | "Give me a visual plan for adding rate limiting" |
| `visual-recap` | Renders a visual summary of a PR, branch, commit, or uncommitted work | "Visual recap of PR 142" · "Show me what changed on this branch" |

## How a session flows

1. **You ask** for a visual plan or recap.
2. **The agent writes** a markdown document and starts the local server
   (random free port, bound to `127.0.0.1`).
3. **You get a link** like `http://127.0.0.1:39257/#/add-rate-limiting.md`
   and review the document in your browser.
4. **The page live-reloads** whenever the agent edits the file — you watch
   revisions land in real time. Multiple documents from the same session show
   up together in the sidebar.
5. **You leave feedback without switching windows**: **select any text** to
   comment on that exact snippet (it gets highlighted), hover a section heading
   or a rendered component — a diagram, diff, migration, API card — to pin a
   comment there, or use the comment drawer for document-level notes. The agent
   reads your comments (each labelled with what it's anchored to) before its
   next revision and marks them resolved as it addresses them. Changed your
   mind before the agent gets to it? Double-click a comment the agent hasn't
   acknowledged yet to edit its text in place, or hover it and hit **×** to
   dismiss it entirely — dismissal works until the comment is resolved, and a
   dismissed comment never reaches the agent's digest.
6. If you'd rather talk to the agent directly — or the server was stopped —
   hit **"Copy as prompt"** and your feedback is turned into a ready-to-paste
   message for the chat.

## What renders nicely

Documents are plain GitHub-flavored markdown, so they're readable anywhere —
but in the viewer these fences get special treatment:

| Fence | Renders as |
| :---- | :--------- |
| ` ```tldr ` / ` ```summary ` | A prominent **TL;DR** summary card for the top of the document — markdown body (bold, code, links, lists) |
| ` ```mermaid ` | Mermaid diagram (flowchart, sequence, ER, state, …) |
| ` ```nomnoml ` | Sketchy, hand-drawn-style diagram from a tiny UML text DSL |
| ` ```diff ` / ` ```patch ` | Rich diff viewer with a **unified / side-by-side** toggle |
| ` ```migration ` (also ` ```sql-migration `) | Database migration card with green **up** / red **down** panes and a reversible/irreversible badge, with its own unified/side-by-side toggle |
| ` ```api ` / ` ```http ` | Styled HTTP request/response cards, `curl -v` style — method & status badges, collapsible headers, pretty-printed JSON |
| ` ```openapi ` / ` ```swagger ` | Read-only OpenAPI explorer — expandable endpoints with parameters, request bodies, and responses |
| ` ```filetree ` / ` ```files ` | "What changed" file map — coloured A/M/D/R change badges, paths, and per-file notes, grouped by area |
| ` ```question ` / ` ```ask ` | An interactive question — single/multi-select options plus a custom answer; the reply is saved as a comment for the agent |
| Any other language | Syntax-highlighted code with a language tag |

The unified/side-by-side choice is a single **global** preference: clicking
either toggle on any diff or migration block applies it to every diff and
migration block on the page. Like theme and sidebar state, it's remembered
across reloads and across sessions/agents in a small preferences file (see
[Preferences](#preferences) below), so once you pick a view it stays picked —
even though the server binds a new random port every time it starts.

Everything degrades gracefully: if a block can't render, you get a plain
readable code block instead. The renderer libraries (marked, mermaid,
highlight.js, diff2html, js-yaml, nomnoml) are **vendored inside the plugin**
and served from localhost like everything else — the whole thing works with no
internet connection at all.

The viewer has light and dark themes (follows your system, toggleable), and a
title block showing the document, file, last update, and open comment count.

## Privacy & footprint

- The server binds to `127.0.0.1` on a random free port — it is not reachable
  from your network, and nothing is uploaded anywhere. The browser page makes
  zero external requests: all renderer libraries ship vendored with the
  plugin, pinned and hash-verified in an SBOM-style manifest
  ([server/assets/vendor/manifest.json](server/assets/vendor/manifest.json)).
- Your comments are stored next to your documents in
  `.visual-docs/comments.json`, as plain JSON you can read or delete.
- It's a single `node` process with no dependencies; stop it any time with
  `pkill -f visual-docs-server`.

## Preferences

Because the server binds a **new random port every time it starts**, the
browser's `localStorage` (which is keyed per-origin, i.e. per-port) gets wiped
every session — it's only a fast-path cache for instant boot, not the source
of truth. The real, cross-session store is a small JSON file the server reads
and writes on your machine, outside any served directory:

- Linux/macOS: `$XDG_CONFIG_HOME/visual-docs/prefs.json`, falling back to
  `~/.config/visual-docs/prefs.json` if `XDG_CONFIG_HOME` isn't set.
- Windows: `%APPDATA%\visual-docs\prefs.json`.

It currently stores:

| Key | Values |
| :-- | :----- |
| `viewMode` | `"unified"` \| `"side-by-side"` — diff/migration toggle |
| `theme` | `"light"` \| `"dark"` |
| `navOpen` | `true` \| `false` — sidebar expanded/collapsed |
| `sidebarTab` | `"outline"` \| `"docs"` — sidebar's Outline/Docs toggle |

It's plain JSON and safe to hand-edit while no server is running against it.
Unknown keys or invalid values are **ignored on read and rejected (400) on
write** rather than crashing the server or the viewer. Deleting the file (or
any key in it) just resets that preference to its default the next time it's
read — nothing else depends on it existing.

You (or an agent) can also read and change preferences from the command line —
no running server needed, and no JSON to parse:

```bash
node <plugin-dir>/server/bin/visual-docs-server.js --prefs              # print all
node <plugin-dir>/server/bin/visual-docs-server.js --prefs theme dark   # set one
```

## Export

Any document can be exported as **one self-contained HTML file** — same
rendering fidelity as the live viewer (mermaid, diffs, migrations, file
trees, API/OpenAPI blocks, admonitions, images), no server or network
required to view it: open it straight from `file://` in any modern browser,
or attach it to an email/ticket.

In the viewer, click **export** in the document toolbar (downloads with
`?download=1`). From the command line, no running server needed:

```bash
node <plugin-dir>/server/bin/visual-docs-server.js --export ./my-notes plan.md
# /abs/path/plan.html
# 3.8 MB (3,936,673 bytes)
# self-contained — open in any browser or attach anywhere.
```

Pass `--out <file>` to control the output path. Referenced local images are
inlined as `data:` URIs (through the same access gate the server itself
uses); comments, live reload, and the `question` fence's answer form aren't
part of the export — questions render read-only.

## Running the server yourself

The renderer is also a standalone npm package you can point at any folder of
markdown files:

```bash
node <plugin-dir>/server/bin/visual-docs-server.js ./my-notes
# Serving ./my-notes
# VISUAL_DOCS_URL=http://127.0.0.1:39257/
```

Options: `--port <n>` (fixed port), `--host` (Astro-style: bare `--host`
binds all interfaces and prints per-network URLs, so you can review from
another device over LAN or Tailscale — off by default on purpose; there is no
auth), `--no-watch` (disable live reload). Two convenience commands power the
skills and work cross-platform (Windows included): `--serve` backgrounds the
server and prints the URL, then returns (no `nohup`/`&`), and `--docdir` prints a
fresh, session-scoped temp directory to drop docs in. Want it reachable on your
tailnet? Just tell the agent to start the server with `--host`.
See [server/README.md](server/README.md) for the package details, and
[server/examples/demo-plan.md](server/examples/demo-plan.md) for a document
that exercises every feature.

## Design decisions

A few choices worth explaining:

- **nomnoml instead of Excalidraw for sketch-style diagrams.** Excalidraw
  stores diagrams as scene JSON: absolute pixel coordinates, seeds, and version
  nonces for every rectangle and label. Agents are bad at hand-writing that —
  hundreds of tokens per box, easy to get subtly wrong, painful to review in a
  diff. nomnoml expresses the same whiteboard-style drawing as a few lines of
  text DSL (`[client] -> [api]`), which agents generate reliably, humans can
  read in the raw markdown, and git can diff. Same sketchy aesthetic, a
  fraction of the tokens, no React runtime in the viewer. (Mermaid remains the
  default for sequence/ER/gantt diagrams, where its DSL is stronger.)
- **Renderer libraries are vendored, not fetched from a CDN.** A pinned CDN
  URL is a promise, not a guarantee — supply-chain attacks on published
  packages are exactly the failure mode lockfiles exist for. The vendored
  copies live in the plugin, are served from localhost, and every file's
  version, source URL, license, and SHA-384 are recorded in an SBOM-style
  manifest ([server/assets/vendor/manifest.json](server/assets/vendor/manifest.json)).
  `node server/scripts/update-vendor.mjs --verify` checks the files against
  the manifest; running it without the flag re-fetches and re-pins.
- **The server itself has zero npm dependencies.** Nothing to install, no
  install-time scripts to trust, and the plugin works the moment it's cloned.
- **Documents are plain markdown, not a custom format.** If you stop using
  the viewer tomorrow, every plan and recap is still a readable file in your
  repo or temp directory.

## FAQ

**Do I need to approve anything?** The agent only runs `node` from the plugin
directory — starting the server, reading comments, and updating their status are
all `node` commands (no `curl`, no scripts). Approve those and the whole flow is
hands-off.

**Where do the documents live?** Throwaway reviews go to a temp directory.
Ask the agent to keep a plan (e.g. "put it in docs/plans/") and it will write
and serve it from your repo instead.

**Can I edit the markdown myself?** Yes — it's just a file. The browser
reloads on save, and the agent picks up your edits the next time it reads the
document.

## Credits

The visual-plan/visual-recap concept — agents presenting plans and change
summaries as rich, commentable visual documents instead of walls of chat text —
comes from [Builder.io's skills repo](https://github.com/BuilderIO/skills).
This plugin is an independent, fully local reimplementation of that idea;
if you want their hosted experience with wireframes and prototypes, use the
original. Rendering is powered by the open-source libraries listed (with
versions and licenses) in
[server/assets/vendor/manifest.json](server/assets/vendor/manifest.json).
