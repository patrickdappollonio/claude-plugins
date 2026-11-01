---
name: anti-slop-text
description: "Use when writing, editing, or reviewing prose people will read — a README, docs, a commit message, a PR description, release notes, a blog post, an email, a report, a chat reply, an article, or long UI copy — especially when asked to make it sound professional, engaging, or polished, or when text reads as AI-generated. Covers invented details, inflated significance (stands as a testament, plays a pivotal role, evolving landscape), promotional tone, participle tails (highlighting, underscoring, showcasing), weasel attributions (experts argue), not-X-but-Y contrasts in any wording (it's not X it's Y, it could be X but), rule of three, here's the thing, stacked rhetorical questions, delve, tapestry, meticulous, and other AI vocabulary, performative honesty, chat residue (Certainly!, I hope this helps), knowledge-cutoff disclaimers, title case, bold everywhere, emoji bullets, em-dash punch, conclusion sections that restate, placeholders, and commit or PR text about what was preserved or left unchanged."
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
5. **Say Y.** When a sentence, or a pair of sentences, brings up X only to set it aside and then says Y, write Y. The structure is the tell, whatever the words: "it's not X, it's Y", "it could be X, but it's Y", "X isn't the problem, Y is", "sure, X, but Y", "less X, more Y", "the real X is Y", "Y rather than X", "no X, no Y, just Z", and every other variant in `tells-catalog.md`. Ask whether the reader would have believed X if you had not raised it; if not, X is a foil, so delete it. Keep X only when the reader actually holds it or it was an option someone weighed, and then state it as a fact ("we first suspected the cache; the logs showed …"), not as a reveal. When editing, rebuild the sentence: Y in its own sentence; X only if it is a fact the reader needs on its own (a measurement, a named option), in its own sentence, never as the setup for Y. An evaluative X such as *easy* or *obvious* is framing, not a fact, so "keep every fact" does not protect it.
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
| 2. Inflated significance | *stands as*, *serves as*, *testament*, *pivotal*, *crucial role*, *marks a shift*, *paving the way*, *evolving landscape*, *broader trends*, *cannot be overstated*, *fundamentally reshape*, *paradigm*, *ecosystem* | State what happened and stop. |
| 3. Promotional tone | *seamless*, *robust*, *powerful*, *cutting-edge*, *elevate*, *unlock*, *empower*, *boasts*, *vibrant*, *nestled*, *it just works*, *zero config* | The concrete property, with a number if there is one. |
| 4. Participle tails | a sentence ending in *, highlighting / underscoring / showcasing / reflecting / fostering / ensuring …* | Delete the tail, or make it a sentence with its evidence. |
| 5. Vague attribution and claims | *experts argue*, *widely regarded*, *as we all know*, *the truth is*, *this feels like*, *one of those*, *in practice* with no case, a coined label (*the onboarding trap*), *associated with* | Name the source, the case, or the actual relation; describe instead of labelling. |
| 6. Challenges and outlook | *despite these challenges*, *remains to be seen*, *time will tell*, *poised for* | Name the problem and what is being done, or end on the last fact. |
| 7. Contrast framing | any sentence or pair that raises X only to dismiss it, then says Y: *it's not X, it's Y*, *X isn't the problem, Y is*, *it could be X, but*, *sure, X, but*, *not just … but*, *more than just*, *less X, more Y*, *the real X is*, *rather than*, *X? No. Y.*, *no X, no Y*, *didn't X, didn't Y*, *don't call it X* | Say Y; keep X only if the reader holds it. |
| 8. Manufactured rhythm | rule of three, *here's the thing*, *the result? / the lesson?*, *turns out*, *that's the whole point*, mic-drop closers, *let's unpack*, *imagine a world*, *think of it as*, *from X to Y* false ranges, *there are three key reasons*, stacked questions, repeated openers, fragment pairs, "The tool died; the data didn't." | Plain sentences whose count and length follow the content. |
| 9. AI vocabulary | *genuinely*, *the actual X*, *that said*, *delve*, *tapestry*, *meticulous*, *underscore*, *foster*, *enhance*, *robust*, *Additionally / Moreover / Furthermore* opening a sentence, *quietly / deeply / fundamentally*, hedge pileups (full list in the catalog) | Rewrite the sentence around its fact. |
| 10. Stiff wording | *utilize*, *leverage*, *facilitate*, *in order to*, *due to the fact that*, *it is important to note*, *it's worth noting* | The short word; state the note. |
| 11. Performative voice | *to be honest*, *frankly*, *and honestly?*, *sit with that*, *worth naming*, *that's not nothing*, *you're not alone*, *thrilled to announce*, *journey*, *next chapter*, *X taught me Y*, *curious what others think* | Say the thing. |
| 12. Chat residue | *Certainly!*, *Great question*, *Here is*, *I hope this helps*, *Let me know*, *Would you like*, *as of my last update*, *as an AI* | Delete; start and end on content. |
| 13. Formatting tells | Title Case headings, a heading on a short post, bold in every paragraph, **Label:** on every bullet, emoji markers, ✅/❌ lists, arrows in prose, a rule between sections, tiny tables, headings with no text of their own, skipped levels, em dashes several times a paragraph | Sentence case, rare bold, prose for reasoning, the house style. |
| 14. Restating endings | *In conclusion*, *In summary*, *Overall*, *Key takeaways*, a closing section or sentence that repeats earlier text | End on the last new fact. |
| 15. Leftovers | *[Your Name]*, *[insert …]*, *XX%*, *oaicite*, *contentReference*, *turn0search*, *[cite: 1]*, *utm_source=chatgpt.com* | Fill or delete; re-check the claims they touched. |
| 16. Report and PR tells | *preserved*, *retained*, *left unchanged*, *did not touch*, *following best practices*, *ensuring consistency*, *thoroughly*, *comprehensive*, a narrated sequence of steps | What changed, why, how it was checked. |
| 17. Whole-text structure | intro previews, section recaps, and a conclusion that recaps the recaps; one point restated for paragraphs; a metaphor stretched across the text; stacked analogies; duplicated passages | Say each thing once, where it belongs. |
| 18. Flattening | an edit that swaps the writer's or the field's exact term for a common synonym, evens out their register or dialect, or turns *excellent* into *good* | Keep established terms and the writer's voice; fix only what is wrong. |
| 19. Fiction clichés | *my heart sank*, *a chill ran down*, *intoned*, *raises an eyebrow*, *little did I know* | A detail specific to this character and scene. |

