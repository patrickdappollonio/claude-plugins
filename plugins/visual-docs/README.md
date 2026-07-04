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
5. **You leave feedback without switching windows**: hover any section
   heading and click the pin to comment on that section, or use the comment
   drawer for document-level notes. The agent reads your comments before its
   next revision and marks them resolved as it addresses them.
6. If you'd rather talk to the agent directly — or the server was stopped —
   hit **"Copy as prompt"** and your feedback is turned into a ready-to-paste
   message for the chat.

## What renders nicely

Documents are plain GitHub-flavored markdown, so they're readable anywhere —
but in the viewer these fences get special treatment:

| Fence | Renders as |
| :---- | :--------- |
| ` ```mermaid ` | Mermaid diagram (flowchart, sequence, ER, state, …) |
| ` ```nomnoml ` | Sketchy, hand-drawn-style diagram from a tiny UML text DSL |
| ` ```excalidraw ` | An Excalidraw scene (`.excalidraw` JSON) rendered as a static drawing |
| ` ```diff ` / ` ```patch ` | Rich diff viewer with a **unified / side-by-side** toggle |
| ` ```migration ` (also ` ```sql-migration `) | Database migration card with green **up** / red **down** panes and a reversible/irreversible badge |
| ` ```api ` / ` ```http ` | Styled HTTP request/response cards, `curl -v` style — method & status badges, collapsible headers, pretty-printed JSON |
| ` ```openapi ` / ` ```swagger ` | Read-only OpenAPI explorer — expandable endpoints with parameters, request bodies, and responses |
| Any other language | Syntax-highlighted code with a language tag |

Everything degrades gracefully: if a block can't render (or you're offline —
the renderer libraries load from a CDN), you get a plain readable code block
instead.

The viewer has light and dark themes (follows your system, toggleable), and a
title block showing the document, file, last update, and open comment count.

## Privacy & footprint

- The server binds to `127.0.0.1` on a random free port — it is not reachable
  from your network, and nothing is uploaded anywhere.
- Your comments are stored next to your documents in
  `.visual-docs/comments.json`, as plain JSON you can read or delete.
- It's a single `node` process with no dependencies; stop it any time with
  `pkill -f visual-docs-server`.

## Running the server yourself

The renderer is also a standalone npm package you can point at any folder of
markdown files:

```bash
node <plugin-dir>/server/bin/visual-docs-server.js ./my-notes
# Serving ./my-notes
# VISUAL_DOCS_URL=http://127.0.0.1:39257/
```

Options: `--port <n>` (fixed port), `--host <addr>` (e.g. `0.0.0.0` to expose
on your LAN — off by default on purpose), `--no-watch` (disable live reload).
See [server/README.md](server/README.md) for the package details, and
[server/examples/demo-plan.md](server/examples/demo-plan.md) for a document
that exercises every feature.

## FAQ

**Do I need to approve anything?** The agent runs `node` from the plugin
directory and `curl` against localhost; approve those and the whole flow is
hands-off.

**Where do the documents live?** Throwaway reviews go to a temp directory.
Ask the agent to keep a plan (e.g. "put it in docs/plans/") and it will write
and serve it from your repo instead.

**Can I edit the markdown myself?** Yes — it's just a file. The browser
reloads on save, and the agent picks up your edits the next time it reads the
document.
