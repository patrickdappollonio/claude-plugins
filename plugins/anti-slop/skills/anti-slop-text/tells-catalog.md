# Tells catalog

The full list of patterns behind the review table in `SKILL.md`. Each entry gives what the pattern looks like, the words or shapes to search for, and what to write instead. One hit can be chance; several in one text, or one pattern repeated, is the tell. Fix the sentence, never only the word: swapping "delve" for "dig into" keeps the sentence that did not need writing.

## 0. Invented details

No word list catches this one. To make text feel concrete, a model supplies reasons, numbers, anecdotes, outcomes, quotes, and plans nobody gave it: "plugins drifted out of date", "a handful turned out to be dead code", "we will revisit it later", "users love it". Check: for every specific claim, point to where it came from (the brief, the code, the diff, the data, a source you opened). If you cannot, remove it or ask for the real one. This includes the reason for a decision.

## 1. Inflated significance

**Legacy and broader trends.** A plain fact gets a claim that it represents, marks, or shapes something bigger. Search: *stands as*, *serves as*, *is a testament to*, *is a reminder*, *plays a crucial / pivotal / vital / key / significant / central role*, *a pivotal moment*, *key turning point*, *marks a shift*, *represents a shift*, *reflects broader*, *setting the stage for*, *shaping the*, *symbolizing its enduring / lasting*, *indelible mark*, *deeply rooted*, *focal point*, *evolving landscape*, *ever-changing landscape*, *in today's fast-paced world*. Instead: state what happened and stop. "Founded in 1989" needs no "marking a pivotal moment".

**Notability and coverage claims.** Saying a subject was covered, praised, or recognized instead of saying what was said. Search: *has been featured in*, *widely recognized*, *garnered attention*, *received widespread acclaim*, *covered by major outlets*, an "Awards and recognition" or "Legacy" section with nothing concrete in it. Instead: quote or summarize the specific source, or drop the claim.

**Promotional tone.** Brochure and ad language in text that should inform. Search: *nestled in*, *in the heart of*, *rich heritage / history / tapestry*, *hidden gem*, *must-visit*, *breathtaking*, *stunning*, *boasts a* (for "has a"), *vibrant*, *bustling*, *world-class*, *cutting-edge*, *state-of-the-art*, *seamless*, *effortless*, *robust*, *powerful*, *elevate*, *empower*, *unlock*, *unleash*, *supercharge*, *revolutionize*, *game-changer*, *next-generation*. Dev-tool variants: *batteries included*, *it just works*, *zero config*, *sane defaults*, *fits in your head*. Instead: the concrete property, with a number if there is one ("builds in 9 minutes", not "blazing fast").

## 2. Vague analysis and attribution

**Participle tails.** A sentence ends in ", highlighting / underscoring / emphasizing / showcasing / reflecting / demonstrating / illustrating / signaling / solidifying / cementing / reinforcing / fostering / ensuring / contributing to …" that adds an interpretation nobody asked for. Instead: delete the tail. If the interpretation is the point, make it its own sentence with its evidence.

**Weasel attribution.** Claims pinned to unnamed authorities or inflated in number. Search: *experts argue*, *critics have noted*, *observers suggest*, *many believe*, *it is widely considered*, *industry reports indicate*, *studies show* with no study. Instead: name the source, or state it as your claim, or cut it.

**Vague connection.** *associated with*, *connected to*, *in connection with*, *linked to* where the real relation is known. Instead: the relation itself ("was CEO of", "taught at", "calls").

**Challenges-and-outlook formula.** A closing paragraph or section that says the subject "faces challenges" and ends on a hopeful or open note. Search: *despite these challenges*, *faces several challenges*, *challenges remain*, *remains to be seen*, *time will tell*, *the future looks bright*, *poised for growth*. Instead: name the specific problem and what is being done about it, or end on the last fact.

**Didactic hedging.** *it is important to note*, *it's worth noting*, *it should be noted*, *worth pausing on*, *worth considering*, *keep in mind that*. Instead: state the thing; if it matters, its position in the text shows it.

