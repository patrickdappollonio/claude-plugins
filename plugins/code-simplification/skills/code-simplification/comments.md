# Comments

Simplifying code includes the comments attached to it. Apply the same rule
throughout: **a comment earns its place by carrying information the code does
not, about the code as it is now, in as few lines as that takes.** The full
`appropriate-comments-code` skill covers this in depth; the short form:

- **Cover test.** Hide the comment and read the code. Lost nothing? Delete it.
  `// open the connection` above `connection.open()` fails this every time.
- **Present tense, not the journey.** "We used to buffer the whole response,
  but that blew memory, so now we stream" narrates an edit. Rewrite it as the
  standing constraint: "Streams because payloads are unbounded; the caller must
  close the reader." A regression is pinned by a test named after the invariant,
  not by a "don't remove this" comment.
- **Two lines above a declaration.** More than that is documentation and belongs
  in a doc, a package comment, or the commit message. The exception is a
  decision table, state machine, or one-rule-per-line list the comment *is*,
  and bullets do not make it one: a row is a condition and its outcome and
  then it ends (anything after the outcome is a gloss: a dash or parenthesis
  opening an explanation, a clause starting with "because", "since", "so
  that", "which", or "unlike", a second sentence; one glossed row makes the
  block prose), and a row whose condition and outcome both sit in the body below is
  the body restated (a table whose every row matches is deleted). A rule is a
  caller obligation or a guarantee; rationale, precedent, a comparison with no
  neighbour in the file, and the body restated are not rules and go first. A
  prose comment still over four lines is shown to the user with a candidate
  home, never kept under an exemption claim. List every comment of three or
  more lines in the change as a whole comment, meaning the contiguous run of
  comment lines, with shape, both counts, and verdict; appending a note to a
  block makes the run yours, whatever the task asked you to add, and the
  verdict is carried out in the file, never only reported.
- **A doc comment on a published item is documentation.** Where the
  language's doc generator renders it (Rust `///`, a docstring, Javadoc, a Go
  exported identifier), keep a two-line summary plus the convention sections
  that each state a contract, and cut rationale and the body restated as from
  any comment. The marker is not the exemption: `///` on a private function
  is a comment under the two-line limit.
- **Name nothing the body already uses.** Every identifier in a comment is
  a rename away from wrong. Keep the lock to hold, the neighbour differed
  from, and things in other files; drop the fields the body reads and the
  helpers it calls.
- **No session-scoped identifiers.** Finding numbers (`F7`), iteration labels
  ("pass 2"), wave/batch/task IDs, project phase names ("until stage 3"), agent
  or review run labels. They meant something for one session and nothing after.
  Tracker IDs (JIRA, Linear, GitHub) only if the repo already uses them.
- **Name the set, not its size.** "The 7 tests that cover this", "the 13
  other integration tests", "both fields", "the three callers" are tallies of
  things that live elsewhere: true today, silently wrong after the next
  addition, because nothing recomputes them. Point at the set instead — a
  file, a build tag, a pattern, an invariant — so the comment grows with it.
  A number stays only when it is a constraint this code enforces ("batch
  size must stay under 50; the API rejects larger"), and then it is a named
  constant the comment explains. Simplifying a function that used to be
  three and is now one is exactly when these go stale — check for them.
- **Verify what a comment names.** A function, file, test, or number a comment
  cites must exist and be correct — grep for it.
- **You own the comments on lines you touch.** After a split or merge, re-read
  the comments above and inside the affected code; the one that described *one*
  helper now describes *two*, and the one that explained the tangle you removed
  is now describing nothing.

Only touch comments in scope. A comment sweep across the codebase is its own
change.
