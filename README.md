# patrickdappollonio's AI agent plugins

My collection of Claude, Codex, and other AI skills, plugins, MCP servers, and more. It is packaged as native marketplaces for Claude Code and the Codex CLI, with each entry installable on its own. The same skills also install into 75+ other agents with [`npx skills`](https://github.com/vercel-labs/skills) — see [Installing](#installing).

## Installing

Pick the native marketplace for your agent, or use the cross-agent skills installer. All three routes install from this repository.

### Claude Code

From inside a running Claude Code session, type this as a message:

```text
/plugin marketplace add patrickdappollonio/claude-plugins
```

Or run the equivalent command from your regular shell:

```bash
claude plugin marketplace add patrickdappollonio/claude-plugins
```

That registers this marketplace under the name `patrickdappollonio`. You only do this once. Afterwards, install individual plugins either from inside Claude Code with `/plugin install …` or from your shell with `claude plugin install …`, as shown below.

### Codex CLI

Register this repository as a Codex plugin marketplace from your regular shell:

```bash
codex plugin marketplace add patrickdappollonio/claude-plugins
```

Codex does not currently expose marketplace registration as an in-session slash command. Once the marketplace is registered, you can install plugins in either place:

- Inside a running Codex session, enter `/plugins`, open the `patrickdappollonio` marketplace, and select the plugin.
- From your regular shell, install the plugin directly:

```bash
codex plugin add appropriate-comments-code@patrickdappollonio
```

Replace `appropriate-comments-code` with any plugin name in the table below. Codex installs that plugin's own `skills/` directory, not the rest of this collection. Start a new Codex session before using an installed or updated plugin. Run `codex plugin marketplace upgrade patrickdappollonio` from your shell to fetch updates, then reinstall the plugin to refresh it.

### Any other AI agent — Cursor, Copilot, opencode, Gemini, Windsurf…

Run [`npx skills`](https://github.com/vercel-labs/skills), Vercel's open skills installer, from your regular shell. It supports 75+ agents and reads this repository's marketplace file directly, so nothing extra is needed on your side:

```bash
# pick interactively from the whole collection
npx skills add patrickdappollonio/claude-plugins

# or install specific skills without prompting
npx skills add patrickdappollonio/claude-plugins --skill adversarial-review

# everything, into every agent it detects
npx skills add patrickdappollonio/claude-plugins --all
```

Add `-g` to install for your user instead of the current project, and `-a <agent>` to target one agent (`npx skills add … -a cursor`). Update later with `npx skills update`.

To install several, repeat the flag — `--skill a --skill b`. A comma-separated list matches nothing and silently installs nothing, so don't use one.

Each plugin below maps to one skill of the same name, except `adversarial-review` and `visual-docs`, which provide two each. Every skill is self-contained, so installing one without its sibling works fine:

| Plugin | `--skill` name(s) |
|---|---|
| adversarial-review | `adversarial-review`, `adversarial-review-quick` |
| appropriate-comments-code | `appropriate-comments-code` |
| code-simplification | `code-simplification` |
| effective-communicator | `effective-communicator` |
| effective-go | `effective-go` |
| implement-plan | `implement-plan` |
| read-the-docs-first | `read-the-docs-first` |
| use-claude-limits-efficiently | `use-claude-limits-efficiently` |
| use-premium-models-efficiently | `use-premium-models-efficiently` |
| visual-docs | `visual-plan`, `visual-recap` |

> Skills installed this way run with your agent's full permissions, the same as any other skill. They are plain markdown — read them before you install them.

## Plugins

In each block below, the slash command is a message you type inside Claude Code. Commands beginning with `claude`, `codex`, or `npx` run in your regular shell. Inside Codex, you can use `/plugins` instead of the direct shell command and select the named plugin from the marketplace.

### adversarial-review

A hostile, bias-free review of a change — a PR, the last commit, or your
uncommitted work. Most reviews are friendly: the reviewer shares your context
and quietly assumes the code works. This one doesn't. It dispatches a panel of
18 independent reviewers, each a fresh sub-agent with no knowledge of your
conversation or your rationalizations, and each told one thing: *assume the
change is broken and prove it*. Concurrency races, hostile inputs,
authorization gaps, resource exhaustion, hollow AI-generated code, unverified
factual claims — each angle gets its own attacker.

The reviewers get exactly one piece of context: what the change was **agreed**
to do, and what it was agreed *not* to do. That's the difference between a
panel that checks whether the right thing was built and one that hunts bugs in
a faithful implementation of the wrong design — and it stops every deliberate
omission from being reported as a gap. One reviewer does nothing else: it holds
the code against the plan or mock you signed off on, element by element, and
chases where the data from anything dropped ended up instead.

A standalone false-positive filter re-checks every finding against the actual
code before anything reaches you, so the report contains only verified
problems, each with a validated fix proposed. And the report is written for
someone who never read the code — plain sentences, effect first, in Simplified
Technical English. The agents did the grepping; you shouldn't have to open a
file to understand what they found. Symbol names appear in one place only: the
clickable `file:line` under each finding.

Eighteen reviewers plus two gate agents is a lot of tokens, and most changes
don't need all of it — so the plugin also ships a **quick panel**
(`adversarial-review-quick`): the eight highest-yield angles, including both
design charters, with the same verifier and the same fix validator. Ask for *"a
smaller adversarial review"* and your agent runs that one instead. It says up
front which angles it isn't covering, so a clean report never reads as a clean
bill of health.

```text
# Claude Code session — type this as a message
/plugin install adversarial-review@patrickdappollonio

# Shell — Claude Code
claude plugin install adversarial-review@patrickdappollonio

# Shell — Codex CLI
codex plugin add adversarial-review@patrickdappollonio

# Shell — npx skills
npx skills add patrickdappollonio/claude-plugins --skill adversarial-review --skill adversarial-review-quick
```

Then just ask: *"Give this change an adversarial review."* — or *"a smaller
adversarial review"* for the quick panel. [Read more →](plugins/adversarial-review)

### appropriate-comments-code

Comment discipline for the code your agent writes, on one rule: **every comment
carries information the code does not, about the code as it is now, in as few
lines as that takes.** The audience is a developer months from now who was not in
the session, did not read the PR, does not know what was tried first, and cannot
ask — and who is skimming, so every line above the function they came for is a
toll they pay to reach it.

That rules out five things agents do constantly. Narrating the journey — *"we
used to buffer the whole response but it blew up memory, so now we stream it"* —
describes an edit, not the code, and rots on the next change; the standing
constraint gets stated instead. Restating the line below — *"// Opens the DB
connection"* above `connection.open()` — costs the reader time for nothing.
Committing identifiers that outlive nothing: finding numbers like `F7`,
iteration labels, wave and task IDs, project phase names, agent run labels —
those mean something to exactly one person for about a day, and then sit in the
file forever. Counting things that live elsewhere — *"the 7 tests that cover
this"*, *"the 13 other integration tests"*, *"both fields"* — which is accurate
the day it is written and silently wrong after the next addition; the comment
names the set instead so it grows with it. And going long: a twenty-line comment can be accurate,
present-tense and ticket-free and still be documentation parked above a
function, where nobody reads it. One or two lines is the working limit, and the
only exemption is a decision table or state machine that prose can't replace.

Nothing gets thrown away, it gets routed: a regression is pinned by a test named
after the invariant (a comment saying *"don't remove this check"* fails nobody's
build), the reasoning goes in the commit message, review findings stay in the
review thread. And it's explicit about what *does* earn a comment — external
constraints, invariants callers must uphold, units and ownership, upstream-bug
workarounds with their exit condition, public API docs.

```text
# Claude Code session — type this as a message
/plugin install appropriate-comments-code@patrickdappollonio

# Shell — Claude Code
claude plugin install appropriate-comments-code@patrickdappollonio

# Shell — Codex CLI
codex plugin add appropriate-comments-code@patrickdappollonio

# Shell — npx skills
npx skills add patrickdappollonio/claude-plugins --skill appropriate-comments-code
```

Then just write code — it loads itself. [Read more →](plugins/appropriate-comments-code)

### code-simplification

Language-agnostic code simplification that reduces complexity — deep nesting,
long functions, high cyclomatic complexity, near-duplicate functions,
duplicated logic, dead code, unclear names, narrating comments — while
preserving behavior exactly. The goal is not fewer lines; it's code a new team member
would understand faster. It blends [Anthropic's code-simplifier](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/code-simplifier/agents/code-simplifier.md),
[Addy Osmani's code-simplification skill](https://github.com/addyosmani/agent-skills/blob/main/skills/code-simplification/SKILL.md),
and [Happycapy's code-simplification skill](https://happycapy.ai/skills/code-simplification)
into one process.

The discipline is the point: it understands code before touching it
(Chesterton's Fence), pins behavior with a test *before* each change and
proves equivalence by that test still passing after it, asks before adding
tests to a repo that has none, proposes function merges instead of doing them
by reflex, refuses drive-by refactors outside the requested scope, and if a
test fails after a change, it reverts the change — never the test. It also
carries a condensed form of the `appropriate-comments-code` rules, and
routes evidence gathering to cheap models or `grep` while keeping judgment —
and the verification of every subagent finding — on the premium model.

```text
# Claude Code session — type this as a message
/plugin install code-simplification@patrickdappollonio

# Shell — Claude Code
claude plugin install code-simplification@patrickdappollonio

# Shell — Codex CLI
codex plugin add code-simplification@patrickdappollonio

# Shell — npx skills
npx skills add patrickdappollonio/claude-plugins --skill code-simplification
```

Then just ask: *"Simplify what we just wrote."* [Read more →](plugins/code-simplification)

### effective-communicator

Plain language by default, for the reader who **can't see the code you can
see.** Agent findings routinely arrive as a wall of file names, function names,
and variable names — which shifts the work of understanding onto the one person
who can't open the file. This skill makes the agent translate every identifier
into what it actually does, lead with the outcome rather than the label, and
write in Simplified Technical English (ASD-STE100): short sentences, one idea
each, active voice, no unexplained jargon.

It also writes for how attention actually works — the important point lands in
the last message of the turn instead of scrolling off behind a pile of tool
calls — and it never drops a real finding just to be brief. When a reader
answers in code terms, it matches them for that exchange, then resets. It pairs
naturally with `adversarial-review` and any audit or debugging pass that
produces identifier-heavy output.

```text
# Claude Code session — type this as a message
/plugin install effective-communicator@patrickdappollonio

# Shell — Claude Code
claude plugin install effective-communicator@patrickdappollonio

# Shell — Codex CLI
codex plugin add effective-communicator@patrickdappollonio

# Shell — npx skills
npx skills add patrickdappollonio/claude-plugins --skill effective-communicator
```

Then just ask: *"Explain that in plain English."* — or install it and never ask
again. [Read more →](plugins/effective-communicator)

### effective-go

Go written the way the Go community writes it — condensing [Effective
Go](https://go.dev/doc/effective_go), the [Google Go Style
Guide](https://google.github.io/styleguide/go/guide), the [Go
Proverbs](https://go-proverbs.github.io/) and the [Gruntwork
guide](https://docs.gruntwork.io/guides/style/golang-style-guide/) into one
process with a checklist — plus a few house rules that win when the sources
disagree. Errors read like sentences (`failed to open config file %q: %w`,
never `open %q: %w`), sentinels are noun phrases, `errors.New` when nothing
is formatted, `%q` instead of `'%s'`, `errors.Is`/`errors.As` to compare,
and every error is handled exactly once — no log-and-return.

Tests are written first and generously — red → green for new code, a
pinning test for refactors, and proposed **user-journey tests** for
features — appended to the existing `_test.go` rather than sprawled across
new files. They are table-driven with `t.Context()` and got-before-want
messages, and mocks are hand-written `Fn`-field structs whose unwired
methods fail loudly, so a test that forgot to wire a dependency can never
pass on a zero value. The agent commits on approval and never pushes
without explicit approval for that push.
It also folds in Go-flavored versions of `appropriate-comments-code` and
`code-simplification` — comments that carry only what the code cannot say,
in the present tense, and refactors done one tested change at a time — so
one install covers the whole discipline. It pairs with JetBrains'
[`modern-go-guidelines`](https://github.com/JetBrains/go-modern-guidelines)
plugin: if its `use-modern-go` skill is installed the agent uses it for
version-specific idioms newer than its training data, and if not it
recommends it once. Nothing is called done until
`gofmt`, `go vet`, `go test -race` and the project linter have run and their
output is reported.

```text
# Claude Code session — type this as a message
/plugin install effective-go@patrickdappollonio

# Shell — Claude Code
claude plugin install effective-go@patrickdappollonio

# Shell — Codex CLI
codex plugin add effective-go@patrickdappollonio

# Shell — npx skills
npx skills add patrickdappollonio/claude-plugins --skill effective-go
```

Then just write Go — it loads itself. [Read more →](plugins/effective-go)

### implement-plan

The "now build it" step after a plan is agreed. The agent splits the plan into
independent slices, gives each a git worktree and a cheaper executor working
under TDD with unit tests as the floor and every related document updated in
the same diff — journey-style integration/E2E tests and real dependencies via
testcontainers are recommended, and you size them — then checks every slice
**against the plan, item by item** on the premium model, docs included, runs an adversarial review sized to the
change (the `adversarial-review` skills when installed, an on-the-spot panel
when not), fixes what it finds, and iterates. Technical decisions are logged
at the end of the plan in plain language; functional and operational ones are
parked for you, never assumed. It estimates capacity before starting, hands
you a `/goal` condition so the run is hands-free, merges back into the branch
you started on, and never deletes a worktree without asking.

```text
# Claude Code session — type this as a message
/plugin install implement-plan@patrickdappollonio

# Shell — Claude Code
claude plugin install implement-plan@patrickdappollonio

# Shell — Codex CLI
codex plugin add implement-plan@patrickdappollonio

# Shell — npx skills
npx skills add patrickdappollonio/claude-plugins --skill implement-plan
```

Then, once a plan is agreed: *"Implement the plan we agreed on."* [Read more →](plugins/implement-plan)

### read-the-docs-first

Docs-first discipline for anything external or fast-moving. Model memory ages
— APIs drift, majors ship, defaults change — so this skill makes the agent
web-search for current official docs and read primary sources before writing
code or answering from memory. It defines concrete triggers (new packages,
provider SDKs, auth/billing/webhook flows, API-drift errors, "latest/official"
requests), ranks what counts as authoritative, and requires naming the sources
consulted. A work-friendly rewrite of the `read-the-damn-docs` skill.

```text
# Claude Code session — type this as a message
/plugin install read-the-docs-first@patrickdappollonio

# Shell — Claude Code
claude plugin install read-the-docs-first@patrickdappollonio

# Shell — Codex CLI
codex plugin add read-the-docs-first@patrickdappollonio

# Shell — npx skills
npx skills add patrickdappollonio/claude-plugins --skill read-the-docs-first
```

Then just ask: *"Add Stripe webhooks to this app — check the current docs first."* [Read more →](plugins/read-the-docs-first)

### use-claude-limits-efficiently

A budget loop for long-running or parallel agent work under Claude's 5-hour
and weekly usage limits — a rewrite of [`stay-within-limits` from
@agent-native/skills](https://www.npmjs.com/package/@agent-native/skills). The
agent runs work in bounded waves, checks real observed usage between waves
(via the host's own usage command, e.g. `claude -p "/usage"`), pauses new work at 95% of either window,
and resumes only after confirming the window actually rolled over — comparing
block timestamps, never trusting elapsed wall-clock time. Wake prompts are
self-contained, and wakeups chain past runtime clamps so overnight pauses
work.

```text
# Claude Code session — type this as a message
/plugin install use-claude-limits-efficiently@patrickdappollonio

# Shell — Claude Code
claude plugin install use-claude-limits-efficiently@patrickdappollonio

# Shell — Codex CLI
codex plugin add use-claude-limits-efficiently@patrickdappollonio

# Shell — npx skills
npx skills add patrickdappollonio/claude-plugins --skill use-claude-limits-efficiently
```

Then just ask: *"Migrate all 340 handlers overnight, but don't blow through my usage limits."* [Read more →](plugins/use-claude-limits-efficiently)

### use-premium-models-efficiently

Run a premium model where it is worth paying for judgment — a rewrite of
[`efficient-fable` from
@agent-native/skills](https://www.npmjs.com/package/@agent-native/skills),
generalized beyond Claude Fable: it works for any premium/cheap split, whether
that's Fable or Opus orchestrating Sonnet/Haiku, or OpenAI's GPT-5.6 Sol
orchestrating Terra/Luna. The expensive model keeps decomposition,
architecture, synthesis, and final review; cheaper subagents do the
token-heavy scans, log reduction, bounded edits, and testing passes. Every
delegation is a self-contained handoff packet with scope, evidence format, and
stop conditions, and subagent reports are treated as leads, not facts — the
premium model re-verifies cited evidence before declaring work done.

```text
# Claude Code session — type this as a message
/plugin install use-premium-models-efficiently@patrickdappollonio

# Shell — Claude Code
claude plugin install use-premium-models-efficiently@patrickdappollonio

# Shell — Codex CLI
codex plugin add use-premium-models-efficiently@patrickdappollonio

# Shell — npx skills
npx skills add patrickdappollonio/claude-plugins --skill use-premium-models-efficiently
```

Then just ask: *"Find and fix the double-charge bug in this monorepo — delegate the heavy lifting."* [Read more →](plugins/use-premium-models-efficiently)

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

![The visual-docs viewer rendering a plan with its comments panel open](assets/visual-docs-viewer.png)

```text
# Claude Code session — type this as a message
/plugin install visual-docs@patrickdappollonio

# Shell — Claude Code
claude plugin install visual-docs@patrickdappollonio

# Shell — Codex CLI
codex plugin add visual-docs@patrickdappollonio

# Shell — npx skills
npx skills add patrickdappollonio/claude-plugins --skill visual-plan --skill visual-recap
```

Then just ask: *"Give me a visual plan for adding rate limiting to the API"* or *"Visual recap of PR 142."* [Read more →](plugins/visual-docs)

## Updating

When I push new plugins or new versions, refresh your local copy.

Claude Code session — type this as a message:

```text
/plugin marketplace update patrickdappollonio
```

Or run the equivalent Claude Code command from your shell:

```bash
claude plugin marketplace update patrickdappollonio
```

Codex CLI — run this from your shell, then reinstall the plugins you want to refresh:

```bash
codex plugin marketplace upgrade patrickdappollonio
```

`npx skills` — run this from your shell:

```bash
npx skills update
```

## Contributing / issues

Found a bug or have a request? Open an issue on this repository.
