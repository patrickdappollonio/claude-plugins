---
name: ask-me-again
description: >-
  Use when the user says "/ask-me-again", "ask me again", "ask me that properly", or "one question at a time". Also use when the user says the agent's questions were unclear, too technical, too many at once, "a wall of text", or squeezed into a multiple-choice prompt with no room for context. The skill takes every question the agent has open. It checks the facts behind each one, and it checks that each recommended fix really works. Then it asks the questions again in plain chat, one per message, in one fixed shape - a numbered heading that states the claim, the situation, a numbered flow to the consequence, the fix, its cost, and your call. Only a direct answer (apply, reject, or a different direction) closes a question. After a doubtful or vague reply, the agent asks the user to say which they mean. It builds nothing until the last question is closed.
---

# Ask Me Again

You have questions open for the user, and the way you asked them did not work: too many at once, too much jargon, a bare "A or B?" with no picture of what each one does, or a multiple-choice prompt with one line per option. This skill asks them again. Each question becomes a decision the user can make away from the code, in one reading, and every question has the same shape, so a reader who has seen one can read them all.

## The four rules

1. **Facts are yours to find; decisions are the user's to make.** Before asking anything, check whether the codebase, the docs, or a command can answer it. A question that a fact answers is not asked.
2. **A fix you recommend is a fix you have checked.** The user reads **The fix.** as "this works". Verify it before the first question goes out (step 2). A fix you could not check says so, in its own text.
3. **One question per message, in plain chat, in the template.** Never the question tool of the harness (the program that runs you, such as Claude Code or Codex) — `AskUserQuestion` or its equivalent — even when the harness has one: it has room for one line per option and none for a flow. Never two questions in one message, never the list of them.
4. **Only a direct answer closes a decision.** The user applies the fix, rejects it, or sends you in a different direction, in words that leave no doubt. Anything else keeps the question open, and you ask the user to say which they mean. Never answer your own question, and never treat silence or a vague reply as consent. The checks in step 2 are work you do now. Building anything the questions decide waits until the last one is closed, unless the user tells you to start earlier.

## The process

Do every step in order.

### 1. Collect the open questions

Read back through the conversation and list every question that is still waiting on the user: the ones you asked in prose, the ones you sent through a question tool, the ones buried in a status message ("I assumed X, tell me if not"), and the ones you were about to ask. If the user named a topic when they invoked the skill, keep only that topic. Do not invent questions to fill a list. If nothing is open, say that in one line and stop.

An assumption you made without asking is an open question when it changes what the user gets and the user has not confirmed it. Put it in the list. A routine choice of how to write the code is not one. Keep the list to yourself; the user sees one question at a time.

A new problem that you find while checking (step 2), and that only the user can decide, is a question of its own. Add it to the end of the list; `M`, the number of questions this run asks, grows by one. Never fold it into another question, and never bring it up inside the message that asks a different one.

### 2. Check the facts and the fix — before the first question

For each question, in this order:

- **Can a fact settle it?** Test the question first. A question about what something **is** today ("which format do the file names use?") can be closed by a fact. A question about what something **should be**, or which of several options to take ("A or B?", "keep it the same?"), cannot: it stays the user's, whatever the code suggests. Then, for a question a fact can close: read the code, the config, the docs of the version that is installed, or run a read-only command. If the answer is there, the question is closed by you. Keep one line about it for the opening message. A fact closes a question only when nothing is left to decide. "Which delimiter does the export use?" is closed by reading the code. "The lifetime is 300 seconds today — should the new export keep it?" is not: the value today is a fact, and whether it stays is the user's decision. A fact that leaves only one workable option does not close the decision either: ask whether to take it. A habit you see in the code ("the other button says Download") is a reason for your recommendation; it is not the user's answer. When in doubt, ask.
- **Is every fact in the situation true right now?** Open the file or run the command again. Your memory of the conversation is not evidence; the file may have changed and you may have misread it the first time.
- **Does the fix work?** Check every part of it that can be wrong: the function, flag, option, endpoint, or command exists in the version that is installed, or in the version the fix would add or upgrade to (read its source or its docs, not your memory of it); the change fits in the place you say it goes; the behavior you promise is the behavior it has. When a small probe would settle it — a throwaway script or test in a scratch directory — run the probe, read what it printed, and delete it. How much to check depends on what can be wrong. A fix that is only a choice of wording needs no check. A fix that names an API, a version, a config option, a command, a number, or how another system behaves always needs one.
- **Never change the user's files, install anything, call or write to a service outside the machine, or put heavy load on the machine to check a fix.** Those need the user's word first, and the user has not answered yet. Reading public documentation is allowed.

