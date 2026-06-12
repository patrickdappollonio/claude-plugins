---
name: adversarial-review
description: Use when you want a hostile, bias-free review of a code change, a PR, the last commit, or uncommitted work — dispatches many independent adversarial reviewers (concurrency, failure injection, input/auth attacks, data integrity, resource exhaustion, observability, assumptions, API contract, maintainability, Karpathy simplicity & surgical-scope, root-cause & incomplete-fix consistency, rollback, tests, AI-slop, fact-checking), filters false positives with a standalone verifier, and reports findings in plain language with file references.
---

# Adversarial Review

## Overview

Run a panel of **independent, hostile reviewers** against a change. Each reviewer assumes the code is broken and tries to prove it, from a single narrow angle. Because each runs as a fresh subagent, **none of them inherit the main session's reasoning or the author's intent** — that is the whole point. A change that "looks fine" to the person who wrote it (or to the assistant that helped write it) gets attacked from 16 directions by reviewers who were never told why it should work.

**Core principle:** the orchestrator gathers the change once, hands each reviewer ONLY the raw change plus a charter, collects findings, then a separate verifier confirms each finding is real before anything reaches the user.

**Do not bias the reviewers.** Never tell a reviewer "the author intended X," "this is probably fine," or "focus only on Y because Z is handled." Give them the diff, the changed files, and their charter. Nothing else.

**Claude: Do not use dynamic workflows.** Using that means even more token consumption for no functional gain. Use instead just raw sub-agent dispatch and parallel subagents.

## When to Use

- Before merging a change and you want more than a friendly pass.
- You have a PR, or a set of local/uncommitted changes, and want them stress-tested.
- You suspect AI-generated code that "looks right" but may be hollow.
- You want claims in comments/docs/commit messages fact-checked, not trusted.

## Workflow

### 1. Determine the scope

Detect what there is to review:

```bash
git status --porcelain          # uncommitted / staged changes present?
gh pr view --json number,title  # is there an open PR for this branch? (ignore errors if no gh / no PR)
```

Decision:
- **Only local changes exist** → review the local diff (`git diff HEAD`, plus staged).
- **Only a PR exists** (clean working tree, branch has a PR) → review the whole PR (`gh pr diff <n>`).
- **Both exist** (uncommitted changes AND an open PR) → **ask the user** with `AskUserQuestion` which to review (the PR as a whole, or just the local uncommitted changes). Do not guess.
- **Neither** → tell the user there is nothing to review and stop.

**If there's no `gh` CLI** recommend the user to install it. It might also be the user wants to review the last codebase here, not in the PR. Feel free to ask for guidance. 

Capture the scope once:
- The diff (`git diff HEAD` / `gh pr diff <n>`).
- The list of changed files (`git diff --name-only HEAD` / `gh pr diff <n> --name-only`).

### 2. Pick the reviewers

Default to running **all 16 reviewers** (charters below). Skip a reviewer only when it clearly cannot apply to this change, and **say which you skipped and why** in the final report. Examples of fair skips:
- No external/database persistence touched → skip *Data Integrity Prosecutor*.
- No auth/permission surface anywhere near the change → skip *Authorization Attacker*.
- No comments, docs, citations, or factual claims of any kind → skip *Fact-Checker*.

When unsure, run it. The cost of an extra reviewer is cheaper than a missed bug.

### 3. Dispatch the reviewers (parallel, isolated, cheap model)

Dispatch each chosen reviewer as its **own subagent**, all in parallel.

**Claude Code:** use the `Agent` tool with `subagent_type: "general-purpose"` and **`model: "sonnet"`** for every reviewer (this review is token-heavy across many agents; the cheaper model is required). The *Fact-Checker* additionally needs `WebSearch`/`WebFetch` — general-purpose has them. Send all `Agent` calls in a single message so they run concurrently.

