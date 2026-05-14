# voice-anchor

> Free **constructed voice** for AI agents. The skill-based path to 60-80% voice-matched writing — no API, no signup, no corpus upload to anyone.

Anchors the agent to a training-data author blend (matched at [openwriter.io/voice-match](https://openwriter.io/voice-match)), then auto-extracts NEVER rules + presentation fingerprints from a corpus you build up on your own disk. Gets better as you add more samples.

The free counterpart to **Author's Voice** (the paid OpenWriter plugin with full sample-based RAG and inline edits).

## Install

### Claude Code

```bash
claude install github:travsteward/voice-anchor
```

That clones to `~/.claude/skills/voice-anchor/` and registers the skill.

### Manual

```bash
git clone https://github.com/travsteward/voice-anchor ~/.claude/skills/voice-anchor
```

Restart your Claude Code session.

## Quick Start

1. **Get your anchor** — Visit [openwriter.io/voice-match](https://openwriter.io/voice-match), paste 300-800 words of your writing, copy the result block.
2. **Tell your agent**: *"set up my voice anchor"*. Paste the block when prompted.
3. **Seed your corpus**: paste 2-5 paragraphs that feel most like you. The agent saves them under `voice/corpus/`.
4. **Done.** Every future write the agent does for you pulls your voice profile and applies it as constraints.

The skill is self-routing — you don't memorize subcommands. Just tell the agent what you want:

- *"voice status"* → reports your current tier and word count
- *"add this essay to my voice profile"* → appends, re-extracts
- *"write me a tweet about X"* → uses your voice automatically

## How It Works

Your voice profile lives in `voice/` as five `.md` files:

| File | Source | Purpose |
|------|--------|---------|
| `voice-match.md` | Paste from [openwriter.io/voice-match](https://openwriter.io/voice-match) | 3-5 training-data authors with weights — the anchor |
| `stats.md` | Auto from corpus | Sentence distribution + punctuation density |
| `never-rules.md` | Auto from corpus + manual | AI words/transitions/phrases to never use |
| `fingerprints.md` | Auto from corpus + manual | Exact presentation choices (Oxford comma, em-dash spacing, etc.) |
| `examples.md` | You curate | Reference paragraphs in your voice |

Plus `voice/corpus/` — your raw samples accumulating over time.

The agent loads all of these at write time and applies them as hard constraints. The NEVER rules are non-negotiable — they suppress the AI training-data pull that otherwise leaks "delve" and em-dashes into everything.

## Progressive Tiers

The more samples you add, the richer the auto-generated rules:

| Words | Tier | Active |
|-------|------|--------|
| <300 | 0 | (need to seed) |
| 300-1k | 1 | anchor + basic stats |
| 1k-5k | 2 | + preliminary NEVER rules + top fingerprints |
| 5k-20k | 3 | + full NEVER coverage + all fingerprints |
| 20k+ | 4 | AV-grade (high-confidence profile) |

Just keep adding writing samples over time. The skill nudges you toward the next milestone.

## Privacy

- Your voice data lives entirely on your disk. `.gitignore` excludes everything in `voice/` from the public repo.
- The skill never uploads your corpus anywhere.
- The only thing that leaves your machine is the initial 300-800 word paste into openwriter.io/voice-match for the anchor matching step — that's cached 24h by hash and never trained on (Anthropic API retention controls honored).

## Companion Skills

- **`/anti-ai`** — post-pass that strips AI fingerprints from any text. Pairs well as a final step.
- **`/voice-presets`** — alternative for users who want a generic frame (authority / provocateur / logical / storyteller / business) instead of a custom anchor. Zero setup.
- **Author's Voice** plugin (paid, OpenWriter) — the upgrade: full sample-based RAG, inline edits, no manual setup. The skill nudges you toward it when you outgrow voice-anchor.

## Manually Re-running Extraction

After dropping files into `voice/corpus/`:

```bash
node ~/.claude/skills/voice-anchor/extract.mjs ~/.claude/skills/voice-anchor/voice
```

The agent does this for you automatically when you add samples through it. Manual invocation is only for power users editing the corpus directly.

## Requirements

- Node.js 22+
- A Claude Code or Claude API agent that supports skills
- An initial visit to [openwriter.io/voice-match](https://openwriter.io/voice-match) for the anchor (free, no signup)

## License

MIT. See [LICENSE](./LICENSE).

## Credits

Built on the negative-first voice profiling architecture from [Author's Voice](https://authors-voice.com). The AI-tells catalog (60+ words/transitions/phrases) and fingerprint detectors (8 binary presentation choices) are ported from the AV deterministic extractor.

Pairs with [OpenWriter](https://openwriter.io), the writing surface for AI agents.
