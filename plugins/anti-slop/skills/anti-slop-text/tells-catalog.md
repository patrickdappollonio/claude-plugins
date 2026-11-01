# Tells catalog

The full list of patterns behind the review table in `SKILL.md`. Each entry gives what the pattern looks like, the words or shapes to search for, and what to write instead. Fix the sentence, never only the word: swapping "delve" for "dig into" keeps the sentence that did not need writing.

## How to weigh a hit

Every tell is a frequency signal. People use all of these patterns, and many good writers always did. What gives text away is density (several tells in a short text, or one pattern repeated) and fit (a habit normal in a social post reads as slop in a design doc or a commit message).

- **Fix on sight**, even once: invented details, contrast framing where the reader never held X, participle tails, *serves as* for *is*, drumroll openers (*here's the thing*, *the result?*), *cannot be overstated*, chat residue, model disclaimers, placeholders, and markup debris.
- **Fix when they cluster**: the rule of three, em dashes, hedge words, intensifying adverbs, *especially*, *in practice*, *genuinely*, bold, and the vocabulary list. One is fine; several per paragraph is the tell.
- **Not a tell on their own**: curly quotes, a single em dash, short sentences, *in order to*, and the occasional *rather than* that names an option someone weighed. Do not rewrite good text to remove them.

The words drift between model generations: *delve*, *tapestry*, and *a testament to* were common markers and are now rare, while *genuinely*, *the actual X*, *that said*, and *it's not X, it's Y* have grown. The sentence shapes last longer than any word, so check the shapes first.

## 0. Invented details and missing specifics

No word list catches this one. To make text feel concrete, a model supplies reasons, numbers, anecdotes, outcomes, quotes, and plans nobody gave it: "plugins drifted out of date", "a handful turned out to be dead code", "we will revisit it later", "users love it". Check: for every specific claim, point to where it came from (the brief, the code, the diff, the data, a source you opened). If you cannot, remove it or ask for the real one. This includes the reason for a decision.

The opposite failure is text with no specifics at all: no names, dates, numbers, versions, file paths, or details only someone close to the work would know. Text that could be pasted under any other subject unchanged is the tell. Instead: put in the specifics you have, and ask for the ones you lack; never fill the gap with invented ones.

## 1. Inflated significance

**Legacy and broader trends.** A plain fact gets a claim that it represents, marks, or shapes something bigger. Search: *stands as*, *serves as*, *is a testament to*, *is a reminder*, *plays a crucial / pivotal / vital / key / significant / central role*, *a pivotal moment*, *key turning point*, *marks a shift*, *represents a shift*, *reflects broader*, *setting the stage for*, *paving the way for*, *shaping the*, *symbolizing its enduring / lasting*, *indelible mark*, *deeply rooted*, *focal point*, *evolving landscape*, *ever-changing landscape*, *in today's fast-paced world*. Instead: state what happened and stop. "Founded in 1989" needs no "marking a pivotal moment".

**Stakes inflation.** The impact is raised to the scale of an era. Search: *fundamentally reshape*, *define the next era*, *change everything*, *paradigm shift*, *game-changing*, *revolutionary*, *cannot be overstated*, *of the utmost importance*, *the stakes have never been higher*. Instead: the specific effect, at its real size, with its evidence.

**Grand abstract nouns.** *tapestry*, *landscape*, *paradigm*, *ecosystem*, *synergy*, *realm*, *journey*, *space* (as in "the AI space"). Instead: name the concrete thing: the market, the tools, the three teams, the codebase.

**Notability and coverage claims.** Saying a subject was covered, praised, or recognized instead of saying what was said. Search: *has been featured in*, *widely recognized*, *garnered attention*, *received widespread acclaim*, *covered by major outlets*, an "Awards and recognition" or "Legacy" section with nothing concrete in it. Instead: quote or summarize the specific source, or drop the claim.

**Promotional tone.** Brochure and ad language in text that should inform. Search: *nestled in*, *in the heart of*, *rich heritage / history / tapestry*, *hidden gem*, *must-visit*, *breathtaking*, *stunning*, *boasts a* (for "has a"), *vibrant*, *bustling*, *world-class*, *cutting-edge*, *state-of-the-art*, *seamless*, *effortless*, *robust*, *powerful*, *elevate*, *empower*, *unlock*, *unleash*, *supercharge*, *revolutionize*, *game-changer*, *next-generation*. Dev-tool variants: *batteries included*, *it just works*, *zero config*, *sane defaults*, *fits in your head*. Instead: the concrete property, with a number if there is one ("builds in 9 minutes", not "blazing fast"). For an ease claim, name the hard part and how it was handled.

## 2. Vague analysis and attribution

**Participle tails.** A sentence ends in ", highlighting / underscoring / emphasizing / showcasing / reflecting / demonstrating / illustrating / signaling / solidifying / cementing / reinforcing / fostering / ensuring / contributing to / paving the way for …" that adds an interpretation nobody asked for. Instead: delete the tail. If the interpretation is the point, make it its own sentence with its evidence.

**Weasel attribution.** Claims pinned to unnamed authorities or inflated in number. Search: *experts argue*, *critics have noted*, *observers suggest*, *many believe*, *it is widely considered*, *industry reports indicate*, *reports suggest*, *studies show* or *studies have found* with no study. Instead: name the source, or state it as your claim, or cut it.

**Asserted obviousness.** A claim declared self-evident or shared so it needs no support. Search: *the truth is*, *the reality is*, *simply put*, *make no mistake*, *history is clear*, *as we all know*, *everyone knows*, *needless to say*, *it goes without saying*. Instead: the claim and its evidence; if it really goes without saying, do not say it.

**Impressions in place of claims.** *this feels like*, *it feels as though*, *one of those cases where*, *one of those X that*. The writer reports a mood or files the subject under a familiar genre instead of saying what is true. Instead: state the opinion as an opinion, or the fact as a fact.

**Ungrounded grounding.** *in practice*, *in the real world*, *on the ground*, *at the end of the day* used to sound empirical without citing a case. Instead: the case. If there is none, drop the phrase.

**Coined labels.** A made-up name presented as if it were an established term: "the supervision paradox", "the onboarding trap", *we call this*, *what I call*. Instead: describe the pattern in plain words. Keep a label only if the text defines it and uses it again, or it is a term the team or field already uses (a name in the codebase, the docs, or the brief). When editing someone else's draft, a label used once that you cannot confirm is in use elsewhere is still a coinage: replace it with the plain description, and list it so the author can put it back if the team does use it. The flattening rule (keep the writer's exact terms) protects established terms, not one-off coinages.

