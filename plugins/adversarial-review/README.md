# Adversarial Review

A token-conscious skill that runs a **hostile, bias-free review** of a code change — a PR, the last commit, or your uncommitted work — and reports only the findings that survive verification.

Most reviews are friendly: the reviewer shares your context and quietly assumes the code works. This one doesn't. It dispatches a panel of **16 independent reviewers, each a fresh sub-agent with no knowledge of your conversation or your intent.** Every reviewer is told one thing: *assume the change is broken and prove it.* A change that "looks fine" to the person who wrote it (or to the assistant that helped write it) gets attacked from 16 directions at once.

## The reviewer panel

Each reviewer attacks from one narrow angle:

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

## Notes

- **Token-heavy by design.** It runs many agents in parallel. In Claude Code each reviewer uses the cheaper `sonnet` model to keep cost sane — the value is in the panel's breadth, not any single agent's horsepower.
- **The Fact-Checker needs web access** (web search / fetch) to ground claims against real documentation.
- **`gh` CLI is optional** — it's only needed to review GitHub PRs directly; local diffs work without it.
