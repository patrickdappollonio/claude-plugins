---
name: code-simplification
description: Use when code works but is harder to read, maintain, or extend than it should be — after a feature lands, when review flags complexity, or when you hit deep nesting, long functions, high cyclomatic complexity, functions too tangled to test, two functions that do nearly the same thing, duplicated logic, dead code, unclear names, or comments that narrate instead of inform — and you want the complexity reduced without changing behavior.
---

# Code Simplification

## Overview

Simplify code by reducing complexity while preserving exact behavior. The goal
is not fewer lines — it's code that is easier to read, understand, modify, and
debug. Every simplification must pass one test: **"Would a new team member
understand this faster than the original?"**

This skill is language-agnostic: it works on patterns (nesting, naming,
duplication, dead code), not on any one language's idioms. Apply it using the
idioms of whatever language and codebase you're in.

## Read the Companion Files First

This skill ships in two layers. `SKILL.md` carries the rules and a short
summary of each step; four files beside it carry the full procedures:

- `evidence-gathering.md` — model-tier routing, handoff packets, verifying findings
- `cyclomatic-complexity.md` — counting, tools, the split procedure
- `equivalent-functions.md` — diff → callers → propose → merge
- `comments.md` — the comment digest

**The first time you use this skill in a session, read all four before doing
anything else** — before scoping, before reading the target code, before
answering a question about it. The summaries in this file are reminders for a
reader who has already seen the full text; they are not a substitute for it.
Re-read the relevant file again at the step that names it. If the files are
missing, say so — do not proceed as if the summaries were the whole skill.

## When to Use

- After a feature is working and tests pass, but the implementation feels heavier than it needs to be
- During code review when readability or complexity issues are flagged
- When you encounter deeply nested logic, long functions, or unclear names
- When refactoring code written under time pressure
- After merging changes that introduced duplication or inconsistency

**When NOT to use:**

- Code is already clean and readable — don't simplify for the sake of it
- You don't understand what the code does yet — comprehend before you simplify
- The code is performance-critical and the "simpler" version would be measurably slower
- The module is about to be rewritten — simplifying throwaway code wastes effort

## Determine the Scope First

Default to **recently modified code**: the current session's edits, the working
diff (`git diff HEAD`), or the current branch's changes. Only widen the scope
when the user explicitly names a file, module, or the whole codebase.
Unscoped simplification creates noisy diffs and risks regressions in code
nobody asked you to touch.

## The Five Principles

### 1. Preserve Behavior Exactly

Don't change what the code does — only how it expresses it. All inputs,
outputs, side effects, error behavior, ordering, and edge cases must remain
identical. If you're not sure a simplification preserves behavior, don't make it.

```
ASK BEFORE EVERY CHANGE:
→ Does this produce the same output for every input?
→ Does this maintain the same error behavior?
→ Does this preserve the same side effects and ordering?
→ Do all existing tests still pass without modification?
→ Is there a test, written BEFORE the change, that would fail if the answer to any of these were "no"?
```

"Semantically equivalent" is a claim, and a claim is proven by a test that
existed before the edit and still passes after it — see *Prove Equivalence With
a Test That Predates the Change*. Reasoning about equivalence, however careful,
is not proof.

### 2. Follow Project Conventions

Simplification means making code more consistent with **this** codebase, not
imposing external preferences. Before simplifying, read the project's
instructions file (CLAUDE.md, AGENTS.md, CONTRIBUTING, style guides) and study
how neighboring code handles similar patterns — imports, declaration style,
naming, error handling, type/annotation depth. Match them, even where you'd
personally write it differently.

Simplification that breaks project consistency is not simplification — it's churn.

### 3. Prefer Clarity Over Cleverness

Explicit code beats compact code whenever the compact version requires a mental
pause to parse. A five-line conditional a reader scans in two seconds is
simpler than a one-line nested ternary they have to decode. Dense chained
one-liners that build a structure in a single expression are usually clearer as
a named intermediate step. When in doubt, write the boring version.

