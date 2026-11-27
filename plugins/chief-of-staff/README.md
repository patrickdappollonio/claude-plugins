# Chief of Staff

Makes the main agent lead a development session instead of doing the work, so it stays available while requests keep arriving.

A chief of staff runs the house so the principal can decide what only they can decide. This skill gives the main agent that job. You set goals and make the calls that change what your users get. The agent splits the work, hands it to subagents, judges what comes back, decides the rest, and tells you what happened in one short message.

## What it does

- **Delegates the work.** Every change to what the code does, every build, every long test run, and every proof of concept goes to a one-shot subagent on a cheaper model, chosen by how hard the piece is. The lead reads, judges, and reports; it makes only edits that carry no logic, such as a typo or a version number, and runs only quick checks. Small items are bundled, because starting a subagent is not free. A correction is a new subagent, never a resumed one, because a resumed subagent re-reads its whole history at full price.
- **Does not bias its subagents.** A brief carries the goal and what was observed, never the lead's theory. Every brief asks the subagent to report anything that worried it, inside the task or outside it.
- **Reviews as if the work were wrong.** A subagent's report is a claim, however thorough it reads. The lead reads the diff itself and runs the tests instead of quoting them, then takes a second opinion from a fresh subagent that gets only the goal, the diff, and what to look for. A correction of 250 changed lines or fewer is reviewed by the lead alone, because a reviewer subagent would cost more than the read; a bigger one gets a fresh reviewer.
- **Keeps the adversarial-review skills for big work.** It never runs them as its own review. When the session's work passes 4,000 changed lines, measured with git, and one of them is installed, it recommends the one that fits how complex the change is. Below that it does not bring them up.
- **Keeps sight of the goal.** It says back what it understood from each request and each decision of yours, in its own words, so a misreading shows up before anything is built. When something learned along the way would change the outcome you asked for, even slightly, it checks in with you first, with the trade-off, as a plain confirmation and not as bad news.
- **Plans first when you are planning.** "That works" approves an idea, not a start. It builds once you pick a design or accept the plan, or on a direct go; when it cannot tell, it asks in one plain line. After that it does not come back for permission at each step.
- **Decides instead of asking.** A decision that changes nothing a user or consumer gets is made, recorded with how to reverse it, and reported. A doubt that can be settled by trying it is settled with a quick proof of concept. Only a decision that changes behavior comes to you, with a recommendation and its caveat.
- **Draws what you have to look at.** When a decision is about how something looks or is arranged, such as two screen layouts or a flow, it puts a page beside the question: a private artifact when your harness has one (a Claude artifact, for example), the visual-docs renderer when that is installed and the page is only diagrams or tables, or one HTML file served on your machine at `127.0.0.1`. A screen is drawn either as a plain sketch that says it is one, or from the product's own styles, never as something close to the real thing but not exact. The page is a whiteboard that only shows the options; the question is still asked in full in the chat, and answered there. It never makes a page public, and opens a local page to another network, such as Tailscale, only when you ask.
- **Asks before touching the files that steer your agents.** `CLAUDE.md`, `AGENTS.md`, rules folders, harness settings, and hooks, in the repository or in your own configuration, are edited only after you have seen the file, the exact text, and the reason, and said yes. A subagent that wants such an edit reports it, and the lead asks you. The text it proposes states the fact or the rule and leaves out the story: no dates, no "the user decided", no account of how the rule came about. A rule that a test or a lint rule could enforce is proposed as that check. The agent's own memory notes stay free to write.
- **Commits freely, pushes never on its own.** Local commits need no permission. A push or a pull request happens only after you have seen what would go out and accepted it.
- **Builds in parallel, within a ceiling.** Side by side is the default: a piece that is ready starts while a slot is free, in its own git worktree when another executor is already working, and waits only for code it needs from an unfinished piece. Changing the same files as another piece is not a reason to wait; the merge settles it. More executors never means more test runs: each runs only the tests for its own change, and the lead alone orders the one full run. At most five subagents run at once, of any kind, unless you set another number; anything beyond that waits in a queue and starts in order. The lead merges a piece into the working branch only after reviewing it, settles a small conflict itself, hands a large one to a merge subagent, and re-checks that merge before it lands.
- **Protects your machine.** Executors run only the tests for their own change. Full runs go one at a time, through one subagent, when a batch is integrated, and at most three of the five subagents build or test at once.
- **Builds the way you would ask for.** Executors work test-first and write integration tests as user journeys, mocking only what cannot run for real, with real dependencies in containers.
- **Keeps quality cheap.** Comments are written well the first time by each executor. Simplification is one occasional pass over an integrated batch.
- **Keeps a record outside the work tree,** in the scratchpad, so a compaction does not lose your requests, its decisions, or open questions. The record is its own working file: it does not announce it, and gives you the path only when you ask.
- **Talks to you, and reports only when there is something to report.** When you say or ask something, it answers in plain sentences and opens with where it stands. After a stretch of work it sends a short list: done, decisions made, pending for you, next, with empty parts left out and nothing repeated from the message before. Anything that matters is in the last message of the turn or counts as never said. When the work has a concrete finish, it adds a `/goal` line you can paste to keep it running until then.

## Companion skills

It works alone. When any of these is installed it is used as written; when it is not, a short version built into this skill takes its place, and the agent checks which is which before reading anything: `ask-me-again`, `use-premium-models-efficiently`, `appropriate-comments-code`, `code-simplification`. The visual-docs skills (`visual-recap`, `visual-plan`) are optional in the same way: their renderer draws the page beside a visual decision when one is installed, and is never brought up when it is not.

## Install

**Claude Code:**

```
/plugin marketplace add patrickdappollonio/claude-plugins
/plugin install chief-of-staff@patrickdappollonio
```

**Codex CLI:**

```
codex plugin add chief-of-staff@patrickdappollonio
```

**Any other agent** — Cursor, Copilot, opencode, Gemini, and 70+ more — via [`npx skills`](https://github.com/vercel-labs/skills):

```bash
npx skills add patrickdappollonio/claude-plugins --skill chief-of-staff
```

Add `-g` to install for your user instead of just this project, and `-a <agent>` to target one agent. Update later with `npx skills update`.

Then say: *"Be my chief of staff for this session."* The mode stays on until you tell it to stop.

## License

MIT.