**Vague connection.** *associated with*, *connected to*, *in connection with*, *linked to* where the real relation is known. Instead: the relation itself ("was CEO of", "taught at", "calls").

**Challenges-and-outlook formula.** A closing paragraph or section that says the subject "faces challenges" and ends on a hopeful or open note. Search: *despite these challenges*, *despite its challenges*, *faces several challenges*, *challenges remain*, *remains to be seen*, *time will tell*, *only time will tell*, *the future looks bright*, *poised for growth*. Instead: name the specific problem and what is being done about it, or end on the last fact.

**Didactic hedging.** *it is important to note*, *it's worth noting*, *worth mentioning*, *it should be noted*, *importantly*, *notably*, *worth pausing on*, *worth considering*, *keep in mind that*. Instead: state the thing; if it matters, its position in the text shows it.

## 3. Contrast framing

The most frequent tell, and the one a word list misses most often. A sentence, or a pair of sentences, brings up X only to set it aside, then says Y, the thing the writer meant. X is a foil: the reader did not believe it, and it is there to make Y sound like a correction or a reveal. The wording varies endlessly, so judge the structure, not the opening words. It can start with *it's not*, *sure*, *it could be*, *less*, or *forget*; it can be split across two sentences or two paragraphs; it can sit in a heading.

**The test.** For each sentence that mentions something it then dismisses, downplays, or outranks, ask: would the reader have believed X if the text had not raised it? If not, delete X and state Y on its own. If Y then sounds thin, it needed a fact, not a foil.