When you hand text over, list the tells you found and fixed in one line each. If you kept one on purpose (a house style, a real three-item list, a quote), say why.

## Do not overcorrect

- Plain constructions are the fix, not a new tell: *there is*, *it has*, short sentences, a definite claim ("was the first"), and an honest hedge (*probably*, *tends to*) where the evidence is partial.
- When editing someone else's text, fix the tells and leave the rest: their established terms, dialect, sentence length, and register. A direct quote stays word for word. A claim in the draft that you cannot verify stays and goes on the list for the author to confirm; deleting it changes what they said. An edit that makes every writer sound the same is a regression.
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
| "Both halves are in the draft" or "I was told to keep every fact." | Rebuild it: Y in its own sentence; X only if it is a fact the reader needs on its own, in its own sentence, never as Y's setup. *Easy*, *simple*, and *obvious* are framing, not facts. |
| "I replaced *delve* and *tapestry*, so it's fine." | The patterns are in the sentence shapes. Replacing words keeps the sentences that did not need writing. |
| "The reviewer should know I didn't touch X." | Only if they would assume you did. Otherwise it is noise that hides the actual change. |
| "Bold and bullets make it skimmable." | Bold everywhere means nothing stands out. Reasoning cut into bullets loses its *because*. |

## Red flags — stop and re-read "Write it in this order"

- You started writing without reading `tells-catalog.md` and loading either `effective-communicator` or `communication.md` this session.
- You are writing a reason, number, or outcome that is not in your material.
- You typed *not just*, *rather than*, *here's the thing*, *turns out*, or a colon followed by exactly three items.
- You named something only to say it is not the point, not the problem, or not the real one.
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
- [ ] No contrast framing in any wording (nothing raised only to be dismissed), no drumrolls, stacked questions, or manufactured rhythm.
- [ ] Structure fits the content and the destination's format; sentence case; rare bold; no emoji markers; no restating ending.
- [ ] No chat residue or disclaimers in the artifact.
- [ ] Reports, commits, and PRs say what changed, why, and how it was checked.
- [ ] Ran the tells review and listed each finding in one line.
