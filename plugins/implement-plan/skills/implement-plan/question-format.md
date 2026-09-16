# Question Format — how every decision is put to the user

A question to the user is a decision only they can make, written so they can make it away from the code, in one reading. Every such question — in the plan file, in a visual plan, in chat — has the same shape. The shape matters as much as the content: a reader who has seen one question can read all of them, and a reader who has seen none can still answer.

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

The four bold labels **The situation.**, **The flow.**, **The fix.**, and **Cost.** are mandatory, in this order, spelled exactly like this, and are followed by *Your call*: a bold **Your call:** line in chat and in a file nobody is serving, a `question` fence in a file that `visual-plan` is serving (below). A question missing one part is not finished. Every question is numbered in its heading.

**Count the words; do not judge length by feel.** The prose of a question — from its heading to the end of *Cost*, not counting *Your call* — is at most **200 words**, and inside that: the heading at most 15 words; the situation two to four sentences; the flow three to five steps of one line each; the fix one to three sentences; the cost one or two. *Your call* is one sentence plus at most four alternatives of one line each. A fact stated in the situation is not repeated in the fix or the cost. As soon as you finish a question, count the prose words — `wc -w` on the text, or by hand — and write the count in your notes before starting the next one. Over 200: cut, starting with anything that describes an alternative outside *Your call* (the delivery-shape question's two neutral lines stay).

## What goes in each part

- **The heading** is the claim: what goes wrong, or what is undecided, as one sentence a reader can agree or disagree with. "The two 'runs at the same time' tests could pass without ever running at the same time", not "Test parallelism". Never a bare topic, never a code identifier alone.
- **The situation** gives the facts the decision rests on: what the plan or the code does today, what is not settled, and why it is the user's to settle rather than yours (the table in `SKILL.md` that says which decisions are the user's and which are yours). A function, file, or flag named here is explained in the same sentence, as everywhere else in this skill.
- **The flow** is a numbered walk, step by step, through what the consumer of the code — a user, an operator, the next process, the implementer — does and what they hit. It ends at the consequence they would notice. It is the part that lets the reader see what the decision does, instead of working it out from a description. Three to five steps. The test for `N/A`: write the first step; if there is no second step — the consumer sees the result and that is the whole story, for example which of two labels a button carries, or whether the work ships as one pull request or several — write `**The flow.** N/A`. If a second step exists (something happens because of the first), write the walk. `N/A` is for a flow that does not exist, never for one you did not write.
- **The fix** is your recommendation: the one path you would take and why, in plain words. It names no other path; the alternatives live in *Your call*. For the one question that carries no recommendation — delivery shape, one pull request or several — state both shapes with their trade in one neutral line each and pick neither.
- **Cost** is what the fix costs, and only the fix: lines, a migration, a new dependency, a new background process, a behavior someone would notice. Not what the alternative would cost, not what the fix saves. `None` is a legitimate value and is written out, never left blank.
- **Your call** is the question itself, in a few words: `accept?`, or the alternatives when the decision is a choice — two to four, each with its consequence on the same line. The user may answer in their own words; the alternatives are a convenience, not a form.

## Numbering

`Question <N> of <M>`: `M` is how many questions are open right now, across every round, and `N` is this question's position among them, in the order they appear in the file. The count is of open questions only: when a question is answered it is deleted, and the rest renumber. A question is referred to by its heading text, never by its number, because the number changes.

Order the open questions so the ones that can be answered now come first, and among those, put the question that unblocks the most other questions first; a question whose answer waits on another open question comes after it and says so in its first sentence ("Waits on the reclaim question above.").

## Heading level

The question's heading sits **one level below the section that holds it**, so the questions read as part of the document instead of breaking its outline. Under a `## Open questions` section, each question is an `###`. Under a `## Decisions made during implementation` section, each question is an `###`. If the document's major sections are `###`, the questions are `####`. In chat, where nothing encloses the question, use the level it has in the file, so the heading needs no change when the text moves between the two.

## Where the questions live, and how many at a time

