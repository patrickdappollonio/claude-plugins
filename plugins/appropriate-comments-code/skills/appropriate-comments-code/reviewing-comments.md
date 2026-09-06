# Reviewing and auditing comments

The full procedures for verifying what a comment claims, fixing code before
commenting it, reviewing comments in a diff, and auditing comments in bulk.
`SKILL.md` carries the summaries; this file is the procedure. Read it before
reviewing a diff or sweeping a package.

## Reviewing comments: flag, rewrite, or delete

When reviewing a diff — yours or another agent's — treat every added or changed
comment as a finding until it passes. A comment in a test file is judged only
under the relaxed test-file rules in `SKILL.md`: session-scoped identifiers and
restatements are findings, length and history are not. For each one:

1. **Classify** it with one label: `restates` (fails the cover test), `narrates`
   (past tense, journey, process), `documents` (true, but too long or about the
   feature rather than the line), `unverified` (names something you have not
   confirmed), `counts` (a tally of things that live elsewhere), `stale` (no longer matches the code beside it).
2. **Rewrite or delete — never keep as-is.** A flagged comment has exactly two
   exits. Rewrite when there is one mechanical fact about *these lines* the
   reader cannot get from the code — most often, why the line differs from its
   neighbours. Delete when there is not. "Shorten it a bit" is not an option: a
   trimmed comment on the wrong subject is still on the wrong subject.
3. **Relocate, don't discard.** If the deleted text was accurate documentation,
   say where it goes (package doc, API doc, PR description) in the review, and
   put it there if that is in scope.
4. **Report it as a defect**, in the same list as the code findings, with the
   label and the replacement text. A comment on the wrong subject is not a nit.

## Doing this at scale

Auditing comments across a codebase, or across a large change, has failure modes
of its own.

**Measure the ratio after the pass.** Run the normal pass on each file in
scope, then count that file's comment lines against its code lines as
`SKILL.md`'s ratio check describes, over the whole file when auditing. A file still at half or more is a document with code in it: report
it to the user with what its comments say and ask whether that material moves
to a doc, rather than cutting further.

**Cut in order of length.** A ten-line block is worth more attention than a
three-line one; trimming three lines to two is churn that risks a fact for almost
no gain. Sort the work by size and start at the top.

**A shorter comment that lost a rule is a regression, not progress.** The
dangerous edit is not the one that keeps too much — it is the one that reads
beautifully and quietly drops "callers must hold the lock". When compressing:
- Compress the prose *around* a rule; never the rule.
- If a block states two independent facts, two lines is often the honest floor.
  Do not merge two rules into one sentence that states one.
- After the pass, re-read the diff asking only: *what did the old text assert
  that the new text does not, and does anything depend on it?*

**Do not record why you kept something.** A note explaining that a comment was
left long, or which fact forced it, is a comment about the comment. It belongs in
the review conversation, not in the file — and not in a `KEPT.md` either.

**Skip test files by default.** A sweep leaves existing test-file comments
alone; they are the home of a test's history. Say that you skipped them. Review
them only when the user explicitly asks, and then under the relaxed test-file
rules in `SKILL.md`: session-scoped identifiers and restatements go, length and
history stay.

**Do not touch comments outside the change you are making.** The rule against
improving adjacent code applies to comments. A cleanup that rewrites a hundred
comments nobody asked about buries the change reviewers came to read. If the
codebase needs a sweep, make it its own change and say so.

**Verify mechanically, not by reading the report.** If you delegate this work,
check the result: that no functional directive was removed (`//nolint`,
`//go:build`, `//go:generate`, pragma comments — these are *code*), that no
non-comment line changed, and that generated files were regenerated rather than
hand-edited.

## Verify what the comment claims

A comment can be confidently, fluently wrong. Before you write or keep one that
names something, confirm the something exists:

- **An identifier** — a function, method, type, constant, table, index, env var.
  Grep for it. A comment naming a method that was renamed, or never existed, is
  worse than silence: the reader trusts it and goes looking.
- **A file or document path** — does it still resolve?
- **A test** — a comment saying "pinned by TestFoo" is an assertion about the
  suite. If `TestFoo` is gone, the comment now promises a guarantee nobody has.
- **A numeric claim** — "the ceiling is four attempts" is checkable. Check it.
  And if the number is a tally of things elsewhere rather than a value in
  this code, it fails tenet 6 regardless of whether it is currently right.

This is not paranoia; it is the failure mode long comments have. Nobody reads
twenty lines closely enough to notice that one names a function that does not
exist. Length and inaccuracy are the same problem wearing two hats.

## Fix the code before you comment it

A comment is the second-best tool for making code clear. Reach for the first
one — a name, a smaller function, a constant — before writing prose.

- **A comment does not excuse unclear code.** `// n is the retry count` above
  `n := 3` is a request to rename `n` to `retryCount`. `// convert to cents`
  above `x * 100` is a request for a `toCents` helper or a named constant. If
  the comment names what the code should have been called, rename instead.
- **If you cannot write a clear comment, the code is the problem.** When you
  cannot say in two lines why a block exists or what it guarantees, that is not
  a reason to write ten lines — it is a sign the block needs splitting, renaming,
  or rethinking. Fix that, then see whether a comment is still needed.
- **A cryptic comment is worse than none.** "Magic, do not touch", "you are not
  expected to understand this", a bare `// XXX` — these announce confusion
  without dispelling it. Either state the actual invariant or delete the note.

Two comment kinds the article-style advice gets right and this skill endorses,
with the conventions that keep them from rotting:

- **Copied code links its source.** Code lifted from a Stack Overflow answer, a
  blog post, or another repository carries a one-line comment with the URL.
  Readers can reach the original context, licence, and later corrections; you
  cannot reproduce those in prose.
- **Incomplete work is marked, not implied.** A known gap gets a `TODO` in the
  form the project already uses (grep for `TODO` / `FIXME` first — some repos
  require a tracker link, some an owner). State *what* is missing in the
  present tense: `// TODO: handle 429 by honouring Retry-After`, never
  `// TODO: fix later` or `// TODO from review`.

**Bug fixes and tenet 2, reconciled.** Conventional advice says "add a comment
when you fix a bug". This skill says the same thing narrowly: comment the
*workaround* — the external defect, its link, and its exit condition — because
that is a standing constraint. Do not comment the *incident*: what broke, who
found it, what you tried. The regression itself is pinned by a test.

