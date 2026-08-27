# Cyclomatic Complexity

Cyclomatic complexity counts the independent paths through a function. Compute
it by hand when no tool is available: **start at 1, add 1 for each `if`,
`elif`/`else if`, `case`/`when`, loop, `catch`/`except`, ternary, and each
`&&`/`||`/`and`/`or` inside a condition.** Every decision point is a path a test
has to reach, so the number is also a rough count of the tests the function
needs — a function with complexity 25 needs on the order of 25 cases to be
exercised, and almost nobody writes them.

| Complexity | Meaning | Action |
|---|---|---|
| 1–10 | Straightforward | Leave it unless another pattern applies |
| 11–20 | Hard to test fully | Look for a split along decision clusters |
| 21+ | Effectively untestable as one unit | Split — this is not optional |

Use a real tool when the project has one (`radon`, `gocyclo`, `eslint`'s
`complexity` rule, `rubocop`'s `Metrics/CyclomaticComplexity`, `lizard`, …) and
report the number before and after. Otherwise count by hand and say you did.

**How to split without changing behavior:**

1. Find the **decision clusters**: groups of branches that decide one thing —
   a discount tier, a tax rate, a coupon amount, a validation. Each cluster is a
   candidate function with one input set and one output.
2. Extract the cluster as a **pure function** where possible: inputs in,
   value out, no mutation of the caller's state. Pure pieces are the ones that
   become trivially testable.
3. Keep the **orchestration** in the original function: it should read as the
   sequence of decisions, not contain them.
4. Write tests for each extracted piece — this is where the win lands. A
   complexity-25 function with no tests becomes five complexity-5 functions
   with five tests each, and the orchestrator needs only a handful.
5. Re-run the tests that pinned the original function. They must still pass
   unmodified; the split is an implementation detail from their point of view.

Splitting must not become fragmentation: a helper that is called once, has no
name a reader would search for, and just relocates three lines is worse than
the inline code. Every extracted function should be nameable by what it
decides, and testable on its own.

Length matters too, but as a weaker signal than complexity: a 60-line
straight-line function may be fine, and a 20-line function with complexity 15
is not.