What the check found decides what happens to the question:

| The check found | What you do |
|---|---|
| The facts hold and the fix works | Ask the question |
| A fact was wrong | Correct the situation; ask the corrected question, or drop it if nothing is left to decide |
| The fix does not work | Find one that does and check that one. If you find none, say so in the situation, and never present an unchecked fallback as working: the decision becomes whether to drop the goal, put it off, or change what is required |
| The question was a fact, not a decision | Drop it; tell the user in one line what you found |
| Something cannot be checked from here (it needs production access, a credential, a system you cannot reach, a tool that is not installed, or a step you are not allowed to take) | Ask, and end **The fix.** with `Not verified: <what>, because <why>.` Those words count toward the limit |

### 3. Order and number them

Questions that can be answered now come first, and among those, the one whose answer unblocks the most others comes first. A question that waits on another comes after it and says so in its first sentence ("Waits on the reclaim question above."). `N` counts the questions you have asked, from 1; asking the same question again does not raise it. `M` is the questions already asked plus the ones still to ask. An ordinary answer does not change `M`. A question that is dropped or answered before you asked it lowers `M`; a new question raises it; the next message says so in one line. Example: four questions, and the first reply also answers the third directly, so the next heading is `Question 2 of 3`. Refer to a question by its heading text, never by its number.

### 4. Ask the first question, then stop

The first message holds, in this order: one line for each question you closed yourself in step 2 (if any), then the one question, in full, in the template below. Nothing after **Your call**. End your turn and wait. If the checks closed every question, send the one-line findings, say that nothing is left to decide, and carry on with the work.

### 5. Read the reply

| The reply | What you do |
|---|---|
| Accepts the fix in direct words ("yes", "accept", "do it", "go with the second one") | Closed: apply |
| Rejects the fix in direct words ("no", "leave it as it is", "skip this") | Closed: reject. The fix is not done; nothing replaces it unless the user said what |
| Names another direction, one of the alternatives or their own | One of the listed alternatives: closed. A direction of their own: closed as they stated it. Do not stop to check it now; note it as *to check* and go on. You check it after the last question (step 6), unless the user asks you to check it now |
| A yes with a condition ("A, if it supports X") | Closed as stated. Note the condition as *to check* and go on. You check it after the last question (step 6), unless the user asks you to check it now |
| An instruction that settles a question you have not asked yet | When it is direct, that question is closed: record it, lower `M`, and do not ask it |
| A direct answer plus a question that does not change it ("yes, do it — how long will it take?") | Closed. Answer their question after the record line |
| A hedged yes — a yes with a word of doubt attached — also to a plain `accept?` ("fine by me I guess", "I think so", "probably", "go for it, maybe?") | Still open, and handled like the vague reply below: doubt is not a direct answer. Say in one line that the reply read as unsure, and put the same **Your call** part again |
| Asks you something, or wants more detail | Answer it, briefly and only from what you checked; when you cannot check it from here, say so and give no estimate or typical figure in its place, then put the same **Your call** part again, alternatives included. Still open. The user asked, so look into it when the answer needs that |
| Vague, partial, or about something else ("sure, whatever you think", "hmm, maybe", "ok" to a question with several alternatives, a thumbs-up to a message that held a choice) | Still open. Say in one line what you could not tell ("I could not tell from 'sounds fine' which of the two you want, so nothing is recorded."), and put the same **Your call** part again, alternatives included |
| Answers this question and also a later one | Close both only if each answer is direct; say so in the record line |
| "You decide", for this question or for the rest | A direct instruction, and the user's to give. Confirm it back in one line, list the fix you will apply for each question it covers, and proceed |
| "Stop asking" | Stop. It does not hand you the decisions. The remaining questions stay open, their fixes are not built, and the work that depends on them stays blocked. List them in one message, one line each |

