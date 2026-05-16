---
name: writers-voice
description: |
  Constructed voice for writing tasks. The free, skill-based path to 60-80%
  voice-matched output. Anchors the agent to a training-data author blend
  (from openwriter.io/writers-voice) and progressively layers NEVER rules,
  presentation fingerprints, and curated examples as the user accumulates
  a writing corpus. Pure markdown — agent does best-effort analysis by
  following the prompts in catalog/. Gets better as the user adds samples.

  Use when: "/writers-voice", "set up my voice", "set up my voice anchor",
  "anchor my voice", "voice match", "use my voice", "write in my voice"
  (when no Authors Voice profile is configured), "add to my voice profile",
  "voice profile status", "voice status".

  NOT for: users with a paid Authors Voice profile — use the voice-apply
  skill family for that. This is the free starter tier.
metadata:
  author: travsteward
  version: "0.4.3"
license: MIT
---

# Writer's Voice

A constructed voice the user builds up over time. The free counterpart to **Author's Voice** (the paid plugin with full RAG retrieval and inline edits). Writer's Voice gets the user to 60-80% match using a training-data author blend plus NEVER rules, presentation fingerprints, sentence stats, coined terms, and curated examples — all assembled into a fixed system prompt and run through a clean opus sub-agent.

## Architecture

The skill ships a **skeleton** prompt template and assembles it from per-user voice files at write time. The dirty editor (main agent) loads the skeleton, substitutes file contents into injection points, fills the TASK section, and spawns a fresh opus sub-agent (the minion) with the assembled prompt. The minion has no session pollution, returns prose, dies. The editor integrates the result.

## File layout

```
writers-voice/
├── SKILL.md                    # this file — operational instructions
├── prompts/
│   └── skeleton.md             # rigid prompt template + injection points
├── voice/                      # user-specific
│   ├── anchor.md               # corpus-wide blend (lean — model-facing)
│   ├── anchor-<ctx>.md         # OPTIONAL per-register anchors (lean)
│   ├── anchor-analysis.md      # human-facing rationale (NEVER injected)
│   ├── never-rules.md          # diction/syntax/punctuation kill list
│   ├── fingerprints.md         # presentation choices
│   ├── stats.md                # sentence distribution + punctuation density
│   ├── coined-terms.md         # author's coined terms to preserve verbatim
│   ├── examples.md             # OPTIONAL curated paragraphs
│   ├── status.md               # tier + what's locked + below-hurdle detections
│   └── corpus/sample-NNN.md    # raw samples
└── catalog/                    # read-only reference (analysis rules)
```

Lean / rich split: voice files ending in `-analysis.md` are human-facing only and never get injected into the minion prompt. Everything else under `voice/` (and `prompts/skeleton.md`) is what the model sees.

## Routing

| User intent | Action |
|-------------|--------|
| "set up my voice" / "/writers-voice" / first run | Run **Setup Flow** |
| "add this essay to my voice profile" / "save this writing" | Append to `voice/corpus/`, run **Analysis Protocol** |
| "voice status" / "what's locked" | Read `voice/status.md`, report |
| (User asks the agent to write anything) | Run **Apply Protocol** (after **Context Hygiene** check) |
| "show me my anchor" / "show me my fingerprints" | Read the relevant `voice/*.md` and report |
| "regenerate my profile" / "re-analyze my corpus" | Run **Analysis Protocol** |
| "make a book / business / [context] voice anchor" | Run **Anchor Protocol** for that register |
| "split my anchor by register" | Run **Multi-Register Split** |

## Setup Flow

If `voice/anchor.md` doesn't exist or is empty, walk the user through setup:

1. **Get the anchor.** Two paths:
   - **Web tool** — user pastes 300-800 words at openwriter.io/writers-voice, copies the result block back. Parse `- XX% Author Name` rows and write to `voice/anchor.md` (lean: just the blend lines, no sub-bullets).
   - **In-agent (Anchor Protocol)** — if user has corpus on disk, run the protocol below to generate `voice/anchor.md` directly.
