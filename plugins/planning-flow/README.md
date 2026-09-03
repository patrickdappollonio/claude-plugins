# Planning Flow

Turn a request into **one plan** — the current, complete answer to what you
asked, with the decisions that shaped it and the caveats that remain — and
never a story of how the plan got there.

Two things go wrong when an agent plans with reviews in the loop. The chat
becomes a travelogue of every hurdle the reviewers raised and every fix that
followed, when all you wanted was the end plan. And the plan itself picks up
the same habit: headings like "Implementing X, revisited", or an `Edit: we're
actually not doing what the previous paragraph says` appended instead of the
paragraph being rewritten, until you are reading a plan in diffs. This skill
makes both impossible by rule: the plan is rewritten in place on every
revision, the only memory it keeps is a decisions section, and the closing
message describes the plan, whether it covers the ask, and the gotchas.

## What it does

- **Explores in parallel.** Cheaper subagents each take one bounded question
  about the codebase and return facts with evidence; the session keeps the
  synthesis.
- **Drafts to a fixed skeleton** in `.plans/<task>.md` (kept out of the diff
  through the repository's local exclude file, never your `.gitignore`), or
  in the harness's own plan file when the session started in plan mode.
- **Reviews the draft with zero context.** One reviewer on the most capable
  model available gets only your original words, the plan, and the codebase,
  and tries to prove the plan fails the ask.
- **Asks you only what the code cannot answer.** Questions from the agent and
  the reviewer are merged, then filtered: anything an earlier decision
  settles is decided the same way and logged; anything the codebase answers
  becomes a spike; anything technical is decided and logged. What remains is
  asked in themed batches of at most four. A simple change may have none.
- **Never nudges on delivery shape.** One pull request or several is your
  call; the skill states both trades neutrally and makes no recommendation.
  Big tickets are legitimate.
- **Writes tickets** in one fixed format: title, what, why (in Simplified
  Technical English), acceptance criteria, dependencies by title, and a size
  guessed in lines of code, never time. Spikes are labeled in the title. No
  ticket numbers, so nothing leaks into code comments.
- **Logs every decision** with who made it, the alternative, the reason, the
  drawback, and whether it is reversible, so you remember what you chose and
  why, and can undo it later.
- **Offers an adversarial review** of the plan, sized to the change (the
  `adversarial-review` skills when installed, an on-the-spot panel when not),
  and offers to close the cheap spikes on the spot. Technical findings are
  folded in and logged; anything that changes what you would experience is
  asked.
- **Presents the plan** through the `visual-plan` skill when installed, the
  harness's plan mode otherwise, or in chat, and closes with the path, what
  the plan does, whether it covers the ask, the gotchas, and the decisions
  you might want to reverse.
- **Hands off in plain text.** Once approved, it asks whether to start
  implementing, naming the `implement-plan` skill when installed, so you can
  answer with any skill or command you have.

## Install

**Claude Code:**

```
/plugin marketplace add patrickdappollonio/claude-plugins
/plugin install planning-flow@patrickdappollonio
```

**Codex CLI** (after `codex plugin marketplace add patrickdappollonio/claude-plugins`):

```
codex plugin add planning-flow@patrickdappollonio
```

**Any other agent** — Cursor, Copilot, opencode, Gemini, and 70+ more — via
[`npx skills`](https://github.com/vercel-labs/skills):

```bash
npx skills add patrickdappollonio/claude-plugins --skill planning-flow
```

Add `-g` to install for your user instead of just this project, and `-a <agent>` to
target one agent. Update later with `npx skills update`.

## Running it

```
/planning-flow:planning-flow Add rate limiting to the public API; we get bursts from two customers and the current retry logic makes it worse
```

or just ask for a plan in your own words.

It pairs with, but does not require, the `visual-plan`, `adversarial-review`,
`adversarial-review-quick`, `effective-communicator`, and `implement-plan`
skills from this marketplace: when they are installed it uses them; when they
are not, it carries a distilled version of each so it works standalone, and it
does not suggest installing them unless you ask.

## Credit

The interview model — a design tree of decisions, a frontier of questions
whose prerequisites are settled, asked in rounds, with facts found by the
agent and only decisions put to the user, plus the fog-of-war and
out-of-scope ideas and the rule to refer to work by name rather than by
number — is adapted from [Matt Pocock's `grilling` and `wayfinder`
skills](https://github.com/mattpocock/skills) (MIT). The plain-language
discipline is distilled from this marketplace's own `effective-communicator`
skill.