Each reviewer prompt contains, and ONLY contains:
1. Its charter (verbatim from the list below).
2. The raw diff.
3. The list of changed files (the reviewer may open those files and surrounding code for context).
4. The shared output format (below).

Do **not** add your own framing, hypotheses, or reassurances. The isolation is the value.

### 4. Verify every finding (standalone)

Collect all findings from all reviewers. Then dispatch **one separate verifier subagent** (the *False-Positive Filter*, charter below) — also `model: "sonnet"` in Claude Code. Give it the full list of findings plus the diff and changed files. It re-checks each finding against the actual code and returns a verdict: **confirmed / not-confirmed**, with a one-line reason. This agent must be fresh and standalone so it does not inherit any reviewer's enthusiasm.

Only **confirmed** findings reach the user. Keep the not-confirmed ones available in case the user asks.

### 5. Report in plain language — lead with a simple-terms TL;DR

**Open with a TL;DR anyone could follow.** Before any list or severity table, write 2–4 sentences in plain, non-technical language: what you reviewed, how many real problems survived verification, and whether any of them are genuinely scary. Write for a reader who never saw the code and doesn't know the jargon — no "race condition," "IDOR," or "non-idempotent" without a plain-words gloss. **This simple-terms summary is the most important part of the whole report;** the technical detail lives below and the user pulls it only if they want it.

Then present:
- A one-line count (e.g. "9 confirmed issues across 5 files; 3 high, 4 medium, 2 low").
- Findings grouped by severity (high → low), each with:
  - **What's wrong** — one or two sentences, plain words, no jargon.
  - **Where** — `file:line` (clickable).
  - **What could go wrong** — the real-world consequence.
  - **Which reviewer found it** — so the user can gauge the angle.
- Which reviewers were skipped and why.

Keep the default report skimmable. Hold the deep technical detail until the user asks.

### 6. STOP — hand the decision to the user; do not fix anything

**Reviewing is the whole job. Finding a problem is NOT permission to fix it.** The moment the report is delivered you stop and put the next move in the user's hands. Do not edit code, do not open files to "just fix the quick one," do not start drafting patches.

Present exactly these three choices (use `AskUserQuestion`) and wait for the user to pick:

1. **Explain a finding** — go deeper on one or more specific issues (the technical detail, the exact code path, a suggested fix described in words). This is read-only: explaining is not fixing.
2. **Fix everything** — implement fixes for all the confirmed findings.
3. **Triage** — defer some findings to a follow-up, and/or let the user mark findings they judge to be non-issues as dismissed (record their reasoning), then act only on whatever remains.

Only after the user chooses **Fix everything**, or names the subset to fix under **Triage**, do you touch code. **Explain** never edits anything.

This gate holds no matter what:

| The pull you'll feel | The reality |
|----------------------|-------------|
| "This one's a trivial one-line fix, I'll just do it." | Trivial or not, it's the user's code and the user's call. Report it, then wait. |
| "It's high severity — surely they want it fixed now." | High severity raises urgency, not your authority. Present the choice. |
| "Fixing as I go is more efficient than asking." | They asked for a review, not a rewrite. Their control is the goal, not your throughput. |
| "I already know the fix, so report-and-fix is one step." | Knowing the fix is exactly why you pause — so they can still choose Explain / Fix / Triage. |

## Shared output format (give this to every reviewer)

Each reviewer returns a JSON array of findings, each:

```json
{
  "title": "short imperative summary",
  "reviewer": "<charter name>",
  "location": "path/to/file.go:123",
  "severity": "high | medium | low",
  "what_is_wrong": "plain-language description",
  "what_could_go_wrong": "the concrete consequence",
  "evidence": "the specific code / interleaving / input that proves it",
  "suggested_fix": "one line, optional"
}
```

If a reviewer finds nothing, it returns `[]`. An empty result is a valid, useful result — do not pressure reviewers to invent findings.

---

# Reviewer Charters

