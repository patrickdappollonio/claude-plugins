# patrickdappollonio's Claude plugins

My collection of Claude (and other AI's) skills, plugins, MCP servers, and more — packaged as a [Claude Code plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces) so you can install any of them with one command.

## Add the marketplace

```
/plugin marketplace add patrickdappollonio/claude-plugins
```

That registers this marketplace under the name `patrickdappollonio`. You only do this once; afterwards every plugin below is available to install.

## Plugins

### adversarial-review

A hostile, bias-free review of a change — a PR, the last commit, or your
uncommitted work. Most reviews are friendly: the reviewer shares your context
and quietly assumes the code works. This one doesn't. It dispatches a panel of
16 independent reviewers, each a fresh sub-agent with no knowledge of your
conversation or your intent, and each told one thing: *assume the change is
broken and prove it*. Concurrency races, hostile inputs, authorization gaps,
resource exhaustion, hollow AI-generated code, unverified factual claims — each
angle gets its own attacker.

A standalone false-positive filter re-checks every finding against the actual
code before anything reaches you, so the report contains only verified
problems, explained in plain language with a validated fix proposed for each.

```
/plugin install adversarial-review@patrickdappollonio
```

Then just ask: *"Give this change an adversarial review."* [Read more →](plugins/adversarial-review)

### code-simplification

Language-agnostic code simplification that reduces complexity — deep nesting,
long functions, duplicated logic, dead code, unclear names — while preserving
behavior exactly. The goal is not fewer lines; it's code a new team member
would understand faster. It blends [Anthropic's code-simplifier](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/code-simplifier/agents/code-simplifier.md),
[Addy Osmani's code-simplification skill](https://github.com/addyosmani/agent-skills/blob/main/skills/code-simplification/SKILL.md),
and [Happycapy's code-simplification skill](https://happycapy.ai/skills/code-simplification)
into one process.

The discipline is the point: it understands code before touching it
(Chesterton's Fence), applies one tested change at a time, refuses drive-by
refactors outside the requested scope, and if a test fails after a change, it
reverts the change — never the test.

```
/plugin install code-simplification@patrickdappollonio
```

Then just ask: *"Simplify what we just wrote."* [Read more →](plugins/code-simplification)

### visual-docs

Fully local visual plans and recaps — a take on [BuilderIO's `/visual-plan`
and `/visual-recap` skills](https://github.com/BuilderIO/skills) with no hosted
service, no accounts, and nothing leaving your machine. The agent writes a
markdown document and serves it on a random localhost port with a bundled
zero-dependency Node server: Mermaid and nomnoml diagrams, rich diffs, DB
migration cards, API call cards, and a read-only OpenAPI view.

The page live-reloads as the agent edits, and you can pin comments to any
section — the agent reads them before revising, closing the feedback loop
without leaving your browser.

```
/plugin install visual-docs@patrickdappollonio
```

Then just ask: *"Give me a visual plan for adding rate limiting to the API"* or *"Visual recap of PR 142."* [Read more →](plugins/visual-docs)

## Updating

When I push new plugins or new versions, refresh your local copy:

```
/plugin marketplace update patrickdappollonio
```

## Contributing / issues

Found a bug or have a request? Open an issue on this repository.