## 3. Formulaic constructions

**Negative parallelism.** Correcting a misconception nobody held. Shapes: *not just X, but (also) Y*; *not only … but …*; *it's not X, it's Y* (also split: "It isn't X. It's Y."); *not X, but Y*; *Y rather than X*; *no X, no Y, just Z*. Instead: say Y.

**Negation chains.** Two or more "no …" or "did not …" items in a row: "No fluff, no filler, no jargon." "It didn't crash, didn't hang, didn't lose data." Instead: say what it does, once.

**Rule of three.** Three adjectives or three short phrases where fewer, or a different number, is true: "fast, reliable, and secure". Also a colon opening onto a list of three. It stands out most where people would not bother with a flourish, such as commit messages and chat replies. Instead: list the real items, however many there are; often one.

**Stage-managed reveals.** *here's the thing*, *here's the twist / catch / kicker / rub*, *the punchline is*, *turns out*, *it turns out that*, *the secret?*, *the result?*, *the best part?* Instead: state the point without the drumroll.

**Totalizing punchlines.** *that's the whole point*, *is the whole trick*, *is the entire game*, *the entire business model is*, *the only X I trust*, *the only thing that matters*, *X is dead*, *that's why X mattered*. Instead: the actual claim, with its limits.

**Stacked rhetorical questions.** Two or more questions fired in a row, often fragments: "Does it scale? Where does it break? Who maintains it?" Instead: answer them, or state the concern.

**Repeated openers and echo runs.** Three or more sentences in a row starting with the same word ("Maybe … Maybe … Maybe …"), or sentences built on the same skeleton ("A cart is an object in the system. A room is an object in the system."). Instead: merge them or vary the structure because the content differs.

**Stranded auxiliary.** A contrast that lands on a bare auxiliary: "The tool died; the data didn't." "Reading passed. Writing didn't." Instead: say what happened to each in full once, if the contrast matters.

**Don't-call-it.** "Don't call it X. Call it Y." "Don't fix it — rewrite it." Instead: just use Y.

**Copula avoidance.** *serves as*, *stands as*, *functions as*, *acts as*, *features*, *offers*, *boasts* where *is* or *has* is the plain word. Instead: *is*, *has*, *uses*.

**Stiff synonyms.** *utilize* (use), *leverage* (use), *facilitate* (help), *commence* (start), *endeavor* (try), *attempted* (tried), *authored* (wrote), *relocated* (moved), *in order to* (to), *due to the fact that* (because), *a number of* (some, or the number). Instead: the short word.

## 4. Voice

**Performative honesty.** Sincerity announced instead of shown: *I'll be honest*, *to be clear*, *let's be real*, *I won't pretend*, *frankly*, *honestly,* or *look,* opening a sentence, *don't take my word for it*. Instead: say it.

**Therapist voice.** *sit with that*, *it's worth naming*, *that's not nothing*, *you already know*, *hold space for*, *that loss is real*. Instead: in technical and business text, delete; elsewhere, say the specific thing.

**Chat residue in an artifact.** Text written as a reply to the person who asked, left inside the thing they will publish or send: *Certainly!*, *Of course!*, *Great question*, *You're absolutely right*, *Here is a …*, *I hope this helps*, *Let me know if you'd like …*, *Would you like me to …*, *Feel free to …*, *Happy to help*. Instead: the artifact starts with its first real sentence and ends with its last.

**Model disclaimers.** *As an AI language model*, *as of my last update*, *my knowledge cutoff*, *I cannot browse the internet*, *I don't have access to real-time data*, *please verify this information*. Instead: check what you can check; state plainly what you could not verify, once, where it applies.

## 5. Vocabulary

Words that studies cited by Wikipedia's guide found far more often in model output than in human writing. Several in one paragraph is the tell; each is fine in its literal sense (an *underscore* character, a *landscape* photo). Do not replace one with its synonym; rewrite the sentence around the fact.

