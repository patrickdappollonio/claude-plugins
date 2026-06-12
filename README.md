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

### adversarial-review

After installing, just ask your agent for an adversarial review:

```
Give this change an adversarial review using the adversarial review skill.
```

The skill also triggers on its own whenever you ask for a hostile, adversarial, or pre-merge review of a change. See the [plugin README](plugins/adversarial-review) for the full reviewer panel and notes.

## Updating

When I push new plugins or new versions, refresh your local copy:

```
/plugin marketplace update patrickdappollonio
```

## Contributing / issues

Found a bug or have a request? Open an issue on this repository.
