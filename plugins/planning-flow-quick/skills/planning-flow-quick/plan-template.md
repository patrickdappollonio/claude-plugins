# Plan Template — the short plan, its one ticket, the decisions, the ladder

A quick plan is one markdown file with one ticket. You rewrite the same file on every revision, so it always reads as if written today. Its sections are a subset of the full `planning-flow` plan, in the same order and with the same names, so `planning-flow` can pick the file up and add the sections it lacks.

## The skeleton

Include every section. When a section has nothing to say, keep the heading and write one line saying so ("No open questions."). The order is fixed, and the first line is the marker.

```markdown
<!-- planning-flow-quick -->
# <Imperative title: what this plan delivers>

## The ask

<One sentence: the task — what is to be fixed, built, or changed, and for
whom. The user's wording when they stated it; yours when it took shape in
the conversation. Never the request for a plan.>

> <The user's words, verbatim: each message that states the task, a
> constraint, or a non-goal, as its own quote, in order.>

## Summary

<Two or three plain sentences: what is wrong or missing, what changes, and
what is true afterwards. No file, function, or symbol names.>

## Technical context

<Everything the implementer needs so they never open a file they were not
told about. Bullets grouped by topic. Values, never pointers.>

## Tickets

<Exactly one ticket, in the format below. A spike ticket may sit beside it
only when the user deferred or declined a check.>

## Decisions

<One entry per decision, format below. The only section that remembers.>

## Gotchas and caveats

<Bullets: what could go wrong, what the plan assumes, and every sign from
"Too big for a quick plan" that showed.>

## Open questions

<Every question the user has not answered, in the shape from
`question-format.md`. Delete each when answered. When empty: "No open
questions.">
```

## Technical context

The test: **an implementer who reads only this plan can start work without opening a file they were not told about, and finds nothing there the plan did not say.** It holds:

- **Every exact string** the change must write or match: the old text and the new text, quoted.
- **Every file the ticket touches, with what is there today**: the path, what the file does in one line, and the current state of the part that changes.
- **The pattern to follow**, stated in words, with its closest example at `path:line` and a short excerpt. "Follow the existing pattern" without the pattern is a gap.
- **Every other place the same thing appears**, and whether the change covers it.
- **How tests and checks run**: the exact commands.
- **The tests that cover each surface the ticket touches**: file, test name, and what it does (setup, action, assertion).
- **The repository rules that bind this change**, stated as rules.

What does not belong: history, alternatives (those are decisions), and counts of things that live elsewhere.

## The ticket format

```markdown
## <Title>

**What.** <What changes, technical detail welcome. Every file, function, or
symbol is explained in the same sentence in plain words.>

**Why.** <Short active sentences, one idea each. What is wrong today, what
is true when this is done, and who benefits.>

### Acceptance Criteria
* <An observable check a reviewer can run.> — extends `<test file>` `<TestName>`
* <Another.> — new test: <why no existing test on this surface performs 60% or more of the new test's setup and action steps>

**Depends on.** nothing

**Size.** <XS | S | M>
```

- **Title.** A plain imperative phrase. No ticket numbers or codes. A spike's title starts with `Spike:` and its acceptance criteria are the questions it must answer.
- **Acceptance criteria.** Observable: "the settings page title reads 'Account settings'", not "the title is correct". Each ends with the test that proves it. A criterion with no test clause is a research gap.
- **Size.** A guess at lines touched, tests and docs included: XS under 200, S 200 to 750, M 750 to 1500. Size is not a sign that a plan is too big for this skill; the signs in `SKILL.md` are. A ticket above M is usually more than one ticket, which is a sign.

## The decisions format

```markdown
- **<What was decided>** (<user> | <agent>, <YYYY-MM-DD>). <The alternative
  that was not chosen and why.> <For agent decisions: the drawback, if any.>
  <"Reversible: yes/no/with cost".>
```

A decision the user made quotes their words and names what it was about, so nobody stretches it past that subject. A decision that follows from the user's says so ("Follows the user's choice to…"). A check that settled a fact is a decision entry that says what was run and what it showed. A choice to keep going after a too-big warning is the user's decision, logged with the sign it was about. A decision that reverses an earlier one replaces it.

## The ladder

Walk the plan once, part by part. Stop at the first rung that holds:

1. **Does this need to exist?** If the ask does not need it, cut it.
2. **Does the codebase already have it?** Reuse it.
3. **Does the standard library or the platform have it?** Use it.
4. **Does an installed dependency have it?** Use it.
5. **Does a maintained library have it?** For anything that reads or writes a published format, protocol, or standard, name the library; never hand-write part of one. A new dependency is a question for the user, with the library's current version, last release date, and license read from the registry ("not checked" when not read there).
6. **Is it one line?** Then it is one line.
7. **Only then:** the minimum that works today.

Every rung climbed past is a decisions entry (rung 5 is a question). Never cut validation at a trust boundary, data-loss handling, security, or accessibility.

## The timeless-prose rule

Delete on every revision: "revisited", "updated", "revised", "corrected", "previously", "as discussed", "after the check", "Edit:", "Update:", struck text, a paragraph kept "for context", and a resolved spike left as a ticket. Read the changed section as someone opening the plan for the first time; delete any word that only makes sense to someone who saw an earlier draft.