### 4. Maintain Balance

Simplification has a failure mode: over-simplification. Watch for these traps:

- **Inlining too aggressively** — removing a helper that gave a concept a name makes the call site harder to read
- **Combining unrelated logic** — two simple functions merged into one complex function is not simpler
- **Removing "unnecessary" abstraction** — some abstractions exist for extensibility or testability, not complexity
- **Removing error handling or validation** — cleaner-looking is not a reason; behavior must hold
- **Optimizing for line count** — fewer lines is not the goal; faster comprehension is

### 5. Scope to What Changed

Simplify the code in scope; leave the rest alone. No drive-by refactors, no
"improving" adjacent code, no reformatting files you pass through. Every
changed line should trace back to a simplification you can name.

## The Simplification Process

### Step 1: Understand Before Touching (Chesterton's Fence)

Before changing or removing anything, understand why it exists. If you see a
fence across a road and don't know why it's there, don't tear it down —
first learn the reason, then decide whether the reason still applies.

```
BEFORE SIMPLIFYING, ANSWER:
- What is this code's responsibility?
- What calls it? What does it call?
- What are the edge cases and error paths?
- Are there tests that define the expected behavior?
- Why might it have been written this way? (Performance? Platform constraint? Historical reason?)
- What does git blame / history say about its original context?
```

If you can't answer these, you're not ready to simplify. Read more context first.

### Step 2: Identify Simplification Opportunities

Scan for these patterns — each is a concrete signal, not a vague smell:

**Structural complexity:**

| Pattern | Signal | Simplification |
|---------|--------|----------------|
| Deep nesting (3+ levels) | Hard to follow control flow | Invert conditions into guard clauses / early returns, or extract helpers |
| Long functions (50+ lines) | Multiple responsibilities | Split into focused functions with descriptive names |
| High cyclomatic complexity (>10 decision points) | Too many paths to test one by one | Split along decision clusters — see *Cyclomatic Complexity* |
| Two functions with the same shape | Same branches and calls, different names or literals | Propose a merge — see *Roughly Equivalent Functions* |
| Nested conditionals-in-expressions | Requires a mental stack to parse | Replace with explicit branching or a lookup table |
| Boolean parameter flags | `doThing(true, false, true)` | Replace with named options or separate functions |
| Repeated conditionals | Same check in multiple places | Extract to a well-named predicate |

**Naming and readability:**

| Pattern | Signal | Simplification |
|---------|--------|----------------|
| Generic names | `data`, `result`, `temp`, `val`, `item` | Rename to describe the content: `userProfile`, `validationErrors` |
| Abbreviated names | `usr`, `cfg`, `btn`, `evt` | Use full words unless the abbreviation is universal (`id`, `url`, `api`) |
| Misleading names | A "get" that also mutates state | Rename to reflect actual behavior |
| Comments explaining "what" | `// increment counter` above an increment | Delete the comment — the code says it |
| Comments explaining "why" | `// Retry because the API is flaky under load` | Keep these — they carry intent the code can't express |
| Comments narrating history or a session | "used to", "pass 2", `F7`, "per review" | Rewrite as a present-tense constraint or delete — see *Comments* |
| Comments counting things that live elsewhere | "the 7 tests", "both fields", "the three callers" | Name the set (file, tag, pattern, invariant) so the comment grows with it — see *Comments* |

**Redundancy:**

