---
name: adversarial-review
description: Use when you want a hostile, bias-free review of a code change — a PR, the last commit, or local/uncommitted work — that attacks it from many independent angles (conformance to the approved design, whether that design was right in the first place, concurrency, failure injection, input and auth attacks, data integrity, resource exhaustion, observability, API contract, maintainability, simplicity and scope creep, root-cause/incomplete-fix consistency, rollback, tests, AI-slop, fact-checking). Especially for AI-generated code that looks right but may be hollow, when a change should be checked against a plan or mock that was signed off, or when you want claims in comments and commit messages fact-checked rather than trusted.
---

# Adversarial Review

## Overview

Run a panel of **independent, hostile reviewers** against a change. Each reviewer assumes the code is broken and tries to prove it, from a single narrow angle. Because each runs as a fresh subagent, **none of them inherit the main session's reasoning or the author's rationalizations** — that is the whole point. A change that "looks fine" to the person who wrote it (or to the assistant that helped write it) gets attacked from 18 directions by reviewers who were never told why it should work.

**Core principle:** the orchestrator gathers the change *and the brief* once, hands each reviewer the raw change, the brief, and a charter, collects findings, a separate verifier confirms each finding is real, and a separate validator confirms each proposed fix actually works — before anything reaches the user.

### The one thing reviewers must know: what was agreed

There are two very different things a reviewer could be told about a change, and they are easy to confuse:

| | Give it to every reviewer | Never give it to any reviewer |
|---|---|---|
| **What it is** | **The brief** — what this change was *supposed* to do, and what it was deliberately *not* going to do | **Reassurance** — anyone's opinion that the code is correct, safe, or already handled |
| **Examples** | The approved plan, mock, or design artifact; the issue or ticket; the PR description; the agreed non-goals and deferrals; agreed constraints ("don't touch the public API") | "The author says this is safe"; "this part is fine"; "focus on X, Y is handled"; your own hypotheses about where the bug is |
| **Why** | Without it, nobody checks the change against what was signed off, and every deliberate omission gets flagged as a gap — burying the real findings in noise | It tells the reviewer the answer before it looks, which is exactly the bias this skill exists to remove |

The brief is **facts about the assignment**. Reassurance is **conclusions about the result**. Pass the first verbatim; never pass the second.

This distinction comes from a real failure: three reviewers hunted bugs well on a piece of UI work and all three passed it, because none of them had been told what had been agreed. The build had silently dropped a column the approved mock had, and a value was rendered in the wrong place as a result. A correct implementation of the wrong design passes every bug-hunting charter.

**A dropped design element is not cosmetic.** It routinely takes data with it: a column removed from a layout leaves its value homeless, and it tends to get rendered somewhere wrong rather than not at all.

### The brief bounds scope. It never establishes correctness.

The brief has one legitimate job and one illegitimate one, and the difference is what this panel lives or dies on:

- **Legitimate — it bounds scope.** "Don't report the absence of work nobody agreed to do."
- **Illegitimate — it defines correctness.** "The code does this because the plan says so, therefore it isn't a finding."

The second reading makes the brief unfalsifiable. A reviewer finds something wrong, checks the brief, sees the behaviour was agreed, and files it under *out of scope* instead of under *bug*. That suppression is silent, and because it is deterministic it fires again on every later round — which is exactly how a defect survives review after review while everybody works honestly.

**Agreement moves the fault from the implementer to the design. It does not make the fault disappear.** Whether the change matches what was approved, and whether what was approved was right, are two separate questions, and this panel answers both. The *Spec Conformance Auditor* owns the first. The *Premise Auditor* owns the second. Every other reviewer is told, in the scope rule, that "it was in the plan" is never a reason to withhold a defect.

This comes from a second real failure, the mirror of the one above: a bug survived two full adversarial rounds because every reviewer checked whether the implementation matched the design instead of whether the design was right. The two failures bracket each other:

| The failure | What passes it |
|---|---|
| A correct implementation of the wrong design | Every bug-hunting charter |
| A wrong design that was formally approved | Every conformance charter — and it silences the bug hunters too |