**Test every reply before you write `Recorded:`.** Does it hold a word of doubt — guess, think, probably, maybe, might, suppose, whatever, not sure — or end in a question mark? Then the question is still open and you ask the user to say which they mean, even when the same reply also holds "yes", "sure", or "ok" ("mm probably, sure" is not an answer). Beyond that test, judge whether the reply picks an action beyond doubt, not whether it contains a certain word. Doubt keeps the question open, whether it comes with a yes, a no, or a direction of their own ("no, probably leave it").

When the user's question makes you change your recommendation, say that it changed and why, and move `(recommended)` to the new option in the **Your call** list.

A message that asks again does not repeat the full template. It holds only these things: the answer to what they asked (when they asked something), one line that says the question is still open and why, and the **Your call** part. The still-open line is never left out, also when the reply held a question: a user who wrote "ok, but what about X?" may believe they have answered. No new issue, no second question.

**Do not go and investigate in the middle of the run unless the user asks you to.** You checked everything before the first question; the run itself is for asking. When a reply needs checking — a direction of the user's own, a condition, a later question whose facts the answer changed — note it and keep asking. All of those checks happen once, after the last question (step 6). A request from the user, in any form ("can you check whether it supports X?", or a plain question whose answer you do not have), is the one reason to look into something now.

When a question closes, the next message opens with one record line — `Recorded: <the decision, in plain words>.`, with `I will check it after the last question.` added when it is noted *to check* — and then holds the next question in full. If the answer changed a later question, rewrite that question from what you already know; leave new checks to step 6. After the last answer, step 6 takes the place of that line. Do not build anything between questions unless the user tells you to; a later answer can change it.

### 6. After the last question: come back once, then build

First do the checks you noted as *to check*: each direction of the user's own, each condition, and each later question an answer changed, checked as you checked the fix in step 2. One that holds stays closed. One that does not comes back to the user: reopen that question, one per message, with its heading text, one line on what your check found, and a **Your call** part that fits what you now know. A new question that the checks turned up is asked now too, in the full template. The same reply rules apply to these.

Then send one short message: every decision, one line each, in plain words, plus any question that stayed open and why. Then do the work the questions were blocking, exactly as decided. Build an applied fix as it was described. Do not build a rejected fix. Build a different direction as the user stated it. Work that depends on a question that stayed open stays blocked; say which.

## The template

```markdown
### Question <N> of <M> — <the claim, in one plain sentence>

**The situation.** <What exists, what is unsettled, and why the codebase cannot settle it. Two to four sentences.>

**The flow.**

1. <Step one: what the person or system that uses this code does first.>
2. <Step two.>
3. <The last step: the consequence they would notice.>

**The fix.** <What you recommend, in one to three sentences.>

**Cost.** <What the fix costs — lines, a migration (a change to the database structure), a dependency, a change someone would notice — or `None`.>

**Your call:** <the question, in a few words>

- <The fix (recommended): its consequence, on one line. Bullets only when the decision is a choice.>
- <The next alternative and its consequence. Two to four bullets in all; none when the question is `accept?`.>
```

The four bold labels **The situation.**, **The flow.**, **The fix.**, and **Cost.** are mandatory, in this order, spelled exactly like this, followed by a bold **Your call:** line. A question missing one part is not finished. Every question is numbered in its heading. The heading is `###`. Write each part as one unbroken line; do not wrap prose at a column.

## What goes in each part

