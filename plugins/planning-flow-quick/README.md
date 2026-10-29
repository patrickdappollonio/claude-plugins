# Planning Flow Quick

A short plan for a small coding change: a renamed title, a corrected message, a one-function bug fix, a small new option. It is the lighter version of the [`planning-flow`](../planning-flow) skill, for changes where a full codebase map, parallel exploration, several reviewers, and an interview tree would cost more than the work.

## What it does

- **Learns the area around the change, not the whole repository.** When a `planning-flow` codebase map exists, it uses the sections that bear on the change and confirms each fact against the current code. When none exists, two cheap explorers read the files the change touches, their neighbors, their tests, and the repository's instructions files: one finds the patterns to follow and the closest existing example, the other finds how tests run and which existing tests cover each surface. The new code follows the repository, and every acceptance criterion names the test it extends.
- **Writes one short plan with one ticket** in `.plans/<task>.md` (kept out of the diff through the repository's local exclude file), with the same section names as a full plan: the ask, a summary, technical context, the ticket, decisions, gotchas, and open questions.
- **Checks unknowns on the spot.** A small change that turns out impossible at implementation time saves nothing, so any unknown that would change the plan is checked when it is found. Local reads and scratch-directory probes just run; anything that reaches the network, your browser, a shared service, or an install asks first.
- **Asks only what the code cannot answer**, one question per message, in the same fixed shape `planning-flow` uses: the claim, the situation, a numbered flow, the fix, its cost, and your call.
- **Checks the plan once with fresh eyes.** One subagent with no context reads the plan cold, then opens the code and tries to prove it wrong, including any decision made on your behalf that changes what you would notice.
- **Warns when the change is not small.** Lines of code are not the measure; stops are. It warns when the work needs more than one ticket, reaches a second subsystem, touches a sensitive area (a database schema, a stored format, sign-in or permissions, work that runs at the same time, a public API, an outside service), has no pattern to follow, carries many unknowns or decisions, or does not settle after a second check. When `planning-flow` is installed, it recommends switching, and `planning-flow` picks up the quick plan file and runs every step the quick flow skipped. When it is not installed, it keeps going, warns again at each new sign, and lists the signs in the plan's caveats. It never asks you to install anything.
- **Closes with a plain-text offer to implement**, directly or with `implement-plan` when installed, and a one-line `/goal`.

## Install

**Claude Code:**

```
/plugin marketplace add patrickdappollonio/claude-plugins
/plugin install planning-flow-quick@patrickdappollonio
```

**Codex CLI** (after `codex plugin marketplace add patrickdappollonio/claude-plugins`):

```
codex plugin add planning-flow-quick@patrickdappollonio
```

**Any other agent** — Cursor, Copilot, opencode, Gemini, and 70+ more — via [`npx skills`](https://github.com/vercel-labs/skills):

```bash
npx skills add patrickdappollonio/claude-plugins --skill planning-flow-quick
```

## Running it

```
/planning-flow-quick:planning-flow-quick Rename the "Preferences" page title to "Account settings"
```

or ask for a quick plan in your own words.

It works alone. When `planning-flow`, `visual-plan`, `adversarial-review-fast`, `implement-plan`, or `effective-communicator` from this marketplace are installed, it uses them where they fit; when they are not, it carries what it needs.
