# Question Format — how every finding is put to the user

Once the report is delivered, each confirmed finding is a decision only the user can make: apply its validated fix, defer it, dismiss it, or, when the finding is against the agreed design, revise that design or keep it. Every such question — every finding, in every review — has the same shape. The shape matters as much as the content: a reader who has seen one question can read all of them, and a reader who has seen none can still answer, away from the code, in one reading.

## The template

```markdown
### Question <N> of <M> — <the claim, in one plain sentence>

**The situation.** <What exists, what the plan says, what is unsettled, and
why the codebase cannot settle it. Two to four sentences.>

**The flow.**

1. <Step one: what the person or system that uses this code does first.>
2. <Step two.>
3. <The last step: the consequence they would notice.>

**The fix.** <What you recommend, in one to three sentences.>

**Cost.** <What the fix costs — lines, a migration (a change to the
database structure), a dependency, a change someone would notice — or
`None`.>

**Your call:** <the question, in a few words; the alternatives, when there
are any, each with its consequence on the same line>
```

The four bold labels **The situation.**, **The flow.**, **The fix.**, and **Cost.** are mandatory, in this order, spelled exactly like this, and are followed by a bold **Your call:** line with its alternatives as a bulleted list under it. A question missing one part is not finished. Every question is numbered in its heading.

**Count the words; do not judge length by feel.** The prose of a question — from its heading to the end of *Cost*, not counting *Your call* — is at most **200 words**, and inside that: the heading at most 15 words; the situation two to four sentences; the flow three to five steps of one line each; the fix one to three sentences; the cost one or two. *Your call* is one sentence plus at most four alternatives of one line each. A fact stated in the situation is not repeated in the fix or the cost. As soon as you finish a question, count the prose words — `wc -w` on the text, or by hand — and write the count in your notes before sending it. Over 200: cut, starting with anything that describes an alternative outside *Your call*.

## What goes in each part

- **The heading** is the claim: what goes wrong, as one sentence a reader can agree or disagree with. "Two uploads arriving at the same instant can both claim the same name", not "Concurrency in the upload handler". Never a bare topic, never a code identifier alone, never the charter's name.
- **The situation** gives the facts the decision rests on: what the code does today, what the brief says about it — it matches the brief, the brief is silent, or the brief specifies it — and why it is the user's to settle rather than yours: it is their code and their design. For a `design_is_wrong` finding, say plainly that the code is faithful and the brief is the problem, so nobody reads it as the implementer having slipped. The last sentence pairs the question with its report entry: where it was found (`path/file.go:142`, the one place a symbol may appear), the severity, and the reviewer — "Found at `internal/media/upload.go:88`, rated serious, by the Data Integrity Prosecutor." Any other function, file, or flag named here is explained in the same sentence, as everywhere else in this skill.
- **The flow** is a numbered walk, step by step, from the trigger through what the person or system using the code does and hits, ending at the consequence they would notice. It is the part that lets the reader see what the defect does, instead of working it out from a description. Three to five steps. The test for `N/A`: write the first step; if there is no second step — the consumer sees the result and that is the whole story, for example a label that reads wrong — write `**The flow.** N/A`. If a second step exists (something happens because of the first), write the walk. `N/A` is for a flow that does not exist, never for one you did not write.
- **The fix** is the validated fix, in outcome terms: the one path the validator confirmed and why it closes the case. It names no other path; the alternatives live in *Your call*. When no fix survived validation, write "No confirmed fix yet" and, in one sentence, what was tried. For a `design_is_wrong` finding this is the change to the plan — what the design would become — under the same **The fix.** label: the report headed that field *The change to the plan*, but the question keeps the label the template gives it.
- **Cost** is what the fix costs, and only the fix: lines, a migration, a new dependency, a new background process, a behavior someone would notice. For a design finding this is where the size of the change to the plan goes, because it asks the user to revisit a decision rather than approve a patch. Not what the alternative would cost, not what the fix saves. `None` is a legitimate value and is written out, never left blank.
- **Your call** is the question itself, in a few words, then the alternatives, each with its consequence on the same line. An ordinary finding offers three: **apply** the validated fix (recommended, unless there is no confirmed fix); **defer** to a follow-up (recorded, nothing changes now); **dismiss** as a non-issue (they say why; the reason is recorded). A `design_is_wrong` finding never offers *apply*, because applying its fix would be you re-deciding a design on the user's behalf: it offers **revise the design** (you write down what the design becomes, they approve or amend it, that becomes the new brief, and the change is then measured against it), **keep the design** (recorded as an accepted trade-off with their reasoning; the finding closes), or **defer**. Explaining is not an alternative because it is always available: the user asks in their own words. The user may answer in their own words too; the alternatives are a convenience, not a form.

