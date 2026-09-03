# Plan Template — the file, the tickets, the decisions, the sizes

The plan is one markdown file. You rewrite the same file on every revision,
so it always reads as if you wrote it today. This file gives the skeleton, the
ticket format, the decisions format, the size bands, and the timeless-prose
rule with examples of what to delete.

## The skeleton

Include every section. When a section has nothing to say, keep the heading
and write one line saying so ("No open questions.", "Nothing ruled out."),
so the reader knows you considered the section and had nothing to put in
it. The order is fixed.

```markdown
# <Imperative title: what this plan delivers>

## The ask

> <The user's request, verbatim. Their words, not a paraphrase. Quote it.>

## Summary

<Two to four plain sentences: what is wrong or missing, what we will do about
it, and what is true afterwards. No file, function, or symbol names.>

## The problem

<What is wrong today, in plain words, with the real-world effect. Who is hit
and how. Why it matters now. Technical detail is welcome when it explains the
mechanism; every identifier is explained in the same sentence.>

## The solution

<How the plan solves the problem, top-down: the approach first, then the
parts. Write for a technical reader who has never opened this repository.
Explain the behavior, then the mechanism. Diagrams and tables before code;
code only when the reader must see it to judge the plan.>

## Technical context

<Everything an implementer needs so they never open a file they were not
told about. See "The technical context contract" below. Facts only, each
grounded in the codebase, each with the exact value rather than a pointer
to where the value lives.>

## Tickets

<One `## <Title>` block per ticket in the format below. Order them so
dependencies come first. Spikes are tickets whose title starts with `Spike:`.>

## Decisions

<One entry per decision, format below. This is the only section that
remembers anything.>

## Gotchas and caveats

<Bullets. What could go wrong, what is deliberately out of scope, what the
plan assumes about the world, what to watch during rollout. Each one a line
or two.>

## Out of scope

<What this plan deliberately does not do, one line each with the reason. The
user ruled it out, or the ask did. Do not add it back to this plan.>

## Open questions

<Only questions the user has not yet answered. Delete each one when answered;
its answer becomes a decision. When empty: "No open questions.">

### Not yet specified

<In-scope unknowns too dim to phrase as a question yet: the area, and the
open answer it waits on. Each line graduates into a question, spike, or
ticket when the answers ahead of it arrive, and is deleted then.>
```

## The technical context contract

The *Technical context* section is written for an implementer who has the
plan and nothing else: no conversation, no exploration notes, and no time to
explore. The test is a sentence: **an implementer who reads only this plan
can start work without opening a file they were not told about, and finds
nothing there that the plan did not say.** The cold implementer check in
`plan-review.md` measures this, and a plan fails it more often than any
other check.

A pointer is not context. "The template defines the shape" is a pointer;
the ten heading strings in order are context. Write the value, not where
the value lives. The section holds, as bullets grouped by topic:

- **Every exact string the implementation must match.** Heading text,
  labels, tokens, separators, file names, command names, flag names, output
  formats, exit codes, error messages the code must print or parse. Quote
  them.
- **Every file the tickets touch, with what is there today.** The path, what
  the file does in one line, and the current state of the part that will
  change: the function's shape, the existing list, the current wording.
- **The convention to copy, with the file that shows it.** When the plan says
  "follow the existing pattern", name the file, and state the pattern in
  words: how it parses, how it reports, how it exits, what it imports.
- **The runtime facts.** Language version, module format, dependencies
  allowed, platform constraints, where a script runs from and what its
  working directory is.
- **How tests and checks run today.** The exact command, the runner, the
  workflow file and its trigger paths, the version it runs on, and what is
  missing when nothing exists yet.
- **Where each edit goes.** For a change to a document or a config, the
  section or key that changes and its current text.
- **The rules of the repository that bind this work**, stated as rules, not
  as "see the instructions file".

What does not belong: history, alternatives (those are decisions), and
opinions. If a fact is uncertain, say so and make it a spike.

## The ticket format

Exactly this shape. Headings, bold labels, and order do not vary.

```markdown
## <Title>

**What.** <May span paragraphs. Technical detail is welcome. Every file,
function, or symbol is explained in the same sentence in plain words.>

**Why.** <Simplified Technical English. Short sentences. Active voice. One
idea per sentence. What is wrong today, what is true when this is done, and
who benefits.>

### Acceptance Criteria
* <An observable check a reviewer can run.>
* <Another.>

**Depends on.** <Titles of other tickets, or "nothing".>

**Size.** <XS | S | M | L | XL | XXL>
```

### Rules

- **Title.** A plain imperative phrase: "Add a per-supplier switch for the
  drop-off check". **No ticket numbers, codes, or identifiers**: not "#4",
  not "PF-12", not "Ticket 3". A quantity that is part of the work, such as
  "batches of 500", is fine. Tickets are referenced by title in *Depends on*
  and in the decisions section. A numbered
  ticket ends up in the code as a `// ticket 4` comment, which explains a
  past decision instead of the line under it.
