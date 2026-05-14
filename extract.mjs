#!/usr/bin/env node
// extract.mjs — read all samples in voice/corpus/, run extractors, write
// derived files in voice/ (never-rules.md, fingerprints.md, stats.md, status.md).
//
// Usage:
//   node extract.mjs <voice-dir>
//
// Idempotent. Safe to re-run after every corpus update.

import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { extractFromCorpus } from './lib/extractor.mjs';

const voiceDir = resolve(process.argv[2] ?? './voice');
const corpusDir = join(voiceDir, 'corpus');

if (!existsSync(corpusDir)) {
  console.error(`Corpus directory not found: ${corpusDir}`);
  console.error('Create it and drop sample files in (any .md or .txt files).');
  process.exit(1);
}

// ─── Read corpus ─────────────────────────────────────────────────────────────
const files = readdirSync(corpusDir)
  .filter(f => f.endsWith('.md') || f.endsWith('.txt'))
  .sort();

if (files.length === 0) {
  console.error(`No samples in ${corpusDir}. Add .md or .txt files first.`);
  process.exit(1);
}

const samples = files.map(f => {
  const path = join(corpusDir, f);
  return readFileSync(path, 'utf8').replace(/^---[\s\S]*?---\n/, '').trim();
});
const corpus = samples.join('\n\n');

console.log(`Read ${files.length} sample(s) from ${corpusDir}`);

// ─── Run extractor ───────────────────────────────────────────────────────────
const result = extractFromCorpus(corpus);
console.log(`Corpus: ${result.word_count} words, ${result.sentence_distribution.sentence_count} sentences`);
console.log(`Tier ${result.tier.tier}: ${result.tier.name}`);

// ─── Write voice/stats.md ────────────────────────────────────────────────────
const statsLines = [
  '# Statistical Fingerprint',
  '',
  '> Auto-generated from `voice/corpus/`. Do not edit — re-run `extract.mjs` after adding samples.',
  '',
  '## Corpus',
  `- Words: ${result.word_count}`,
  `- Sentences: ${result.sentence_distribution.sentence_count}`,
  `- Average words per sentence: ${result.sentence_distribution.average_length}`,
  '',
  '## Sentence Length Distribution',
  '',
  `| Bucket | Words | Percentage |`,
  `|--------|-------|------------|`,
  `| Short | 1-${result.sentence_distribution.short_max_words} | ${result.sentence_distribution.short_pct}% |`,
  `| Medium | ${result.sentence_distribution.short_max_words + 1}-${result.sentence_distribution.long_min_words - 1} | ${result.sentence_distribution.medium_pct}% |`,
  `| Long | ${result.sentence_distribution.long_min_words}-35 | ${result.sentence_distribution.long_pct}% |`,
  `| Very long | 36+ | ${result.sentence_distribution.very_long_pct}% |`,
  '',
  `Short-max boundary: ${result.sentence_distribution.short_max_words} words.`,
  `Long-min boundary: ${result.sentence_distribution.long_min_words} words.`,
  '',
  '## Punctuation Density (per 1000 words)',
  '',
  `| Mark | Rate | Category |`,
  `|------|------|----------|`,
  ...Object.entries(result.punctuation_tally.per1k).map(([k, v]) =>
    `| ${k.replace(/_/g, ' ')} | ${v} | ${result.punctuation_tally.category[k]} |`
  ),
  '',
  '## Apply-Time Directive',
  '',
  `Match the user's sentence-length distribution: target ~${result.sentence_distribution.short_pct}% short / ${result.sentence_distribution.medium_pct}% medium / ${result.sentence_distribution.long_pct}% long / ${result.sentence_distribution.very_long_pct}% very-long. Cap sentences over ${result.sentence_distribution.long_min_words + 12} words. Vary sentence length deliberately.`,
].join('\n');
writeFileSync(join(voiceDir, 'stats.md'), statsLines + '\n');
console.log(`Wrote ${join(voiceDir, 'stats.md')}`);

