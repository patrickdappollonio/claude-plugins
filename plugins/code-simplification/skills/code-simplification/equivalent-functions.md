# Roughly Equivalent Functions

When two or more functions have the **same shape** — the same sequence of
branches and calls, differing only in names, literals, or an argument — they
are one function that was written twice. Signals:

- Same control-flow skeleton (compare the branches, ignore variable names)
- Same external calls in the same order
- Names that differ only by a qualifier: `loadUserConfig` / `loadProjectConfig`,
  `sendEmailAlert` / `sendSmsAlert`, `parseV1` / `parseV2`
- Bug fixes that had to be applied to both

Handle them by proposal, not by reflex:

1. **Diff them.** Write down every real difference. If you find none, or only
   naming and a literal, they are candidates. If the differences are
   behavioral — different error handling, different validation, one mutates
   and one does not — they are *not* equivalent, and the review is over.
2. **Check every caller** of both. Merging changes an API surface; callers must
   be updated in the same change and the tests for both must still pass.
3. **Propose the merge to the user** before doing it — name both functions,
   what would differ in the unified signature (a parameter for the literal
   that varied, or nothing), and the caller count. Merging is the one
   simplification that routinely crosses the requested scope, and a near
   duplicate is sometimes deliberate: two things that look alike today but
   change for different reasons should stay apart.
4. If approved: pin both originals with tests, write the unified function,
   route every caller through it, run the pinning tests unmodified, then
   delete the originals. Two functions that share a body but keep both public
   names as thin wrappers is a valid endpoint when callers are external.

Do **not** merge functions whose similarity is coincidental — two short loops
that happen to look alike but serve unrelated domains gain nothing from a shared
helper with a vague name.