*additionally* (especially opening a sentence), *align with*, *boasts*, *bolster / bolstered*, *commendable*, *crucial*, *deep dive*, *delve*, *emphasizing*, *enduring*, *enhance*, *ever-evolving*, *foster / fostering*, *garner*, *highlighting*, *interplay*, *intricate / intricacies*, *key* (as an adjective of importance), *landscape*, *meticulous / meticulously*, *multifaceted*, *navigate* (figurative), *nuanced*, *pivotal*, *realm*, *resonate with*, *seamless*, *showcasing*, *tapestry*, *testament*, *underscore*, *valuable* (as in "valuable insights"), *vibrant*. For models from mid-2025 on, the guide lists *emphasizing*, *enhance*, *highlighting*, and *showcasing*.

## 6. Formatting

**Title Case Headings** in a document that otherwise uses sentence case, or where the house style is sentence case. Use the house style; default to sentence case.

**Headings that only hold headings.** A heading with no text before its first subheading. Add the sentence that says what the section is for, or remove the level.

**Skipped heading levels** (an H1 then an H3), and **many H1s** in one document. Use levels in order; one H1 at most.

**Bold everywhere.** Several bold phrases per paragraph, or the same term bolded every time. Bold at most the one thing a skimmer must not miss.

**Inline-header bullets.** Every bullet starting with a bold label and a colon ("- **Speed:** It is fast."). Keep the form for a reference list the reader scans by label; for reasoning or narrative, write sentences.

**Lists for prose.** Bullets for content that is an argument or a sequence of causes. Write a paragraph.

**Tiny tables.** A table of two rows, or one column of real data, that a sentence would carry. Use a table for three or more rows compared across two or more columns.

**Em dashes as punch.** Em dashes several times per paragraph, used for dramatic pauses or to bolt on a parallel clause, often with spaces around them. One is fine; use a comma, colon, or parentheses for the rest. Follow the house style on spacing.

**Emoji as formatting.** Emoji before headings, bullets, or status lines (✅ 🚀 ✨ 📌 💡 🎯). Delete them.

**Section rules.** A horizontal rule between every section. Headings already separate sections.

**Summary and conclusion restating.** A closing "Conclusion", "Summary", "In summary", "In conclusion", "Overall", or "Key takeaways" that repeats what was just said, or paragraphs that end by restating their first sentence. End on the last new fact.

**Wrong markup for the destination.** Markdown in a plain-text email, a commit body, a Slack message that renders a different syntax, a wiki that uses wikitext, or a form field. Use the destination's markup, or none.

## 7. Leftovers and placeholders

**Markup debris** from chat tools, which shows the text was pasted from one: *oaicite*, *contentReference*, *turn0search0*, *attributableIndex*, *[cite: 1]*, *[span_1](start_span)*, *grok_card*, *utm_source=chatgpt.com* or *utm_source=openai* on links, lenticular brackets 【 】 around citations. Delete; re-check the claims they were attached to.

**Unfilled placeholders.** *[Your Name]*, *[Company]*, *[insert date]*, *<describe the change>*, *XX%*, *Lorem ipsum*. Fill them with real values or ask for them.

**Invented or unchecked sources.** Citations, links, DOIs, ISBNs, quotes, or page numbers you did not open. Open them or remove them.

## 8. Reports, commit messages, and PR descriptions

**What you did not do.** *preserved*, *retained*, *kept intact*, *left unchanged*, *avoided modifying*, *no changes to X*, *did not touch*. Mention an untouched part only when the reader would otherwise assume it changed, or when the user asked you to confirm it.

**Compliance assurances.** *in line with best practices*, *following the project's conventions*, *ensuring consistency*, *adheres to the style guide*, *maintaining backward compatibility* with nothing to show for it. Instead: state the change; show the evidence (the test, the command output) for any claim that matters.

**Emphasis on sourcing instead of content.** *well-sourced*, *thoroughly researched*, *based on reliable sources*, *comprehensive*. Instead: the finding, and the source it came from.

**Process narration.** *First I analyzed …, then I carefully reviewed …* in a result the reader wants the outcome of. Instead: what changed, why, and how it was checked.
