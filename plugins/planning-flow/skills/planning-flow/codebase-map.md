# Codebase Map — how the repository works today, mapped once and kept fresh

Step 0 maps the whole repository before any plan is drafted: its structure, its features, the flows a request or command takes through it, the services it exposes and who may call them, the patterns new code must copy, how it is tested, and the rules that bind it. The map is a file that every later plan in the same repository reuses, so a repository is mapped once and then only where it changed.

The map answers "how is this done here?" for every step after it. Exploration in step 2 starts from it instead of from nothing, the draft in step 3 copies its facts into *Technical context*, and the ladder in step 4 checks "the codebase already has it" against it.

## Where the map lives

- **Inside a git repository:** `codebase-map.md` in the plan folder (`.plans/` or `.planning-flow/`). Choose the folder and add its exclude line before writing the map, as *Where the Plan Lives* in `SKILL.md` says, so the map never shows up in the diff. Look for an existing map in both folders before deciding there is none. One map per clone or worktree, shared by every plan made there.
- **The session started in plan mode:** the harness lets you write only its plan file. Read an existing map if one is there and fresh. If a map is missing or stale, run the mappers anyway and keep their sections in the conversation; write no file, and say so in one line.
- **Not a git repository:** write it beside the plan in the scratchpad. Without a commit to stamp, a map from an earlier session cannot be trusted; map again in each new session.
- **An empty or brand-new repository** (no source files yet): skip the map, say so in one line, and write in *Technical context* that there is no existing code to follow.

The map is not a plan. It holds no task, no ticket, and nothing about the change being planned. Its first line under the stamp says so, so no other tool takes it for a plan.

## Fresh, stale, or missing

Decide this yourself; it is a fact, not a question for the user (rule 4). Read the stamp, then:

1. **No map:** map everything.
2. **The stamped commit no longer exists** (`git cat-file -e <sha>^{commit}` fails, for example after a rebase): map everything.
3. **Otherwise, list what changed since the stamp:** `git diff --name-only <sha>` (committed and uncommitted changes to tracked files) and `git ls-files --others --exclude-standard` (new untracked files).
   - Nothing changed: reuse the map as it is.
   - Something changed: re-run only the mappers whose sections cite or describe a changed path, and replace those sections. A changed dependency manifest or lock file re-runs the stack mapper; a new or removed top-level directory re-runs the structure mapper.
   - Three or more mappers affected: map everything.

After any re-run, update the stamp. When a later step finds a line in the map that is wrong, fix that line in place; do not re-stamp, because the rest of the map was not re-checked.

## The mappers

Read `model-routing.md` first. Dispatch the mappers below on the cheaper tier, in one message — every one of them always, except *Services and access*, which runs only when the repository serves requests (an HTTP, gRPC, GraphQL, or WebSocket server, or handlers for a serverless platform) — each with its sections, the rules under *What every mapper follows*, and the template for its sections. Each returns its sections as finished markdown, with nothing before or after. You assemble the file, write the stamp, and check one cited `path:line` per section against the code before you trust it. When a citation is wrong, send that mapper back with the line that failed, then check a different citation from its new sections.

