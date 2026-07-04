# patrickdappollonio's Claude plugins

My collection of Claude (and other AI's) skills, plugins, MCP servers, and more — packaged as a [Claude Code plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces) so you can install any of them with one command.

## Add the marketplace

```
/plugin marketplace add patrickdappollonio/claude-plugins
```

That registers this marketplace under the name `patrickdappollonio`. You only do this once; afterwards every plugin below is available to install.

> Prefer the terminal? The same commands work non-interactively:
> ```bash
> claude plugin marketplace add patrickdappollonio/claude-plugins
> ```

## Plugins

| Plugin | What it does | Install |
| :----- | :----------- | :------ |
| [`adversarial-review`](plugins/adversarial-review) | A hostile, bias-free review of a change (PR, last commit, or uncommitted work) — dispatches 16 independent adversarial reviewers plus a standalone false-positive filter, and reports only verified findings in plain language. | `/plugin install adversarial-review@patrickdappollonio` |
| [`visual-docs`](plugins/visual-docs) | Fully local visual plans and recaps: the agent writes markdown, a bundled zero-dependency server renders it in your browser with Mermaid/nomnoml diagrams, rich diffs, DB migration cards, API call cards, and a read-only OpenAPI view — plus live reload and a comment box that feeds your feedback back to the agent. | `/plugin install visual-docs@patrickdappollonio` |

### adversarial-review

After installing, just ask your agent for an adversarial review:

```
Give this change an adversarial review using the adversarial review skill.
```

The skill also triggers on its own whenever you ask for a hostile, adversarial, or pre-merge review of a change. See the [plugin README](plugins/adversarial-review) for the full reviewer panel and notes.

### visual-docs

A fully local take on [BuilderIO's `/visual-plan` and `/visual-recap` skills](https://github.com/BuilderIO/skills): no hosted
service, no accounts, nothing leaves your machine. Ask your agent for a visual
plan or recap:

```
Give me a visual plan for adding rate limiting to the API.
Visual recap of PR 142.
```

The agent writes a markdown document, serves it on a random localhost port
with a bundled zero-dependency Node server, and hands you the link. The page
live-reloads as the agent edits, and you can pin comments to any section —
the agent reads them before revising. See the [plugin README](plugins/visual-docs)
for everything it renders.

## Updating

When I push new plugins or new versions, refresh your local copy:

```
/plugin marketplace update patrickdappollonio
```

## Contributing / issues

Found a bug or have a request? Open an issue on this repository.