- **Spikes.** A ticket for something not yet known. Title starts with
  `Spike:`. Its acceptance criteria are the questions it must answer. Size it
  by the code the investigation touches, usually XS. When a spike is resolved
  it is **deleted**: the answer becomes a decisions entry, and the tickets
  the answer affects are rewritten. A resolved spike never stays as a ticket.
- **What.** Written for a technical reader who has not seen the code. A
  name may appear, but the sentence must survive with the name removed. Bad:
  "Extend `IsValidSource` to cover all providers." Good: "The check that
  decides which suppliers are switched on (a function named `IsValidSource`)
  currently lists two by hand; extend it to read the full supplier list."
- **Why.** ASD-STE100 rules: sentences under twenty words, active voice,
  present tense, common words ("check", not "invariant"; "at the same time",
  not "concurrently"; "empty", not "nil"). Say the effect on a person: money,
  time, data, safety, confusion.
- **Acceptance criteria.** Observable and checkable. "The command exits with
  an error when the file is missing", not "handles errors well".
- **Depends on.** Titles only, separated by semicolons, each one exactly
  matching a ticket heading in this file. "nothing" when independent.
- **Size.** A guess at **lines of code touched** (added, changed, removed,
  tests and docs included). Never time. Bands:

| Size | Lines touched |
|---|---|
| XS | under 200 |
| S | 200 to 750 |
| M | 750 to 1500 |
| L | 1500 to 4500 |
| XL | 4500 to 6000 |
| XXL | over 6000 |

Every band is legitimate. A large ticket is not a defect. Do not split a
ticket because it is big; split only when the user asks, or when two parts
have no shared files and the user chose several pull requests.

### Example

```markdown
## Add a per-supplier switch for the drop-off check

**What.** The importer keeps a list of suppliers it knows about, and a
separate check that decides which of them are "switched on" for the
drop-off comparison — the pass that notices when a supplier stops carrying a
product. That check (a function named `IsValidSource` in the importer
package) lists two suppliers by hand. Replace the hand-written list with a
lookup against the supplier table, so a supplier is switched on when its row
carries the new `dropoff_enabled` flag. Add the flag to the table with a
migration that defaults it to true for the two suppliers already listed and
false for the rest, so nothing changes on the day it ships.

**Why.** Today only two of five suppliers get the drop-off check. For the
other three, a product the supplier stopped selling stays listed as
available. Customers order it and the order fails. After this ticket, an
operator can switch the check on for any supplier from the database, with
no code change.

### Acceptance Criteria
* A supplier with the flag set to true is included in the drop-off comparison.
* A supplier with the flag set to false is skipped, and the skip is logged once per run.
* The migration leaves the two existing suppliers switched on and the rest off.
* The existing drop-off tests pass unchanged; one new case covers a switched-off supplier.

**Depends on.** nothing

**Size.** S
```

## The decisions format

The decisions section is the plan's only memory. One entry per decision,
newest last. Both the user's decisions and yours go here, marked.

```markdown
- **<Short statement of what was decided>** (<user> | <agent>, <YYYY-MM-DD>).
  <One or two sentences: the alternative that was not chosen and why.>
  <For agent decisions: the drawback, if any.> <"Reversible: yes/no/with
  cost", one clause.>
```

Examples:

```markdown
- **The flag defaults to off for suppliers not already checked** (user,
  2026-09-02). The alternative was on-for-all, which would start checking
  three suppliers nobody has validated. Reversible: yes, one row per supplier.
- **The switch lives in the supplier table, not a config file** (agent,
  2026-09-02). Follows the user's earlier choice to keep supplier settings in
  the database. A config file would need a deploy to change. Drawback: a
  migration is required. Reversible: with cost, the migration would need a
  counterpart.
- **The vendor endpoint accepts batch requests up to 500 items** (agent,
  2026-09-02). Measured with one request against the sandbox; this closed
  the spike that asked it. The import ticket sends batches of 500.
  Reversible: yes, the batch size is one constant.
```

A decision made because an earlier user decision implies it says so ("Follows
the user's choice to…"). A decision that reverses an earlier one replaces the
earlier entry; it does not sit beside it.

## The timeless-prose rule

Every sentence must read the same to someone opening the plan for the first
time, with no earlier draft in their head. Delete, on every revision:

| Delete | Because |
|---|---|
| "revisited", "updated", "revised", "corrected", "now", "previously", "as clarified", "as discussed", "after the review", "the reviewer noted" | They describe the edit, not the plan |
| "Edit:", "Update:", "Note: we are no longer…", "instead of what the previous section says" | The previous section should have been rewritten |
| `~~struck text~~`, a paragraph kept "for context", a superseded option left in place | The reader has no earlier draft to contrast it with |
| A heading such as "Implementing X, revisited" or "Revision 3" | There is one plan |
| A ticket marked "done" or "resolved" | A resolved spike or a dropped ticket is deleted; its outcome is a decision |

The test: read the changed section. Delete any word that only makes sense
to someone who saw an earlier draft. Rewrite the sentence as a statement of
what the plan is.