Both come from a reviewer trusting a document instead of reasoning. The brief tells reviewers **what to look at**. It must never tell them **what to conclude**.

**Claude: Do not use dynamic workflows.** Using that means even more token consumption for no functional gain. Use instead just raw sub-agent dispatch and parallel subagents.

## When to Use

- Before merging a change and you want more than a friendly pass.
- You have a PR, or a set of local/uncommitted changes, and want them stress-tested.
- A plan, mock, or design was approved and you want the implementation held against it, not just checked for bugs — **and the design itself questioned**, not treated as settled.
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

### 2. Assemble the brief — what this change was agreed to do

**Do this before dispatching anyone.** A reviewer without the brief cannot tell a deliberate omission from a defect, and nobody in the panel is checking the change against what was approved.

Gather, from strongest source to weakest:

1. **An approved design artifact** — a mock, wireframe, rendered artifact, schema, or written plan the user signed off on. If one exists, it is the specification, not a suggestion. Attach it to the reviewers verbatim (paste it, or give its path and tell them to open it).
2. **The written statement of work** — the PR description, the issue or ticket, the plan document, the commit messages.
3. **What the user asked for in this session** — quoted, not paraphrased into your own reading of it.

Assemble the brief as **evidence of what was asked for, never as evidence that it was a good idea.** You are recording the assignment, not endorsing it. The panel is going to attack this document as well as the code, and that is intended.

Then write down, explicitly:

- **Goals** — what the change was meant to accomplish, in the terms it was agreed in.
- **Non-goals and deferrals** — what was deliberately left out, agreed to be handled later, or ruled out. This is the half that gets forgotten, and it is what turns a review into noise when it is missing.
- **Agreed constraints** — "don't change the public API," "no new dependencies," "keep it backwards compatible."
- **Known deviations already announced** — anything the implementer flagged at the time as a departure from the design, with the reason.

Rules for writing the brief:

- **Quote and cite; do not editorialize.** Every line is either lifted from a source or a plain statement of fact about the assignment, with the source named. No assessments of the code, no "this looks handled," no hypotheses.
- **A non-goal only counts if it was actually agreed.** Do not invent one to excuse something the change skipped. If you are not sure whether an omission was deliberate, leave it out of the non-goals and let the reviewers flag it.
- **If there is no brief, do not fabricate one.** Use `AskUserQuestion` to ask what this change was supposed to do and what was deliberately left out. If the user has nothing — an old branch, an inherited PR — that is a legitimate answer: run the panel spec-blind, skip the *Spec Conformance Auditor*, and **say plainly in the report that no agreed scope was available**, so the user knows design drift was not checked. The *Premise Auditor* still runs: with nothing written down, the design is whatever the change implies, and it attacks that instead.

Give the brief to **every** reviewer, the verifier, and the validator, marked clearly as the brief.

### 3. Pick the reviewers

Default to running **all 18 reviewers** (charters in `charters.md`). Skip a reviewer only when it clearly cannot apply to this change, and **say which you skipped and why** in the final report. Examples of fair skips:
- No external/database persistence touched → skip *Data Integrity Prosecutor*.
- No auth/permission surface anywhere near the change → skip *Authorization Attacker*.
- No comments, docs, citations, or factual claims of any kind → skip *Fact-Checker*.
- No approved design artifact or written statement of work exists at all → skip *Spec Conformance Auditor* (and say so loudly in the report).

**Never skip the *Premise Auditor*.** It is the one reviewer that has something to attack even with no brief at all: when nothing was written down, the design is whatever the change implies, and that implied design is still open to being wrong. A missing brief makes its job harder, not unnecessary.

When unsure, run it. The cost of an extra reviewer is cheaper than a missed bug.

### 4. Dispatch the reviewers (parallel, isolated, cheap model)

Dispatch each chosen reviewer as its **own subagent**, all in parallel.

