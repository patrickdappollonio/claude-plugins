# Adversarial Review

A **hostile, bias-free review** of a code change — a PR, the last commit, or your uncommitted work — that reports only the findings which survive verification.

Most reviews are friendly: the reviewer shares your context and quietly assumes the code works. This one doesn't. It dispatches a panel of **independent reviewers, each a fresh sub-agent with no knowledge of your conversation or your rationalizations.** Every reviewer is told one thing: *assume the change is broken and prove it.* A change that "looks fine" to the person who wrote it (or to the assistant that helped write it) gets attacked from every direction at once.

This plugin ships **two skills** — the same method at two sizes. Pick by how much the change is worth.

## The full panel

**`adversarial-review`** — all **18 reviewers**, plus the verifier and the fix validator. Everything below describes this one.

> [!WARNING]
> **This is token-intensive.** Twenty agents each read the diff and the code around it, in parallel. That breadth is the value, but it is not free, and most changes don't need it. For a cheaper pass, run [the quick panel](#the-quick-panel) instead — it keeps the eight highest-yield reviewers and both verification gates.

## The quick panel

**`adversarial-review-quick`** — **8 reviewers**, same brief, same scope rule, same standalone False-Positive Filter and Solution Validator. Ask for *"a smaller adversarial review"* and your agent picks this one.

The eight are the two design charters (which no bug hunt substitutes for) plus the six that historically produced the most confirmed high- and medium-severity findings: **Spec Conformance Auditor**, **Premise Auditor**, **Test Skeptic**, **Assumption Hunter**, **Observability Auditor**, **Incomplete-Fix Prosecutor**, **Data Integrity Prosecutor**, **API Contract Pedant**.