// ─── Write voice/never-rules.md ──────────────────────────────────────────────
const neverLines = [
  '# NEVER Rules',
  '',
  '> Auto-generated from `voice/corpus/`. Hand-edits in `## Manual Additions` section are preserved.',
  '> The rules below are AI tells that DO NOT appear at signature frequency in the user\'s corpus.',
  '> Each is forbidden because the AI training distribution will push it back in unless explicitly banned.',
  '',
  '## Diction — NEVER',
  '',
  ...(result.avoid.diction.length > 0
    ? result.avoid.diction.map(r => `- ${r}`)
    : ['_(none emitted yet — corpus may be too small)_']),
  '',
  '## Syntax — NEVER',
  '',
  ...result.avoid.syntax.map(r => `- ${r}`),
  '',
  '## Punctuation — NEVER',
  '',
  ...(result.avoid.punctuation.length > 0
    ? result.avoid.punctuation.map(r => `- ${r}`)
    : ['_(none emitted yet — corpus may be too small)_']),
  '',
  '## Manual Additions',
  '',
  '<!-- Add NEVER rules here — they will not be overwritten by extract.mjs. -->',
  '<!-- Example: -->',
  '<!-- - NEVER "synergy". -->',
  '<!-- - NEVER opening a paragraph with "Look,". -->',
  '',
].join('\n');
// Preserve manual additions section if it exists
const neverPath = join(voiceDir, 'never-rules.md');
let manualSection = '';
if (existsSync(neverPath)) {
  const prior = readFileSync(neverPath, 'utf8');
  const match = prior.match(/## Manual Additions[\s\S]*$/);
  if (match) manualSection = match[0];
}
const neverFinal = manualSection
  ? neverLines.replace(/## Manual Additions[\s\S]*$/, manualSection)
  : neverLines;
writeFileSync(neverPath, neverFinal + (manualSection ? '' : '\n'));
console.log(`Wrote ${neverPath}`);

// ─── Write voice/fingerprints.md ─────────────────────────────────────────────
const fingerprintLines = [
  '# Presentation Fingerprints',
  '',
  '> Auto-generated from `voice/corpus/`. Exact presentation choices the user makes consistently.',
  '> Match these in every generated response — LLMs default to training data otherwise.',
  '',
  ...(result.fingerprints.length > 0
    ? result.fingerprints.map(f => `- ${f}`)
    : ['_(none emitted yet — corpus may be too small or too uniform)_']),
  '',
  '## Manual Overrides',
  '',
  '<!-- Override any auto-detected fingerprint here. These win over the auto-detected ones above. -->',
  '<!-- Example: -->',
  '<!-- - Em-dash spacing: never use em-dashes at all. -->',
  '<!-- - Quote style: straight always. -->',
  '',
].join('\n');
const fpPath = join(voiceDir, 'fingerprints.md');
let manualFp = '';
if (existsSync(fpPath)) {
  const prior = readFileSync(fpPath, 'utf8');
  const match = prior.match(/## Manual Overrides[\s\S]*$/);
  if (match) manualFp = match[0];
}
const fpFinal = manualFp
  ? fingerprintLines.replace(/## Manual Overrides[\s\S]*$/, manualFp)
  : fingerprintLines;
writeFileSync(fpPath, fpFinal + (manualFp ? '' : '\n'));
console.log(`Wrote ${fpPath}`);

// ─── Write voice/status.md ───────────────────────────────────────────────────
const statusLines = [
  '# Voice Profile Status',
  '',
  `_Last updated: ${new Date().toISOString()}_`,
  '',
  `## Tier ${result.tier.tier}: ${result.tier.name}`,
  '',
  result.tier.notes,
  '',
  '## Corpus',
  '',
  `- ${result.word_count} words total`,
  `- ${files.length} sample(s) in \`voice/corpus/\``,
  `- ${result.sentence_distribution.sentence_count} sentences`,
  '',
  '## Active',
  '',
  ...result.tier.unlocked.map(u => `- ✓ ${u}`),
  '',
  '## Locked (add more samples to unlock)',
  '',
  ...(result.tier.locked.length > 0
    ? result.tier.locked.map(l => `- ◯ ${l}`)
    : ['_(all features unlocked)_']),
  '',
  ...(result.tier.next_milestone
    ? [`Next milestone: ${result.tier.next_milestone} words (${result.tier.next_milestone - result.word_count} more).`]
    : []),
  '',
  '## Files',
  '',
  '| File | Purpose | Auto / Manual |',
  '|------|---------|---------------|',
  `| \`voice-match.md\` | Anchor blend from openwriter.io/voice-match | Manual (paste from web tool) |`,
  `| \`stats.md\` | Sentence distribution + punctuation density | Auto (from corpus) |`,
  `| \`never-rules.md\` | NEVER rules (diction/syntax/punctuation) | Auto + manual additions |`,
  `| \`fingerprints.md\` | Exact presentation choices | Auto + manual overrides |`,
  `| \`examples.md\` | Curated paragraphs for reference | Manual |`,
  `| \`corpus/\` | Raw samples accumulating | Manual (drop files) |`,
  '',
  '## Below-Hurdle Detections',
  '',
  '_(items present in corpus but below the authenticity threshold — flagged as likely AI contamination, not signature use)_',
  '',
  ...(result.ai_tell_tally.below_hurdle_labels.length > 0
    ? result.ai_tell_tally.below_hurdle_labels.map(l => `- \`${l}\` — appears ${result.ai_tell_tally.counts[l]}x, rate ${result.ai_tell_tally.rate_per_1k[l]}/1k`)
    : ['_(none)_']),
  '',
].join('\n');
writeFileSync(join(voiceDir, 'status.md'), statusLines + '\n');
console.log(`Wrote ${join(voiceDir, 'status.md')}`);

console.log('\nDone. Re-run after adding new samples to voice/corpus/.');