**When X stays.** The reader actually holds X (the brief says so, it is a common misreading of this specific thing, or it was a hypothesis someone tested), or X was a real option that was weighed. Then state it as a fact, not a reveal: "We first suspected the cache; the logs showed two writers racing on the same row." "We chose Postgres over Redis because the data is relational." One genuine contrast in a text is fine; several is the tell.

**When editing, rebuild the sentence this way.** Y gets its own sentence, with its reason if the material gives one. X stays only if it is a fact the reader needs on its own, and then it gets its own sentence, never placed as the setup for Y. This keeps every fact in the draft and drops only the framing, so it holds even when you were told to keep every fact.

**Facts versus framing.** An evaluative word whose only job is to set up the other half (*easy*, *simple*, *obvious*, *table stakes*, *the boring part*) is framing, not a fact, and "keep every fact" does not protect it. A measured X (a duration, a count, a version, a named option) is a fact: it can stay, as its own sentence. "Writing the migration was easy. Getting the retry semantics right was the hard part." becomes "Getting the retry semantics right took most of the work." "The migration took two days; the retry semantics took three weeks." stays, because both halves are measurements. Re-wording the evaluative half to sound measured ("took little time", "went smoothly") keeps the same setup; only a number or a source makes X a fact.

**How to search.** Search for *not*, *n't*, *but*, *rather*, *instead*, *more than*, *less*, *real*, *actual*, *just*, *only*, *forget*, *sure*, *that said*, *what matters*, and a question mark followed by a short answer. Read each hit and check its structure against the table. Most hits will be fine; the ones whose first half the reader never believed are the tell.

| Shape | Example | Write instead |
|---|---|---|
| It's not X, it's Y (also split: "It isn't X. It's Y.") | "This isn't a bug. It's a design flaw." | "This is a design flaw: …" |
| Not X, but Y / Y, not X | "It's a workflow, not a framework." | "It is a workflow: …" |
| Not just X, but (also) Y / not only X but Y / X isn't just Y, it's Z | "It's not just fast, it's reliable." | State both as facts, each with its evidence, or keep only the one that matters. |
| More than (just) X / far from X / anything but X | "More than just a linter." | "A linter that also formats." |
| X isn't the problem, Y is / the problem isn't X | "Speed isn't the bottleneck. Memory is." | "Memory is the bottleneck." |
| The question / point / goal isn't X, it's Y | "The question isn't whether to migrate, it's when." | "The open question is when to migrate." |
| This isn't about X, it's about Y | "This isn't about tabs versus spaces. It's about consistency." | Say what the consistency rule is. |
| It may look like X, but it's Y / you might think X / at first glance X; in reality Y | "It might look like a caching issue, but it's actually a race condition." | "It is a race condition: …" |
| It could be X, but it's Y / sure, X, but Y / yes, X, but Y / that said, Y (concede, then pivot) | "Sure, it works. But it doesn't scale." | "It stops responding above 500 requests a second." |
| Some might argue X, but Y (a strawman raised to be knocked down) | "Some might argue tests slow you down. But …" | Answer an objection someone actually made, and name who; otherwise state Y. |
| Less X, more Y / less about X and more about Y | "Less a tool, more a philosophy." | Say what it does. |
| Y rather than X / Y instead of X, where nobody proposed X | "We use plain files rather than a database." | "We store state in plain files." Keep X only when it was an option weighed, and give the reason. |
| Not because X, but because Y / Not because X. Because Y. | "Not because it's popular, but because it's simple." | "Because it is simple: …" |
| The real X is Y / the actual X / what X really means / the true cost is | "The real cost is maintenance." "The actual problem is the schema." | "Maintenance is the largest cost: …" "The schema is the problem: …" |
| What (actually) matters is Y / the only thing that matters | "What actually matters is retention." | Say why retention matters, with the number. |
| X is easy / table stakes; Y is the hard part / Y was harder (or: X gets the attention, Y does the work) | "Writing the code is easy. Maintaining it is the hard part." | Say what makes maintaining it hard. If the material does not say, state Y alone ("Getting the retry semantics right took most of the work"). *Easy* is framing, not a fact; a measured X ("took two days") can stay as its own sentence. |
| X is dead (long live Y) | "The résumé is dead. Long live the portfolio." | Check whether X is in fact gone; state what changed about Y. |
| Forget X. Y. / stop X, start Y / don't call it X, call it Y / don't X, Y | "Don't fix it, rewrite it." | "Rewrite it: …", with the reason. |
| X? No. Y. / is it X? Not quite. (question, then pivot) | "Is it a bug? Not exactly. It's undefined behavior." | "It is undefined behavior: …" |
| No X, no Y, just Z / Not X. Not Y. Just Z. (countdown) | "No setup, no config, just results." "Not a scam. Not a bargain. Just a lamp." | Say what it is or does, once. |

