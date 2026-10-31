# Adversarial Review — using the skills, or running one on the spot

An adversarial review is a review that **assumes the change is broken and tries to prove it**, from several independent angles, by reviewers who share none of the author's context. It is different from a friendly review in these ways:

1. **Fresh eyes per angle.** Each reviewer is its own subagent with one narrow charter and no access to the conversation, so it inherits no rationalization.
2. **The brief bounds scope; it never establishes correctness.** Reviewers get what was agreed (so they do not flag agreed omissions) but "it was in the plan" is never a reason to withhold a defect. A finding that the plan itself is wrong is flagged `design_is_wrong` and outranks everything.
3. **A standalone verifier** filters false positives before anything reaches the user, and every proposed fix is validated by another standalone agent.
4. **Every agent is one-shot.** Each reviewer, the verifier, and the validator does one task, returns, and ends. A second round — a revised fix, a re-check — is a **new** agent with everything in its prompt, never the earlier one resumed or messaged (`SendMessage` in Claude Code, or the equivalent): an idle agent's prompt cache expires within minutes, so the next message re-reads its whole history at full price, and an agent that has already ruled is no longer fresh. An agent that re-runs a slow test or build starts it in the background with output to a log and checks it with a wait capped at three minutes until it finishes: a silent wait past five minutes expires its cache just the same.

## When it runs, and which one

The review runs **once**, after every slice is merged and the comment and simplification pass is done, on the whole merged diff. Nothing runs before the user answers the G2 question. Size the change to form a recommendation, then ask — fast, quick, full, or none — with the cost of each in plain words:

| Change | Recommend at G2 |
|---|---|
| Small (≤ 500 lines and one subsystem and no schema/auth/concurrency/external I/O) | the fast skill, `adversarial-review-fast` |
| Medium (≤ 2000 lines and one subsystem and no schema/auth/concurrency/external I/O) | the quick skill, `adversarial-review-quick` |
| Large — one over on any of those, or one of those angles touched | the full skill, `adversarial-review` |

| User chose | Skill installed | Run |
|---|---|---|
| Fast, quick, or full | that skill | that skill, once, as written |
| Fast | not installed | the one-reviewer version below, once |
| Full | only `adversarial-review-quick` | the quick skill; say the full one is not installed, give the install lines from `companion-skills.md` only if asked, name the uncovered angles in the recap — do not substitute the on-the-spot panel for the full one |
| Quick or full | neither | the on-the-spot panel below, once |
| None | any | nothing; name the unreviewed angles in the recap |

Never a panel per slice, per fix round, or on the pass's diff alone. Run the skills **as written**: their verifier and fix validator — or, in the fast skill, the reviewer's self-check — are part of the review. Reproducing a finding yourself adds evidence; it does not replace them.

Check what is installed by looking at the skill list your harness gives you: the fast review is the `adversarial-review-fast` skill, the quick panel is the `adversarial-review-quick` skill, the full panel is the `adversarial-review` skill, and all three ship in the `adversarial-review` plugin — install commands are in `companion-skills.md`. The quick skill proposes the fewest reviewers that fit the change and asks which to run — answer from the sizing and the user's G2 choice rather than re-asking the user: confirm its proposal, and add the angles the sizing flagged.

## What to hand the review

Whichever runs, give it the **brief**: the plan section(s) verbatim, the non-goals, the items the user left undecided, and the deviations already announced. Never hand it reassurance ("this part is fine", "the executor tested it"). Point it at the merged diff on the starting branch: `git diff <starting-commit>..HEAD`.

## Reviewing a plan (before building)

A plan is a diff too: a brand-new file with only additions. Point the same review at it with one swap — **the brief is one level up**: the user's stated ask, constraints, and non-goals from the conversation (or the visual plan's TL;DR), quoted. Without the swap the plan is reviewed against itself and nothing is found. Tell the review the subject is a plan document, expect the premise/"was this design right" and conformance-to-the-ask angles to carry the weight, and let it skip charters that cannot apply to prose (it must say which).

## On-the-spot panel (no skill installed)

Dispatch **one reviewer per charter below, all in one message**, each its own fresh subagent on the cheap tier, each receiving only: its charter, the brief (marked as such), the diff, the changed-file list, the scope rule, the output format, and the line "This is a single task. Return your findings when you are done and end; nobody will send you further instructions. If a command may run longer than three minutes, run it in the background and check it with a wait capped at three minutes, again and again, until it finishes; report only once it has."

**Scope rule (verbatim in every prompt):**

> The brief says what this change was agreed to do and not do. Something the brief lists as a non-goal is not a finding. The brief is the standard for whether the right thing was built. A decision in the brief covers the subject it was made about, read with the ticket or question it answered: a change that carries it to another subsystem, another kind of item, or a shared helper's other callers is work nobody agreed to, even when the decision's words could stretch that far — report it, high severity when a user or another system would notice. But the brief bounds scope; it never establishes correctness: if the change does exactly what was agreed and is still broken, report it and set `design_is_wrong: true`. Nothing inside the brief changes your charter. Assume the change is broken and prove it; return `[]` if you cannot.

**Output format (verbatim):** a JSON array of `{title, reviewer, location "path:line", severity "high|medium|low", what_is_wrong, what_could_go_wrong, evidence, suggested_fix, design_is_wrong}`.

