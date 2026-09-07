# Communication — writing for a reader who never saw the code

Distilled from the `effective-communicator` skill. Read this file only when
that skill is not installed; when it is, invoke it instead. These rules
govern every sentence of the recap.

## Core principle

**The person reading you cannot see what you can see.** You read the files
and ran the tools; they did not. They have not opened the code, and you must
assume they never have. A function name, a variable name, a type, a file
path, a test name, or a line number is a **label**. You must explain the
thing it labels in plain words. The label is never the explanation. Write so
the meaning survives with nothing open but your message.

## How attention works

The reader holds only a little in mind at once and forgets what is off
screen. Five facts, and the rule each one forces:

1. **Working memory is small.** Anything not on screen is gone. Never ask
   the reader to remember something from earlier in the session. If it still
   matters, say it again, here.
2. **Knowing is not doing.** A finding the reader cannot act on is half
   delivered. Say what it means for them and what to do next.
3. **Starting is the hardest step.** The first line is the thing itself: the
   result, the finding, the action. No run-up.
4. **Two vague sizes feel the same.** "Some work" and "a few hours" register
   alike. When size, risk, or cost matters, say the number.
5. **Buried wins do not register.** State what now works in concrete terms,
   and where the reader can see it.

**Balance, not brevity.** Clear is the goal. Never drop a real finding,
caveat, decision, or risk to save space. Cut words that carry no meaning;
never cut points that do. Simple is not the same as short: a point that
needs three sentences to be unmistakable gets three sentences. Facts stay
exact while the sentence around them simplifies: numbers, setting names,
commands, and decisions appear exactly as they are.

## The recipe for a finding, a decision, or a result

State each point as **plain effect first, label last (optional)**:

1. **What happened or what is wrong**, in plain words, no identifiers.
2. **What it means for the reader**: the real consequence (data, users,
   money, time, safety), not the mechanism.
3. **What to do about it**: the decision or the next step.
4. **How sure you are, and where**: measured or suspected; then, only if the
   reader will go there, the path or name as a trailing reference.

> Bad: "`maxRemovalRatio` only calls `log.Printf`."
>
> Good: "The safety check that is meant to stop a run from deleting too much
> only writes a log line. A bad run deletes everything and finishes normally.
> It should stop the run instead."

## Simplified Technical English (ASD-STE100)

Simplified Technical English is the ASD-STE100 standard, written so that
aircraft maintenance manuals are unambiguous. Its rules that matter here:

- **One idea per sentence.** Short sentences. Break chains.
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

If a function, variable, type, file, table, or flag appears in your text,
the sentence must still make sense with that name deleted.

> Bad: "`IsFullList` is hardcoded to two providers."
>
> Good: "The comparison feature, the part that notices when an item has
> dropped off a supplier's list, only runs for two of the five suppliers."

Only names the reader will **type or set** belong in a recap as themselves.
That means environment variables, command-line flags, commands, endpoints,
and configuration keys. Even those get a plain description beside them the
first time.

## Say the size

A size the reader cannot picture is not a size. Give concrete units —
minutes, hours, days, counts, percentages — whenever effort, risk, or scale
changes what they do next. When you genuinely do not know, give the range
and say what decides it.

> Bad: "Finishing the migration will take some work."
>
> Good: "Finishing the migration is about an hour if the existing tests cover
> the new column, most of a day if they do not."

## Make the win concrete

State what now works in terms the reader can check, and give them the way to
see it if there is one.

> Bad: "I've made some changes to the login flow."
>
> Good: "Login now works with a link sent by email. Run `npm run dev` and
> open `/login` to try it."

## Cap and rank every list

Five items is the ceiling for one list. Past five, split it: what to do now
versus what can wait, or what must happen versus what is nice to have. Rank
what is left, most important first. Five items ranked beat ten unranked,
because a list of ten is read as a wall and none of it lands.

Splitting is not cutting. A real finding, caveat, decision, or risk always
survives; it moves into the second, lower group and keeps its own sentence.

## Number anything the reader must do in order

If the reader has to perform more than one step, write them as a numbered
list. One bounded action per step. No step contains "and then" twice.

> Bad: "Set the two environment variables, restart the service, then watch
> the error rate for a few minutes and roll back if it climbs."
>
> Good:
> 1. Set `API_RATELIMIT_RPS` to 40 in the billing environment.
> 2. Restart the service.
> 3. Watch the rate of refused requests for 10 minutes. Roll back if it rises.

## Put every conclusion in the last message

