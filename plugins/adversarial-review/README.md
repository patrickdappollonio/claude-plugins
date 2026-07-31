# Adversarial Review

A token-conscious skill that runs a **hostile, bias-free review** of a code change — a PR, the last commit, or your uncommitted work — and reports only the findings that survive verification.

Most reviews are friendly: the reviewer shares your context and quietly assumes the code works. This one doesn't. It dispatches a panel of **17 independent reviewers, each a fresh sub-agent with no knowledge of your conversation or your rationalizations.** Every reviewer is told one thing: *assume the change is broken and prove it.* A change that "looks fine" to the person who wrote it (or to the assistant that helped write it) gets attacked from 17 directions at once.

## What the reviewers are — and aren't — told

Reviewers get exactly one piece of context: **the brief** — what the change was agreed to do, and what it was agreed *not* to do (the approved plan or mock, the ticket, the declared non-goals). They never get anyone's opinion that the code is fine.

That line matters in both directions. Without the brief, nobody on the panel is checking whether the right thing was built, and every deliberate omission gets reported as a gap — burying the real findings in noise. With anyone's reassurance, a reviewer is handed the answer before it looks.

This comes from a real miss: three reviewers hunted bugs well on a piece of UI work and all three passed it. The build had silently dropped a column the approved mock had, and a value ended up rendered in the wrong place. **A correct implementation of the wrong design has no bugs in it** — so a bug-hunting charter will pass it every time.

## The reviewer panel

Each reviewer attacks from one narrow angle:

- **Spec Conformance Auditor** — was the *approved* thing actually built? Dropped elements, silent deviations, and where the missing element's data ended up instead
- **Concurrency & State Saboteur** — races, deadlocks, lost updates, ordering bugs
- **Failure Injection Adversary** — every dependency times out or returns garbage
- **Input Attacker** — malformed, oversized, injection, and boundary inputs
- **Authorization Attacker** — what a valid-but-unauthorized user can reach
- **Data Integrity Prosecutor** — wrong queries, lost records, broken transactions
- **Resource Exhaustion Adversary** — unbounded growth, leaks, quadratic blowups
- **Observability Auditor** — silent failures, useless logs, missing signals
- **Assumption Hunter** — unstated invariants that nothing enforces
- **API Contract Pedant** — where the promise and the implementation diverge
- **Maintainability Cynic** — what the next reader will misread
- **Karpathy Minimalist** — speculative complexity and scope creep (doing *too much*)
- **Incomplete-Fix Prosecutor** — symptomatic patches; the same bug left unfixed elsewhere (doing *too little*)
- **Rollback & Change-Safety Adversary** — can we kill this in five minutes?
- **Test Skeptic** — the bug the tests would quietly let through
- **AI Anti-Slop Critic** — plausible-but-hollow generated code, hallucinated APIs
- **Fact-Checker** — every factual claim verified against primary sources via web search

A standalone **False-Positive Filter** runs last and gates everything before it reaches you.

## The report is written for you, not for the panel

Seventeen agents just grepped and read their way across the codebase. You
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

## Installing

Add the marketplace, then install the plugin:

```
/plugin marketplace add patrickdappollonio/claude-plugins
/plugin install adversarial-review@patrickdappollonio
```

## Running it

Just ask your agent for an adversarial review when you have a change to stress-test:

```
Give this change an adversarial review using the adversarial review skill.
```

Or invoke it explicitly with the slash command:

```
/adversarial-review:adversarial-review
```

It works on uncommitted changes, the current branch's PR (via the `gh` CLI), or whatever you point it at. If both local changes and an open PR exist, it asks which you mean rather than guessing.

If you approved a plan or a mock, point at it — *"review this against the plan we agreed"* — and the panel measures the implementation against it. If it can't find one, it asks what was agreed and what was deliberately left out; if there genuinely is no agreed scope, it runs anyway and tells you in the report that design drift went unchecked.

## Notes

- **It reports, it doesn't rewrite.** Every finding is verified and every proposed fix is validated by a separate agent, and then it stops and hands you the choice: explain, apply, or triage.
- **Token-heavy by design.** It runs many agents in parallel. In Claude Code each reviewer uses the cheaper `sonnet` model to keep cost sane — the value is in the panel's breadth, not any single agent's horsepower.
- **The Fact-Checker needs web access** (web search / fetch) to ground claims against real documentation.
- **`gh` CLI is optional** — it's only needed to review GitHub PRs directly; local diffs work without it.