| Pattern | Signal | Simplification |
|---------|--------|----------------|
| Duplicated logic | Same 5+ lines in multiple places | Extract to a shared function |
| Dead code | Unreachable branches, unused variables, commented-out blocks | Remove (after confirming it's truly dead) |
| Unnecessary wrappers | A layer that adds no value over what it wraps | Inline it; call the underlying thing directly |
| Over-engineered patterns | Factory-for-a-factory, strategy-with-one-strategy, config nobody sets | Replace with the simple direct approach |
| Manual re-implementation | Hand-rolled loop/branching for something the language or stdlib does idiomatically | Use the idiom the codebase already uses elsewhere |

### Step 3: Apply Changes Incrementally

Make **one simplification at a time** and run the tests after each change.
Never batch several simplifications into a single untested edit — when
something breaks, you need to know which change caused it. "Extracted four
helpers" is four changes, not one.

```
FOR EACH SIMPLIFICATION:
1. Confirm a test pins the behavior you are about to reshape (write one first if not — see below)
2. Run it: it must pass on the ORIGINAL code
3. Make the change
4. Run the test suite
5. Tests pass → keep it, move to the next
6. Tests fail → revert and reconsider (do NOT modify the tests to make them pass)
```

**Keep refactoring separate from feature work.** A change that refactors and
adds a feature is two changes — split them into separate commits or PRs.

**The Rule of 500:** if a refactoring would touch more than ~500 lines, invest
in automation (codemods, structured search-and-replace, AST transforms) instead
of hand-editing. Manual edits at that scale are error-prone and exhausting to review.

### Step 4: Verify the Result

After the pass, step back and evaluate the whole:

```
COMPARE BEFORE AND AFTER:
- Is the simplified version genuinely easier to understand?
- Did you introduce any pattern inconsistent with the codebase?
- Is the diff clean and reviewable, with nothing unrelated mixed in?
- Would a teammate approve this change as a net improvement?
```

If the "simplified" version is harder to understand or review, revert it. Not
every simplification attempt succeeds, and reverting is a valid outcome.

## Gathering the Evidence

Finding (which functions are complex, which pairs share a shape, who calls
what) is cheap work; comprehending (why, and whether a change is safe) is
expensive work. Route them differently:

- **Ask the user once** how many subagents may run in parallel and which model
  tiers are available, before fanning out. Their tokens, their machine.
- **Cheap tiers find, premium tiers decide.** Pattern finding goes to Haiku,
  Sonnet, or Luna; equivalence judgment, the change itself, and verification
  stay on Opus, Fable, Sol, or Terra (medium–max). On a single-model harness,
  find with `grep`/`rg` and the project's complexity tool instead of reading.
- **Verify every finding yourself.** A subagent's report is a lead, not a
  fact: open the location, recount the number, re-diff the pair, re-run the
  test. A finding you have not reproduced is a hypothesis.

**Read `evidence-gathering.md` before spawning any subagent** — it has the
routing table, the handoff-packet template, and the stop conditions.

## Prove Equivalence With a Test That Predates the Change

Every change this skill makes — a renamed variable, a flattened conditional, a
split function, a merged pair — must be semantically equivalent to what it
replaced. The only accepted proof is **TDD applied to refactoring**:

```
1. Before touching the code, write (or locate) tests that pin its CURRENT behavior:
   the normal cases, every branch you can reach, the error paths, and the edge cases
   (empty input, zero, missing keys, malformed data).
2. Run them against the ORIGINAL code. They must pass. A test that fails here is
   describing behavior the code does not have — fix the test, not the code.
3. Make the simplification.
4. Run the same tests, unmodified. They must still pass.
```

A test that passes before and after is the evidence. A test written *after* the
change proves only that the new code does what the new code does.

**If the repository has no tests — or none cover the code in scope — stop and
ask the user before creating any.** Adding a test file, a test framework, or a
test dependency is a decision about their project, not yours. Ask once, with
the specifics: which functions you want to pin, what framework you would use,
and what the tests would live under. The simplification waits for the answer —
do not make the change first and ask afterwards, and do not treat silence as a
decline. Deadline pressure, "keep it moving", and
"it's a small change" do not waive this — a missing test is exactly when a
refactor silently changes behavior.

If the user declines tests, say plainly that the change is unproven, use a
throwaway differential check (old function vs. new function over the same
inputs) as the best remaining evidence, report what it covered, and keep the
change mechanical. Do not present a deleted script as proof: it guards nothing
once it is gone, and the next person who edits the function inherits none of it.

**What the pinning tests are not:** they are not a rewrite of the test suite,
not a coverage project, and not a place to fix behavior you dislike. A
characterization test records what the code does today — including the odd
edge case — because today's behavior is what "equivalent" means.

## Cyclomatic Complexity

Count the independent paths: **1, plus 1 for each `if`, `elif`/`else if`,
`case`, loop, `catch`, ternary, and `&&`/`||` inside a condition.** The
number is roughly how many tests the function needs, which is why high values
go untested.

| Complexity | Meaning | Action |
|---|---|---|
| 1–10 | Straightforward | Leave it unless another pattern applies |
| 11–20 | Hard to test fully | Look for a split along decision clusters |
| 21+ | Effectively untestable as one unit | Split — this is not optional |

Report the number before and after. Split along *decision clusters* into pure,
individually testable functions, and never into once-called helpers that just
relocate lines. **Read `cyclomatic-complexity.md` before splitting a
function** — it has the tools per ecosystem, the split procedure, and the
fragmentation trap.

## Roughly Equivalent Functions

Two functions with the same control-flow skeleton and the same calls,
differing only in names or literals, were written twice. A merge is a
**proposal to the user, never a reflex**: diff them line by line, count the
callers of both, then propose the unified signature and wait. Behavioral
differences — error handling, validation, mutation — end the review; they are
not equivalent. **Read `equivalent-functions.md` before proposing a merge.**

## Comments

Comments on touched lines are in scope. The rule: **a comment earns its place
by carrying information the code does not, about the code as it is now, in as
few lines as that takes.** Cover it with your hand — if the code is no poorer,
delete it. Present tense, not history; two lines above a declaration; no
session-scoped identifiers (finding numbers, pass labels, task IDs, phase
names); no counts of things that live elsewhere ("the 7 tests", "both
fields") — name the set so the comment grows with it; verify anything a
comment names. **Read `comments.md` before writing or
rewriting a comment.** The standalone `appropriate-comments-code` skill is the
full treatment.

## Core Pattern Example

The single most portable simplification — flattening nested conditionals into
guard clauses. The shape is identical in every language:

```python
# Before: the happy path is buried three levels deep
def process(data):
    if data is not None:
        if data.is_valid():
            if data.has_permission():
                return do_work(data)
            else:
                raise PermissionError("No permission")
        else:
            raise ValueError("Invalid data")
    else:
        raise TypeError("Data is None")

# After: reject early, then the happy path reads top-to-bottom
def process(data):
    if data is None:
        raise TypeError("Data is None")
    if not data.is_valid():
        raise ValueError("Invalid data")
    if not data.has_permission():
        raise PermissionError("No permission")
    return do_work(data)
```

Same errors, same behavior, same edge cases — only the shape changed.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It's working, no need to touch it" | Working code that's hard to read will be hard to fix when it breaks. Simplifying now saves time on every future change. |
| "Fewer lines is always simpler" | A one-line nested conditional is not simpler than a five-line explicit branch. Simplicity is comprehension speed, not line count. |
| "I'll just quickly simplify this unrelated code too" | Unscoped simplification creates noisy diffs and risks regressions in code you didn't intend to change. Stay focused. |
| "The types make it self-documenting" | Types document structure, not intent. A well-named function explains *why* better than a signature explains *what*. |
| "This abstraction might be useful later" | Speculative abstraction is complexity without value. Remove it; re-add it when a second use actually appears. |
| "The original author must have had a reason" | Maybe — check the history (Chesterton's Fence). But complexity is often just the residue of iteration under pressure. |
| "I'll refactor while adding this feature" | Mixed changes are harder to review, revert, and understand in history. Separate them. |
| "The tests need a small tweak to pass" | Tests failing means you changed behavior. Revert the simplification, don't bend the tests. |
| "There are no tests and we ship tomorrow, so I'll just be careful" | Careful is not proof. Ask the user for permission to add pinning tests; if they decline, say the change is unproven. Pressure is when refactors break things. |
| "I verified it with a throwaway script, then cleaned up" | A deleted check guards nothing. The next edit to that function has no test. Either the tests stay, or the report says the change is unpinned. |
| "I split it into helpers, so it's simpler" | Only if each helper decides one nameable thing and has its own tests. Relocating lines into once-called helpers with vague names is fragmentation. |
| "Those two functions are basically the same, I'll merge them while I'm here" | Merging crosses scope and changes an API surface. Diff them, count callers, propose it. A near-duplicate is sometimes two things that change for different reasons. |
| "Complexity is subjective" | It is a count. Count the decision points, report the number before and after. |
| "The subagent already checked it" | A finder's report is a lead. Open the location, recount, re-diff, re-run — then act. |
| "I'll spin up a dozen agents, it's faster" | Faster for you, paid by the user. Ask how much parallelism they want, and use cheap tiers for finding. |
| "The summary in SKILL.md is enough, I'll skip the companion file" | The summary is a reminder of text you are supposed to have read. Read the four files on first use, and the named one again at its step. |
| "Reading the whole module is more thorough than grepping" | For finding, grep is thorough and cheap. Read whole files for meaning, not for locating. |
| "The comment explains the history of this fix" | The reader sees today's code. State the constraint in the present tense; the story goes in the commit message. |
| "The count is accurate, I just checked" | Accurate today; nothing re-checks it when the next one lands. Name the set instead. |

## Red Flags — Stop and Reassess

- A simplification requires modifying tests to pass (you likely changed behavior)
- The "simplified" code is longer and harder to follow than the original
- You're renaming things to match your preferences rather than project conventions
- You're removing error handling or validation because "it makes the code cleaner"
- You're simplifying code you don't fully understand
- You're batching many simplifications into one large, hard-to-review change
- You're touching code outside the requested scope without being asked
- You started scoping or reading code before reading the four companion files this session
- You are about to change a function that no test covers and you have not asked about adding one
- You are creating tests in a repo that has none without asking
- Your proof of equivalence is a script you intend to delete
- You are merging two functions you have not diffed line by line, or without checking their callers
- A function's complexity went *up* in a helper you extracted (you moved the tangle, not untangled it)
- A comment you wrote says "used to", "per review", names a finding or pass number, or is longer than two lines above a declaration
- A comment you wrote or kept counts tests, callers, fields, or cases that live elsewhere ("the 7 tests", "both", "all three")
- You are about to edit on the strength of a subagent's finding you have not opened and confirmed yourself
- You fanned out subagents without asking the user how many, or used a premium model to grep

## Verification Checklist

After completing a simplification pass:

- [ ] All four companion files were read on first use this session, and the relevant one re-read at its step
- [ ] All existing tests pass **without modification**
- [ ] Every reshaped function is pinned by a test that existed **before** the change and passes after it
- [ ] If the repo had no tests, the user was asked before any were created; if they declined, the report says the change is unproven and what the differential check covered
- [ ] Cyclomatic complexity was reported before and after for any function you split, and no extracted helper is more complex than the piece it replaced
- [ ] Each extracted helper decides one nameable thing and has its own tests
- [ ] Any function merge was proposed with the diff and caller count before being made, and every caller was updated
- [ ] Every finding that became a change was reproduced by the model running this skill — location opened, numbers recounted, pairs re-diffed, tests re-run
- [ ] Subagent fan-out and model tiers matched what the user agreed to; finding went to cheap models or grep, judgment to premium
- [ ] Comments on touched lines survive the cover test, are present-tense, fit in two lines above a declaration, cite nothing session-scoped, and count nothing that lives elsewhere
- [ ] Build succeeds with no new warnings; linter/formatter passes
- [ ] Each simplification was applied and tested as its own incremental change
- [ ] The diff is clean — no unrelated changes mixed in
- [ ] Simplified code follows project conventions (checked against the project's instructions file and neighboring code)
- [ ] No error handling was removed or weakened
- [ ] No dead code was left behind (unused imports, unreachable branches, orphaned helpers)
- [ ] A teammate reviewing the diff would call it a net improvement