Hand each charter to its own subagent **verbatim**, alongside the diff, the changed-file list, and the output format above. Every reviewer operates under one rule: **assume the change is broken and prove it.** Returning an empty list when nothing is found is correct — never invent findings to look thorough.

## 1. The Concurrency & State Saboteur

Assume any shared state is corruptible and any parallelism hides a race. Hunt data races, deadlocks, lost updates, ordering assumptions, non-atomic read-modify-write, and resources mutated from two places. **Charter: "Show me the interleaving or sequence where state goes wrong."** For each finding, describe the specific interleaving or ordering that triggers the bug.

## 2. The Failure Injection Adversary

Treat every boundary — network, disk, database, third-party call, subprocess — as something that will fail, time out, or return success with garbage. Ask what happens on retry, whether operations are idempotent, whether partial failures leave inconsistent state, and what the blast radius is. **Charter: "Make every dependency hostile and find where that breaks things."** For each finding, name the dependency and the failure mode that breaks it.

## 3. The Input Attacker

Come at every input as malicious or malformed: oversized, empty, wrong type, wrong encoding, injection payloads, boundary values, unexpected nulls. Cover both security (injection, traversal, deserialization) and plain robustness. **Charter: "Find the input that crashes it, corrupts it, or gets past validation."** For each finding, give the exact input that triggers it.

## 4. The Authorization Attacker

Assume the caller is authenticated but should NOT be allowed to do what they're doing. Hunt missing permission checks, privilege escalation, insecure direct object references, trust placed in client-supplied identity, and confused-deputy problems. **Charter: "I'm a valid user. Show me what I can reach that isn't mine."** For each finding, describe the request a valid-but-unauthorized user would send.

## 5. The Data Integrity Prosecutor

Assume every persistence operation is subtly wrong. Hunt incorrect queries/filters, lost or duplicated records, transaction boundaries that don't hold, schema changes that break during a rolling deploy, and reads that can see partial writes. **Charter: "Find where the stored data ends up wrong or inconsistent."** For each finding, describe the sequence that leaves data wrong.

## 6. The Resource Exhaustion Adversary

Assume scale and adversarial load. Hunt unbounded collections, missing limits/pagination, leaks (memory, connections, handles, goroutines/threads), and quadratic-or-worse algorithms hiding behind small test data. **Charter: "Show me the load or input size that exhausts or degrades it."** For each finding, state the load/input size that triggers degradation.

## 7. The Observability Auditor

Assume the system will fail silently at 3am and leave you blind. Hunt swallowed errors, missing context in logs, no actionable signal on the failure path, alerts that will false-positive, and metrics that explode in cardinality. **Charter: "When this breaks in production, what's the first signal — and is it useful?"** For each finding, describe what an operator would (not) see.

## 8. The Assumption Hunter

The meta-reviewer. Read only for unstated invariants — "this assumes the list is non-empty," "this assumes the call already happened," "this assumes the config is present." For each, ask where it's enforced; if it isn't, that's the finding. **Charter: "List every assumption, then break the unenforced ones."** For each finding, state the assumption and where enforcement is missing.

## 9. The API Contract Pedant

Assume every interface will be misused by a future caller and that the implementation quietly violates its own contract. Hunt breaking changes disguised as additions, inconsistent error semantics, leaky abstractions, and mismatches between documented behavior and actual behavior. **Charter: "Find where the promise and the implementation diverge."** For each finding, quote the promise (signature/doc) and the diverging behavior.

## 10. The Maintainability Cynic

Don't care that it works today — assume the next person will misread it. Flag misleading names, lying comments, functions doing too much, hidden coupling, and "clever" code that obscures intent. **Charter: "Find what looks correct but is hard to verify or easy to break."** For each finding, explain how the next reader gets misled.

## 11. The Rollback & Change-Safety Adversary

Assume this change must be reverted under pressure. Ask whether migrations are reversible, whether the new path can be disabled without a redeploy, whether old and new versions can coexist during rollout, and whether anything is irreversible once shipped. **Charter: "Assume we need to kill this in five minutes — can we?"** For each finding, state what blocks a fast, safe rollback.

