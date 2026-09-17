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

**Count the words; do not judge length by feel.** The prose of a question — from its heading to the end of *Cost*, not counting *Your call* — is at most **200 words**; on the rare flow that must run past five steps, each step past the fifth adds 15 words to the limit. Inside that: the heading at most 15 words; the situation two to four sentences; the flow three to five steps of one line each (one or two when that is the whole story, more than five only when absolutely needed, never past ten); the fix one to three sentences; the cost one or two. *Your call* is one sentence plus at most four alternatives of one line each. A fact stated in the situation is not repeated in the fix or the cost. As soon as you finish a question, count the prose words — `wc -w` on the text, or by hand — and write the count in your notes before starting the next one. Over the limit: cut, starting with anything that describes an alternative outside *Your call* (the delivery-shape question's two neutral lines stay).

## What goes in each part

- **The heading** is the claim: what goes wrong, or what is undecided, as one sentence a reader can agree or disagree with. "The two 'at the same time' tests could pass without ever running in parallel", not "Test parallelism". Never a bare topic, never a code identifier alone.
- **The situation** gives the facts the decision rests on: what the plan or the code does today, what is not settled, and why it is the user's to settle rather than yours (the table in `SKILL.md` that says which decisions are the user's and which are yours). A function, file, or flag named here is explained in the same sentence, as everywhere else in this skill.
- **The flow** is a numbered walk, step by step, through what the consumer of the code — a user, an operator, the next process, the implementer — does and what they hit. It ends at the consequence they would notice. It is the part that lets the reader see what the decision does, instead of working it out from a description. **Three to five steps, one line each.** A flow with only one or two real steps is the written exception: write it as it is, and never pad a flow to reach three. Go past five only when it is absolutely needed: removing any step would hide how the consequence comes about. Never go past ten. A flow that needs eleven steps is two questions, or a situation that says too little. Write `**The flow.** N/A` only when no person or system would ever notice the decision. `N/A` is for a flow that does not exist, never for one you did not write.
- **The fix** is your recommendation: the one path you would take and why, in plain words, checked before it is asked (*Check the fix before you ask*, below). It names no other path; the alternatives live in *Your call*. For the one question that carries no recommendation — delivery shape, one pull request or several — state both shapes with their trade in one neutral line each and pick neither.
- **Cost** is what the fix costs, and only the fix: lines, a migration, a new dependency, a new background process, a behavior someone would notice. Not what the alternative would cost, not what the fix saves. `None` is a legitimate value and is written out, never left blank.
- **Your call** is the question itself, in a few words: `accept?`, or the alternatives when the decision is a choice — two to four, each with its consequence on the same line. The user may answer in their own words; the alternatives are a convenience, not a form.

## Check the fix before you ask

The user reads **The fix.** as "this works". Before a question is written into the file or asked in chat, check it, as far as what can be wrong requires:

- **Every fact in the situation is true right now.** Open the file or run the command again; your memory of an earlier read is not evidence.
- **The fix works.** The function, flag, option, endpoint, or command it names exists in the version that is installed (read its source or its docs, not your memory of it); the change fits in the place you say it goes; the behavior you promise is the behavior it has. When a small probe would settle it — a throwaway script or test in a scratch directory — run it, read what it printed, and delete it. A fix that is a choice of wording needs no check; a fix that names an API, a version, a config option, a command, a number, or how another system behaves always does.
- **Never change the user's files, install anything, call or write to a service outside the machine, or put heavy load on the machine to check a fix.** Reading public documentation is allowed.

If a fact was wrong, correct the situation, or drop the question when nothing is left to decide. If the fix does not work, find one that does and check that one; if you find none, say so in the situation and never present an unchecked fallback as working. If the check shows the question was a fact and not a decision, it is not asked; record what you found where the skill records facts. If a part cannot be checked from here (it needs production access, a credential, a system you cannot reach), end **The fix.** with `Not verified: <what>, because <why>.`; those words count toward the limit.

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

A question put to the user is answered by the user. Do not fill in a likely answer and proceed, do not treat silence as consent, do not pick the fix because the user is away. Only a direct answer closes a question: the user accepts the fix, rejects it, or names a different direction, in words that leave no doubt. A vague, partial, or hedged reply ("sure, whatever you think", "fine I guess", "ok" to a question with several alternatives) or a question back does not: answer what they asked, say in one line what you could not tell, and put the same *Your call* part again, alternatives included. If a question is unanswered, it stays open in the file, and every stop says how many are open.

## The worked example

Nothing in it can be removed without losing something the reader needs.

```markdown
### Question 24 of 31 — The two "at the same time" tests could pass without ever running in parallel

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
- A flow written as prose instead of numbered steps, a flow padded with a step that describes nothing real, a flow over five steps that was not absolutely needed, a flow over ten steps, or `N/A` on a decision that has a consumer who would notice it
- A question asked before its facts and its fix were checked; a fix that names an API, flag, version, command, or number you did not look up; an unchecked part with no `Not verified:` line
- A question treated as answered after a reply that was vague, partial, or a question back
- A cost left blank, a cost that prices the alternative, or a fix that describes a second path (except the delivery-shape question)
- Two questions in one chat message, or a chat message that lists every open question
- A question in chat whose heading, situation, flow, fix, or cost differs by a word from the file's
- A question asked through the harness question tool
- A question written without its word count noted, or a fact repeated between the situation and the fix or cost
- A bold *Your call* line in a file that `visual-plan` is serving; the situation, flow, fix, or cost inside a `question` fence; a heading inside one; a fence pasted into chat
- A question whose prose runs over its word limit, or whose *Your call* has more than four alternatives
