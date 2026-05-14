// Negative extractor: takes a corpus, produces NEVER rules + fingerprints +
// sentence distribution. Pure JS, no LLM, no network.
//
// Ported from authors-voice (NegativeExtractor.ts) with TypeScript stripped.

import {
  AI_TELLS,
  AI_TELL_LABELS,
  AI_STRUCTURAL_PATTERNS,
  passesAuthenticityHurdle,
} from './ai-tells.mjs';
import { detectFingerprints, renderFingerprints } from './fingerprints.mjs';

// ─── Punctuation tally ───────────────────────────────────────────────────────
export function computePunctuationFrequencies(content) {
  const words = content.split(/\s+/).filter(Boolean).length || 1;
  const count = (re) => (content.match(re) || []).length;

  const raw = {
    em_dash: count(/—/g),
    en_dash: count(/–/g),
    colon: count(/:/g),
    semicolon: count(/;/g),
    question: count(/\?/g),
    exclamation: count(/!/g),
    ellipsis: count(/\.{3}|…/g),
    paren_pair: Math.min(count(/\(/g), count(/\)/g)),
    bracket: count(/\[/g),
    double_quote_straight: count(/"/g),
    double_quote_curly: count(/[“”]/g),
    single_quote_curly: count(/[‘’]/g),
  };

  const per1k = {};
  const category = {};
  for (const [k, v] of Object.entries(raw)) {
    const rate = (v / words) * 1000;
    per1k[k] = Math.round(rate * 100) / 100;
    category[k] = rate === 0 ? 'never' : rate < 0.5 ? 'rare' : rate < 2 ? 'low' : 'strong';
  }

  return { words, per1k, raw, category };
}

// ─── AI-tell tally with authenticity hurdle ─────────────────────────────────
export function computeAITellTally(corpus, words) {
  const totalWords = words ?? (corpus.split(/\s+/).filter(Boolean).length || 1);
  const counts = {};
  const rate_per_1k = {};
  const forbid = [];
  const preserve = [];
  const below = [];

  for (const tell of AI_TELLS) {
    tell.pattern.lastIndex = 0;
    const n = (corpus.match(tell.pattern) || []).length;
    counts[tell.label] = n;
    rate_per_1k[tell.label] = Math.round((n / totalWords) * 1000 * 100) / 100;

    if (passesAuthenticityHurdle(tell, n, totalWords)) {
      preserve.push(tell.label);
    } else {
      forbid.push(tell.label);
      if (n > 0) below.push(tell.label);
    }
  }

  return { counts, rate_per_1k, forbid_labels: forbid, preserve_labels: preserve, below_hurdle_labels: below };
}

// ─── Sentence distribution ──────────────────────────────────────────────────
export function computeSentenceDistribution(corpus) {
  const sentences = corpus.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) {
    return {
      average_length: 0, short_pct: 0, medium_pct: 0, long_pct: 0,
      very_long_pct: 0, short_max_words: 10, long_min_words: 23, sentence_count: 0,
    };
  }
  const wordCounts = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
  const avg = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;

  const sorted = [...wordCounts].sort((a, b) => a - b);
  const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
  const short_max = Math.max(6, Math.min(12, q(0.25)));
  const long_min = Math.max(18, Math.min(28, q(0.75)));

  const short = wordCounts.filter(w => w <= short_max).length;
  const longCt = wordCounts.filter(w => w >= long_min && w <= 35).length;
  const veryLong = wordCounts.filter(w => w >= 36).length;
  const medium = wordCounts.length - short - longCt - veryLong;

  const pct = (n) => Math.round((n / wordCounts.length) * 100);

  return {
    sentence_count: sentences.length,
    average_length: Math.round(avg * 10) / 10,
    short_pct: pct(short),
    medium_pct: pct(medium),
    long_pct: pct(longCt),
    very_long_pct: pct(veryLong),
    short_max_words: short_max,
    long_min_words: long_min,
  };
}

// ─── Avoid block assembly ───────────────────────────────────────────────────
export function buildAvoidBlock(tally, ai) {
  const diction = [];
  const punctuation = [];

  const forbidSet = new Set(ai.forbid_labels);
  for (const tell of AI_TELLS) {
    if (!forbidSet.has(tell.label)) continue;
    const line = `NEVER "${tell.label}".`;
    if (tell.category === 'punctuation') punctuation.push(line);
    else diction.push(line);
  }

  const neverMap = {
    en_dash: 'en-dashes',
    semicolon: 'semicolons',
    ellipsis: 'ellipses',
    bracket: 'square brackets',
    double_quote_curly: 'curly double quotes',
    single_quote_curly: 'curly single quotes / apostrophes',
    exclamation: 'exclamation marks',
  };
  for (const [key, nicename] of Object.entries(neverMap)) {
    if (tally.category[key] !== 'never') continue;
    if (AI_TELL_LABELS.has(nicename)) continue;
    punctuation.push(`No ${nicename}.`);
  }

  return { diction, punctuation };
}

// ─── Tier determination ─────────────────────────────────────────────────────
export function determineTier(wordCount) {
  if (wordCount < 300) return {
    tier: 0,
    name: 'Empty',
    unlocked: [],
    locked: ['anchor blend', 'basic stats', 'preliminary NEVER rules', 'fingerprints'],
    next_milestone: 300,
    notes: 'Need 300+ words to compute basic stats. Use openwriter.io/voice-match to get your anchor block.',
  };
  if (wordCount < 1000) return {
    tier: 1,
    name: 'Anchor',
    unlocked: ['anchor blend', 'basic stats'],
    locked: ['preliminary NEVER rules', 'fingerprints'],
    next_milestone: 1000,
    notes: 'Anchor + stats active. Add more samples to unlock NEVER rules and fingerprints (need 1k+ words).',
  };
  if (wordCount < 5000) return {
    tier: 2,
    name: 'Preliminary',
    unlocked: ['anchor blend', 'basic stats', 'preliminary NEVER rules', 'top fingerprints'],
    locked: ['full NEVER coverage', 'all fingerprints'],
    next_milestone: 5000,
    notes: 'Preliminary NEVER rules and top fingerprints active. Add more samples to unlock full coverage (need 5k+ words).',
  };
  if (wordCount < 20000) return {
    tier: 3,
    name: 'Full Coverage',
    unlocked: ['anchor blend', 'stats', 'full NEVER rules', 'full fingerprints'],
    locked: ['high-confidence em-dash hurdle'],
    next_milestone: 20000,
    notes: 'Full coverage active. Reach 20k+ words for AV-grade high-confidence profile.',
  };
  return {
    tier: 4,
    name: 'AV-Grade',
    unlocked: ['anchor blend', 'stats', 'full NEVER rules', 'full fingerprints', 'em-dash hurdle cleared'],
    locked: [],
    next_milestone: null,
    notes: 'Full AV-grade profile. Authenticity hurdles satisfied across all categories.',
  };
}

// ─── Public orchestrator ────────────────────────────────────────────────────
export function extractFromCorpus(corpus) {
  const punctuation_tally = computePunctuationFrequencies(corpus);
  const ai_tell_tally = computeAITellTally(corpus, punctuation_tally.words);
  const fingerprint_set = detectFingerprints(corpus);
  const sentence_distribution = computeSentenceDistribution(corpus);
  const { diction, punctuation } = buildAvoidBlock(punctuation_tally, ai_tell_tally);

  // Unconditional structural rules (banned for everyone)
  const syntax = AI_STRUCTURAL_PATTERNS
    .filter(p => p.unconditional)
    .map(p => p.negative_rule);

  const tier = determineTier(punctuation_tally.words);

  return {
    word_count: punctuation_tally.words,
    tier,
    sentence_distribution,
    punctuation_tally,
    ai_tell_tally,
    fingerprint_set,
    fingerprints: renderFingerprints(fingerprint_set),
    avoid: { diction, syntax, punctuation },
  };
}