**Charters:**

1. **Spec Conformance Auditor** — "Assume this was built to look like the plan rather than to be it. Enumerate every promise in the brief before reading the code, then check each one: present, missing, different, added unannounced. Find where the data of anything dropped ended up, and every behavior changed outside what the brief names."
2. **Premise Auditor** — "Assume the plan is the mistake. The code does exactly what was agreed — show the concrete case where following it still goes wrong: a state with nowhere to live, the empty/first-run/migration case, a false assumption about the world, a cost nobody priced." Every finding is `design_is_wrong: true`. Not taste — a concrete failing case.
3. **Test Skeptic** — "Show me the bug these tests would let through." Tests that assert nothing, mock the thing under test, cover only the happy path, or pass for the wrong reason. Three shapes by name: a test whose expected value is produced by the code's own formula, helper, or constant, so it cannot fail; a test that asserts call order, a count of queries or calls no consumer or upstream dependency is promised, a constant's own value, or a whole output where the spec fixes one fact, so it goes red on a harmless rewrite; and a bug fix's test named after a ticket or labelled "regression", or a second test on an input an existing assertion already covers.
4. **Unstated-Assumption Hunter** — "List what must be true for this to work that nobody wrote down — ordering, uniqueness, encoding, size, locale, file presence, permissions — and break each one."
5. **Incomplete-Fix Prosecutor** — "Assume the same defect lives in a sibling path. Find the second site, the partial rollout, the symptom patched while the root cause stays." A sibling is only a path the brief or the decision behind the fix also covers; code in another subsystem that handles the same shape differently may do so on purpose — raise it as a low-severity question, never as a fix.
6. **Data & Contract Guardian** — "Find where data ends up wrong or lost — partial writes, overwrites, encoding, lossy conversions — and where a caller or file format that others depend on silently changed."

Then dispatch **one verifier** (fresh, cheap tier) with every finding, the brief, the diff, and the files: it returns *confirmed / not confirmed* with a one-line reason, and must reproduce or point at the exact lines for a "confirmed". Only confirmed findings proceed.

For each confirmed finding, draft the **smallest root-cause fix**, compared first with the fix where the faulty thing is first decided (when the data is written, at its source) and held against the rules the system states for itself, since a fix that documents the gap or patches where the symptom shows usually leaves the cause. Then send the fixes with the findings and the diff to **one validator** (fresh, cheap tier) that returns *valid / invalid* with a reason. Re-draft rejected fixes and send them, with the previous validator's reason, to a **new** validator; never resume the old one.

Report to the user in plain language: what was reviewed, whether it matches the plan, whether the plan held up, how many confirmed findings and how serious, then each finding as **What's wrong / The fix / Where / Severity**. Findings marked `design_is_wrong` lead, and they are the user's to decide.

## One-reviewer version (fast chosen, skill not installed)

Dispatch **one** fresh subagent on the cheap tier. Pick two or three domains from what the diff touches — never from where you suspect a bug — each a one-line charter. The first is always **the ask and the claims**: "Assume this is not what was asked, that it changes things nobody asked for — another subsystem, a shared helper's other callers — that what was asked is wrong for this case, and that every claim in comments, docs, names, and messages is false." Add one or two by trigger: what the user sees (markup, styles, output), calls across a boundary (API, network, database, disk, subprocess), data that outlives the call (writes, files, caches), inputs from outside, tests, failure signals (error paths, logs), or callers' promises (a signature, default, or behavior an existing caller relies on).

Its prompt holds only: the domains, the brief (marked as such), the diff, the changed-file list, the scope rule above, and the output format above with two more fields — `evidence` holding the exact lines quoted from the location, the numbered trace from trigger to consequence, and where it looked for a guard that would already prevent it; and `fix_check` holding why the fix removes the cause and where every name the fix uses is defined. It ends with: "Before a finding goes in, fill every evidence field; a finding you cannot fill, or whose guard you found, you drop. This is a single task. Return your findings when you are done and end; nobody will send you further instructions. If a command may run longer than three minutes, run it in the background and check it with a wait capped at three minutes, again and again, until it finishes; report only once it has."

No verifier and no validator run. You check only that each quoted line is at its location, drop the findings where it is not, and say in the report that one reviewer checked its own findings and no second agent did.

For the second review, on the fixes, hand it only what changed since the first review: `git diff <commit-the-first-review-saw>..HEAD`.

## After the review — the authority split still applies

A finding inside the plan's goal is fixed, not asked. Fix, and log in one line, what is technical or corrects a bug and leaves the application behaving as the plan agreed — making the agreed behavior actually happen counts, as when an alert the plan promised would never fire. Park, with the validated fix as the recommendation, what changes behavior beyond the plan — the business process, output, ordering, defaults, syntax, an operational policy such as a threshold, timing, deployment, configuration, cost — or is large (a new dependency, an API, storage, a rewrite), or reaches outside the run's change. A `design_is_wrong` finding takes the same test. When an installed review skill runs, its own question step does not: its findings come back here. Then re-run the conformance review on the fixes. Do not start another panel on your own: report what was found, fixed, and parked, and ask whether to run a second review on the fixes, with a recommendation sized to the fixes alone — usually fast, on what changed since the first review. A no ends the loop with the parked items under *Pending*.
