# Writing the document: comprehensive, layered, terse

This is where your output budget goes. The flow around it (capturing the diff,
serving, reading comments) should be nearly silent; the document should be the
one place you spend tokens lavishly. Read this once before authoring, then apply
it — don't quote it back into chat.

## 0. Audience: write for the CEO

Write the document for **the CEO of the company: tech-savvy, but not a
developer.** They understand products, systems, data, risk, and tradeoffs; they
do not read code, and a wall of diffs tells them nothing. Every section must
answer *what changes for the business or the user, why it's worth doing, and
what could go wrong* — in plain language a smart non-programmer follows without
translation.

Concretely:

- **Explain behavior and business logic, never implementation mechanics.**
  "Users who cancel mid-trial keep access until the period ends" — not "the
  `subscription.cancel` handler now checks `period_end`."
- **Code appears only when it's genuinely necessary to make the point** — a
  contract the reader must approve, a before/after that words can't carry. When
  it does, trim it hard and introduce it in plain language so the section still
  works for someone who skips the fence.
- **Prefer the visual, non-code blocks** — diagrams, file maps, migration and
  API cards, tables — over code fences. Those show *what the system does*;
  raw code shows *how*, which this reader didn't ask for.
- If a section only makes sense to someone who has the repo open, rewrite it.

The failure mode to avoid: drifting back into writing for a fellow engineer —
or worse, for the inventor of the programming language — because that's who
you'd naturally talk to. The reader never sees the code, and every symbol name
you drop is a word they must skip over. The litmus test for each sentence:
*would the CEO understand this, and could they act on it?* If not, it's written
for the wrong person.

This is not advisory: **the linter warns when plain-language sections (the
preamble, Summary/Outcome, What changed, Architecture) name code symbols**, and
lint findings must be fixed before the document is served.

The rule governs the **document**, not the conversation around it. When the
user asks you — in chat, or via a comment — to explain a topic in more depth,
answer at whatever technical level they ask for; the CEO framing never means
withholding detail from someone who requests it.

The goal is a document that is **terse and detailed at the same time**. Those
aren't in tension when you split them across two kinds of content:

- **Terse comes from starving the prose.** Prose exists only to explain what
  can't be shown structurally. No filler, no framing-about-the-framing.
- **Detail comes from the structure.** Every change becomes a block; the density
  lives in diagrams, diffs, migration/API/OpenAPI cards, and file maps — each
  introduced by one sentence, never a wall of text.

Minimal prose + maximal structure + trimmed-to-what-matters = terse and complete.

**Scale the document to the change.** Length is proportional to how much the
change actually contains, never padded to a template. A 100-line branch gets a
short document — a few sections, one or two blocks — that still covers every
meaningful item; forcing it to look substantial is a failure. A 10k-line PR gets
a genuinely comprehensive one: many `## Key changes` subsections, a block per
distinct diagram/migration/endpoint, a full risks list. Thoroughness (every
item on the inventory is represented) is constant; the *amount* of output tracks
the size and complexity of the diff. Right-size, don't inflate and don't thin.

## 1. Layer it simple → complex

The skeleton is ordered on purpose: plain-language outcome → what changed →
architecture → data/API → the actual code → risks. Hold that gradient.

- A reader who has **not** opened the diff or the repo must follow every section
  through *What changed* and *Architecture* **without hitting a function name, a
  variable, a filename-as-jargon, or a line number.** Describe the effect and
  the reason, not the mechanism.
- Only `## Key changes` and the structured fences below it may name specific
  functions, symbols, or lines — and only when the reader needs *that specific
  one* to follow the story. Never drop a symbol in for color or false precision.
  Even there, the lead-in sentence must carry the meaning on its own (§0): the
  fence is evidence for a claim already made in plain language, not the claim.
- Put the concrete, legible thing early; push the dense mechanics down.

## 2. Cover everything (inventory → represent → audit)

Thin is the common failure. Beat it with a coverage discipline:

1. **Inventory (internal, never printed).** Before writing, build a checklist of
   every meaningful item the change touches: each changed file, schema/table,
   endpoint/route, flow or data-path that moved, UI surface **including empty,
   loading, error, and permission/role states**, load-bearing code hunk, and
   risk. This is reasoning, not a chat message and not a section of the doc.
2. **Represent or omit.** Every item on the checklist either becomes a block in
   the document or is intentionally omitted because it's trivial, redundant, or
   not reviewer-facing. If you can't state the omission reason in one clause,
   it's missing, not cut — add it.
