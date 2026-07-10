---
name: code-simplification
description: Use when code works but is harder to read, maintain, or extend than it should be — after a feature lands, when review flags complexity, or when you hit deep nesting, long functions, duplicated logic, dead code, or unclear names — and you want the complexity reduced without changing behavior.
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
```

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
something breaks, you need to know which change caused it.

```
FOR EACH SIMPLIFICATION:
1. Make the change
2. Run the test suite
3. Tests pass → keep it, move to the next
4. Tests fail → revert and reconsider (do NOT modify the tests to make them pass)
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

## Red Flags — Stop and Reassess

- A simplification requires modifying tests to pass (you likely changed behavior)
- The "simplified" code is longer and harder to follow than the original
- You're renaming things to match your preferences rather than project conventions
- You're removing error handling or validation because "it makes the code cleaner"
- You're simplifying code you don't fully understand
- You're batching many simplifications into one large, hard-to-review change
- You're touching code outside the requested scope without being asked

## Verification Checklist

After completing a simplification pass:

- [ ] All existing tests pass **without modification**
- [ ] Build succeeds with no new warnings; linter/formatter passes
- [ ] Each simplification was applied and tested as its own incremental change
- [ ] The diff is clean — no unrelated changes mixed in
- [ ] Simplified code follows project conventions (checked against the project's instructions file and neighboring code)
- [ ] No error handling was removed or weakened
- [ ] No dead code was left behind (unused imports, unreachable branches, orphaned helpers)
- [ ] A teammate reviewing the diff would call it a net improvement
