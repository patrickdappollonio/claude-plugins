# Communication — writing for a reader who has not seen what you saw

Distilled from the `effective-communicator` skill. Read this file only when that skill is not installed; when it is, invoke it instead. These rules decide who the text is for and how it is structured; `SKILL.md` and `tells-catalog.md` decide which patterns it must not contain. Both apply to every sentence.

## Core principle

**The reader cannot see what you can see.** You read the code, the diff, the brief, and the conversation; they did not. A function name, a variable name, a file path, or a line number is a **label for a thing you must explain in plain words**. It is never the explanation. Write so the meaning survives with nothing open but your text.

## Know the reader of each destination

Before writing, name the reader and what they already have.

- **A README, docs, or a blog post**: someone deciding whether to use the thing, or trying to use it. They have not seen the code and may never. Explain what it does for them, then how to do it.
- **A PR description or commit message**: a reviewer or a future maintainer who can open the diff but was not in the session. They know the codebase in general, not this change. Say what changed and why before how.
- **A report, status update, or chat reply**: the person who asked. They want the answer to their question, not the story of how you found it.
- **A reader who is clearly technical here** (they wrote the code, or they asked in code terms) can have precise technical language for that exchange. The next reader and the next message go back to plain.

## Write for how attention works

1. **Working memory is small.** Do not ask the reader to remember something from earlier in the text or the conversation. If it still matters, say it again, here.
2. **Knowing is not doing.** A fact they cannot act on is half-delivered. Say what it means for them and what to do next.
3. **Starting is the hardest step.** The first line is the thing itself: the answer, the change, the result. No run-up.
4. **A vague word and an exact number feel the same** until the work costs more than expected. When size, time, cost, or risk matters, say the number.
5. **Buried wins do not register.** State what now works in concrete terms.

**Balance, not brevity.** Clear is the goal. Never drop a real finding, caveat, decision, or risk to save space. Cut words that carry no meaning; never cut points that do.

## The recipe for a finding or a result

State each point as **plain effect first, label last and optional**:

1. **What happened or what is wrong**, in plain words, no identifiers.
2. **What it means for the reader**: the consequence they care about (users, data, money, time, safety), not the mechanism.
3. **What to do about it**: the decision or the next step.
4. **How sure you are, and where**: measured or suspected; then, only if the reader can open the file, the path or name as a trailing reference.

"The safety check only writes a log line instead of stopping the run", not "`maxRemovalRatio` only calls `log.Printf`."

## Write in Simplified Technical English (ASD-STE100)

- **One idea per sentence.** Short sentences. Break chains.
- **Active voice, present tense.** "The system deletes the old records", not "the old records would end up being deleted".
- **Common words.** "check", not "invariant"; "stops", not "short-circuits"; "empty", not "nil"; "unused", not "dead code"; "at the same time", not "concurrently".
- **Name the thing, not the code for the thing.** "the date a record was first created", not "`AddedAt`". If you must name an identifier, define it in the same breath.
- **No unexplained jargon, abbreviations, or symbols.** Expand it the first time, or drop it.

## Translate every identifier

If a function, variable, file, table, or flag appears in your text, the sentence must still make sense with that name deleted. Names the reader will **type or set** (commands, flags, environment variables, configuration keys, endpoints) appear as themselves, with a plain description beside them the first time.

## Finish one thing before the next

Do not mix a second issue into the explanation of the first. Finish the main point, then raise the next as its own paragraph or item. State problems matter-of-factly: cause, then fix. No "oops", no "it seems there was a problem".

## Pre-send check

Reread the text as its reader and cut:

- A first sentence that announces what comes next ("This document describes …", "Let me explain …").
- A closing that asks "anything else?" or repeats what was just said. Offering one specific deeper dive in a chat reply is fine.
- A hedge that carries no real uncertainty. Keep a hedge that marks something you did not verify.
- An idiom or figure of speech ("circle back", "on the same page"). Say the literal thing.

Then verify:

- Could the named reader act on this with nothing else open?
- Does the first sentence give the answer, the change, or the result?
- Every real finding, caveat, and risk kept, complete and not clipped?
- Every identifier explained or deletable?

## Red flags

- A code fence, identifier, file path, or line number is doing the explaining.
- A sentence only makes sense if the reader opens the file.
- A subagent's, a linter's, or a test runner's raw output is pasted through untranslated.