**Claude Code:** use the `Agent` tool with `subagent_type: "general-purpose"` and **`model: "sonnet"`** for every reviewer (this review is token-heavy across many agents; the cheaper model is required). The *Fact-Checker* additionally needs `WebSearch`/`WebFetch` — general-purpose has them. Send all `Agent` calls in a single message so they run concurrently.

Each reviewer prompt contains, and ONLY contains:
1. Its charter (verbatim from `charters.md`).
2. The brief from step 2 (verbatim), under a heading that says what it is — plus the approved design artifact itself, or its path, when one exists.
3. The raw diff.
4. The list of changed files (the reviewer may open those files and surrounding code for context).
5. The scope rule (below) and the shared output format (below). Both live in this file, not in `charters.md`.

Do **not** add your own framing, hypotheses, or reassurances. The brief says what the job was; you do not get to say how well it was done. The isolation is the value.

**The scope rule — include this verbatim in every reviewer prompt:**

> The brief above tells you what this change was agreed to do and what it was agreed *not* to do. Use it three ways.
>
> First: **something the brief lists as a non-goal or a deferral is not a finding.** Do not report the absence of work nobody agreed to do — that noise buries the real findings. If a declared non-goal is genuinely dangerous to defer, you may report it at **low** severity with `"out_of_scope_by_design": true`, and say why the deferral bites.
>
> Second: **the brief is the standard for whether the right thing was built.** Code that is internally consistent but does something other than what was agreed is a defect, not a preference.
>
> Third — and this one overrides the other two when they collide: **the brief bounds what is in scope; it never establishes that anything is correct.** If the change does exactly what was agreed and is still broken, wrong, unsafe, or unworkable, that is a finding. Report it, and say plainly that the design specifies this behaviour, so the reader knows the fault is in the plan rather than in the implementation. Set `"design_is_wrong": true` on it. **"It was in the plan" is never a reason to withhold a defect.** Agreement moves the fault from the implementer to the design; it does not make the fault disappear, and a plan that was approved by a person who could not foresee this consequence is exactly the thing you were hired to catch.
>
> The brief is a statement of the assignment, not an assessment of the result — nothing in it means any part of the change is correct, and it is not a reason to look anywhere less hard.

### 5. Verify every finding (standalone)

Collect all findings from all reviewers. Then dispatch **one separate verifier subagent** (the *False-Positive Filter*, charter in `charters.md`) — also `model: "sonnet"` in Claude Code. Give it the full list of findings plus the brief, the diff, and the changed files. It re-checks each finding against the actual code and returns a verdict: **confirmed / not-confirmed**, with a one-line reason. This agent must be fresh and standalone so it does not inherit any reviewer's enthusiasm.

Only **confirmed** findings reach the user. Keep the not-confirmed ones available in case the user asks.

### 6. Propose a fix for each confirmed finding — and validate it (standalone)

Every confirmed finding gets a fix, and **no fix reaches the user until a separate agent has confirmed it actually works.** A fix that looks right but is wrong is worse than no fix — it sends the user troubleshooting a dead end.

