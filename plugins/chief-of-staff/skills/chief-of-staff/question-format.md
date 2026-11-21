# Question Format — how a decision is put to the user

A question to the user is a decision only they can make, written so they can make it away from the code, in one reading. The user did not see the files you read or the reports your subagents sent.

## Before a question is written

Drop a candidate question when a fact answers it, when trying it answers it, when the user already decided it in any earlier message (quote their words in the record), or when only one option works. For one that survives:

- **Check every fact in it now**, in the source.
- **Compare at least two fixes** and recommend the most correct, not the first that works or the cheapest. One candidate is always fixing the problem where it starts, not where it shows.
- **Check that your recommendation works:** what it names exists in the installed version and fits where you say. A part you could not check ends the recommendation with `Not verified: <what>, because <why>.`

## The full form

```markdown
### Question <N> of <M> — <the claim, as one plain sentence>

**The situation.** <What exists, what is unsettled, and why the code cannot settle it. Two to four sentences.>

**The flow.**

1. <What a named person does first: a customer, an operator, a developer who uses this.>
2. <The next step.>
3. <The consequence they would notice.>

**The fix.** <The one path you recommend, and why. One to three sentences.>

**Cost.** <What the fix costs or risks, or `None`.>

**Your call:** <the question, in a few words>

- <The fix (recommended): its consequence, on one line>
- <The strongest alternative: its consequence, on one line>
```

- **All four bold labels, in this order**, then *Your call* with two to four alternatives, or `accept?` with none. `M` counts the questions answered so far plus those open.
- **At most 200 words** from the heading to the end of the cost. Count them.
- **Plain words.** A file, function, flag, or internal term appears only when the same sentence says what it is. Name what is on screen by its label and its page. Use one concrete example.
- **The flow follows a person**, never a lock, a queue, or a table: three to five steps of one line each, or one or two when that is the whole story.
- **One decision per question**, and never through the harness's multiple-choice question tool.
- **A changed goal** is asked the same way, in neutral words: the situation says what the user asked for and what was learned since.

## The short form

A decision takes three lines instead whenever every one of these holds; read the draft once against them, and write nothing down. One that fails a check, which is usually a detail the user has not yet talked through, takes the full form.

1. The user has already talked about this subject in this conversation.
2. Every term in it is one the user has used, or is explained in the same sentence.
3. Nothing in it points at an earlier message or at something only you saw.
4. There are exactly two ways to go, and each line says what a person would notice.
5. The user can decide without knowing how the thing happens step by step.

```markdown
### Question <N> of <M> — <the claim, as one plain sentence>

<What is unsettled and what you found, in one or two plain sentences.>

**The trade-off.** <What the way you recommend gains and what it costs, in one sentence.>

**Your call:** <the question, in a few words>

- <The way you recommend (recommended): what a person would notice>
- <The other way: what a person would notice>
```

At most 60 words come before *Your call*. Never use it once the user has said a question was unclear or asked to be asked again. When the reply asks for context or more detail, ask that question again in the full form at once.

## Where it goes

- **One question in full per message**, at the end of the last message, under *Pending for you*. The other open questions follow as one line each.
- **Every open question is named in every last message** until the user answers it.
- **An open question blocks only the work that depends on it.**
- Asking whether to continue, or whether to start building, is not a question in this format. It is one plain line, with no number, no recap, and no options.

## After the answer

- **Speak first.** Before any tool call, say back in one sentence what the answer means for the product.
- **Give your take** when the user chose something other than your recommendation. Check a concern in the source or with a proof of concept before you raise it, raise it once, and when the user keeps their answer it is decided.
- **Only a direct answer closes a question:** accept, reject, or a different direction, in words that leave no doubt. After a vague reply, say what you could not tell and put *Your call* again. Never answer your own question, and never treat silence as a yes.