3. **Audit before serving.** Walk the checklist against the finished document one
   item at a time. This is the gate that turns "I listed it" into "it's covered."

Recap the **whole** unit of work (all the thread's commits/changes), not just
the latest fix.

## 3. Prefer the purpose-built block over a raw diff

Every fence type earns its keep — reach for the one that shows the *thing*, not
just the code that implements it. A `diff` of a route handler shows that a route
exists; it does **not** show the endpoint's contract. When the change exposes or
modifies an **HTTP API, routes, actions, or message shapes** — even if the
system is "just" API-driven and there's no formal spec file — represent that
surface with an ` ```openapi ` block (the read-only endpoint explorer) and/or
` ```api ` request/response cards. That is the headline for an API change; a
handler `diff` is at most supporting evidence beside it, never a substitute.
The same reflex applies elsewhere: schema/migration → ` ```migration `,
architecture/flow → ` ```mermaid `/` ```nomnoml `, the changed-files map →
` ```filetree ` (flags + notes, not a bullet list). If a purpose-built block can
carry the change, don't let a code diff or a plain list stand in for it. The
same applies to callouts: a risk or decision-needed aside is a `> [!WARNING]`/
`> [!IMPORTANT]` admonition, never a bold-keyword blockquote standing in for one.

## 4. One sentence of intent above every structured fence

Every `diff`, `migration`, `api`, and `openapi` fence gets exactly one sentence
directly above it saying what it changes and **why it matters** — not only the
ones under `## Key changes`. A bare fence with no lead-in makes the reader
reverse-engineer intent from the code. Never leave a fence unlabeled.

## 5. Trim complex code to the load-bearing lines, then annotate

When a hunk touches a large or intricate function, **do not paste the whole
function.** Trim the `diff`/code fence to the changed lines plus a few lines of
surrounding context, then add **2–4 bullets directly below the fence** naming
exactly which lines or branches matter and why. (Our renderer has no inline
margin notes, so annotations are prose right after the fence.)

One or two high-signal bullets beat a line-by-line walkthrough. If you're
annotating more than about a third of the lines, you haven't trimmed enough.

## 6. Before/after and type-change idioms

- When a field or parameter's **type/shape changed** (rather than being newly
  added), put a small table above the fence: `field | change | was → now`.
- For a structured before/after that isn't naturally a diff (a reshaped schema,
  a swapped component), use two labeled fences (`Before` / `After`) or a
  two-column table — this is our substitute for a dedicated comparison block.

## 7. No prose about the document itself

Cut any sentence whose only content is describing or disclaiming the document:
"this recap summarizes N files," "the reviewer should still read the diff,"
"generated from branch X," "as discussed above," "this revision fixes…". That's
padding, not coverage. Every prose sentence must tell the reader something about
**the change**, not about the write-up.

## 8. One document, never a change-log

When feedback or new information changes the plan, **rewrite the affected
sections in place** so the document always reads as one coherent plan written
fresh — a reader arriving now must never have to reconstruct the current state
from a base plan plus a trail of patches.

Forbidden, in any form:

- Delta headings: `## Update`, `## Revision 2`, `### Changed after review`,
  `## Addendum`, `(revised)` suffixes on titles.
- Sections that describe the edit instead of the plan: "per the feedback above,
  we now…", "this replaces the earlier approach," "see the updated section
  below."
- Keeping a superseded section alongside its replacement "for context."

Superseded content is deleted, not annotated. If the *history* of a decision
genuinely matters to the reader (a rejected alternative with a real tradeoff),
it belongs as a plain sentence inside the relevant section — "we chose X over Y
because…" — not as a record of the document's own evolution.

## 9. Calibration — GOOD vs BAD

**BAD.** A 20-file recap with one paragraph of Outcome, a bare file list, and no
`diff`/`migration`/`api` fences — the reviewer is forced back into `git diff`.
Equally bad: ten `diff` fences with no lead-in sentences and no Outcome, so the
reviewer must read every hunk to learn what any of it is for.

**GOOD.** Outcome explains the change in three sentences with zero code; *What
changed* lists all 20 files with one clause each; the schema delta is two
`migration` fences, each with a one-line reason above it; `## Key changes` is
five trimmed `diff` hunks, each led by a why-sentence and 2–3 annotation bullets
on the lines that matter; *Risks* names the one compatibility break. Terse
prose, dense structure, full coverage.