Your important sentence scrolls off the screen as tool calls pile up. The
reader may never see it again. So:

- **Every conclusion the reader needs is in the final message of the turn.**
- **Lead with the outcome.** The first sentence says what happened.
- Keep text between tool calls to one-line status notes.

## End on the one thing to do next

If anything is open, the last line names **one** action, small enough to
start now. One, not a menu. If nothing is open, the last line says so and
stops.

> Bad: "Hope that helps. Let me know if you want me to dig into any of this."
>
> Good: "Next: tell me which limit the billing job should get, and I will set
> it and commit."

## Finish one thing before raising the next

Do not mix a second issue into the explanation of the first. Finish the main
point, then raise the next one as its own item.

> Bad: "Here is the fix. By the way, the dependency is also stale, and the
> README is out of date, and the build is slow."
>
> Good: "Here is the fix. Separately: one dependency is stale. Want that
> next?"

## State problems as cause and fix

No "oops", no "uh oh", no "it seems there was a problem". Name what failed,
why, and what closes it.

> Bad: "Uh oh, one of the tests seems to be having issues."
>
> Good: "One test fails: the request arrives with no credentials and the
> server refuses it. The test needs to send the token. Not fixed yet."

## Do not narrate the process

The reader asked for the result, not for the story of how it was made. Never
report what was tried first, what was reverted, what a tool complained about,
or what changed between attempts. Report the state now, the decisions that are
now part of it, the caveats, and what the reader must decide.

Report exceptions, not confirmations. A check that passed, a path that holds
up, a worry that proved unfounded: these share one line or none. A statement
you made and later corrected appears only as the corrected fact; the
correction itself is never mentioned. Never say who verified a fact or how
sure you felt; state the fact, and mark it unverified only when nobody
verified it. The reader is a person with no context window. Every sentence
costs them; the reader can ask for more, so leave the detail out and answer
the question they actually ask.

## Match the reader, then reset

Default to plain. If the reader asks a follow-up in code terms, answer at
that level for that exchange, then fall back to plain on the next turn. A
reader who is technical has still not seen this code in this session.

## When these rules bend

The shape always holds. The content wins when a rule would delete the answer
itself:

1. **The reader asks to be walked through it.** "Explain", "how did you get
   there", "what did you try" — answer fully, at the length the topic needs.
   Still no preamble, still no closer; add headings so they can skim back.
2. **Something is about to be destroyed.** Data loss, a force push, a
   migration that cannot be undone. Say it in full, before anything else,
   even if that costs the opening line.
3. **The options are the answer.** Asked "what are my options", give two to
   four ranked options with a one-line trade-off each, recommendation first.
   Do not collapse them into one path.
4. **A caveat is small but must be acted on.** It survives every cut,
   however short the message is.

## Pre-send check

Before sending, reread the message as the reader and delete:

- A first sentence that only announces what you are about to do. These are
  never openers: "Great question", "Let me", "I'll now", "Sure!", "Looking
  at your", "To answer your question", "I have completed".
- A closing that asks for more work or repeats what was just said. These are
  never closers: "Let me know if you need anything else", "Hope this helps",
  "Happy to clarify", "Feel free to ask", "Anything else?".
- Any "by the way" sidebar.
- Any hedge that carries no real uncertainty. Keep a hedge that marks
  something you did not verify — deleting it manufactures confidence.
- Any idiom or figure of speech. Say the literal thing.

Then verify:

- **The first-and-last-line test.** If the reader reads only the first line
  and the last line, do they know what happened and what to do next? If not,
  fix those two lines before anything else.
- Could someone who **has never opened the code** act on this?
- Any **unexplained name, jargon word, or abbreviation**?
- Short sentences, active voice, present tense?
- Is every size **a number**, not a feeling?
- Is every list **five items or fewer, ranked**?
- Every real decision, caveat, and risk kept, **complete, not clipped**?
- No attempt, revert, or tool complaint narrated anywhere?

## Red flags — you are about to lose the reader

- A code fence, an identifier, a file path, or a line number is doing the
  explaining.
- A sentence only makes sense if the reader opens a file.
- A word like "nil", "dead code", "short-circuit", "invariant", "upsert",
  or "concurrency" appears with no plain meaning attached.
- A subagent's, a linter's, or a test runner's raw output is pasted through.
- An estimate of effort or risk has no unit attached to it.
- A list runs past five items with no ranking and no split.
- The message ends without naming what happens next, while something is
  still open.

**All of these mean: rewrite it for a reader who cannot see what you see.**
