# effective-communicator

A Claude Code skill that keeps agent messages readable by the person actually
reading them — who, more often than not, **cannot see the code the agent can
see.**

## The problem

Agents are usually used on a surface where the person cannot open a second
terminal and poke around the codebase. Yet findings routinely arrive like this:

> `IsFullList` / `IsValidSource` are closed switches hardcoded to two providers.
> If the others aren't added, the drop-off check silently never runs for them.
> `last_synced_at` has no write path — the safety column is dead on arrival.

To a reader who can't see the file, this means nothing. They don't know what
`IsFullList` is, whether a human wrote it, or whether the name even means what it
claims. Quoting files, line numbers, function names, and variable names shifts the
work of understanding onto the one person who can't do it.

## What the skill does

It makes plain-language the **default** for every user-facing message — no one has
to remember to say "the reader is non-technical." It teaches the agent to:

- **Translate every identifier.** A function or variable name is a label for a
  thing to explain in plain words, never the explanation itself. Every sentence
  must still make sense with the name deleted.
- **State effect first, label last.** "The safety check only writes a log line
  instead of stopping" — not "`maxRemovalRatio` only calls `log.Printf`."
- **Write in Simplified Technical English (ASD-STE100)** — short sentences, one
  idea each, active voice, present tense, common words, no unexplained jargon.
- **Keep the important point in the final message of the turn**, so it doesn't
  scroll off-screen behind a pile of tool calls, and lead with the outcome.
- **Write for how attention works** — small working memory (restate the state,
  don't ask the reader to "keep in mind" things), lead with the action not the
  run-up, finish one point before raising the next, make finished work visible,
  and be specific when size or risk matters. These tenets are adapted from the
  [i-have-adhd](https://github.com/ayghri/i-have-adhd) skill by ayghri — but with
  an explicit **balance-not-brevity** rule: never drop a real finding to be short.
- **Match technical readers when they ask.** If the reader wrote the code or
  replies in code terms, precise jargon is fine *for that exchange* — then it
  resets to plain for the next turn and the next reader.
- **Offer a deeper dive in plain prose** rather than forcing it.

It composes with other skills: when a review, scan, audit, or debug pass (e.g.
`adversarial-review`, `improve`) hands over findings full of identifiers, this
skill governs the message the agent actually sends — translate first, then send.

## Installation

Add the marketplace and install the plugin:

```
/plugin marketplace add patrickdappollonio/claude-plugins
/plugin install effective-communicator
```

## License

MIT.
