# Appropriate Comments in Code

Comment discipline for code an agent writes. One rule, applied every time a
comment is written or touched:

> **Every comment carries information the code does not, and describes the
> current state only. No iteration labels, finding numbers, wave or task IDs, or
> "how we got here" narrative.**

The audience is a developer months from now who was not in the session, did not
read the pull request, does not know what was tried first, and cannot ask. If a
sentence only makes sense to someone who watched the code being written, it does
not belong in the code.

## The three tenets

- **Describe the present, not the journey.** `// We used to buffer the whole
  response but it blew up memory, so now we stream it` describes an edit, not the
  code. State the standing constraint instead — it stays true, and it survives
  the next person's change.
- **A comment must earn its place.** `// Opens the DB connection` above
  `connection.open()` costs the reader time and gives them nothing. Cover the
  comment with your hand: if the code is no poorer, delete it.
- **Never commit an identifier that outlives nothing.** Finding numbers (`F7`),
  iteration labels ("pass 2"), wave/batch/task IDs, agent run labels, checklist
  positions — all meaningless to every reader but the one driving that session,
  and meaningless to them within a day. Tracker IDs (JIRA, Linear, Notion) only
  if the repo already uses them, or you ask first.

## A regression is documented by a test

`// don't remove this check, it caused a double-charge` is an honour-system
guardrail: nothing fails when someone removes the check. A test does. The skill
routes context to where it stays true rather than deleting it:

| Context | Its home |
|---|---|
| A bug that must never come back | A test named after the invariant |
| Why this approach over the one it replaced | The commit message / PR description |
| A finding from a review pass | The review thread |
| Planned follow-up work | The issue tracker |
| Alternatives considered and rejected | A design doc or ADR |
| A standing constraint the code must respect | A comment — this is what comments are for |

## Installing

Add the marketplace, then install the plugin:

```
/plugin marketplace add patrickdappollonio/claude-plugins
/plugin install appropriate-comments-code@patrickdappollonio
```

## Running it

It is written to load itself whenever the agent is about to write code or touch
a comment, so most of the time you do nothing. To invoke it deliberately:

```
/appropriate-comments-code:appropriate-comments-code
```

Or ask for it in passing: *"Clean up the comments in what we just wrote."*

## Notes

- **Language-agnostic.** It works on what a comment says, not on any one
  language's comment syntax or doc convention. It follows whatever the project
  already uses.
- **It does not say write fewer comments.** Constraints from outside the code,
  invariants callers must uphold, units and ownership, workarounds for upstream
  bugs, and public API docs all earn their place — the skill lists what to write,
  not just what to cut.
- **Comments are part of the code you edit.** After changing a line, the skill
  re-reads the comments around it; a comment that was right before the edit and
  wrong after is worse than none.
- **It steps aside for annotated code.** If you asked for tutorial or teaching
  code where narrating every line *is* the deliverable, the skill says so and
  gets out of the way.
