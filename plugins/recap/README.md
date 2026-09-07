# recap

A Claude Code skill that ends a session with a recap the person managing the
agent can actually use: **the result, not the journey.**

## The problem

Ask an agent "what did we do?" at the end of a long session and you get a
long, unstructured report. Every file it touched, by path. Every function and
type, by name. The test it edited and then reverted. The linter warning it
silenced. The unrelated test fixture it patched to make the tests pass. The
idea it had, argued with itself about, and dropped. That is the agent's diary.
It shifts the work of finding out what happened onto the one person who
cannot see the code. They never opened it. They ran an agent against a
codebase, known or unknown, and watched tool calls scroll by.

Meanwhile the two things that matter most are buried or missing. One is the
choices the agent made for you without asking. The other is the decisions
only you can make before the work can safely go further.

## What the skill does

It sets the recap to six parts and a closing line, in order, and to the
shortest form the content allows — a session with one open item recaps in
three sentences:

1. **Result.** Two or three sentences: what was built, why you asked for it,
   how it works in plain words, and whether it is done, partly done, or not
   done. A reader who stops here still has the answer.
2. **What you have now.** What the system does that it did not do before,
   from your side of it. Behaviors, never files. The only names allowed are
   the ones you will type or set — environment variables, flags, commands.
3. **Decisions made for you.** Every choice the agent made where your ask was
   silent and that is now part of the result: a default, an exemption, an
   approach. Each comes with the alternative and the reason, so you can
   reverse it in one reply. Never skipped: a silent decision is how the next
   step gets built on a choice you never agreed to. An idea the agent tried
   and dropped on its own, or a statement it made and then corrected, is not
   a decision; it left nothing behind, so it is cut.
4. **Changes you did not ask for.** Anything touched outside the ask, stated
   as what is different now, not how it was found.
5. **Decisions for you and things to watch.** Breaking changes, defaults that
   affect existing users, risks noticed but not acted on, work left undone on
   purpose — each with its consequence and options.
6. **Verified, and not.** What was actually checked, in words, and the commit
   state.

Two filters cut everything else. The **journey filter** removes any sentence
that describes how a result was reached instead of the result ("first",
"then", "reverted", "turned out"). The **delete filter** removes any sentence
whose loss would cost you nothing you must know, decide, or watch for — which
takes out every check that came back fine, every reviewer that found nothing,
and every "I verified this one myself." Exceptions get sentences;
confirmations share one line or none. If you want the detail behind a
conclusion, you ask, and the agent answers that one question.

Then one closing line: **the single next action**, small enough to start now
— the question to answer, the command to run, the word to say. One, not a
menu. If nothing is open, it says the work is finished and stops. That line
replaces "let me know if you need anything else", which hands you an empty
choice at the moment you need a starting point.

Three rules keep the parts readable when a session was busy. Every list is
capped at five items and ranked, worst consequence first; past five it splits
into what to settle now and what can wait, and nothing is dropped in the
split. Every amount of work, time, or risk carries a real unit — "about an
hour", "a day if the tests do not already cover it" — because "some work" and
"a few hours" register the same and neither lets you plan. Anything you have
to do in more than one step arrives as a numbered list, one action per step.

The shape bends in four cases, and only these four: you ask to be walked
through what happened, so the journey is what you get; something can be
destroyed or cannot be undone, so it goes first and in full; you asked which
way to go, so the ranked options are the answer; or a caveat is small but you
must act on it, so it survives every cut.

The agent writes every sentence in Simplified Technical English (the
ASD-STE100 standard) for a reader who never saw the code: short, active,
present tense, no unexplained names. If the `effective-communicator` skill is
installed, the agent uses it. If it is not, the skill reads its own short
copy of the same rules, `communication.md`. The recap comes out the same
either way.

## Install

**Claude Code:**

```
/plugin marketplace add patrickdappollonio/claude-plugins
/plugin install recap@patrickdappollonio
```

**Any other agent** — Cursor, Codex, Copilot, opencode, Gemini, and 70+ more — via
[`npx skills`](https://github.com/vercel-labs/skills):

```bash
npx skills add patrickdappollonio/claude-plugins --skill recap
```

Add `-g` to install for your user instead of just this project, and `-a <agent>` to
target one agent. Update later with `npx skills update`.

Then, at the end of a session: *"Recap this session."*

## Credits

The rules for ending on one concrete next action, sizing work in real units,
capping and ranking lists, and refusing the stock opener and closer come from
[`i-have-adhd`](https://github.com/ayghri/i-have-adhd) by ayghri, which shapes
an assistant's whole output for a reader who cannot hold much on screen. This
skill applies that shaping to one message — the end-of-session recap — rather
than to every response.

## License

MIT.
