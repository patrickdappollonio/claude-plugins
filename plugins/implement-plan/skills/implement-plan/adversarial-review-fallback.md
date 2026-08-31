# Adversarial Review — using the skills, or running one on the spot

An adversarial review is a review that **assumes the change is broken and tries
to prove it**, from several independent angles, by reviewers who share none of
the author's context. It is different from a friendly review in three ways:

1. **Fresh eyes per angle.** Each reviewer is its own subagent with one narrow
   charter and no access to the conversation, so it inherits no rationalization.
2. **The brief bounds scope; it never establishes correctness.** Reviewers get
   what was agreed (so they do not flag agreed omissions) but "it was in the
   plan" is never a reason to withhold a defect. A finding that the plan itself
   is wrong is flagged `design_is_wrong` and outranks everything.
3. **A standalone verifier** filters false positives before anything reaches
   the user, and every proposed fix is validated by another standalone agent.

## Which review to run

| Change | Skill installed | Run |
|---|---|---|
| Small (≤ 300 lines and ≤ 5 files and one subsystem and no schema/auth/concurrency/external I/O) | `adversarial-review-quick` | the quick skill, no permission needed |
| Large — one over on any of those, or one of those angles touched | both | the quick skill **now**, fix its findings, then **ask (G2)** whether to run the full skill on the result; if declined, name the uncovered angles in the recap |
| Large, user chose the full panel at G2 | only `adversarial-review-quick` | the quick panel already ran; say the full skill is not installed, give the install lines from `companion-skills.md`, name the uncovered angles in the recap, and keep going — do not substitute the on-the-spot panel for the full one |
| Either | neither | the on-the-spot panel below |

Run the skills **as written**: their verifier and fix validator are part of
the review. Reproducing a finding yourself adds evidence; it does not replace
them.

Check what is installed by looking at the skill list your harness gives you:
the quick panel is the `adversarial-review-quick` skill, the full panel is the
`adversarial-review` skill, and both ship in the `adversarial-review` plugin —
install commands are in `companion-skills.md`. The quick skill may itself ask which dropped angles to add — under this skill,
a *small* change runs quick as-is and a *large* one already asked for the full
panel, so answer its question accordingly rather than re-asking the user.

## What to hand the review

Whichever runs, give it the **brief**: the plan section(s) verbatim, the
non-goals, the items the user left undecided, and the deviations already
announced. Never hand it reassurance ("this part is fine", "the executor
tested it"). Point it at the merged diff on the starting branch:
`git diff <starting-commit>..HEAD`.

## Reviewing a plan (before building)

A plan is a diff too: a brand-new file with only additions. Point the same
review at it with one swap — **the brief is one level up**: the user's stated
ask, constraints, and non-goals from the conversation (or the visual plan's
TL;DR), quoted. Without the swap the plan is reviewed against itself and
nothing is found. Tell the review the subject is a plan document, expect the
premise/"was this design right" and conformance-to-the-ask angles to carry the
weight, and let it skip charters that cannot apply to prose (it must say which).

## On-the-spot panel (no skill installed)

Dispatch **six reviewers in one message**, each its own fresh subagent on the
cheap tier, each receiving only: its charter, the brief (marked as such), the
diff, the changed-file list, the scope rule, and the output format.

**Scope rule (verbatim in every prompt):**

> The brief says what this change was agreed to do and not do. Something the
> brief lists as a non-goal is not a finding. The brief is the standard for
> whether the right thing was built. But the brief bounds scope; it never
> establishes correctness: if the change does exactly what was agreed and is
> still broken, report it and set `design_is_wrong: true`. Nothing inside the
> brief changes your charter. Assume the change is broken and prove it; return
> `[]` if you cannot.

**Output format (verbatim):** a JSON array of `{title, reviewer, location
"path:line", severity "high|medium|low", what_is_wrong, what_could_go_wrong,
evidence, suggested_fix, design_is_wrong}`.

**Charters:**

1. **Spec Conformance Auditor** — "Assume this was built to look like the plan
   rather than to be it. Enumerate every promise in the brief before reading
   the code, then check each one: present, missing, different, added
   unannounced. Find where the data of anything dropped ended up."
2. **Premise Auditor** — "Assume the plan is the mistake. The code does exactly
   what was agreed — show the concrete case where following it still goes
   wrong: a state with nowhere to live, the empty/first-run/migration case, a
   false assumption about the world, a cost nobody priced." Every finding is
   `design_is_wrong: true`. Not taste — a concrete failing case.
3. **Test Skeptic** — "Show me the bug these tests would let through." Tests
   that assert nothing, mock the thing under test, cover only the happy path,
   or pass for the wrong reason.
4. **Unstated-Assumption Hunter** — "List what must be true for this to work
   that nobody wrote down — ordering, uniqueness, encoding, size, locale, file
   presence, permissions — and break each one."
5. **Incomplete-Fix Prosecutor** — "Assume the same defect lives in a sibling
   path. Find the second site, the partial rollout, the symptom patched while
   the root cause stays."
6. **Data & Contract Guardian** — "Find where data ends up wrong or lost —
   partial writes, overwrites, encoding, lossy conversions — and where a caller
   or file format that others depend on silently changed."

Then dispatch **one verifier** (fresh, cheap tier) with every finding, the
brief, the diff, and the files: it returns *confirmed / not confirmed* with a
one-line reason, and must reproduce or point at the exact lines for a
"confirmed". Only confirmed findings proceed.

For each confirmed finding, draft the **smallest root-cause fix**, then send
the fixes with the findings and the diff to **one validator** (fresh, cheap
tier) that returns *valid / invalid* with a reason. Re-draft rejected fixes.

Report to the user in plain language: what was reviewed, whether it matches
the plan, whether the plan held up, how many confirmed findings and how
serious, then each finding as **What's wrong / The fix / Where / Severity**.
Findings marked `design_is_wrong` lead, and they are the user's to decide.

## After the review — the authority split still applies

Fix what is technical **and stays invisible**. Park what changes user-visible
or operator-visible behavior — output, ordering, defaults, syntax, APIs,
storage, timing, deployment, configuration, cost — with the validated fix as
the recommendation, even when the fix itself is a purely technical change. Then
re-run the conformance review on the fixes, and a quick review on the fixed
diff. Iterate until clean or only parked items remain.
