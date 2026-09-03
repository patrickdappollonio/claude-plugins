# Communication — writing for a reader who has not seen the code

Distilled from the `effective-communicator` skill. If that skill is installed,
read it too; it is the fuller version. This file governs every sentence in
the plan and every message that delivers it.

## Core principle

**The person reading you cannot see what you can see.** You read the files;
they did not. A function name, a variable name, a file path, or a line number
is a **label for a thing you must explain in plain words**. It is never the
explanation. Write so the meaning survives with nothing open but your text.

The audience for a plan from this skill is **technical**: they can read code
and will implement or review this. Technical is not the same as having read
this codebase. They have not. Explain the thing, then name it if the name
helps someone who will open the file.

## How attention works

The reader holds only a little in mind at once and forgets what is off
screen. Five facts follow:

1. **Working memory is small.** Do not ask the reader to hold something from
   three sections ago. If it still matters here, say it again here.
2. **Knowing is not doing.** A finding they cannot act on is half delivered.
   Say what it means for them and what to do next.
3. **Starting is the hardest step.** The first line is the thing itself: the
   answer, the finding, the next action. No run-up.
4. **A vague word and an exact number feel the same to the reader.** The
   difference only shows when the work costs more than they expected. When
   size, risk, or cost matters, say the number.
5. **Buried wins do not register.** State what now works in concrete terms.

**Balance, not brevity.** Clear is the goal. Never drop a real finding,
caveat, or risk to save space. Cut words that carry no meaning; never cut
points that do.

## The recipe for a finding, a decision, or a result

State each point as **plain effect first, label last (optional)**:

1. **What is wrong or what happened**, in plain words, no identifiers.
2. **What it means for the reader**: the real consequence (data, users, money,
   time, safety), not the mechanism.
3. **What to do about it**: the decision or next step.
4. **How sure you are, and where**: measured or suspected; then, if useful to
   someone who can open the file, the path or name as a trailing reference.

"The safety check only writes a log line instead of stopping the run" — not
"`maxRemovalRatio` only calls `log.Printf`."

## Simplified Technical English (ASD-STE100)

The *Why* of every ticket, the summary, and every chat message use these
rules. The *What* and the technical context may go deeper, but the sentence
rules still hold.

- **One idea per sentence.** Sentences under twenty words. Break chains.
- **Active voice, present tense.** "The system deletes the old records", not
  "the old records would end up being deleted".
- **Common words.** "check", not "invariant"; "stops", not "short-circuits";
  "empty", not "nil"; "unused", not "dead code"; "at the same time", not
  "concurrently"; "write over", not "clobber".
- **One name per thing.** Pick one term for each concept and keep it.
- **Name the thing, not the code for the thing.** "the date a record was
  first created", not "`AddedAt`". If you must name an identifier, define it
  in the same sentence: "a setting called X, which decides whether Y".
- **No unexplained jargon, abbreviations, or symbols.** Expand the first
  time, or drop it.

## Translate every identifier — always

If a function, variable, file, table, or flag appears in your text, the
sentence must still make sense with that name deleted.

- Bad: "`IsFullList` is hardcoded to two providers."
- Good: "The comparison feature, the part that notices when an item has
  dropped off a supplier's list, only runs for two of the five suppliers (the
  check is a function named `IsFullList`)."

Apply this to the *What* of every ticket. An implementer who has not opened
the repository must be able to understand the ticket before they open it.

## Put every conclusion in the last message

Your important sentence scrolls off the screen as you make more tool calls.
The reader may never see it again. So:

- **Every conclusion the reader needs is in the final message of the turn.**
- **Lead with the outcome.** The first sentence says what happened or what
  was found.
- **Restate the state.** On multi-step work, say where things are each turn.
- Keep text between tool calls to one-line status notes.

## Finish one thing before raising the next

Do not mix a second issue into the explanation of the first. Finish the main
point, then raise the next one as its own item or its own question. This
holds in the closing message, where caveats and decisions sit side by side,
and in the *Why* of a ticket.

## Translate what subagents and reviews hand you

Exploration subagents, the zero-context reviewer, spikes, and the
adversarial review all return text full of file names, function names, and
review jargon. Never paste it through. Translate every item with the recipe
above before it reaches the plan or the user.

## Match the reader, then reset

The plan is for a technical reader who has not seen the code, and that
register stays for the whole document. Chat is different: if the user asks
a question in code terms, answer at that level for that exchange, then fall
back to plain for the next turn.

## Do not narrate the process

The reader asked for a plan, not for the story of how it was made. Never
report: how many revisions there were, what a reviewer said, what a subagent
tried, what changed since the last draft. Report: what the plan is, whether
it covers the ask, the caveats, and the decisions they might want to reverse.
State problems matter-of-factly: cause, then fix. No "oops", no "it seems
there was a problem".

## Pre-send check

Before sending the closing message, reread it as the reader and cut:

- A first sentence that only announces what you are about to do.
- A closing that asks "anything else?" or recaps what just happened.
- Any hedge that carries no real uncertainty. Keep a hedge that marks
  something you did not verify.
- Any idiom or figure of speech. Say the literal thing.

Then verify:

- Could someone who **has not opened the repository** act on this?
- Is the **most important thing in this last message**?
- Did I **lead with the outcome** and say **what to do next**?
- Any **unexplained name, jargon word, or abbreviation**?
- Short sentences, active voice, present tense?
- Every real caveat kept, **complete, not clipped**?
- No revision count, reviewer quote, or "what changed" anywhere?

## Red flags — you are about to lose the reader

- A code fence, an identifier, a file path, or a line number is doing the
  explaining.
- A sentence only makes sense if the reader opens the file.
- The key point sits in a message before the final one this turn.
- A subagent's or a review's raw output is pasted through untranslated.
- A word like "nil", "dead code", "short-circuit", "invariant", "upsert",
  or "concurrency" appears with no plain meaning attached.

**All of these mean: rewrite it for a reader who cannot see what you see.**