2. **Seed the corpus** — ask for 2-5 paragraphs, write each to `voice/corpus/sample-NNN.md` with `added: YYYY-MM-DD` frontmatter.
3. **Run Analysis Protocol** — populates `stats.md`, `never-rules.md`, `fingerprints.md`, `status.md`.
4. **Optional: curate examples** — ask the user for 3-5 most-representative paragraphs, write to `voice/examples.md`.
5. **Optional: populate coined terms** — ask the user for any coined terms / proper-noun concepts they want preserved verbatim, write to `voice/coined-terms.md` as a bare bullet list.
6. **Report status** — read `voice/status.md` and tell the user their tier + what unlocks next.

## Anchor Protocol (in-agent equivalent of the web tool)

Generates `voice/anchor.md` (lean) and `voice/anchor-analysis.md` (rich).

1. Confirm corpus has ≥300 words. Below 300, route to web tool.
2. Read `voice/stats.md`. If missing, run **Analysis Protocol** first.
3. Read `catalog/anchor-prompt.md` (full stylometry rubric) and `catalog/author-hints.md` (curated training-data authors with prose features).
4. **Set aside conversational context.** Score the corpus on prose mechanics only — never on themes/topics.
5. **Per-sample register analysis.** For each sample, record word count, address mode, register, signature moves. Flag samples >25% volume. Cluster by register; if 2+ distinct registers appear, flag as multi-register corpus.
6. **Score with register-aware feature validation.** Apply the 8 dimensions from `catalog/anchor-prompt.md`. Match against author hints. Assign weights summing to 100. For each cited feature, verify ≥40% sample appearance OR ≥40% volume (if neither, drop the feature; if it was the strongest evidence, drop the author).
7. **Self-criticism pass.** Strip any thematic reasoning. Set `confidence` and `any_thematic_reasoning` flags.
8. **Write `voice/anchor.md`** — JUST the lean `- N% Author` lines. No headers, no sub-bullets.
9. **Write `voice/anchor-analysis.md`** — per-author features, per-sample table, register diversity, self-check, refresh notes. Human-facing only.
10. **If multi-register corpus detected**, recommend a Multi-Register Split (see below).
11. Report blend + confidence + caveats to user.

## Multi-Register Anchors

If the corpus spans multiple registers (e.g., third-person expository AND direct-you instructional), maintain a separate anchor per register: `voice/anchor-<context>.md` (e.g., `anchor-book.md`, `anchor-essay.md`, `anchor-tweets.md`). Same lean format. Each gets a paired `voice/anchor-<context>-analysis.md`.

**Multi-Register Split procedure:**

1. Identify registers from the per-sample analysis.
2. For each register, ask the user for a slug + one-line description.
3. Filter corpus to samples in that register.
4. Run the matcher on the subset (same `catalog/anchor-prompt.md` rubric, same variance checks).
5. Write `voice/anchor-<slug>.md` (lean) + `voice/anchor-<slug>-analysis.md` (rich).

**Apply-time anchor selection:** at write time, if multiple anchor files exist, pick by user's request context (explicit naming wins; project the user is working on wins next; ask if ambiguous; fallback to `voice/anchor.md`).

## Analysis Protocol (regenerate voice files from corpus)

Run any time the corpus changes.

1. **Read inputs.** Concatenate every file in `voice/corpus/` (strip frontmatter). Count words. Read `catalog/ai-tells.md`, `catalog/fingerprints.md`, `catalog/hurdle.md`.
2. **Compute deterministic tally** (best effort — counts may drift ±1 on long corpora):
   - **Sentence distribution**: split on `[.!?]\s`, compute short/medium/long/very-long percentages, average length. Set `short_max` (25th-pct, clamped [6,12]) and `long_min` (75th-pct, clamped [18,28]). Do NOT emit a sentence-length cap in the apply directive — the corpus distribution carries the right ceiling and an arbitrary cap suppresses signature long sentences.
   - **Punctuation density per 1k words** for em/en dash, colon, semicolon, question, exclamation, ellipsis, paren, bracket, straight/curly quotes. Categorize as `never` / `rare` / `low` / `strong`.
   - **AI-tell tally**: count each item from `catalog/ai-tells.md`. Apply hurdle from `catalog/hurdle.md`: passes hurdle → preserve; fails → emit NEVER rule; below-hurdle but present → log to `below_hurdle`.
   - **Fingerprints**: apply each detector from `catalog/fingerprints.md` with its decision rule.