> [!NOTE]
> **It is narrower, and it says so.** Dropping ten angles means input attacks, authorization, concurrency, failure injection, resource exhaustion, rollback safety, maintainability, scope creep, AI-slop and fact-checking go unexamined — so a clean quick report is not a clean bill of health. When the change touches one of those angles, the skill stops and asks which missing reviewers you want; pick some and it escalates to [the full panel](#the-full-panel) running just those plus the quick eight, decline and it runs quick and names the gap in the report.

## What the reviewers are — and aren't — told

Reviewers get exactly one piece of context: **the brief** — what the change was agreed to do, and what it was agreed *not* to do (the approved plan or mock, the ticket, the declared non-goals). They never get anyone's opinion that the code is fine.

That line matters in both directions. Without the brief, nobody on the panel is checking whether the right thing was built, and every deliberate omission gets reported as a gap — burying the real findings in noise. With anyone's reassurance, a reviewer is handed the answer before it looks.

This comes from a real miss: three reviewers hunted bugs well on a piece of UI work and all three passed it. The build had silently dropped a column the approved mock had, and a value ended up rendered in the wrong place. **A correct implementation of the wrong design has no bugs in it** — so a bug-hunting charter will pass it every time.

## The brief bounds scope. It never establishes correctness.

There's a mirror image of that miss, and the panel is built to catch it too. Once a plan is written down and handed to reviewers, it starts to read as settled: a reviewer sees something wrong, checks the brief, finds the behaviour was agreed, and quietly files it under *out of scope* rather than *bug*. That's how a defect survives round after round while everybody works honestly — and it happens the same way every time, so re-running the review doesn't help.

So the brief is allowed to tell reviewers what's in bounds, and never allowed to tell them what's correct. **"It was in the plan" is never a reason to withhold a defect.** Agreement moves the fault from the implementer to the design; it doesn't make the fault disappear. Two questions get answered separately, every run: *does this match what was agreed*, and *was what was agreed right*.

## The reviewer panel

Each reviewer attacks from one narrow angle. **✓ marks the eight that the quick panel also runs.**

| | Reviewer | Attacks |
|---|---|---|
| ✓ | **Spec Conformance Auditor** | was the *approved* thing actually built? Dropped elements, silent deviations, and where the missing element's data ended up instead |
| ✓ | **Premise Auditor** | was the approved thing *worth* building? A perfect implementation of this design — what still goes wrong? |
| ✓ | **Test Skeptic** | the bug the tests would quietly let through |
| ✓ | **Assumption Hunter** | unstated invariants that nothing enforces |
| ✓ | **Observability Auditor** | silent failures, useless logs, missing signals |
| ✓ | **Incomplete-Fix Prosecutor** | symptomatic patches; the same bug left unfixed elsewhere (doing *too little*) |
| ✓ | **Data Integrity Prosecutor** | wrong queries, lost records, broken transactions |
| ✓ | **API Contract Pedant** | where the promise and the implementation diverge |
| | **Failure Injection Adversary** | every dependency times out or returns garbage |
| | **Rollback & Change-Safety Adversary** | can we kill this in five minutes? |
| | **Concurrency & State Saboteur** | races, deadlocks, lost updates, ordering bugs |
| | **Input Attacker** | malformed, oversized, injection, and boundary inputs |
| | **Authorization Attacker** | what a valid-but-unauthorized user can reach |
| | **Resource Exhaustion Adversary** | unbounded growth, leaks, quadratic blowups |
| | **Maintainability Cynic** | what the next reader will misread |
| | **Karpathy Minimalist** | speculative complexity and scope creep (doing *too much*) |
| | **AI Anti-Slop Critic** | plausible-but-hollow generated code, hallucinated APIs |
| | **Fact-Checker** | every factual claim verified against primary sources via web search |

A standalone **False-Positive Filter** runs last and gates everything before it reaches you — in both panels.

## The report is written for you, not for the panel

A pile of agents just grepped and read their way across the codebase. You
didn't. So the report is a plain re-telling, not a dump of what they found:
short sentences, one idea each, active voice, effect first — Simplified
Technical English (ASD-STE100). Every finding says what breaks and what you'd
lose, in words that still mean something to someone who never opened the file.

Symbol names appear in exactly one place: a clickable `file:line` pointer under
each finding. Never in the explanation. *"The change to `fooBar()` conflicts
with `barbaz()`"* names three things you've never seen and tells you nothing —
so instead you get *"two requests arriving at the same instant can both claim
the same name, and the second silently overwrites the first."* Asking for more
depth gets you more of the story, not a switch into code-speak. If you have
[`effective-communicator`](../effective-communicator) installed, it governs the
wording.

## Install

**Claude Code:**

```
/plugin marketplace add patrickdappollonio/claude-plugins
/plugin install adversarial-review@patrickdappollonio
```

That installs **both skills** — your agent picks the panel from how you ask.

**Any other agent** — Cursor, Codex, Copilot, opencode, Gemini, and 70+ more — via
[`npx skills`](https://github.com/vercel-labs/skills), which installs one skill at a
time, so name the ones you want:

```bash
npx skills add patrickdappollonio/claude-plugins --skill adversarial-review --skill adversarial-review-quick
```

Each skill is self-contained, so either one works installed on its own. Add `-g` to
install for your user instead of just this project, and `-a <agent>` to target one
agent. Update later with `npx skills update`.

## Running it

Just ask your agent for an adversarial review when you have a change to stress-test:

```
Give this change an adversarial review using the adversarial review skill.
```

Ask for a smaller one and you get the quick panel:

```
Run a smaller adversarial review on this change.
```

Or invoke either explicitly with its slash command:

```
/adversarial-review:adversarial-review
/adversarial-review:adversarial-review-quick
```

Both work on uncommitted changes, the current branch's PR (via the `gh` CLI), or whatever you point it at. If both local changes and an open PR exist, it asks which you mean rather than guessing.

If you approved a plan or a mock, point at it — *"review this against the plan we agreed"* — and the panel measures the implementation against it. If it can't find one, it asks what was agreed and what was deliberately left out; if there genuinely is no agreed scope, it runs anyway and tells you in the report that design drift went unchecked.

## Notes

- **It reports, it doesn't rewrite.** Every finding is verified and every proposed fix is validated by a separate agent, and then it stops and hands you the choice: explain, apply, or triage.
- **A problem with the plan is never fixed silently.** When the finding is that the agreed design was wrong, the fix necessarily changes what you approved — so it comes to you as a decision with its cost attached, and a fourth choice appears: revise the design. Deciding to live with it is a valid answer too.
- **Token-heavy by design.** It runs many agents in parallel. In Claude Code each reviewer uses the cheaper `sonnet` model to keep cost sane — the value is in the panel's breadth, not any single agent's horsepower. The quick panel trades ten of those angles for roughly half the agents; it never trades away the two verification gates, which is where the trust comes from.
- **The Fact-Checker needs web access** (web search / fetch) to ground claims against real documentation. It is a full-panel reviewer only, so the quick panel never needs the network.
- **`gh` CLI is optional** — it's only needed to review GitHub PRs directly; local diffs work without it.
