---
name: anti-slop-text
description: "Use when writing, editing, or reviewing prose people will read — a README, docs, a commit message, a PR description, release notes, a blog post, an email, a report, a chat reply, an article, or long UI copy — especially when asked to make it sound professional, engaging, or polished, or when text reads as AI-generated. Covers invented details, inflated significance (stands as a testament, plays a pivotal role, evolving landscape), promotional tone, participle tails (highlighting, underscoring, showcasing), weasel attributions (experts argue), not-just-X-but-Y and not-X-but-Y contrasts, rule of three, here's the thing, stacked rhetorical questions, delve, tapestry, meticulous, and other AI vocabulary, performative honesty, chat residue (Certainly!, I hope this helps), knowledge-cutoff disclaimers, title case, bold everywhere, emoji bullets, em-dash punch, conclusion sections that restate, placeholders, and commit or PR text about what was preserved or left unchanged."
---

# Anti-Slop Text

## The rule

**Every sentence gives the reader a fact they need, in the plainest words that carry it, and every fact comes from the material you were given or something you checked.**

Slop is text shaped like writing with nothing specific in it: significance claimed instead of shown, reasons made up to sound concrete, rhythm doing the work that content should. A reader who spots the patterns tends to distrust the rest of the text, including the parts that were true.

## Read the companion files first

This skill ships two companion files beside it. On first use in a session, before any other step:

1. **Read `tells-catalog.md`** in full. It holds the full list behind the review table below: every pattern, the words and shapes to search for, and what to write instead. The table here is a reminder of text you have already read, never a substitute. Re-read it before any review pass over text longer than a few paragraphs.
2. **Load the communication rules**, one of two ways:
   - **The `effective-communicator` skill is installed** (it appears in your list of available skills, on its own or under a plugin prefix): invoke it and follow it. Do not read `communication.md`; the installed skill is the fuller version of the same rules.
   - **It is not installed**: read `communication.md` in full. It is the distilled version of that skill.

Writing from memory of what "plain" or "clear" means, without one of those loaded, is a red flag below. Never tell the reader to install the other skill; use it when it is there and the file when it is not.

## Write it in this order