1. **Draft a fix** for each confirmed finding: the *smallest* change that resolves the **root cause**, not just the symptom. Small and root-cause are not opposites — reach the actual source of the bug, but with the minimal change that does it. This is the same Simplicity-First, Surgical-Changes discipline the *Karpathy Minimalist* reviews for: no refactoring, no cleaning up adjacent code, no new abstraction, no guarding impossible cases. When the same defect lives in sibling paths or parallel call sites (the *Incomplete-Fix Prosecutor*'s territory), each site is its own finding with its own minimal fix — never a reason to balloon one fix into a sweeping rewrite. Make it specific enough to act on — what to change and where — but only describe it. Do not edit any code.

   Three scope rules bind the fixes as well. A fix must **stay inside the brief**: it may not implement something the brief declares a non-goal, and it may not break an agreed constraint — if the only real fix does either, say so and present it as a decision for the user rather than a fix to apply. A fix for a **conformance** finding is *restore what was approved*: bring the change back to the agreed design, rather than inventing a third design that is neither. And a fix for a **`design_is_wrong`** finding is the deliberate exception to the first rule: the agreed design is the defect, so the fix necessarily leaves the brief. Draft it anyway, as small as it can be, and carry it to the user as a **design decision to make** rather than a patch to apply — describe what the design would become and what it costs, and let them choose. Do not water it down into something that fits the old design; a fix that stays inside a broken design keeps the bug.
2. **Validate every fix with one standalone *Solution Validator* subagent** (charter in `charters.md`; `model: "sonnet"` in Claude Code). Give it the brief, the confirmed findings, the drafted fixes, the diff, and the changed files. It is a fresh, hostile checker that owes the fixes nothing: for each one it tries to prove the fix wrong — does it address the real cause, does every API/method/field it names actually exist, does it leave the same bug standing in sibling paths, does it break anything nearby? It returns **valid / invalid** with a one-line reason, and it does not modify code.
3. **Revise and re-validate** any fix the validator rejects, then send it back through. Loop until valid. If a fix still can't be validated, **say so plainly** — present the problem with "no confirmed fix yet" rather than shipping a guess.

Only **validated** fixes appear in the report.

### 7. Report the problems and their fixes, grouped by category

By now you hold detailed, code-level material: reviewer findings full of symbols, the drafted fixes, the validator's notes. **The report is not that material — it is a plain re-telling of it.** Rewrite every finding for a reader who never saw the code and never will. One self-check governs the whole report: *if a sentence only makes sense to someone already reading the code, rewrite it.*

**Why this rule is absolute here.** Eighteen agents just grepped, opened, and read their way across the codebase. The user did none of that, and on most surfaces could not have. A change big enough to deserve this review is a change nobody is holding in their head, so a sentence like *"the change to `fooBar()` at `example.js:24` conflicts with `barbaz()` and `dafoo()`"* transfers nothing: the reader doesn't know what any of those do, whether the names mean what they claim, or what breaks. It reads as information while being none. Every identifier you leave in the prose moves the work of understanding onto the one person who cannot do it.

**Write the report in Simplified Technical English (ASD-STE100)**, or any equally plain register:

- Short sentences, one idea each. Active voice, present tense.
- Common words over precise-but-obscure ones. No unexplained jargon, ever — and no jargon at all where a plain phrase carries the same meaning.
- Name the **effect first**, the label last (if the label appears at all).
- Describe **what a person would observe** — what breaks, what they'd see, what they'd lose — not what the code does internally.
- Never sacrifice a real finding to be brief. Plain is the goal; short is not. Balance, not brevity.

If the reader replies in code terms — they wrote it, they're quoting symbols back at you — match them for that exchange, then reset to plain for the next one. If the `effective-communicator` skill is installed, it governs the wording of the report and this section defers to it.

This applies to **Explain** in step 8 as well. "Go deeper" means more of the reasoning, the sequence of events, the consequence — not a switch into code-speak. Reach for identifiers only once the user has shown they're reading the code alongside you.

**Where code identifiers go.** Function names, class names, variables, flags — any symbol — belong **only** in the `Where` field, as a clickable `file:line`. That field is the pointer into the editor; it carries the code-level precision so the prose doesn't have to. The problem and the fix describe *what happens* and *what changes* in outcome terms, with no symbol names in them.

**Open with a short TL;DR anyone could follow** — 2–4 sentences: what you reviewed, **whether the change matches what was agreed**, **whether what was agreed turned out to be right**, how many real problems survived verification, and whether any are genuinely serious. Don't label it or announce that you're keeping jargon out — just write it that way. Never use a term like "race condition," "IDOR," or "non-idempotent" without a plain-words gloss.

**Say where the change stands against the brief, every time — including when it matches.** One line is enough: "It does what was agreed," or "Two things from the approved design didn't make it in." If no brief was available, say that instead, plainly: nobody checked this against an agreed design, because there wasn't one.

**Then say whether the agreed design held up — also every time.** This is a separate sentence, and it is separate because the two answers are independent: a change can match the plan exactly and still be wrong, and that is the case the user has the least chance of catching alone. "The plan itself looks sound," or "the plan works for the ordinary case but breaks the first time a customer has two accounts." Never let a clean conformance line stand in for this one.

Then a one-line count (e.g. "9 confirmed issues across 5 files; 3 serious, 4 moderate, 2 minor").

Then the **findings grouped by category** — a short, plain-language theme, not a charter name. Pick the few that fit; for example: *the plan itself has a problem*, *doesn't match what was agreed*, *could crash or break*, *security and access gaps*, *data ending up wrong*, *slow under heavy use*, *will confuse the next person*, *weak tests*, *claims that aren't true*.

**Two groups come first, in this order, whenever they have anything in them:**

1. ***The plan itself has a problem*** — every `design_is_wrong` finding. This group outranks all others, including conformance, because everything below it is measured against a plan this group is saying was wrong. Open the group with one sentence making that explicit: the code here does what was agreed, and doing what was agreed is the problem. Then describe each finding by the case that breaks and what the user would see — never as an argument about design style. Say clearly that fixing it means changing what was agreed, not correcting a mistake in the code, so nobody reads it as the implementer having slipped.
2. ***Doesn't match what was agreed*** — the conformance findings. The code compiles, the tests pass, and nothing looks wrong unless you hold it up against the design, so this is the group the user is next-least able to catch alone. Describe the gap the way the user would experience it ("the list has no column showing which item is which, so the number shown is the count rather than the item's ID"), not as a diff against a document.

Each finding has exactly this shape:

- **What's wrong** — one to three plain sentences: the situation and its real-world consequence.
- **The fix** — one to three plain sentences: what changes, in outcome terms. (More text isn't better; the user can ask for depth.)
- **Where** — `path/file.go:142` (the only place a symbol name appears).
- **Severity** — serious / moderate / minor (the reviewers' high / medium / low).
- **Found by** — the reviewer, so the user can gauge the angle.

A concurrency finding, for example, renders like this:

> **What's wrong:** Two requests arriving at the same instant can both pass the "is this name still free?" check before either of them saves, so the second silently overwrites the first. It's invisible under normal traffic and only shows up under load, as quietly lost data.
> **The fix:** Make the check-and-save happen as one all-or-nothing step, so a second request can't slip in between the two.
> **Where:** `internal/store/users.go:142`
> **Severity:** serious — **Found by:** Concurrency & State Saboteur

Notice what the example does *not* contain: no function name, no "mutex," no "transaction," no "race condition." Those live in the code at `Where`, not in the explanation.

For a **`design_is_wrong`** finding, the shape is the same with two changes: the fix line is headed **The change to the plan** instead of **The fix**, and it ends with what that change costs — the work it implies, or what has to be given up. A finding like this asks the user to revisit a decision, so it has to arrive with the price attached:

> **What's wrong:** The plan stores one address per customer. Support already has customers with a billing address and a delivery address, and they've been keeping the second one in the notes field. When this ships, saving the delivery address will overwrite the billing one with no warning, and the old value is gone.
> **The change to the plan:** Let a customer hold more than one address, and mark one as the default. This is a bigger change than the one that was approved — it touches the stored data and the screens that show it — so it's a decision to make, not a patch to apply.
> **Where:** `internal/customer/address.go:31`
> **Severity:** serious — **Found by:** Premise Auditor

Close with which reviewers were skipped and why. If any reviewer raised something the brief had declared out of scope, list those separately at the end as *deliberately left out — flagged anyway*, one line each, so the user sees them without them competing with the real findings. Hold the deep technical detail until the user asks.

### 8. STOP — hand the decision to the user; do not change anything

**Reviewing and proposing fixes is the whole job. A described, validated fix is NOT permission to apply it.** The moment the report is delivered you stop and put the next move in the user's hands. Do not edit code, do not open files to "just apply the quick one," do not start drafting patches in the working tree.

Present these choices (use `AskUserQuestion`) and wait for the user to pick:

1. **Explain a finding or its fix** — go deeper on one or more specific issues (the technical detail, the exact code path, why the validated fix works). This is read-only: explaining is not applying.
2. **Apply the fixes** — implement the validated fixes for all the confirmed findings.
3. **Triage** — defer some findings to a follow-up, and/or let the user mark findings they judge to be non-issues as dismissed (record their reasoning), then act only on whatever remains.
4. **Revise the design** — offer this fourth choice **only when there is at least one `design_is_wrong` finding**, and when there is, offer it first. These findings cannot be handled by "apply the fixes": the fix changes what the user approved, so applying it silently would be you re-deciding a design on their behalf. Choosing this means you write down what the design would become, they approve or amend it, that becomes the new brief, and the change is then measured against it — not against the old one. If they'd rather keep the design as it is, record that as an accepted trade-off with their reasoning and move on; that is a legitimate answer and the finding stops being open.

Only after the user chooses **Apply the fixes**, names the subset to fix under **Triage**, or approves a revised design under **Revise the design**, do you touch code. **Explain** never edits anything.

**Never fold a design change into "apply the fixes."** If the user picks *Apply* while a `design_is_wrong` finding is open and hasn't been decided, apply everything else and stop at that one — say it needs their call on the design first.

This gate holds no matter what:

| The pull you'll feel | The reality |
|----------------------|-------------|
| "This one's a trivial one-line fix, I'll just apply it." | Trivial or not, it's the user's code and the user's call. Report it, then wait. |
| "It's serious — surely they want it fixed now." | Severity raises urgency, not your authority. Present the choice. |
| "Fixing as I go is more efficient than asking." | They asked for a review, not a rewrite. Their control is the goal, not your throughput. |
| "The fix is already written and validated, so applying it is one more step." | The fix being ready is exactly why you pause — so they can still choose Explain / Apply / Triage. |

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
  "suggested_fix": "one line, optional",
  "out_of_scope_by_design": false,
  "design_is_wrong": false
}
```

Set `out_of_scope_by_design` to `true` only for the case the scope rule describes: the brief declared this a non-goal or a deferral, and you are flagging it anyway because deferring it is dangerous. Those findings are reported separately and never compete with the real ones.

Set `design_is_wrong` to `true` when **the code does what the brief says and the brief is the problem** — the implementation is faithful, and the agreed design is what produces the defect. This flag exists so the finding survives the gates that would otherwise reject it as "already agreed," so use it accurately: it is not a way to escalate a preference about how you'd have designed it. In `evidence`, say which part of the brief specifies the behaviour, and give the concrete consequence of following it.

If a reviewer finds nothing, it returns `[]`. An empty result is a valid, useful result — do not pressure reviewers to invent findings.

---

## The charters live in `charters.md`

All 18 reviewer charters, the *False-Positive Filter* verifier, and the *Solution
Validator* are in **`charters.md`**, next to this file. Open it when you reach
step 4, and paste each charter into its subagent prompt verbatim — do not
paraphrase one from memory, and do not dispatch an agent without reading its
charter first.

---

## Common Mistakes

- **Reviewing without the brief.** The most expensive failure this skill has had: reviewers hunted bugs well, found none, and the change shipped visibly wrong because it wasn't what had been approved and nobody was checking. Assemble the brief before dispatching anyone.
- **Leaking assessments into reviewer prompts.** "The author says this is safe," "Y is already handled," "I think the bug is in the parser" all poison the review. Never include them. The brief is different: it states what the assignment was, not how well it was met — pass it, and pass it verbatim.
- **Inventing a non-goal to explain a gap.** A non-goal is something that was actually agreed to be left out. Guessing that an omission was probably intentional turns the brief into a shield and hands the reviewers the wrong standard. When you don't know, say nothing and let the reviewer flag it.
- **Letting deliberate omissions become findings.** The other half of the same coin: a panel that reports every agreed deferral as a gap buries the two real problems under twelve non-problems. That's what the scope rule in every reviewer prompt is for.
- **Treating the brief as proof that something is correct.** The second-most expensive failure this skill has had, and the mirror of the first: a bug survived two full adversarial rounds because every reviewer checked whether the code matched the design instead of whether the design was right. Each reviewer saw the problem, checked the brief, found the behaviour had been agreed, and filed it under *out of scope*. The brief bounds what is in scope; it never establishes that anything is correct. "It was in the plan" is never a reason to withhold a defect.
- **Letting a design finding die at a gate.** The verifier rejecting it as "already agreed," or the validator rejecting its fix as "outside the brief," are the same circular error at two different stations — both use the disputed design to dismiss a challenge to that design. The `design_is_wrong` flag exists to carry a finding past both; honour it.
- **Reporting a design finding as if the implementer erred.** The code here is faithful. Say so, or the user goes looking for a coding mistake that isn't there — and then applies a patch that reintroduces the drift the conformance charter exists to catch.
- **Skipping the *Premise Auditor* because there was no brief.** No brief means the design is implicit in the diff, not that there is no design. Reconstruct it and attack it.
- **Letting the *Premise Auditor* editorialize.** "I'd have designed this differently" is noise, and it is the failure mode this charter is prone to. A design finding names a concrete case where following the agreed design produces a wrong result, a failure, or a cost nobody agreed to. No case, no finding.
- **Passing the conformance charter a spec you wrote yourself.** Give it the artifact the user approved. A summary you drafted from the diff will agree with the diff.
- **Confirming conformance from the diff alone.** Reading a change and thinking "this looks like the design" is precisely how a dropped column survives review. Enumerate the approved elements first, then check them one by one.
- **Dispatching a charter from memory.** The charters live in `charters.md` precisely so they arrive verbatim. A remembered summary of one drops the method steps and the guardrails, and a reviewer given the gist of a charter reverts to generic bug-hunting — which is the failure this panel exists to avoid. Open the file, copy the charter.
- **Skipping the verifier.** Adversarial reviewers over-report. The standalone verifier is what makes the output trustworthy — do not present raw findings.
- **Presenting an unvalidated fix.** A fix that looks right but is wrong sends the user troubleshooting a dead end — worse than offering no fix at all. Every fix goes through the standalone Solution Validator; if one can't be validated, say "no confirmed fix yet" instead of guessing.
- **Using the expensive model for subagents in Claude Code.** 18+ agents on the big model is wasteful; use `sonnet`.
- **Dumping technicalities on the user.** Lead with plain language and consequences; expand only on request.
- **Padding the problem or the fix.** Each is one to three sentences. More words don't make it more correct — the user can always ask for depth.
- **Proposing a fix bigger than the bug.** The fix is the smallest change that resolves the root cause — not a refactor, not a cleanup, not a new abstraction. Breadth across sibling paths is handled by separate findings, each with its own small fix. The Solution Validator rejects fixes that overreach.
- **Letting code identifiers leak into the prose.** Function and symbol names belong in the `Where` (`file:line`) field, not in the problem or the fix. The panel read the code; the user didn't and won't. "The change to `fooBar()` conflicts with `barbaz()`" names three things the reader has never seen and tells them nothing about what breaks. If the explanation only makes sense to someone reading the code, rewrite it.
- **Treating "explain further" as permission to go technical.** Depth means more of the story — the sequence, the trigger, the consequence — in the same plain register. Switch to symbols only when the user is clearly reading the code with you.
- **Announcing that you're simplifying.** Just write plainly; don't label the summary "simple terms" or tell the user you're keeping the jargon out. That guidance is for you, not for them.
- **Skipping the opening TL;DR.** The plain summary up top is the most important part of the report, not an optional nicety — write it for someone who never saw the code.
- **Applying fixes before the user chooses.** This skill produces a *review with proposed fixes*, not changes to the code. A confirmed finding with a validated fix — even an obvious one-liner — does not authorize editing. Stop at the report and let the user pick Explain / Apply the fixes / Triage.
- **Running reviewers sequentially.** Dispatch them in one batch so they run concurrently.