- **The plan file holds every open question, in full.** They live in the file's open-questions section (or, during an implementation run, the "Decisions made during implementation" section that the run adds at the end of the file), one after another, all of them, in the template. A reader who opens the file sees everything that is waiting on them.
- **A visual plan shows the same file**, so it too shows every open question. **When the `visual-plan` skill is serving the file, the *Your call* line in the file is a `question` fence** — not the bold line — so the answer comes back as a comment. Write it that way the first time; do not write the bold line and convert later. The fence's first line is `Your call:` followed by the question, the alternatives (when any) are its `- ` option lines, and there is no description line — the situation, flow, fix, and cost stay as ordinary markdown above the fence, because the fence's description renders as one inline line and would flatten a numbered flow into a run-on sentence. A pure "accept?" fence has no options; the viewer's free-text box takes the answer. Never put a heading inside the fence.

  ````markdown
  ### Question 2 of 3 — A crashed worker leaves its wallet claimed forever

  **The situation.** …

  **The flow.**

  1. …

  **The fix.** …

  **Cost.** …

  ```question
  Your call: a janitor that reclaims after ten minutes, or a by-hand command?
  - The janitor (recommended): nobody is paged for a crash
  - A by-hand command: no migration, but every crash is a page
  ```
  ````

- **Chat asks one question per message.** A stop in chat carries exactly one question, in full, in the template, under the stop's opening line (the `Step <n> of 13; <k> questions open` line in a planning run, the *Where we are* line of the resume block in an implementation run), plus how many more are open and the file's path. Never two, never the whole list. Ask it, stop, wait for the answer, update the plan file with the answer, and ask the next one in the next message. Rounds are as many as it takes; there is no cap on rounds and no batching inside one. The file is where a reader goes to see them all; the chat is where they answer one at a time without facing a long block of text.
- **The chat question and the file question are the same words**, from the heading to the end of the cost. Write it once, into the file; the chat message repeats it. The one difference is the last part: a fence in the file becomes, in chat, the bold **Your call:** line followed by its alternatives as a bulleted list — a fence in chat is a code block nobody can click.

## The harness question tool is not used for these

A harness question tool (a multiple-choice prompt) has room for one line per option and none for a flow. These questions need the whole template, so they go in the message as markdown, and the user answers in their own words. This holds even when the harness has such a tool.

## Never answer your own question

A question put to the user is answered by the user. Do not fill in a likely answer and proceed, do not treat silence as consent, do not pick the fix because the user is away. If a question is unanswered, it stays open in the file, and every stop says how many are open.

## The worked example

Its prose is about 185 words. Nothing in it can be removed without losing something the reader needs.

```markdown
### Question 24 of 31 — The two "runs at the same time" tests could pass without ever running at the same time

**The situation.** Two acceptance tests exist to prove the design is safe
with several workers: "three workers process three wallets of one bulk
request at once", and "two janitors on the same rows don't fight". The plan
names the tests but not how they must run. This codebase's habit for
"simulate several copies" is to call the function twice, one after the other
— which proves nothing about racing.

**The flow.**

1. Implementer writes the three-workers test as three sequential calls. Green.
2. The claim step has a subtle flaw: two workers can both win the same job
   under real contention.
3. Never seen in tests. Seen in production as a wallet submitted twice.

**The fix.** Both tests must launch real parallel workers with a shared start
gate and a small injected delay to widen the race window — the exact pattern
one existing freeze test already uses. Assert exactly one winner per job.

**Cost.** None. It's a requirement on the test, not on the code.

**Your call:** accept?
```

## Red flags — the question is not in shape

- A bold label missing, renamed, reordered, or a heading without a number
- A heading that is a topic ("Retry policy") instead of a claim
- A flow written as prose instead of numbered steps, or `N/A` on a decision that has a consumer who would notice it
- A cost left blank, a cost that prices the alternative, or a fix that describes a second path (except the delivery-shape question)
- Two questions in one chat message, or a chat message that lists every open question
- A question in chat whose heading, situation, flow, fix, or cost differs by a word from the file's
- A question asked through the harness question tool
- A question written without its word count noted, or a fact repeated between the situation and the fix or cost
- A bold *Your call* line in a file that `visual-plan` is serving; the situation, flow, fix, or cost inside a `question` fence; a heading inside one; a fence pasted into chat
- A question whose prose runs over 200 words, or whose *Your call* has more than four alternatives
