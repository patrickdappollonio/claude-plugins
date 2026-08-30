# Appropriate Comments in Code

Comment discipline for code an agent writes. One rule, applied every time a
comment is written or touched:

> **Every comment carries information the code does not, about the code as it
> is now, in as few lines as that takes. No iteration labels, finding numbers,
> wave or task IDs, counts of things that live elsewhere, or "how we got here"
> narrative.**

The audience is a developer months from now who was not in the session, did not
read the pull request, does not know what was tried first, and cannot ask. If a
sentence only makes sense to someone who watched the code being written, it does
not belong in the code.

## The five tenets

- **Two lines is the working limit.** Above a declaration, aim for one or two
  lines. A comment can be accurate, present-tense and free of every ticket
  number and still be wrong for the spot it occupies: twenty lines above a
  function is documentation, and nobody reads it on the way to the code. The
  exemption is a decision table or a state machine, where the mapping *is* the
  contract and prose cannot replace it.
- **Describe the present, not the journey.** `// We used to buffer the whole
  response but it blew up memory, so now we stream it` describes an edit, not the
  code. State the standing constraint instead — it stays true, and it survives
  the next person's change.
- **A comment must earn its place.** `// Opens the DB connection` above
  `connection.open()` costs the reader time and gives them nothing. Cover the
  comment with your hand: if the code is no poorer, delete it.
- **Never commit an identifier that outlives nothing.** Finding numbers (`F7`),
  iteration labels ("pass 2"), wave/batch/task IDs, project phase names ("until
  stage 3"), agent run labels, checklist positions — all meaningless to every reader but the one driving that session,
  and meaningless to them within a day. Tracker IDs (JIRA, Linear, Notion) only
  if the repo already uses them, or you ask first.
- **Name the set, not its size.** "The 7 tests that cover this", "the 13
  other integration tests", "both fields", "the three callers" — each is a
  tally of something that lives elsewhere, true the day it is written and
  silently wrong after the next addition. Point at the set instead (a file, a
  build tag, a pattern, an invariant) so the comment grows with it. A number
  stays only when it is a constraint this code enforces — and then it is a
  named constant the comment explains.

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

## Install

**Claude Code:**

```
/plugin marketplace add patrickdappollonio/claude-plugins
/plugin install appropriate-comments-code@patrickdappollonio
```

**Any other agent** — Cursor, Codex, Copilot, opencode, Gemini, and 70+ more — via
[`npx skills`](https://github.com/vercel-labs/skills):

```bash
npx skills add patrickdappollonio/claude-plugins --skill appropriate-comments-code
```

Add `-g` to install for your user instead of just this project, and `-a <agent>` to
target one agent. Update later with `npx skills update`.

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
  wrong after is worse than none. It watches in particular for a comment that
  describes *one* of something — one caller, one direction, one supported mode —
  after a change made it two.
- **It checks what a comment claims.** An identifier, path or test name a
  comment mentions is confirmed to exist first; a comment naming a method that
  was renamed away is worse than silence, because the reader believes it.
- **It has rules for bulk audits.** Cutting comments across a codebase goes
  longest-first, never compresses away a rule such as "callers must hold the
  lock", leaves comments outside the change alone, and verifies mechanically
  that no pragma directive (`//nolint`, `//go:build`) was deleted as prose.
- **It steps aside for annotated code.** If you asked for tutorial or teaching
  code where narrating every line *is* the deliverable, the skill says so and
  gets out of the way.