## 12. The Test Skeptic

Distrust the tests themselves. Hunt tests that assert nothing meaningful, mock away the thing under test, only cover the happy path, are coupled to implementation rather than behavior, or pass for the wrong reason. **Charter: "Show me the bug these tests would let through."** For each finding, describe a real bug the test would not catch.

## 13. The AI Anti-Slop Critic

Assume an AI wrote this to look correct, not to be correct. Hunt the plausible-but-hollow tells of generated code:
- Hallucinated APIs, methods, fields, imports, or config keys that do not actually exist in the libraries/versions used.
- Invented or subtly-wrong function signatures and parameter orders.
- Copy-paste duplication and near-identical blocks that should be one.
- Over-engineered abstractions for a trivial problem; layers that add nothing.
- Defensive code for impossible cases while the real edge cases go unhandled.
- Comments that merely restate the code, or describe behavior the code doesn't have.
- Placeholder/stub/TODO code, mock values, or example data presented as finished.
- Generic naming (`data`, `result`, `temp`, `handler`, `process`) that hides intent.
- Patterns inconsistent with the rest of the codebase (reinventing an existing helper, different error style, etc.).
- Verbose boilerplate that pads the change without doing work.

**Charter: "Assume an AI wrote this to look correct, not to be correct. Find the plausible-but-hollow parts."** For each finding, point to the specific code and say why it's hollow, fake, or wrong rather than merely ugly. When you claim an API/method/field doesn't exist, that's a factual claim — flag it as such so the verifier and the Fact-Checker can confirm.

## 14. The Fact-Checker (Claim Auditor)

**Treat every factual claim in this change as a lie until proven true with primary sources.** Use `WebSearch` and `WebFetch` to verify. Claims to audit include:
- API/library behavior: does this function/method/flag actually exist and behave as the code assumes, in the version in use?
- Standards and citations: are referenced RFCs, specs, CVEs, or algorithms cited correctly?
- "This is safe/recommended/deprecated because X" statements in comments, docs, or commit messages.
- URLs and links: do they resolve, and do they actually say what the code/comment claims?
- Version- or platform-specific assumptions ("supported since vN", "default is X", "this header is required").
- Security/crypto assertions against current best practice.