3. **Determine tier** by word count: <300 = 0 Empty; 300-999 = 1 Anchor; 1000-4999 = 2 Preliminary; 5000-19999 = 3 Full Coverage; ≥20000 = 4 AV-Grade. See **Tier Reference** below.
4. **Write `voice/stats.md`** — corpus stats, sentence distribution table, punctuation density table.
5. **Write `voice/never-rules.md`** — preserve `## Manual Additions` section verbatim (anchored to start-of-line; the literal also appears in the intro blockquote — naive search will mis-grab it).
6. **Write `voice/fingerprints.md`** — preserve `## Manual Overrides` section, same caution.
7. **Write `voice/status.md`** — tier, words, active features, locked features, next milestone, file list, below-hurdle detections.
8. **Report** — new tier, what changed in NEVER rules, what's locked next.

For corpora >10k words, count in passes (words → phrases → transitions) rather than tracking 60 counters at once.

## Adding Samples Later

User says "add this to my voice profile" or pastes new writing. Append to next `voice/corpus/sample-NNN.md`, re-run Analysis Protocol, report tier change if any.

## Context Hygiene

Reset context before applying voice to fresh writing — voice profiles fight against active conversation context and lose. Anchor blends, NEVER rules, and first-token cadence all get out-pulled by whatever prose dominates the live session.

| Situation | Practice |
|-----------|----------|
| First piece of fresh writing in this session | **Reset.** Start a fresh session. Apply Protocol loads voice files cold. |
| Iteration on already-voice-applied writing (review → revise → review) | **Stay.** The context IS the voice you locked in. |

**Surface the prompt when** ALL THREE hit: (1) voice profile is set up at Tier 1+, (2) request is fresh writing not iteration, (3) session has substantial prior context unrelated to the writing task. Skip for brand-new sessions or when prior context IS the writing-task setup.

**Prompt to surface:**

> Voice profile is set up at **Tier N**. Context here is polluted with **<one-line summary>**, which will pull output toward that register instead of the locked voice.
>
> For best output, start a fresh session and run:
>
> ```
> /writers-voice
> <then ask for your writing task>
> ```
>
> Or tell me **"write here anyway"** and I'll proceed with the active context.

## Apply Protocol

When the user asks for any voice-matched write:

0. **Run Context Hygiene check.** If polluted and user wants fresh, surface the prompt. Otherwise proceed.
1. **Pick the anchor.** List `voice/anchor*.md`. If only `voice/anchor.md` exists, use it. If context-specific anchors exist, infer from request or ask. Fallback to `voice/anchor.md`.
2. **Assemble the minion prompt.** Read `prompts/skeleton.md`. For each `{INCLUDE: <path>}` marker, read that file and substitute its full contents in place. If a referenced file doesn't exist (e.g., user hasn't curated examples), drop the entire `{INCLUDE: ...}` line AND the section header immediately above it. If a context-specific anchor applies, swap the `voice/anchor.md` path in the skeleton's anchor injection to `voice/anchor-<context>.md` before processing.
3. **Fill the `{TASK}` placeholder.** Write the editor's brief in plain prose. Required: COMMITMENTS — what must be true of the output (concepts, claims, sequence, register, avoidances, length/scope). Optional: any depth of additional guidance the editor judges useful — structural beats, paragraph patterns, pacing, source draft to rewrite, specific moves to land. Vague to highly specific is the editor's call based on the piece.
   - **Recommended for high-stakes writing: include CADENCE PRESCRIPTION per paragraph.** Empirically lifts voice fidelity ~0.5 points over baseline. Counterintuitive — explicit rhythm scaffolding doesn't constrain content; it FREES capacity by removing "what shape should this take?" overhead. Example: *"Para 1: open with 3 short declaratives, stack medium with concrete examples, close with one analytical long. Para 2: alternate short claim with longer explanatory, end with sharp short. Para 3: build with longer analytical, end with single-line aphoristic close."*
   - **Vary cadence prescriptions across sections.** If integrating multiple minion outputs into one document, give each section a different prescription. Same prescription per section produces document-scale rhythm repetition (every section opens with 3 shorts, closes with aphorism) — invisible at the section scale, mechanical at the document scale.
