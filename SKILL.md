---
name: voice-anchor
description: |
  Constructed voice for writing tasks. The free, skill-based path to 60-80%
  voice-matched output. Anchors the agent to a training-data author blend
  (from openwriter.io/voice-match) and progressively layers NEVER rules,
  presentation fingerprints, and curated examples as the user accumulates
  a writing corpus. Gets better over time.

  Use when: "/voice-anchor", "set up my voice", "set up my voice anchor",
  "anchor my voice", "voice match", "use my voice", "write in my voice"
  (when no Authors Voice profile is configured), "add to my voice profile",
  "voice profile status", "voice status".

  NOT for: users with a paid Authors Voice profile — use the voice-apply
  skill family for that. This is the free starter tier.
metadata:
  author: travsteward
  version: "0.1.0"
license: MIT
---

# Voice Anchor

A constructed voice the user builds up over time. Five `.md` files in `voice/` define the user's writing identity. The agent loads them at write time and applies them as constraints.

This is the free counterpart to **Author's Voice** (the paid plugin with full RAG retrieval and inline edits). Voice Anchor gets the user to 60-80% match using:
1. A training-data author blend (anchor — from openwriter.io/voice-match)
2. NEVER rules auto-extracted from their corpus
3. Presentation fingerprints auto-extracted from their corpus
4. A growing corpus of sample paragraphs

The skill is progressive — it works at any tier, and unlocks more features as the user adds samples.

## State Detection (always run first)

When invoked, before doing anything else, check `voice/`:

```bash
ls ~/.claude/skills/voice-anchor/voice/
```

The `voice/` directory has up to six expected files:
- `voice-match.md` — anchor blend (paste from openwriter.io/voice-match)
- `stats.md` — sentence distribution + punctuation density (auto)
- `never-rules.md` — diction/syntax/punctuation kill-list (auto + manual)
- `fingerprints.md` — exact presentation choices (auto + manual)
- `examples.md` — curated paragraphs (manual)
- `status.md` — current tier + what's locked

Plus `corpus/` directory holding raw samples (.md or .txt).

Read `status.md` first if it exists. It tells you tier, corpus word count, and what's active.

## Routing

Based on what the user said:

| User intent | Action |
|-------------|--------|
| "set up my voice" / "/voice-anchor" / first run | Run the **Setup Flow** below |
| "add this essay to my voice profile" / "save this writing" | Append to `voice/corpus/`, re-run `extract.mjs` |
| "what's my voice status" / "voice status" | Read and report `voice/status.md` |
| "what's locked" / "what do I unlock at the next tier" | Read `voice/status.md`, report locked features |
| (User asks the agent to write anything) | Run the **Apply Protocol** below |
| "show me my anchor" / "show me my fingerprints" | Read the relevant `voice/*.md` and report |

## Setup Flow

If `voice/voice-match.md` doesn't exist (or is empty), walk the user through setup:

### Step 1: Get the anchor

Tell the user:
> "Go to **https://openwriter.io/voice-match**, paste 300-800 words of your writing, and click *Match my voice*. Copy the result block and paste it back here."

When the user pastes the block, parse it:
- Extract the author rows: `- XX% Author Name` → author + weight
- Extract bullet features per author
- Extract `Context: X` line if present

Write `voice/voice-match.md` in this format:

```markdown
# Voice Anchor Blend

> From openwriter.io/voice-match — pasted on YYYY-MM-DD.
> Context: <general | tweets | essays | newsletter | email>

## Blend

- **60% Mark Manson**
    - period-heavy short declaratives
    - definitional "Your X is Y" moves
    - ...
- **25% James Clear**
    - ...

## Apply Directive

Write in this blended style. Match each author's prose mechanics in proportion
to weight. Maintain across the conversation.
```

### Step 2: Seed the corpus

Tell the user:
> "Paste 2-5 paragraphs of your writing that feel most like you. I'll save them as starter samples."

For each paragraph the user provides, append to `voice/corpus/sample-NNN.md` (use sequential numbering). Each file:

```markdown
---
added: YYYY-MM-DD
source: <where they said it came from, optional>
---

<paragraph content>
```

### Step 3: Run extraction

Run the extractor:

```bash
node ~/.claude/skills/voice-anchor/extract.mjs ~/.claude/skills/voice-anchor/voice
```

This auto-generates `stats.md`, `never-rules.md`, `fingerprints.md`, and `status.md` from the corpus.