## 4. Formulaic constructions

**Negation chains.** Two or more "no …" or "did not …" items in a row: "No fluff, no filler, no jargon." "It didn't crash, didn't hang, didn't lose data." Instead: say what it does, once.

**Rule of three.** Three adjectives or three short phrases where fewer, or a different number, is true: "fast, reliable, and secure". Also a colon opening onto a list of three. People use it too, so it counts when it repeats, or where nobody would bother with a flourish, such as commit messages and chat replies. Instead: list the real items, however many there are; often one.

**False ranges.** *from X to Y*, *everything from X to Y*, *ranging from X to Y* where X and Y are not the ends of any real scale: "everything from onboarding to offboarding", "from startups to enterprises". Instead: name the actual items, or drop the range. Two named items are a list, not a range: "everything from billing exports to email digests" becomes "billing exports and email digests".

**Stage-managed reveals.** A drumroll before an ordinary point, or a self-posed question answered at once. Search: *here's the thing*, *here's the twist / catch / kicker / rub*, *here's what actually happened:*, *here's what surprised me most:*, *the punchline is*, *turns out*, *it turns out that*, *the secret?*, *the result?*, *the catch?*, *the lesson?*, *the best part?*, *that's the part …*. Instead: state the point without the drumroll. When the setup promises a detail, the detail must follow in the same sentence.

**Totalizing punchlines and mic drops.** *that's the whole point*, *is the whole trick*, *is the whole game*, *is the entire game / story*, *the entire business model is*, *the entire point is*, *the only X I trust*, *that's why X mattered*, *that's where the real work lives*, and short closing lines that land a verdict: "It matters." "Let's see what happens." "Watch this space." Instead: the actual claim, with its limits and its support. End on the last fact.

**Narrative pivots.** *then something shifted*, *and then everything changed*, *that's when it clicked*. Instead: say what changed.

**Stacked rhetorical questions.** Two or more questions fired in a row, often fragments: "Does it scale? Where does it break? Who maintains it?" Instead: answer them, or state the concern.

**Announced structure.** A count or a map ahead of text too short to need one: *there are three key reasons*, *a few things to keep in mind*, *firstly … secondly … thirdly*, *the first … the second … the third …* (a list dressed up as prose). Instead: give the items. Write a real list if the content is a list, or prose if it is an argument.

**Guided-tour openers.** The text announces that it is about to explain: *let's break this down*, *let's unpack that*, *let's dive in*, *let's explore*, *let's walk through*, *let me explain*, *you might be wondering*, *as you may know*. Instead: start with the explanation.

**Analogy and scene-setting openers.** *think of it as*, *it's like a*, *picture a*, *imagine a world where*, *what if every*. Instead: explain the thing directly; use one analogy only where it fits better than the plain description, and put the subject first.

**Shell nouns and pseudo-clefts.** *the problem is that*, *the catch is that*, *the key is*, *what changed is*, *what happened was*. A box noun that delays the claim. Instead: "The schedule changed." Fill the box with the claim itself.

