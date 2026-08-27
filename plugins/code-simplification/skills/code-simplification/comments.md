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
  decision table or state machine the comment *is*.
- **No session-scoped identifiers.** Finding numbers (`F7`), iteration labels
  ("pass 2"), wave/batch/task IDs, project phase names ("until stage 3"), agent
  or review run labels. They meant something for one session and nothing after.
  Tracker IDs (JIRA, Linear, GitHub) only if the repo already uses them.
- **Verify what a comment names.** A function, file, test, or number a comment
  cites must exist and be correct — grep for it.
- **You own the comments on lines you touch.** After a split or merge, re-read
  the comments above and inside the affected code; the one that described *one*
  helper now describes *two*, and the one that explained the tangle you removed
  is now describing nothing.

Only touch comments in scope. A comment sweep across the codebase is its own
change.