Method: for each claim, search for the authoritative source (official docs, source repo, spec), fetch it, and compare. Report each claim as **confirmed**, **contradicted**, or **unverifiable** (couldn't find an authoritative source). Always include the source URL you checked.

**Charter: "Treat every factual claim as false. Verify each against primary sources via web search and fetch; report what you couldn't confirm."** For each finding (a contradicted or unverifiable claim), quote the claim, give the location, give the source URL, and say what the source actually says.

## 15. The Karpathy Minimalist (Simplicity & Surgical-Scope Enforcer)

Assume this change overreached. Generated and rushed code tends to do more than the task required — adding speculative complexity and touching code it had no business touching. You are NOT told what the change was asked to do; infer its apparent purpose from the diff itself, then hold the change against the two guidelines below (derived from Andrej Karpathy's observations on common LLM coding pitfalls) and find every place it breaks them.

**Simplicity First — minimum code that solves the problem, nothing speculative:**
- No features beyond what the change apparently set out to do.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't needed.
- No error handling for impossible scenarios.
- If it's 200 lines and could be 50, that's a finding.
- The test: "Would a senior engineer say this is overcomplicated?" If yes, it's a finding.

**Surgical Changes — touch only what you must, clean up only your own mess:**
- No "improving" adjacent code, comments, or formatting the change didn't need to touch.
- No refactoring of things that aren't broken.
- Style must match the surrounding code, even where you'd write it differently.
- Pre-existing dead code must not be deleted by this change — mentioning it is fine, removing it is scope creep.
- Imports, variables, or functions that THIS change rendered unused must be removed; orphans left behind are a finding.
- The test: every changed line should trace to the apparent purpose of the change. Lines that don't are scope creep.

**Charter: "Assume this change overreached. Find the speculative complexity it didn't need and the code it touched but shouldn't have."** For each finding, point to the specific lines, name which guideline they break, and explain why — and distinguish genuine scope creep or over-engineering from a change that is legitimately large because the task demanded it.

## 16. The Incomplete-Fix Prosecutor (Root-Cause & Consistency Auditor)

Assume this change treats a symptom, not the disease — a fast, local patch that fixes the one case in front of it while the same defect, the same missing guard, or the same flawed pattern survives untouched in sibling code paths, parallel call sites, and the layer where the bug actually originates. Do NOT confine yourself to the diff: use the changed files as a starting point and search the wider codebase for the same shape of problem this change is patching. Hunt:

- **Symptomatic fixes.** The change handles or guards the failure at the point it surfaced, but the root cause is upstream and still broken. Ask where the bad value or state actually originates, and whether that source is fixed.
- **The same bug left elsewhere.** The pattern being fixed (a missing nil check, an unescaped input, a wrong comparison, a forgotten lock, a missing await) exists verbatim or near-verbatim in other places the change left alone. Find those other sites.
- **Inconsistent handling across parallel paths.** One of several sibling cases, branches, endpoints, or handlers that do the same job was fixed; the others were not, so behavior now diverges between paths that should match.
- **One-off instead of shared.** A fix applied inline where a shared helper, validation, or constant already exists (or should), guaranteeing the next occurrence gets fixed differently — or not at all.
- **Maintainability debt for the next developer or agent.** A patch that is correct today but leaves the codebase harder to reason about: a special-case branch with no explanation of why only this case is special, a fix that contradicts a nearby pattern without a note, or an implicit coupling that a future change (human or AI) will silently break.

**Charter: "Assume this fix is local and the problem is systemic. Find the other places the same bug lives and the root cause this patch left standing."** For each finding, name the specific other location(s) that share the defect (or the upstream origin), and say why patching only the diffed spot leaves the system broken, inconsistent, or harder to maintain.

---

# Verifier — The False-Positive Filter (standalone, runs last)

You receive the full list of findings from all reviewers, plus the diff and the list of changed files. You did not produce any of these findings and you owe them no loyalty. For each finding:

1. Open the actual code at the cited location and surrounding context.
2. Decide whether the finding is **real, reproducible, and material** — not speculation, not already handled elsewhere, not a misreading, not a style nitpick dressed up as a bug.
3. For *Fact-Checker* findings, sanity-check that the cited source genuinely contradicts the claim (re-fetch if needed).

Return, for each finding, the original finding plus:

```json
{ "confirmed": true | false, "reason": "one line: why it stands or why it's rejected" }
```

Be strict. A finding survives only if you can point at the specific code that makes it true. When in doubt, mark it not-confirmed with a reason — a missed nitpick is cheaper than a false alarm presented to the user as fact.

---

## Common Mistakes

- **Leaking intent into reviewer prompts.** "The author says this is safe" poisons the review. Never include it.
- **Skipping the verifier.** Adversarial reviewers over-report. The standalone verifier is what makes the output trustworthy — do not present raw findings.
- **Using the expensive model for subagents in Claude Code.** 16+ agents on the big model is wasteful; use `sonnet`.
- **Dumping technicalities on the user.** Lead with plain language and consequences; expand only on request.
- **Skipping the simple-terms TL;DR.** The plain-language summary up top is the most important part of the report, not an optional nicety — write it for someone who never saw the code.
- **Fixing before the user chooses.** This skill produces a *review*, not a *fix*. A confirmed finding — even an obvious one-liner — does not authorize editing. Stop at the report and let the user pick Explain / Fix everything / Triage.
- **Running reviewers sequentially.** Dispatch them in one batch so they run concurrently.

