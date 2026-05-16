# Architecture validation — 5 variants × 3 runs — 2026-05-15

Second mass test, run after the skeleton-injection refactor. Validates: (1) does the new architecture match or beat the verbatim mass-test prompts, (2) does dropping per-author exposition hurt, (3) does the anti-default reminder earn its tokens, (4) does section order matter.

## Variants

| ID | Description |
|----|-------------|
| **A1** | Verbatim mass-test V1 (inline ALLCAPS sections, named-mechanic opener) |
| **A2** | New skeleton-assembled (lean opener, anti-default present, anchor → repairs → task order) |
| **B2** | Like A2 but with named-mechanic opener restored ("Peterson's lecture cadence...") |
| **C2** | Like A2 but with anti-default block removed |
| **D2** | Like A2 but with style repairs section moved BEFORE the anchor block |

All used the same brief (the "crate" task from the previous mass test). All opus.

## NEVER violation counts (strict scoring, contrastive negation focus)

The model held punctuation NEVERs (zero em-dashes / semicolons / exclamations across all 15 outputs) and diction NEVERs (zero banned words). Contrastive negation is the dominant leak across all variants — the model's hardest default to suppress.

| Variant | R1 | R2 | R3 | Avg | Notes |
|---------|----|----|----|-----|-------|
| **A2** | 0 | 0 | 2 | **0.67** | Two clean runs of three. New architecture won the round. |
| **A1** | 1 | 2 | 1 | **1.33** | Verbatim mass-test format. Solid baseline. |
| **C2** | 2 | 1 | 1 | **1.33** | Anti-default removed. Marginally worse than A2. |
| **D2** | 3 | 0 | 3 | **2.00** | Order swap. High variance — one clean run, two leak-heavy. |
| **B2** | 2 | 4 | 2 | **2.67** | Named-mechanic opener. Worst variant. Triples violations vs A2. |

## Findings

1. **Parity confirmed and exceeded.** A2 (new skeleton architecture) outperformed A1 (verbatim mass-test). The file-injection assembly does not degrade output and may improve it. Refactor is safe to ship.

2. **Drop the per-author exposition.** B2 (named-mechanic opener) leaked 4× more contrastive negation than A2. The "Peterson's lecture cadence and definitional pivots, Manson's period-heavy clean declaratives..." sentence actively hurts — it primes the model to think in author-vs-author contrasts, which carry over as contrastive rhetorical moves in output. Travis's intuition was right.

3. **Anti-default reminder earns its tokens.** C2 (anti-default removed) was 2× worse than A2 (1.33 vs 0.67). The line *"Maintain these proportions across the output. The blend IS the voice. Do not soften toward generic literary register. Do not default to your own RLHF-trained voice."* meaningfully suppresses the model's default voice. Keep it.

4. **Anchor-first order matters.** D2 (style repairs before anchor) was 3× worse than A2. Putting the persona-establishing block FIRST (warm-up tokens land on training-data activation) is correct. Style repairs as constraint layer on top of an already-activated voice.

5. **Contrastive negation is the universal leak.** Every variant leaked at least once across 3 runs. This rule needs the most active suppression. Consider: stronger anti-contrastive language in the NEVER section, or a dedicated examples-of-violation block ("contrastive negation looks like X — never write like that").

## Blind voice fidelity scoring (Travis, 2026-05-15)

