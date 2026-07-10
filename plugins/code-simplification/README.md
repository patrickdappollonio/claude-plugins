# Code Simplification

A **language-agnostic** skill that reduces code complexity while preserving
exact behavior. The goal is not fewer lines — it's code that is easier to read,
understand, modify, and debug. Every change must pass one test: *would a new
team member understand this faster than the original?*

It works on patterns, not on any one language's idioms:

- **Structural complexity** — deep nesting flattened into guard clauses, long
  functions split, boolean flags replaced with named options
- **Naming and readability** — generic/abbreviated/misleading names renamed,
  "what" comments deleted, "why" comments kept
- **Redundancy** — duplicated logic extracted, dead code removed, valueless
  wrappers inlined, over-engineered patterns replaced with the direct approach

And it's disciplined about *how*, not just *what*:

- **Behavior is preserved exactly** — if the tests need "a small tweak" to
  pass, the simplification changed behavior and gets reverted, not the tests.
- **Chesterton's Fence** — nothing is changed or removed before understanding
  why it exists (including checking git history).
- **One change at a time** — each simplification is applied and tested
  individually, so a failure points at exactly one edit.
- **Scoped by default** — it targets recently modified code unless you
  explicitly widen the scope; no drive-by refactors of unrelated files.
- **Balanced** — it also guards against *over*-simplification: aggressive
  inlining, merging unrelated logic, or stripping abstractions that exist for
  testability or extensibility.

## Inspiration

This skill combines ideas from three sources into one language-agnostic
process:

- [Anthropic's code-simplifier plugin](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/code-simplifier/agents/code-simplifier.md)
- [Addy Osmani's code-simplification skill](https://github.com/addyosmani/agent-skills/blob/main/skills/code-simplification/SKILL.md)
- [Happycapy's code-simplification skill](https://happycapy.ai/skills/code-simplification)

## Installing

Add the marketplace, then install the plugin:

```
/plugin marketplace add patrickdappollonio/claude-plugins
/plugin install code-simplification@patrickdappollonio
```

## Running it

Ask your agent to simplify code when something works but reads heavier than it
should:

```
Simplify what we just wrote using the code simplification skill.
```

Or invoke it explicitly with the slash command:

```
/code-simplification:code-simplification
```

By default it scopes itself to recently modified code (your session's edits or
the working diff). Name a file, module, or the whole codebase to widen it.

## Notes

- **It refuses some work on purpose.** Already-clean code, code it doesn't yet
  understand, performance-critical hot paths, and soon-to-be-rewritten modules
  are all reasons to stop, not simplify harder.
- **Refactors stay separate from features.** It won't fold simplification into
  a feature change — those are two diffs.
- **Big sweeps get automated.** Refactors touching more than ~500 lines call
  for codemods or AST transforms, not hand edits.