- **The heading** is the claim: what goes wrong, or what is undecided, as one sentence a reader can agree or disagree with. "The two 'at the same time' tests could pass without ever running in parallel", not "Test parallelism". It states the problem or the open point, never the recommendation. Test it: if the heading could be pasted into **The fix.**, it is a recommendation, so rewrite it as what is wrong or undecided today. A heading with "should" or "will" in it almost always fails this test ("Archive should reuse the 30-day window" is the fix, and it belongs in **The fix.**). It is a statement, so it never ends in a question mark: "Audit exports would inherit the five-minute cache lifetime", not "Should audit exports use the same lifetime?". Never a bare topic, never a code identifier alone. **One question holds one decision:** the heading, the fix, and **Your call** are all about the same thing. If the fix solves one problem and **Your call** asks about another, that is two questions.
- **The situation** gives the facts the decision rests on: what the code or the plan does today, what is not settled, and why it is the user's to settle and not yours. A function, file, or flag named here is explained in the same sentence. The reader may not be able to see the code.
- **The flow** is a numbered walk, step by step, through what the consumer of the code — a user, an operator, the next process, the next developer — does and what they hit. It ends at the consequence they would notice. **It walks one path:** what happens today, or what would happen without the fix. A step that forks ("if we pick A, this; if we pick B, that") is really the alternatives written as a step; they go in **Your call**. It lets the reader see what the decision does instead of working it out from a description. **Three to five steps, one line each.** A flow with only one or two real steps is the written exception: write it as it is, and never pad a flow to reach three. For a button label, the whole flow is `1. Someone opens the page and sees two buttons, "Download CSV" and "Export PDF", and stops to work out whether they differ.` Go past five only when it is absolutely needed: removing any step would hide how the consequence comes about. Never go past ten. A flow that needs eleven steps is two questions, or a situation that says too little. Write `**The flow.** N/A` only when no person or system would ever notice the decision. `N/A` is for a flow that does not exist, never for one you did not write.
- **The fix** is your recommendation: the one path you would take and why, in plain words, checked in step 2. It names no other path; the alternatives go in **Your call**. When the choice is pure preference and nothing supports one side, write `No recommendation: this is a preference.` The options go in **Your call** with none marked `(recommended)`, and **Cost** reads `Depends on the option; see each line.`
- **Cost** is what the fix costs, and only the fix: lines, a migration, a new dependency, a new background process, a behavior someone would notice. Not what the alternative would cost, not what the fix saves; an alternative's price is its consequence, and it goes on that alternative's line in **Your call**. `None` is a legitimate value and is written out, never left blank.
- **Your call** is the question itself, in a few words. It has one of two forms. When the only real choice is the fix or nothing, it is `accept?` with no list. When the decision is a choice, it names the choice and lists two to four alternatives as bullets, each with its consequence on the same line; the fix is the first bullet, marked `(recommended)`. Never `accept?` over a list that leaves the fix out. A bullet with no consequence ("No, use a different approach"), or a list that is only yes and no, is really a plain `accept?`: write `accept?` and drop the list. The user may answer in their own words; the alternatives are a convenience, not a form.

## Count the words; do not judge length by feel

The prose of a question — from its heading to the end of **Cost**, not counting **Your call** — is at most **200 words**. On the rare flow that must run past five steps, each step past the fifth adds 15 words to the limit. Inside that: the heading at most 15 words; the situation two to four sentences; the flow three to five steps of one line each (one or two when that is the whole story, more than five only when absolutely needed, never past ten); the fix one to three sentences; the cost one or two. **Your call** is one sentence plus at most four alternatives of one line each. A fact stated in the situation is not repeated in the fix or the cost. Count the prose words before you send the message — `wc -w` on the text, or by hand. Over the limit: cut, starting with anything that describes an alternative outside **Your call**. Do not print the count in the message.

## The worked example

Nothing in it can be removed without losing something the reader needs. The agent had checked, before asking, that the freeze test it points to exists and uses the pattern it describes.

```markdown
### Question 2 of 4 — The two "at the same time" tests could pass without ever running in parallel

**The situation.** Two acceptance tests exist to prove the design is safe with several workers: "three workers process three wallets of one bulk request at once", and "two janitors on the same rows don't fight". The plan names the tests but not how they must run. This codebase's habit for "simulate several copies" is to call the function twice, one after the other — which proves nothing about racing.

**The flow.**

1. Implementer writes the three-workers test as three sequential calls. Green.
2. The claim step has a subtle flaw: two workers can both win the same job under real contention.
3. Never seen in tests. Seen in production as a wallet submitted twice.

**The fix.** Both tests must launch real parallel workers with a shared start gate and a small injected delay to widen the race window — the exact pattern one existing freeze test already uses. Assert exactly one winner per job.

**Cost.** None. It's a requirement on the test, not on the code.

**Your call:** accept?
```