**Side-of openers.** *on the X side,*, *on the X front,* ("On the funding side, …"). Instead: name who did what.

**Gerund litanies.** Stacked fragments with no subject: "Fixing the parser. Writing the tests. Shipping the release." Instead: full sentences that say who did it.

**Repeated openers and echo runs.** Three or more sentences in a row starting with the same word ("Nobody read it. Nobody fixed it. Nobody asked."), or sentences built on the same skeleton or ending on the same phrase ("A cart is an object in the system. A room is an object in the system."). Instead: merge them or vary the structure because the content differs.

**Uniform cadence.** Sentence after sentence of the same length and build, marching in formation. Short sentences are not the tell; identical ones are. Instead: let each sentence be as long as its content.

**Stranded auxiliary.** A contrast that lands on a bare auxiliary: "The tool died; the data didn't." "Reading passed. Writing didn't." Instead: say what happened to each in full once, if the contrast matters.

**Copula avoidance.** *serves as*, *stands as*, *functions as*, *acts as*, *features*, *offers*, *boasts* where *is* or *has* is the plain word. Instead: *is*, *has*, *uses*.

**Stiff synonyms and raised register.** *utilize* (use), *leverage* (use), *facilitate* (help), *commence* (start), *endeavor* (try), *attempted* (tried), *authored* (wrote), *relocated* (moved), *in order to* (to), *due to the fact that* (because), *a number of* (some, or the number), *culinary* (cooking), *individuals* (people). Instead: the short, everyday word.

## 5. Voice

**Performative honesty.** Sincerity announced instead of shown: *I'll be honest*, *to be clear*, *let's be real*, *let's be honest*, *I won't pretend*, *frankly*, *honestly,* or *look,* opening a sentence, *and honestly? …*, *I must say*, *don't take my word for it*. Instead: say it. When the text promises proof, give the proof.

**Performed humility.** A confession or self-deprecation that does no work: *I'll admit I was skeptical*, *I'm no expert, but*, *I was wrong about this*. Keep it only when the earlier view is a fact the reader needs.

**Therapist voice.** *sit with that*, *it's worth naming*, *that's not nothing*, *you already know*, *hold space for*, *a safe space*, *meet them where they are*, *that loss is real*, *the backlog is real*, *you're not alone*, *you're not imagining it*, *you're not broken*. Instead: in technical and business text, delete; elsewhere, say the specific thing, or measure the thing called "real".

**Announcement and social-post voice.** *thrilled / excited / humbled to announce*, *I've had the privilege of*, *what an incredible journey*, *the next chapter*, *X taught me Y*, *three decades taught me something:*, *showing up*, *curious what others think*, *would love to hear your thoughts*, *drop a comment below*. Instead: say what happened. End when the content ends; a question to the reader belongs only where you want the answer.

**Chat residue in an artifact.** Text written as a reply to the person who asked, left inside the thing they will publish or send: *Certainly!*, *Of course!*, *Great question*, *You're absolutely right*, *Here is a …*, *I hope this helps*, *Let me know if you'd like …*, *Would you like me to …*, *Feel free to …*, *Happy to help*. Instead: the artifact starts with its first real sentence and ends with its last.

**Model disclaimers and internals.** *As an AI language model*, *as of my last update*, *my knowledge cutoff*, *I was trained by*, *I cannot browse the internet*, *I don't have access to real-time data*, *please verify this information*, and model internals leaking into the text: *system prompt*, *context window*, *tokens*, *as instructed*, *per your instructions*. In fiction or role play, stepping out of the frame ("in this story", "the player", *OOC:*). Instead: check what you can check; state plainly what you could not verify, once, where it applies; stay in the frame.

## 6. Vocabulary

Words found far more often in model output than in human writing. Several in one paragraph is the tell; each is fine in its literal sense (an *underscore* character, a *landscape* photo). Do not replace one with its synonym; rewrite the sentence around the fact.