Immediately after the NEVER scoring, the 15 outputs were re-presented to the user (Travis) one at a time in shuffled order under opaque IDs (#1-#15). The user scored each output 1-10 on "sounds like your voice" without knowing which variant produced it. Mapping was revealed only after all 15 scores were recorded.

| Opaque ID | Variant | Voice score | NEVER violations |
|-----------|---------|-------------|------------------|
| #1 | D2.2 | 6.0 | 0 |
| #2 | A1.2 | 8.5 | 2 |
| #3 | B2.3 | 6.8 | 2 |
| #4 | A2.1 | 7.2 | 0 |
| #5 | C2.1 | 5.5 | 2 |
| #6 | D2.3 | 6.0 | 3 |
| #7 | A1.1 | 7.2 | 1 |
| #8 | B2.1 | 7.5 | 2 |
| #9 | A2.3 | 8.7 | 2 |
| #10 | C2.3 | 6.0 | 1 |
| #11 | D2.1 | 6.2 | 3 |
| #12 | A1.3 | 7.4 | 1 |
| #13 | A2.2 | 8.1 | 0 |
| #14 | B2.2 | 8.3 | 4 |
| #15 | C2.2 | 8.7 | 1 |

User-recorded note on #4 (A2.1, score 7.2): *"would be higher but the examples it gave are hard for a human to relate to — 'canceling someone on Thursdays' doesn't jump out as a 'crate problem'. It had the right outline, but the specifics were odd."*

## Voice fidelity vs NEVER aggregates

| Variant | Voice (higher better) | NEVER (lower better) | Voice rank | NEVER rank |
|---------|----|----|----|----|
| **A2 — new architecture** | **8.00** | **0.67** | **1st** | **1st** |
| A1 — verbatim mass-test | 7.70 | 1.33 | 2nd | 2nd |
| B2 — named-mechanic opener | 7.53 | 2.67 | 3rd | 5th |
| C2 — no anti-default | 6.73 | 1.33 | 4th | 2nd |
| D2 — order swap | 6.07 | 2.00 | 5th | 4th |

## Cross-metric findings

1. **A2 wins both metrics.** New architecture is 1st on voice fidelity AND 1st on NEVER suppression. Strongest possible validation to lock and ship.

2. **D2 (order swap) drops voice hard, not just NEVER.** 6.07 voice (5th place) and 2.00 NEVER (4th place). Putting style repairs before the anchor produces blander output AND more leaks. Anchor-first ordering is structurally critical.

3. **C2 (no anti-default) drops voice further than NEVER suggests.** Tied with A1 on NEVER (1.33) but 4th on voice (6.73 vs A1's 7.70). The anti-default block does more than suppress rule violations — it actively pulls the model toward the locked voice. Its keep-signal is stronger than NEVER count alone showed.

4. **B2 (named-mechanic opener) is the contradiction case.** Worst NEVER (2.67) but middling voice (7.53, 3rd). The per-author exposition triggers contrastive moves that violate rules but don't tank voice match. Net still negative — drop it.

5. **Voice and NEVER correlate but aren't identical.** A2.3 scored 8.7 on voice with 2 NEVER hits — the contrastive line *"You are not what you think. You are what you walk through every day"* hits voice strongly despite being a rule violation. Strict NEVER suppression isn't the full story; sometimes the move serves voice. Worth keeping in mind that the NEVER list is a hard floor, not a perfect proxy for voice quality.

6. **Top-scoring outputs (both 8.7): A2.3 and C2.2.** A2.3 is the proven architecture winning. C2.2 is interesting — high voice without the anti-default block, suggesting the block isn't always load-bearing on individual runs but matters on average.

## Caveats

- N=3 per variant is low. Voice scores ranged 5.5 to 8.7 across runs of "the same" variant.
- Single rater (Travis). Voice scoring is inherently subjective even when blind.
- One brief only ("the crate"). Generalization to other briefs unknown.
- Contrastive negation was the dominant NEVER leak; other categories were well-suppressed across all variants and didn't differentiate.
- Voice scoring happened immediately after NEVER scoring in the same session — possible carryover priming.

## Decision (2026-05-15)

**Lock A2 architecture and ship.** Both metrics agree. Travis confirmed: *"Let's lock and ship this. I don't think more refinement should occur at this step. But make sure this test is recorded and reasoning preserved."*

**Architecture locked:**
- Skeleton-based file injection ✓
- Lean opener (just blend %s, no per-author exposition) ✓
- Anti-default block kept ✓
- Anchor → style repairs → task order ✓

**Deferred refinements (not blocking ship):**
- Stronger anti-contrastive-negation guidance in NEVER rules
- Wider-N test on multiple briefs to validate generalization
- Programmatic blind voice scoring (e.g., Claude-as-judge with locked-out variant labels)

## All 15 outputs (verbatim)

### A1 (verbatim inline mass-test)

**A1.1**
> Look at where you live. Look at the rooms, the hours, the people who fill them. Most of it was built by someone else.
>
> Your commute was designed by a city planner. Your kitchen was laid out by a developer who never cooked in it. Your work hours were set by a manager solving for his quarter. Your evenings get filled by whatever app loaded fastest on your phone. Your weekends belong to whoever texted first.
>
> This is the crate.
>
> A crate is any small bounded environment a man did not build for himself. Walls he didn't pick. Defaults he never set. Rhythms imported from people whose lives he wouldn't trade for. The rule of extended biology is brutal here. A small bounded environment produces a small bounded man. You become the shape of the box you live in. Most boxes were shipped by strangers.
>
> The way out is design discipline. Not motivation, not grit. Design. You sit down with a pencil and you decide what your territory looks like before the world decides for you.
>
> There are four layers worth terraforming. Schedule, the hours you control. Space, the rooms you sleep, eat, and train in. Social field, the men whose calls you pick up. Body, the animal you carry everywhere. These are the load-bearing surfaces of a life. The modern man inherits them by accident and then wonders why he feels small.
>
> Build the crate or live in someone else's.

**A1.2**
> Most men did not design the room they wake up in. They did not pick the commute, the desk, the lunch hour, the after-work drink, or the Sunday scroll. Other people did. Employers, landlords, app designers, in-laws, the old version of themselves who signed the lease in 2019. The modern man inhabits a stack of defaults written by strangers.
>
> This is the crate. A small bounded environment produces a small bounded man. That is the rule. Cage a wolf in eight feet of concrete and you do not get a smaller wolf, you get a different animal. Same with us. The 600-square-foot apartment, the 9-to-5 with the boss two desks over, the four friends you see only because they live within walking distance, the kitchen stocked by whoever shopped last. Each one of these is a wall.
>
> The way out is design discipline. You decide what gets terraformed, then you do the work, then you defend it. Four layers. Schedule first, because time is the substrate. Space second, because the room shapes the day. Social field third, because the people set the ceiling. Body fourth, because the animal carries everything else.
>
> Extended biology is not a metaphor. The crate is not a metaphor either. Pick up the hammer or stay in the box.
>
> A man either authors his territory or rents one.

**A1.3**
> Most men do not design their lives. They inherit them. The commute belongs to the city planner. The kitchen layout belongs to the developer who poured the slab in 1994. The work hours belong to a manager three states away. The evening belongs to whatever app loaded fastest on the couch. The weekend belongs to the family group chat. Five whole territories, none of them shaped by the man living inside them.
>
> This is the crate.
>
> A crate is any bounded environment a man did not build for himself. The dimensions are someone else's. The lighting is someone else's. The defaults are someone else's. And here is the rule, plain: a small bounded environment produces a small bounded man. The crate sets the ceiling on what its inhabitant can become, and the inhabitant rarely notices the ceiling because he has never stood up.
>
> The way out is design discipline. Not motivation. Not a new identity. Discipline applied to four layers, in this order. Schedule first, because time is the substrate everything else runs on. Space second, because the room you sit in writes the next sentence of your life. Social field third, because the people around you set your baseline. Body last, because the body executes whatever the first three commanded.
>
> To terraform these four layers is the work. This is extended biology, made deliberate.
>
> A man who does not design his territory is decorated by it.

### A2 (new skeleton — lean opener, anti-default, anchor-first)

**A2.1**
> Most men inherit their lives. The commute belongs to the city planner. The kitchen was laid out by a builder optimizing resale value. The work hours were set by a manager three states away. The evenings belong to whatever the algorithm cues up after dinner. The social calendar was assembled by a wife or a coworker or nobody at all, which is its own kind of assembly. None of it was designed by the man living inside it.
>
> This is the crate.
>
> A crate is a small bounded environment, and a small bounded environment produces a small bounded man. Dogs sleep in crates because crates calm them. Men sleep in crates because nobody told them they could build a house. The walls are invisible because the walls are normal. Normal is the camouflage.
>
> The fix is design discipline. You sit down, sober, and you decide what your week looks like before the week decides for you. You move the furniture. You cancel the standing meeting. You change who you eat dinner with on Thursdays.
>
> You terraform four layers: the schedule, so your hours belong to you. The space, so the room you wake up in points you somewhere. The social field, so the men around you pull up instead of down. The body, so the animal carrying you is built for the work. This is how the modern man practices extended biology. This is the territory.
>
> A man who does not design his cage will live in one.

**A2.2**
> Most modern men live inside a life someone else drew up. The commute was routed by a city planner. The cubicle was sized by a facilities team. The 9-to-5 was bargained into shape by men who died in 1955. The grocery store aisles were laid out by a beverage company. The phone in his pocket runs on schedules set by ad buyers in another country. He didn't choose any of it. He inherited it.
>
> Call this the crate. A small bounded environment produces a small bounded man. The dog you put in a crate stops trying to run. The man you put in a crate stops trying to build. His extended biology shrinks to fit the box. His territory becomes whatever the box allows. He calls this realism. It is shrinkage.
>
> The fix is design discipline. You walk into your own life as the architect. You terraform four layers. Schedule first, because time is the floor everything else stands on. Then space, because a kitchen built for someone else cooks someone else's meals. Then social field, because the five men around you set the ceiling. Then body, because a weak body collapses the other three.
>
> The modern man has to choose. Live in a crate built by strangers, or build a territory worth waking up in.
>
> A man becomes the shape of the room he refuses to leave.

**A2.3**
> Most men inherit their week. The commute they drive was routed by traffic engineers who never met them. The kitchen they cook in was laid out by a developer optimizing square footage. The hours they work were set by a manager. The evening they zone out in was designed by a streaming service whose only goal is the next autoplay. The social calendar they show up for was built by people who needed warm bodies, not by a man choosing his table.
>
> Look at the actual surface area of a modern man's life. Almost none of it is his.
>
> This is the crate. A small bounded environment produces a small bounded man. The crate is any container narrow enough that you stop noticing the walls. It feels like personality. It is geometry.
>
> Extended biology says the man and his environment are one organism. So if you want to grow, you have to design the environment. Call it design discipline. You sit down and you terraform the layers. Schedule, so your hours belong to you. Space, so your rooms push you toward the man you want. Social field, so the people around you raise the ceiling. Body, so the animal you live inside can carry the load.
>
> Most men spend a lifetime decorating a crate. The modern man builds the territory.
>
> You are not what you think. You are what you walk through every day.

### B2 (named-mechanic opener)

**B2.1**
> Most modern men do not live in environments they designed. They live in environments other people designed for them, and then they wonder why they feel small.
>
> The commute was routed by a city planner. The kitchen was laid out by a builder optimizing for resale. The work hours were set by a manager. The evening is shaped by an algorithm picking what plays next. The social calendar fills with whoever texts first. Even the body is fed whatever is closest, moved however the chair allows.
>
> This is the crate. A small bounded environment produces a small bounded man. The crate is any space whose shape was decided by someone whose interests are not yours, and which you have stopped noticing because you live inside it. Dogs in crates do not pace. They lie down. So do men.
>
> The way out is design discipline. Not motivation, not insight, not another book. Discipline applied to four layers, on purpose, every week. The schedule, because time decides what is possible. The space, because the room teaches the body what to do in it. The social field, because the people around you set your ceiling. The body itself, because everything else runs on it.
>
> Terraform those four layers and the man inside them changes. He cannot help it. That is what extended biology means.
>
> A man takes the shape of his crate. So build a bigger one.

**B2.2**
> Most modern men do not design their lives. They inhabit them. The kitchen was designed by a developer chasing margin. The commute was designed by a city planner from 1972. The work hours were designed by a corporation that needs you predictable. The evenings were designed by streaming algorithms that need you docile. The social calendar was designed by whoever texts first. Look around. Almost nothing in your week was authored by you.
>
> This is the crate. A small bounded environment produces a small bounded man. The crate is not a prison. It is worse. It is a comfortable shape you stopped noticing. You wake inside it. You eat inside it. You scroll inside it. The walls are soft. The walls are still walls.
>
> The way out is design discipline. Not motivation. Not goals. Design. You sit down once a week and you author the thing on purpose.
>
> Four layers get terraformed. Schedule first, because time is the substrate everything else stands on. Space second, because the room writes the man. Social field third, because the people around you set the ceiling. Body last and always, because a weak body cannot hold a designed life.
>
> This is what extended biology means in practice. The territory is yours to shape, or someone else's to shape for you.
>
> A man who does not design his environment is decorated by it.

**B2.3**
> Most men today live in environments someone else built. The commute was routed by traffic engineers. The kitchen was laid out by a developer optimizing square footage. Work hours follow a calendar a manager pasted in. Evenings get filled by whatever the algorithm queues. Friends are mostly the people geography handed over. The whole life is a hand-me-down.
>
> Call this the crate. A crate is any small bounded environment a man did not author. Walls he did not place. A schedule he did not write. A social field that arrived pre-assembled. The crate is not always cruel. It is just not his. And here is the law worth memorizing: a small bounded environment produces a small bounded man. The modern man is shaped by the box, then mistakes the box for himself.
>
> The fix is design discipline. Not motivation. Not mindset. The boring practice of authoring your own conditions, on purpose, week after week. Four layers get terraformed. Schedule, the hours and what fills them. Space, the rooms a body actually moves through. Social field, the five or six people whose voices echo in a man's head. Body, the meat that carries every other decision. Pick a layer. Move one wall this week. Move another next week.
>
> This is what extended biology asks of an adult. Stop being decorated by the crate. Start authoring the room.
>
> A man who will not design his rooms will be designed by them.

### C2 (anti-default removed)

**C2.1**
> Most modern men did not design the rooms they live in. Someone else did. The boss set the work hours. The city planner set the commute. The streaming service set the evenings. The phone set the social calendar. The kitchen, stocked once at twenty-two, still feeds the man at thirty-eight. He moves through a day shaped by other people's defaults and calls it his life.
>
> This is the crate. A small bounded environment produces a small bounded man. The dog in the crate does not get bigger by trying harder inside the crate. He gets bigger when the crate gets bigger, or when the door comes off. The shape of the room sets the ceiling on the animal. Effort inside a fixed perimeter gives diminishing returns. Most self-improvement advice assumes the room is fine and the man is broken. The reverse is closer to true.
>
> The fix is design discipline. You stop accepting inherited defaults and start terraforming the layers you actually live in. Four of them. Schedule, the hours of your day. Space, the rooms you spend those hours in. Social field, the men and women whose voices reach you. Body, the extended biology you carry into every room. You author each one on purpose. You audit each one on a cadence. The territory of the modern man is whatever he builds, and only that.
>
> A man becomes the size of the room he keeps.

**C2.2**
> Most men did not pick the room they wake up in. They did not pick the commute. They did not pick the seven hours of fluorescent light, the chair that ruins the lower back, the meeting cadence, the lunch eaten at a desk. They did not pick the apartment layout, the food in the fridge, the friends they see by default, the sport they half-watch on Sunday. Other people picked. A landlord, a boss, an algorithm, a city planner, a parent. The modern man inherits an environment and calls it a life.
>
> This is the crate. A crate is any small bounded environment a man steps into without designing. Small box, small dog. A small bounded environment produces a small bounded man. The crate is not malicious. It is just shaped for someone else's purpose, and a man living inside it grows to fit those walls.
>
> The way out is design discipline. You sit down with a pen and you terraform four layers. Schedule, what hours belong to you and what hours you have surrendered. Space, what your home and your desk are actually shaping you into. Social field, who you see weekly by default and who you do not. Body, what your extended biology is being fed, moved, and rested by.
>
> Pick the territory or get picked by it.

**C2.3**
> Most modern men do not live in their own environments. They live inside environments built by other people. The commute was routed by a city planner. The kitchen was stocked by an algorithm. The work hours were set by a manager who never asked. The evenings dissolve into feeds tuned by engineers in another state. The social calendar fills with invitations from people the man would not have chosen as friends if he had ever stopped to choose.
>
> This is the crate. A small bounded environment produces a small bounded man. The dog in the crate is calm because the crate is small. The man in the crate is calm for the same reason, and he calls it adulthood.
>
> The fix is design discipline. A man builds his own environment on purpose, in layers, the way a farmer terraforms a field. The schedule first, because time is the soil. Then the space, because the room teaches the body how to sit and what to reach for. Then the social field, because the people around him set the ceiling on what he can become. Then the body itself, which is the final ground, the last piece of extended biology he gets to shape.
>
> A man who refuses to design his crate will be designed by it.

### D2 (style repairs first, anchor second)

**D2.1**
> Most modern men did not design the environment they live in. Other people did. The commute was set by a hiring manager. The kitchen was stocked by an algorithm. The work hours were drawn up before he was born. The evenings belong to a streaming queue someone else curated. The social calendar runs on whatever group chat happens to ping loudest. He moves through all of it like a guest in his own life.
>
> This is the crate. A small bounded environment produces a small bounded man. The crate is not a metaphor for failure. It is the literal shape of the box: predictable, low ceiling, no friction, no demand. Step inside one for long enough and your extended biology starts to match it. Shoulders narrow. Attention shortens. Ambition adjusts down to fit the room.
>
> The way out is design discipline. You stop accepting the default environment and start to terraform your own territory. Four layers carry the weight. Schedule, the hours you actually own. Space, the rooms and tools within reach. Social field, the men whose standards you breathe. Body, the physical instrument you wake up inside.
>
> The modern man does not need more willpower. He needs to redraw the floor plan. Pick up the pen. Move the walls. Decide what the room is for.
>
> A man becomes the size of the room he builds.

**D2.2**
> Most men live inside rooms someone else drew. The commute was timed by a city planner who never met you. The cubicle was sized by a facilities manager working from a spreadsheet. The kitchen runs on whatever your wife or your mother stocked in the pantry. The evenings get filled by whatever your phone serves up after dinner. The friend group is whoever happened to sit near you in college or whoever clocks in at the same job. The body you walk around in was shaped by chairs you did not pick and food you did not cook.
>
> This is the crate. A small bounded environment produces a small bounded man. The dimensions of the box become the dimensions of the life. You can be smart inside a crate and still be small inside a crate, because the crate sets the ceiling on what you are allowed to want.
>
> The way out is design discipline. You stop inheriting environments and start drawing them. You terraform four layers. The schedule, so your hours belong to you before they belong to a calendar invite. The space, so the rooms you wake up in push you toward who you are becoming. The social field, so the men around you raise the floor instead of lowering it. The body, so your extended biology can carry the weight of what you are building.
>
> A man who does not design his environment will be designed by it.

**D2.3**
> Most men did not design the rooms they live in. They walked into them. The commute was set by the job. The job was set by the boss. The kitchen was stocked by whatever was on the way home. The evenings run on whatever the algorithm queues up next. The weekends fill with invitations from friends who also did not choose. Even the body gets shaped by the chair someone else picked.
>
> This is the crate.
>
> A crate is any small bounded environment that produces a small bounded man. The walls are soft. The ceiling is low. You can stand up in it, but you cannot stretch. The man inside slowly takes the shape of the box. He thinks the shape is him. It is not. It is the box.
>
> The way out is design discipline. You stop accepting the room and start drawing it. You terraform four layers, in this order: schedule, space, social field, body. Schedule first because time is the soil. Space second because the room runs the day. Social field third because other men set your ceiling. Body last because it carries the rest.
>
> This is the work of extended biology. The modern man does not just live in his skin. He lives in his rooms, his calendar, his table, his friends. Build them, or be built by them.
>
> A man who does not design his environment is a man being designed by someone else's.