## Rationalizations — and the answer to each

| The thought | The answer |
|---|---|
| "The question tool is quicker for the user" | It cannot hold the situation or the flow, and those are what make the question answerable. Plain chat, every time |
| "These three are small; I'll ask them together" | One per message. Three small questions in one message is the long, hard-to-read message the user invoked this skill to avoid |
| "I'm fairly sure the fix works" | "Fairly sure" is a belief. Check it, or write `Not verified:` in the fix |
| "It was only an `accept?`, and they said 'fine I guess' — close enough" | "I guess" is the user telling you they are not sure. Ask them to say which they mean; a wrong "Recorded:" costs far more than one line |
| "The code already follows a pattern, so no decision is needed" | You offered the user a choice, so the choice is theirs. The pattern is why you recommend one option. Put it in **The fix.** and ask |
| "They said 'sounds fine', that's a yes" | A yes names the thing it agrees to. When you cannot tell, the question is open; ask the **Your call** part again |
| "They have not replied; I'll go with my recommendation so the work moves" | Silence is not consent. The question stays open and the blocked work stays blocked |
| "The flow is obvious, I'll write N/A" | If anyone would notice the decision, there is at least one step. Write it; one or two steps is a valid flow |
| "This one needs seven steps" | Three to five is the rule. Try to cut it first: a step the reader could guess is not a step. Past five only when cutting any one hides how the consequence comes about; past ten, it is two questions |
| "I'll start applying the first answer while I ask the second" | A later answer can change it. Work starts after the last answer, unless the user says otherwise |

## Red flags — stop and fix

- A question sent through the harness question tool
- Two questions in one message, or a message that lists every open question
- A question asked before its facts and its fix were checked; a fix that names an API, flag, version, command, or number you did not look up; an unchecked part with no `Not verified:` line
- A question that a file or a command could have answered
- A bold label missing, renamed, or reordered, or a heading without a number
- A heading that is a topic ("Retry policy") or a question ("Should we retry?") instead of a claim; a heading about one decision over a **Your call** about another
- Alternatives written inside the **Your call** sentence instead of as a bulleted list, or a list that leaves the fix out
- A question closed "by a fact" when the fact was only today's value and the decision was whether to keep it; an "A or B?" question closed by you because the code follows a pattern; a question invented out of a fact you just confirmed
- `No recommendation` in **The fix.** with `(recommended)` in the list below it
- A message that asks again without saying what you could not tell, or that raises a new issue
- Stopping in the middle of the run to investigate something the user did not ask you to look into
- A flow step that forks into the alternatives ("if A… if B…") instead of walking one path
- A heading that could be pasted into **The fix.** ("X should…", "X will use…", "X follows…"); a **Your call** bullet with no consequence, or a yes/no list
- A flow written as prose instead of numbered steps, a flow over five steps that was not absolutely needed, a flow over ten steps, a flow padded with a step that describes nothing real, or `N/A` on a decision somebody would notice
- A function, file, or flag named with no plain-words explanation in the same sentence, or a flow step that only a reader of the code could follow
- A cost left blank, a cost that prices the alternative, or a fix that describes a second path
- Prose over the word limit, more than four alternatives, or a fact repeated between the situation and the fix or cost
- A `Recorded:` line after a reply that holds a word of doubt; a number or estimate in an answer that nothing you checked supports
- Moving to the next question, or doing blocked work, after a reply that was vague, partial, or a question back
- Text after the **Your call** part of a message

## Checklist

- [ ] Every open question collected, unconfirmed assumptions included; none invented
- [ ] Each one checked: facts re-read now, fix verified or marked `Not verified:`, questions a fact could answer dropped and reported in one line
- [ ] Ordered so the answerable and most-unblocking come first; numbered `N of M`
- [ ] One question per message, plain chat, full template, flow of three to five steps (one or two when that is the whole story, more only when absolutely needed), words counted
- [ ] Every question closed by a direct apply, reject, or different direction; doubtful or vague replies asked again on the spot; the user's own directions and conditions noted, checked once after the last question, and brought back only when a check fails
- [ ] Decisions listed, one line each, after the last answer; work resumed exactly as decided