**The long-standing list.** *align with*, *boasts*, *bolster / bolstered*, *commendable*, *crucial*, *deep dive*, *delve*, *emphasizing*, *enduring*, *enhance*, *ever-evolving*, *foster / fostering*, *garner*, *highlighting*, *interplay*, *intricate / intricacies*, *key* (as an adjective of importance), *landscape*, *meticulous / meticulously*, *multifaceted*, *navigate* (figurative), *nuanced*, *pivotal*, *realm*, *resonate with*, *robust*, *seamless*, *showcasing*, *tapestry*, *testament*, *underscore*, *utilize*, *valuable* (as in "valuable insights"), *vibrant*.

**Newer markers.** *genuinely*, *the actual X*, *actually* as emphasis, *that said,*, *in practice*, *especially* tacked onto advice ("…, especially if you're X"), *worth noting*, *feels like*, *one of those*.

**Connective openers.** *Additionally*, *Moreover*, *Furthermore*, *Ultimately*, *Importantly* at the start of a sentence. Instead: drop the connective and start with the point; if the link between two sentences is not obvious, say what it is ("because", "so").

**Intensifying adverbs.** *quietly*, *deeply*, *fundamentally*, *truly*, *incredibly*, *profoundly*, *remarkably*, *genuinely*. Instead: cut them, or use a verb or a number that carries the weight.

**Hedge pileups.** *usually*, *mostly*, *typically*, *often*, *might*, *perhaps*, *could potentially*, *arguably*, several per paragraph. One honest hedge where the evidence is partial is right; a hedge on every claim says nothing. Instead: hedge the claim that is uncertain, once, and state the rest.

## 7. Formatting

**Title Case Headings** in a document that otherwise uses sentence case, or where the house style is sentence case. Use the house style; default to sentence case.

**Headings that only hold headings.** A heading with no text before its first subheading. Add the sentence that says what the section is for, or remove the level.

**Headings on short text.** A markdown title on a social post, a chat reply, or a few paragraphs ("# One Year In: What Nobody Tells You"). Instead: no heading; start with the first sentence.

**Skipped heading levels** (an H1 then an H3), and **many H1s** in one document. Use levels in order; one H1 at most.

**Bold everywhere.** Several bold phrases per paragraph, or the same term bolded every time, especially in casual text. Bold at most the one thing a skimmer must not miss.

**Inline-header bullets.** Every bullet starting with a bold label and a colon ("- **Speed:** It is fast."). Keep the form for a reference list the reader scans by label; for reasoning or narrative, write sentences.

**Lists for prose.** Bullets for content that is an argument or a sequence of causes, or a casual answer turned into a mini-wiki. Write a paragraph, or a few sentences.

**Tiny tables.** A table of two rows, or one column of real data, that a sentence would carry. Use a table for three or more rows compared across two or more columns.

**Em dashes as punch.** Em dashes (or double hyphens) several times per paragraph, used for dramatic pauses or to bolt on a parallel clause, often with spaces around them. One is fine; judge by density. Use a comma, colon, or parentheses for the rest. Follow the house style on spacing.

**Emoji and symbols as formatting.** Emoji before headings, bullets, or status lines (✅ 🚀 ✨ 📌 💡 🎯), ✅/❌ contrast lists, and decorative arrows (→) or symbols standing in for words in prose. Delete them; write the word.

**Section rules.** A horizontal rule between every section. Headings already separate sections.

**Summary and conclusion restating.** A closing "Conclusion", "Summary", "Final thoughts", "In summary", "In conclusion", "To sum up", "All in all", "Overall", or "Key takeaways" that repeats what was just said, or paragraphs that end by restating their first sentence. End on the last new fact.

**Wrong markup for the destination.** Markdown in a plain-text email, a commit body, a Slack message that renders a different syntax, a wiki that uses wikitext, or a form field. Use the destination's markup, or none.

## 8. Whole-text structure

Some tells only show across paragraphs. Read the text start to end once for these.