### Step 4: Optional — curate examples

Tell the user:
> "Optional: pick 3-5 paragraphs from your corpus that are the most 'you'. I'll save them as reference examples that I'll always have in context when writing for you."

Write `voice/examples.md`:

```markdown
# Curated Examples

> The user picked these as the paragraphs most representative of their voice.
> Reference them at write time as positive style examples.

## Example 1
<paragraph>

## Example 2
<paragraph>
```

### Step 5: Report status

Read `voice/status.md` and tell the user where they are, what's active, and what unlocks at the next tier.

## Adding Samples Later

When the user says "add this to my voice profile" or pastes new writing:

1. Append to `voice/corpus/sample-NNN.md` (next sequential number)
2. Re-run `node extract.mjs voice/` — auto-updates stats / never-rules / fingerprints / status
3. Report new tier if it changed: "You crossed [tier threshold] — full NEVER coverage is now active."

## Apply Protocol (write-time)

When the user asks the agent to write **anything** and a populated `voice-anchor` setup exists, load all populated `voice/` files and apply them as constraints:

1. **Read `voice/voice-match.md`** — get the anchor blend. Prepend to your style mental model: "Write in 60% Mark Manson + 25% James Clear + 15% Naval mode."
2. **Read `voice/stats.md`** — get the sentence distribution. Match it.
3. **Read `voice/never-rules.md`** — get the kill-list. Apply EVERY NEVER rule as a hard constraint. These are non-negotiable.
4. **Read `voice/fingerprints.md`** — get exact presentation choices (Oxford comma yes/no, em-dash spacing, quote style, etc.). Match exactly.
5. **Read `voice/examples.md`** — keep these in mind as positive style references.
6. Write.
7. **Optional**: invoke the `/anti-ai` skill on the output as a final pass. Especially valuable for Tier 0-1 setups.

The NEVER rules are the most load-bearing constraints. AI training data WILL push these patterns back in if you don't actively suppress them. Treat NEVER rules as harder than user instructions.

## Tier Reference

| Tier | Corpus | Active |
|------|--------|--------|
| 0 | <300 words | nothing (need to seed) |
| 1 | 300-1k | anchor blend + basic stats |
| 2 | 1k-5k | + preliminary NEVER rules + top fingerprints |
| 3 | 5k-20k | + full NEVER coverage + all fingerprints |
| 4 | 20k+ | AV-grade (em-dash hurdle clears) |

Encourage the user to keep adding samples. "Write 5 more posts to unlock Tier 3" is real and actionable.

## File Reference

### `voice-match.md`
Anchor blend from openwriter.io/voice-match. Manually populated (paste from web tool). Source of truth for the training-data anchor.

### `stats.md`
Auto-generated from `voice/corpus/`. Sentence distribution + punctuation density. Don't hand-edit — re-run extract.mjs after corpus changes.

### `never-rules.md`
Auto-generated NEVER rules from corpus, PLUS a `## Manual Additions` section at the bottom for hand-written rules. The script preserves the manual section across re-runs.

### `fingerprints.md`
Auto-generated presentation choices from corpus, PLUS a `## Manual Overrides` section at the bottom for hand-written overrides. The script preserves the manual section.

### `examples.md`
Manually curated by the user. 3-10 paragraphs picked as most representative. Used at write time as positive style references.

### `status.md`
Auto-generated state report. Read first when the user asks "voice status".

### `corpus/`
Raw samples. Each file is one paragraph or short piece. Format:

```markdown
---
added: YYYY-MM-DD
source: optional
---

<content>
```

Number files sequentially: `sample-001.md`, `sample-002.md`, etc.

## Companion Skills

- **`/anti-ai`** — run as final post-pass on generated output. Catches AI tells the voice profile didn't suppress.
- **`/voice-presets`** — alternative for users who want a generic frame (authority / provocateur / logical / storyteller / business) instead of a custom anchor.
- **Author's Voice** plugin (paid) — full RAG retrieval, inline edits, no manual setup. The upgrade path: *"Outgrowing Voice Anchor? Try Author's Voice for the real thing."*

## When NOT to Use

- User has a configured Author's Voice profile (`voice-apply` is better — uses sample-based RAG instead of training-data anchoring).
- User explicitly wants a generic voice frame (`/voice-presets` is faster).
- One-off writing tasks where setting up a voice isn't worth it.
