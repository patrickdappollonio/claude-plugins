# Read The Docs First

Ground answers in current official documentation instead of model memory.

Model memory ages: APIs drift, majors ship, defaults change, and an agent that
"remembers" how a library works will confidently write last year's code. This
skill forces a docs-first pass whenever the task touches something external or
fast-moving — the agent web-searches for the current official docs, reads the
pages closest to the task, and only then implements or answers.

## What it does

- Defines concrete **docs-first triggers**: adding or upgrading packages,
  provider SDKs and fast-moving frameworks, anything touching auth, billing,
  webhooks, migrations, rate limits, or compliance, errors that smell like API
  drift, and user requests for "latest"/"current"/"official" behavior.
- Ranks **what counts as authoritative**: local repo docs, specs, and schemas
  for internal behavior; official docs, migration guides, changelogs, and SDK
  source for third-party behavior; package registry metadata for versions.
  Stack Overflow and old blog posts are for debugging symptoms, never the
  primary contract.
- Prescribes a **required workflow**: identify the exact surface, search for
  the official docs, read the closest pages, extract the few facts that
  matter, implement, verify with the smallest useful check, and name the
  sources consulted.
- Knows **when to stop**: trivial edits, self-contained code, or answers
  already in the repo don't need a web pass — and if docs are unreachable, the
  agent says so plainly instead of presenting memory as confirmed-current.

## When to use it

Use it when implementing, integrating, upgrading, or debugging anything that
involves third-party APIs, libraries, frameworks, CLIs, cloud services, or
model/provider SDKs — and any time the answer would otherwise start with
"usually" or "I think".

Skip it for trivial language syntax, typos, formatting, or self-contained code
with no external contract.

## Installing

Add the marketplace, then install the plugin:

```
/plugin marketplace add patrickdappollonio/claude-plugins
/plugin install read-the-docs-first@patrickdappollonio
```

## Running it

The skill activates on its own when a task matches its triggers, or you can
invoke it explicitly:

```
/read-the-docs-first:read-the-docs-first
```

## Inspiration

A work-friendly rewrite of the `read-the-damn-docs` skill, keeping its
battle-tested triggers and workflow with the naming cleaned up.