**Fractal summaries.** Each level announces what it will say, says it, then says what it said: an intro that previews the sections, sections that open with a preview and close with a recap, and a conclusion that recaps the recaps. Instead: say each thing once, where it belongs.

**One point, many ways.** A single argument restated in new words paragraph after paragraph, with no new evidence. Instead: make the point once and spend the rest of the length on evidence, or cut the length.

**Stretched metaphor.** One metaphor carried through five or ten sentences until the text is about the metaphor. Instead: use it once, or not at all.

**Stacked analogies.** A rapid run of historical or company comparisons ("like the printing press, like electricity, like the iPhone"). Instead: one analogy that fits, or none.

**Duplicated content.** The same sentence, paragraph, or section appearing twice, verbatim or nearly. Instead: keep one.

## 9. Flattening

Models pull every text toward one default voice: the most common synonym, shorter sentences with fewer subordinate clauses, neutral evaluation, and the same safe structure whatever the subject. Over a long text, or when editing someone else's, this erases the field's own terms, the writer's register, and fine distinctions.

- **Keep the exact term.** When the source, the field, or the writer uses a specific, established word, keep it (a one-off coined label is covered under *Coined labels* instead). Do not swap it for a broader, more common synonym; the specific word often carries a distinction the common one loses.
- **When editing, keep the writer's voice.** Fix what is wrong (an invented detail, a tell, an unclear sentence) and leave their word choice, dialect, sentence length, and register alone. An edit that makes every writer sound alike is a regression.
- **Keep evaluative nuance.** "Adequate", "good", "excellent", and "remarkable" say different things. Use the one the evidence supports, not the safe middle.
- **Let the subject set the shape.** A text about a narrow topic does not need the same intro, three sections, and outlook as every other text.

## 10. Fiction and narrative

**Stock reactions.** *my heart sank*, *a chill ran down my spine*, *blood ran cold*, *let out a breath I didn't know I was holding*. Instead: a specific physical detail of this character in this scene.

**Ornate dialogue tags.** *intoned*, *breathed*, *murmured softly*, *exclaimed*. Instead: *said*, or an action beat.

**Stock gestures.** *raises an eyebrow*, *smiles knowingly*, *nods slowly*, *a smirk played on her lips*. Instead: a gesture that belongs to this character.

**Stock greetings and foreshadowing.** *well, well, well*, *so we meet again*, *ah, you must be*, *little did I know*, *the die was cast*, *only time will tell*. Instead: open with action; let events foreshadow.

## 11. Leftovers and placeholders

**Markup debris** from chat tools, which shows the text was pasted from one: *oaicite*, *contentReference*, *turn0search0*, *attributableIndex*, *[cite: 1]*, *[span_1](start_span)*, *grok_card*, *utm_source=chatgpt.com* or *utm_source=openai* on links, lenticular brackets 【 】 around citations. Delete; re-check the claims they were attached to.

**Unfilled placeholders.** *[Your Name]*, *[Company]*, *[insert date]*, *<describe the change>*, *XX%*, *Lorem ipsum*. Fill them with real values or ask for them.

**Invented or unchecked sources.** Citations, links, DOIs, ISBNs, quotes, or page numbers you did not open. Open them or remove them.

## 12. Reports, commit messages, and PR descriptions

**What you did not do.** *preserved*, *retained*, *kept intact*, *left unchanged*, *avoided modifying*, *no changes to X*, *did not touch*. Mention an untouched part only when the reader would otherwise assume it changed, or when the user asked you to confirm it.

**Compliance assurances.** *in line with best practices*, *following the project's conventions*, *ensuring consistency*, *adheres to the style guide*, *maintaining backward compatibility* with nothing to show for it. Instead: state the change; show the evidence (the test, the command output) for any claim that matters.

**Emphasis on sourcing instead of content.** *well-sourced*, *thoroughly researched*, *based on reliable sources*, *comprehensive*. Instead: the finding, and the source it came from.

**Process narration.** *First I analyzed …, then I carefully reviewed …* in a result the reader wants the outcome of. Instead: what changed, why, and how it was checked.
