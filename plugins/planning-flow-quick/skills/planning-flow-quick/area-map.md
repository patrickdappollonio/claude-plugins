# Area Map — the patterns and tests around the change, without mapping the whole repository

A quick plan still has to answer "how is this done here?" for the code it touches, or the change ends up in a style the rest of the repository does not use, with a test nobody would have written that way. It does not need the answer for the whole repository. This file says how to find the answer for the area the change touches, and where to stop.

## Use a codebase map when one exists

The `planning-flow` skill keeps a map of the whole repository in `codebase-map.md`, in `.plans/` or `.planning-flow/` at the repository root. Look in both folders.

- **A map exists.** Read the sections that bear on the change: *Structure*, *Modules*, *Patterns and conventions*, *Recipes*, *Testing*, *Test inventory*, and *Repository rules*. Treat what you read as a starting point, not as evidence: the map may be older than the code. Confirm every fact you copy into the plan against the current code before you copy it. When the area the change touches has changed since the commit stamped at the top of the map (`git diff --name-only <sha> -- <paths>`), read that area from the code instead.
- **Never build, refresh, or re-stamp the map.** That is `planning-flow`'s work, and a partial map written by this skill would look complete to it. When you find a line of the map that is wrong, say so in one line in chat; do not edit it.
- **No map exists, and the area is small:** the files the change touches, their neighbors, their tests, and the instructions files come to about ten files. Read them yourself, in the order below, and answer every numbered question in both explorer prompts, the conventions and the repository's rules included; reading the files yourself is not a reason to skip a question. Two subagents cost more than the reading.
- **No map exists, and the area is bigger:** run the two scoped explorers below.

## The two scoped explorers

Dispatch both on the cheaper tier (Claude Sonnet or Haiku; GPT-5.6 Terra or Luna), in one message. When the harness cannot choose a model, run them on the session model and say so once. Each gets the ask, the files you already know the change touches (or the words to search for when you do not), and its prompt below. Each returns facts with `path:line` evidence; you read the evidence, not its conclusions, and ask for the line when a fact you need has none. Their reports arrive on their own: never loop, sleep, or poll while you wait.

### Where an explorer reads, and where it stops

Read, in this order, and stop when the questions are answered:

1. The files the change touches.
2. Their neighbors: the other files in the same directory, package, or module.
3. Their tests, and the test helpers those tests use.
4. The repository's instructions files: `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, lint and format configs.
5. Further only when a fact sends it there: a helper the code calls, a registry the new thing must be added to, the CI step that runs the tests.

Three to five examples per pattern are enough. Never read a range twice. Never read or quote a secret (`.env` files, keys, tokens): note the path and move on.

### The patterns explorer

> You are finding how code is written in one area of a repository, so a small change there matches the code around it. The repository is at `<path>`. Do not edit anything.
>
> The change: <the ask in one sentence>. It touches, as far as we know: <files or search words>.
>
> Read the files the change touches, their neighbors in the same directory or module, and the repository's instructions files (`CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, lint and format configs). Go further only when a fact sends you there. Never read a secret.
>
> Return, each with `path:line`:
> 1. Where each part of the change goes, and the closest existing example of each thing it creates or modifies.
> 2. The conventions in this area: naming, how user-facing strings and messages are written, error handling, logging, configuration, how a new thing is wired in (a registry, a list, an import). For each, a short excerpt of the example, not a list of files.
> 3. Where two conventions live side by side, which is newer (from `git log`), and that you would follow it.
> 4. The repository's rules that bind this change, stated as rules.
> 5. Every other place the same thing appears (the same string, the same value, the same behavior), so the change does not miss one.
> 6. Anything you could not find. Say so plainly; do not guess.
>
> This is a single task. Return your result when you are done and end; nobody will send you further instructions. If a command may run longer than three minutes, run it in the background and check it with a wait capped at three minutes, again and again, until it finishes; report only once it has.

### The tests explorer

> You are finding how one area of a repository is tested, so a small change there extends the right tests instead of adding new ones. The repository is at `<path>`. Do not edit anything.
>
> The change: <the ask in one sentence>. It touches, as far as we know: <files or search words>.
>
> Read the tests for the files the change touches, the helpers and fixtures they use, and how the test suite is run (the Makefile, the package scripts, the CI workflow). Go further only when a fact sends you there. Never read a secret.
>
> Return, each with `path:line`:
> 1. The exact commands to run the whole suite, the tests for this area alone, and one test; plus the lint, format, and type checks CI runs.
> 2. For each surface the change touches (a command, a function, a page, an endpoint, a string), every existing test that exercises it: the file, the test name, and its setup, action, and assertion in one line.
> 3. Where a new case for this change would go, and which existing test performs most of its setup and action steps.
> 4. How a typical test in this area is built, with one example.
> 5. What the test commands touch: only this machine, a disposable local stack, or something shared (read the config and environment variables they use). Do not run them.
> 6. Surfaces the change touches that have no test.
>
> This is a single task. Return your result when you are done and end; nobody will send you further instructions. If a command may run longer than three minutes, run it in the background and check it with a wait capped at three minutes, again and again, until it finishes; report only once it has.

## After the explorers

- Copy the values into the plan's *Technical context*: the pattern in words with its example, the exact strings, the commands, and the tests to extend with what each does. Never a pointer: the plan check and the implementer do not get the explorers' reports.
- A follow-up question goes to a **new** explorer with the earlier answer in its prompt, never to one that already reported.
- When an explorer reports that the area has no example of the thing the change creates, that is the *No pattern to follow* sign in `SKILL.md`. When its answer reaches a second subsystem or a sensitive area, that is a sign too. Warn as `SKILL.md` says.
- When an explorer finds the same thing in more places than the ask named, and the ask said "all" or "every", those places are inside the ask. When it did not, whether to change them is a question for the user.