1. **List the facts first.** Before writing, list what you know from the brief, the code, the diff, the data, or a source you opened. The text says those things and nothing else. When a fact is missing (why a decision was made, what a number was, what happened next), ask for it or leave it out. Never supply a plausible reason, anecdote, number, quote, or outcome to make the text feel complete; a made-up detail is worse than a missing one because the reader cannot tell which details are real. If the requested length needs more facts than you have, write the shorter text, say how long it came out and why, and ask for the material that would fill it.
2. **Say it plainly.** Subject, plain verb, fact. Use *is*, *has*, *uses*, *wrote*, *tried*, *moved* over *serves as*, *boasts*, *utilizes*, *authored*, *attempted*, *relocated*. A number beats an adjective: "builds in 9 minutes" over "blazing fast".
3. **Let facts carry their own weight.** Do not tell the reader something is significant, pivotal, a testament, a turning point, or part of a broader trend. If it matters, the fact shows why; if the reason is not obvious, state the reason as another fact.
4. **Name who said it.** A claim about what people think names its source, or is stated as your own claim, or is cut. No *experts argue*, *many believe*, *studies show* without the study.
5. **Say Y.** When you are about to write "not just X, but Y", "it's not X, it's Y", "Y rather than X", or "no X, no Y, just Z", write Y. Contrast is for a misconception the reader actually holds.
6. **Let the content set the count and the rhythm.** List the real items, whether that is one or five. No drumroll openers (*here's the thing*, *turns out*, *the punchline*), no stacked rhetorical questions, no three sentences in a row starting the same way, no fragment pairs built for punch ("It broke. We fixed it.").
7. **Fit the structure to the content.** Headings in sentence case unless the house style says otherwise, used only when the text is long enough to need them, in order, each with text before any subheading. Bold at most the one thing a skimmer must not miss. Bullets for list-shaped content; paragraphs for reasoning. A table for three or more rows compared across two or more columns. No emoji as bullets or heading markers, no rule between every section, no closing "Conclusion", "Summary", or "Key takeaways" that restates the text. End on the last new fact.
8. **Use the destination's format.** Markdown where it renders, plain text in a commit body, email, or form field, the house markup in a wiki. Follow the house style for dashes, quotes, and heading case; with none, prefer commas, colons, and parentheses to repeated em dashes.
9. **Leave the conversation out of the artifact.** A document, commit message, or PR description has no *Certainly!*, *Here is …*, *I hope this helps*, *Let me know if …*, or model disclaimers. It starts with its first real sentence. Fill every placeholder with a real value or ask for it.
10. **In reports, commits, and PRs, say what changed.** What changed, why, and how it was checked. Mention an untouched part only when the reader would otherwise assume it changed. No assurances (*following best practices*, *ensuring consistency*, *preserved existing behavior*) without the evidence that makes them true, and no narration of your process.

The communication rules you loaded above decide who the text is for and how it is structured: name the reader of this destination, lead with the answer or the change, state each point as plain effect first and identifier last, one idea per sentence in active voice, and translate every identifier except the ones the reader will type. This skill decides which patterns the text must not contain. Both apply to every sentence.

## Review against the tells

Before handing text over, run this pass. Search for each signal, then read each hit in context: one hit can be chance, several in one text is the tell. Fix the sentence, never only the word: swapping *delve* for *dig into* keeps the sentence that did not need writing.

| Tell | Signals | Fix |
|---|---|---|
| 1. Invented details | reasons, numbers, anecdotes, outcomes, quotes, or sources not in your material | Remove, or ask for the real one. |
| 2. Inflated significance | *stands as*, *serves as*, *testament*, *pivotal*, *crucial role*, *marks a shift*, *evolving landscape*, *broader trends*, *indelible*, *deeply rooted* | State what happened and stop. |
| 3. Promotional tone | *seamless*, *robust*, *powerful*, *cutting-edge*, *elevate*, *unlock*, *empower*, *boasts*, *vibrant*, *nestled*, *it just works*, *zero config* | The concrete property, with a number if there is one. |
| 4. Participle tails | a sentence ending in *, highlighting / underscoring / showcasing / reflecting / fostering / ensuring …* | Delete the tail, or make it a sentence with its evidence. |
| 5. Vague attribution and connection | *experts argue*, *critics note*, *widely regarded*, *associated with*, *connected to* | Name the source or the actual relation. |
| 6. Challenges and outlook | *despite these challenges*, *remains to be seen*, *time will tell*, *poised for* | Name the problem and what is being done, or end on the last fact. |
| 7. Contrast formulas | *not just … but*, *not only … but*, *it's not X, it's Y*, *rather than*, *no X, no Y*, *didn't X, didn't Y*, *don't call it X* | Say Y. |
| 8. Manufactured rhythm | rule of three, *here's the thing / twist*, *turns out*, *the punchline*, *that's the whole point*, *X is dead*, stacked questions, repeated openers, punchy fragment pairs, "The tool died; the data didn't." | Plain sentences whose count and length follow the content. |
| 9. AI vocabulary | *delve*, *tapestry*, *meticulous*, *intricate*, *interplay*, *underscore*, *garner*, *bolster*, *foster*, *enhance*, *showcase*, *additionally* opening a sentence (full list in the catalog) | Rewrite the sentence around its fact. |
| 10. Stiff wording | *utilize*, *leverage*, *facilitate*, *in order to*, *due to the fact that*, *it is important to note*, *it's worth noting* | The short word; state the note. |
| 11. Performative voice | *to be honest*, *let's be clear*, *frankly*, *honestly,*, *look,*, *sit with that*, *worth naming*, *that's not nothing*, *you already know* | Say the thing. |
| 12. Chat residue | *Certainly!*, *Great question*, *Here is*, *I hope this helps*, *Let me know*, *Would you like*, *as of my last update*, *as an AI* | Delete; start and end on content. |
| 13. Formatting tells | Title Case headings, bold in every paragraph, **Label:** on every bullet, emoji markers, a rule between sections, tiny tables, headings with no text of their own, skipped levels, em dashes several times a paragraph | Sentence case, rare bold, prose for reasoning, the house style. |
| 14. Restating endings | *In conclusion*, *In summary*, *Overall*, *Key takeaways*, a closing section or sentence that repeats earlier text | End on the last new fact. |
| 15. Leftovers | *[Your Name]*, *[insert …]*, *XX%*, *oaicite*, *contentReference*, *turn0search*, *[cite: 1]*, *utm_source=chatgpt.com* | Fill or delete; re-check the claims they touched. |
| 16. Report and PR tells | *preserved*, *retained*, *left unchanged*, *did not touch*, *following best practices*, *ensuring consistency*, *thoroughly*, *comprehensive*, a narrated sequence of steps | What changed, why, how it was checked. |

When you hand text over, list the tells you found and fixed in one line each. If you kept one on purpose (a house style, a real three-item list, a quote), say why.

## Do not overcorrect

- Plain constructions are the fix, not a new tell: *there is*, *it has*, short sentences, a definite claim ("was the first"), and an honest hedge (*probably*, *tends to*) where the evidence is partial.
- Repeat the right term. Swapping a word for a synonym to avoid repetition is itself a model habit and makes the reader wonder whether two things are meant.
- A pattern in the table is allowed when it is true and needed: a real list of three, one em dash, a genuine contrast with a misconception the reader holds, *crucial* for something that is.
- When asked whether someone else's text was written by AI, say that style alone is weak evidence: people now write with these patterns, and many good writers always did. Report the patterns you found; do not give a verdict.

## Rationalizations

| Thought | Reality |
|---|---|
| "The user asked for professional and engaging." | Professional is specific and plain. Hype and rhythm are what make it read as generated. |
| "They asked for 300 words and I have 100 words of facts." | Deliver the 100, say so, and ask for material. Padding is where invented details come from. |
| "A concrete detail will make it vivid." | Only if it is true. Invented detail is fabrication, and the reader cannot tell which details are real. |
| "It needs a strong closing." | The last new fact is the strong closing. A summary repeats what they just read. |
| "I replaced *delve* and *tapestry*, so it's fine." | The patterns are in the sentence shapes. Replacing words keeps the sentences that did not need writing. |
| "The reviewer should know I didn't touch X." | Only if they would assume you did. Otherwise it is noise that hides the actual change. |
| "Bold and bullets make it skimmable." | Bold everywhere means nothing stands out. Reasoning cut into bullets loses its *because*. |

## Red flags — stop and re-read "Write it in this order"

- You started writing without reading `tells-catalog.md` and loading either `effective-communicator` or `communication.md` this session.
- You are writing a reason, number, or outcome that is not in your material.
- You typed *not just*, *rather than*, *here's the thing*, *turns out*, or a colon followed by exactly three items.
- A sentence ends in *, highlighting …* or *, ensuring …*.
- Your last paragraph starts with *In summary*, *Overall*, or *Ultimately*.
- The first or last line of the artifact is addressed to the person who asked for it.
- Your commit or PR text lists what you did not change.

## Checklist

- [ ] Read `tells-catalog.md`, and invoked `effective-communicator` or read `communication.md`, this session.
- [ ] Named the reader of this destination; the first sentence gives the answer, the change, or the result; identifiers explained.
- [ ] Every fact is from the material or a check; nothing invented; placeholders filled or asked for.
- [ ] Plain verbs and numbers; no inflated significance, promotional words, or participle tails.
- [ ] Sources named or claims owned; no weasel attribution.
- [ ] No contrast formulas, drumrolls, stacked questions, or manufactured rhythm.
- [ ] Structure fits the content and the destination's format; sentence case; rare bold; no emoji markers; no restating ending.
- [ ] No chat residue or disclaimers in the artifact.
- [ ] Reports, commits, and PRs say what changed, why, and how it was checked.
- [ ] Ran the tells review and listed each finding in one line.