4. **Spawn the minion.** `model: "opus"`, `subagent_type: "general-purpose"`, `prompt: <fully assembled skeleton>`.
5. **Receive output.** Treat as raw material. Do not regenerate or "improve" the prose in main context — the minion's output IS the voice-matched result.
6. **Integrate via openwriter** — `write_to_pad` for edits, `populate_document` for new docs.
7. **Cross-section coherence review.** After integrating multiple minion outputs into one document, scan for what individual minion runs cannot see:
   - **Cadence repetition** across sections (same opens, same closes, same paragraph counts)
   - **Recurring metaphors / phrases** (same image or quasi-verbatim phrasing across sections)
   - **Structural sameness** (every section ends with the 4-layer enumeration, every section opens with 3 shorts)
   - **Coined term overuse** — coined terms get injected into every minion call as MUST-PRESERVE, so every section uses them, producing document-scale repetition (e.g., "territory" appearing every 3 paragraphs). Track which coined terms have been used heavily; for subsequent minions, omit heavy-use terms from the coined-terms injection OR add an instruction to use sparingly.

   Fix options: re-spawn with varied prescription, surgical post-edit (combine/split/swap), vary commitments and coined-terms lists per section at brief-assembly time, or accept for low-stakes drafts. The editor is responsible for document-scale coherence; the minions are only responsible for section-scale quality.

   **Related: COMMITMENTS function as quasi-verbatim instructions.** When the editor writes a commitment with literal phrasing in parentheses (*"Define the crate (a small bounded environment produces a small bounded man)"*), the model treats the parenthetical as the exact phrasing to reproduce — every section gets that line. For multi-section work where phrasing should vary, write commitments abstractly (*"Define the crate"*) and let the model phrase. Use literal commitments only when a specific phrasing MUST land.
8. **Optional: parallel pick-best.** For high-stakes writing, spawn N (3-6) minions in parallel with the same brief. Then pick the best whole, mix and match across variants, refine the best with a follow-up minion, or hand all variants to the user.
9. **Optional: invoke `/anti-ai`** for a final AI-detection pass.

**Use opus.** Sonnet leaks NEVER violations 3+ per output where opus leaks 0-1. Haiku loses voice entirely.

**Send the full editing scope to the minion.** If 6 of 8 paragraphs need fixes, send all 8 — the minion needs full context to maintain flow.

**One minion per natural editing unit** — beat, section, blog post, tweet thread.

## Tier Reference

| Tier | Words | Name | Unlocked | Locked |
|------|-------|------|----------|--------|
| 0 | <300 | Empty | (none) | anchor blend, basic stats, NEVER rules, fingerprints |
| 1 | 300-999 | Anchor | anchor blend, basic stats | preliminary NEVER rules, fingerprints |
| 2 | 1000-4999 | Preliminary | anchor blend, basic stats, preliminary NEVER rules, top fingerprints | full NEVER coverage, all fingerprints |
| 3 | 5000-19999 | Full Coverage | anchor blend, stats, full NEVER rules, full fingerprints | high-confidence em-dash hurdle |
| 4 | ≥20000 | AV-Grade | anchor blend, stats, full NEVER rules, full fingerprints, em-dash hurdle cleared | (none) |

## Companion Skills

- **`/anti-ai`** — final post-pass on generated output. Catches AI tells the voice profile didn't suppress.
- **`/voice-presets`** — generic voice frame (authority / provocateur / logical / storyteller / business) for users without a custom anchor.
- **Author's Voice plugin (paid)** — full RAG retrieval, inline edits, deterministic extraction. Upgrade path when the user outgrows this skill.

## When NOT to use

- User has a configured Author's Voice profile (`voice-apply` is better — sample-based RAG with deterministic extraction).
- User explicitly wants a generic frame (`/voice-presets` is faster).
- One-off writing tasks where setting up a voice isn't worth it.