## Numbering and order

`Question <N> of <M>`: `M` is how many findings are still undecided, and `N` is this question's position among them. The order is the report's order: `design_is_wrong` findings first, because every other finding is measured against a plan they say was wrong; then conformance findings; then the rest from serious to minor. When a finding is decided, the rest renumber. A finding is referred to by its heading text, never by its number, because the number changes.

## Heading level

In chat, nothing encloses the question, so its heading is an `###`, one level below the `##` sections of the report that preceded it.

## One question per message

- **The report is where the user sees everything.** It already lists every confirmed finding; the questions do not repeat that list.
- **A chat message carries exactly one question**, in full, in the template, followed by one line saying how many more wait after it ("Two more findings wait after this one."). Never two, never the whole list. The message says what it does, never more: if no code is being edited, it does not say a fix is being applied. Ask it, stop, wait for the answer, record it, and ask the next one in the next message. Rounds are as many as there are findings; there is no cap and no batching.
- **When the answer is a question**, answer it in the same plain register — more of the reasoning, the sequence, the consequence, not a switch into code-speak unless they quote symbols back at you — and then ask the same question again, word for word. Explaining never edits anything.
- **An answer in their own words that covers the rest** — "apply all of them", "just do everything", "the rest too" — answers every remaining ordinary question at once: record it and stop asking those. It never answers a `design_is_wrong` question. Those are asked one by one regardless, because "all of them" is an answer about the fixes they were offered, not approval of a design they have not been shown.
- **Only after the last question is answered** does any code change, and only the accepted fixes and approved design changes. Close with a short ledger: applied, deferred, dismissed with the user's reasons, and each design decision.

## The harness question tool is not used for these

A harness question tool (`AskUserQuestion` in Claude Code, or a multiple-choice prompt elsewhere) has room for one line per option and none for a flow. These questions need the whole template, so they go in the message as markdown, and the user answers in their own words. This holds even when the harness has such a tool.

## Never answer your own question

A question put to the user is answered by the user. Do not fill in a likely answer and proceed, do not treat silence as consent, do not apply the fix because it is small or because the user is away. An unanswered finding stays undecided and nothing is applied; every message says how many are open.

## The worked example

Its prose is about 150 words. Nothing in it can be removed without losing something the reader needs.

```markdown
### Question 1 of 6 — A failed upload leaves a record marked ready that points at a file that was never written

**The situation.** The upload handler saves the record as "ready" first and
then copies the file to storage. The brief says nothing about the order, so
this is not a conformance gap; it is a defect in how the work was done, and
only you can weigh the fix against your release. Found at
`internal/media/upload.go:88`, rated serious, by the Data Integrity
Prosecutor.

**The flow.**

1. A user uploads a file. The record is saved as "ready".
2. The copy to storage fails halfway. Nothing is logged.
3. Anyone opening the record later gets an error with no explanation.

**The fix.** Mark the record ready only after storage confirms the copy, and
log the failure with the record's ID. The validator confirmed this closes the
case without touching any other path.

**Cost.** About ten lines in one file. No migration, no new dependency.

**Your call:** apply, defer, or dismiss?
- Apply (recommended): the fix lands with the other accepted fixes
- Defer to a follow-up: recorded, nothing changes now
- Dismiss as a non-issue: say why; the reason is recorded
```

## Red flags — the question is not in shape

- A bold label missing, renamed, reordered, or a heading without a number — including **The fix.** renamed to *The change to the plan* on a design finding
- A question sent without the line saying how many more wait after it
- A heading that is a topic ("Retry policy"), a charter name, or a code identifier instead of a claim
- A flow written as prose instead of numbered steps, or `N/A` on a defect that someone would notice happening
- A cost left blank, a cost that prices the alternative, or a fix that describes a second path
- Two questions in one chat message, or a chat message that lists every open finding
- A `design_is_wrong` question that offers *apply*, or one answered by a blanket "all of them"
- A question asked through `AskUserQuestion` or any harness question tool
- A question written without its word count noted, or a fact repeated between the situation and the fix or cost
- A question whose prose runs over 200 words, or whose *Your call* has more than four alternatives
- Code edited before the last question is answered