1. **Stack and structure.** Languages and their versions, frameworks, the dependency manifest and what it pins, how to build and run the project (exact commands). The top-level layout, written to answer "where does a new thing of each kind go?". One table row per package or module: path, what it is responsible for, what it depends on, what uses it. Every entry point: binaries, servers, CLIs, workers, scheduled jobs, UI roots.
2. **Features and flows.** One table row per user-facing feature: what it does in plain words, its entry point, its main files. Then the flows: for each kind of entry point the project has (a CLI command, an HTTP request, a background job, an event, a UI action), trace one representative path end to end as numbered steps, each with `path:line`, from where input arrives to where output or stored state leaves. Then the data: where state lives, the schema or migrations, the formats it stores and exchanges.
3. **Patterns and conventions.** Prescriptive rules, each with one example at `path:line`: naming, how a module or feature is laid out, error handling and the shape of error messages, logging, configuration (flags, environment, files), validation at input boundaries, concurrency, how dependencies are passed in, the comment and doc style. Then a recipe for each common extension point ("add a command", "add an endpoint", "add a component"): the steps and the closest existing example to copy. Where two conventions live side by side, say which is newer (from `git log`) and prefer it.
4. **Testing.** The runner and the exact commands for the whole suite, one package, and one test, plus lint, format, and type checks. Where tests live and how they are named. The helpers, fixtures, fakes, and mocks that exist, and where. How a typical test is built (its setup, the call it makes, what it asserts), with one example at `path:line` for each kind of test (unit, table-driven, integration, end-to-end, snapshot) the project has. Then the **test inventory**, the part later steps lean on most: one row per test file, with the surfaces it exercises (commands, functions, endpoints, types, pages), its test names, and its setup and actions in a line. This is what lets a plan extend an existing test instead of writing a new one that repeats its setup. CI: each workflow file, what triggers it, what it runs, on which versions. Surfaces that have no tests.
5. **Rules, integrations, and concerns.** The rules of the repository from its instructions files (`CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, architecture decision records, lint and format configs), written as rules, never as "see the file". Every outside service and the main third-party libraries: what each is used for and where it is configured. Concerns: fragile areas, clusters of `TODO` and `FIXME`, the files that change most often (`git log --since="6 months ago" --name-only --format=`), and known traps.
6. **Services and access** (only when the repository serves requests). One table row per route or operation: method and path (or service and method), the handler at `path:line`, the middleware or interceptor chain in the order it runs, whether a caller must be signed in, and what permission it needs. Group a large API by resource and list each group's rules, but list every route that needs no sign-in by name. Then **authentication**: every way a caller proves who they are (session cookie, bearer token, API key, mutual TLS, signed webhook), where each is checked at `path:line`, and where the caller's identity is kept for the rest of the request. Then **authorization**: the model (roles, scopes, ownership checks, policies), where it is enforced at `path:line` (middleware, a decorator, a check in the handler, the database), how a route declares what it needs, and a route that shows it. Then the rest of the request boundary: input validation, CORS, CSRF, rate limits, request size limits, and the shape of error responses, each at `path:line`, and the webhooks the service receives and sends. Add a recipe "Add an endpoint" that includes declaring its access. Write down what you find; when two routes enforce access differently, list both and leave them for *Concerns*, never pick the "right" one.

## What every mapper follows

- **Current state only.** Describe what the code does today, never what it used to do or should do.
- **Prescriptive, with evidence.** "New commands register in `cmd/root.go:40` by calling `AddCommand`" helps the implementer; "some commands are registered in the root" does not. Every claim carries a path, and every pattern carries a `path:line`.
- **Show how, not only what.** A pattern is its shape in a few lines (a short excerpt is fine), not a list of the files that use it.
- **Stop at enough.** Three to five strong examples per pattern; group a list that passes about thirty items; never re-read a range already read. In a large repository or a monorepo, map every package at the module level and trace one flow per kind of entry point, not one per endpoint.
- **Never read or quote a secret.** `.env` files, key files, credential stores, and tokens in config are noted as existing, with their path, and never opened or copied. A variable's name may be recorded when the code reads it by that name; its value never is.
- **No counts of things that live elsewhere.** Never write how many there are — "24 handlers", "three services", "the 12 tests in this file". The 25th handler makes the count wrong, and a stale number reads as a fact. List the items, or state the rule that finds them ("every file under `handlers/` that registers a route"); a reader who needs the number counts the list. A limit or a threshold the code enforces ("requests over 10 MB are rejected") is a fact about behavior, not a count, and stays.
- **Whole repository, not the change.** A mapper is never told what is being planned; the map serves every later plan.

## The template

````markdown
---
last_mapped_commit: <full sha of HEAD when mapped>
mapped_at: <YYYY-MM-DD>
---

# Codebase map

This is the planning-flow codebase map, not a plan: how this repository works today, for every plan made here.

## Stack
## Structure
## Modules
| Path | Responsible for | Depends on | Used by |
|---|---|---|---|
## Entry points
## Features
| Feature | What it does | Entry point | Main files |
|---|---|---|---|
## Flows
### <Kind of entry point>: <representative path>
1. <step> — `path:line`
## Data
## Services
| Method and path | Handler | Middleware, in order | Sign-in | Permission |
|---|---|---|---|---|
## Authentication
## Authorization
## Request boundary
## Patterns and conventions
## Recipes
### Add a <thing>
## Testing
## Test inventory
| Test file | Surfaces it exercises | Test names | Setup and actions |
|---|---|---|---|
## CI
## Repository rules
## Integrations
## Concerns
````

Keep every heading. A heading with nothing under it gets one line saying so ("No background jobs.", "The repository serves no requests."), so a reader can tell it was checked.

## How later steps use the map

- **Step 2, exploration.** Give each explorer the map's path, or the sections that bear on its question, with the question. Explorers start from the map and read the current code for the area the change touches; they do not re-map. Two explorers always run. One answers: for each file the change will create or modify, what is the closest existing example to copy, at `path:line`, and which recipe in the map applies; when no example exists, it says so. The other starts from *Test inventory*: for each surface the change touches, which existing tests already exercise it or overlap with what the change needs proven, with each test's setup and actions read from the code. Its answer is what lets each acceptance criterion extend an existing test rather than add one (the 60% rule in `plan-template.md`).
- **Step 3, the draft.** *Technical context* copies the map's values for the area the change touches: the conventions, the flow, the test commands, the tests that cover each surface, the repository rules, and for every route the change adds or modifies, its middleware chain, how the caller signs in, and the permission it needs, with how the route declares that. It copies values, never a pointer: the cold implementer does not get the map, so "see `codebase-map.md`" is a gap.
- **Step 4, the ladder.** "Does the codebase already have it?" is checked against *Modules*, *Patterns and conventions*, and *Recipes* before anything new is planned.
- **Step 5, the reviews.** The zero-context reviewer and the cold implementer never receive the map, and are told to ignore the plan folder when they open the repository. The map would let them trust what they should check.
