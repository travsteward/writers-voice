// Canonical catalog of AI-generated-text tells.
// Ported from authors-voice (AITellsCatalog.ts) with TypeScript stripped.
//
// Role: severity multiplier, NOT an inclusion filter. An item here only
// becomes a NEVER rule if the author's corpus shows it BELOW the authenticity
// hurdle (rate-based — corpus contamination doesn't count as signature use).

const w = (word) => new RegExp(`\\b${word}\\b`, 'gi');
const p = (phrase) => new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
const si = (word) => new RegExp(`(?:^|[.!?]\\s+)${word}\\b`, 'g');

// ─── 25 high-signal AI single words ──────────────────────────────────────────
export const AI_WORDS = [
  { label: 'delve',          pattern: w('delve'),            category: 'word' },
  { label: 'delves',         pattern: w('delves'),           category: 'word' },
  { label: 'pivotal',        pattern: w('pivotal'),          category: 'word' },
  { label: 'tapestry',       pattern: w('tapestry'),         category: 'word' },
  { label: 'realm',          pattern: w('realm'),            category: 'word' },
  { label: 'beacon',         pattern: w('beacon'),           category: 'word' },
  { label: 'harness',        pattern: w('harness'),          category: 'word' },
  { label: 'illuminate',     pattern: w('illuminate'),       category: 'word' },
  { label: 'underscore',     pattern: w('underscores?'),     category: 'word' },
  { label: 'bolster',        pattern: w('bolsters?'),        category: 'word' },
  { label: 'facilitate',     pattern: w('facilitates?'),     category: 'word' },
  { label: 'multifaceted',   pattern: w('multifaceted'),     category: 'word' },
  { label: 'foster',         pattern: w('fosters?'),         category: 'word' },
  { label: 'crucial',        pattern: w('crucial'),          category: 'word' },
  { label: 'vital',          pattern: w('vital'),            category: 'word' },
  { label: 'comprehensive',  pattern: w('comprehensive'),    category: 'word' },
  { label: 'robust',         pattern: w('robust'),           category: 'word' },
  { label: 'leverage',       pattern: w('leverages?'),       category: 'word' },
  { label: 'seamless',       pattern: w('seamless(?:ly)?'),  category: 'word' },
  { label: 'navigate',       pattern: w('navigates?'),       category: 'word' },
  { label: 'embark',         pattern: w('embarks?'),         category: 'word' },
  { label: 'nestled',        pattern: w('nestled'),          category: 'word' },
  { label: 'unwavering',     pattern: w('unwavering'),       category: 'word' },
  { label: 'indelible',      pattern: w('indelible'),        category: 'word' },
  { label: 'meticulous',     pattern: w('meticulous(?:ly)?'), category: 'word' },
  { label: 'transformative', pattern: w('transformative'),   category: 'word' },
  { label: 'revolutionize',  pattern: w('revolutioni[sz]e'), category: 'word' },
];

// ─── Robotic transitions ─────────────────────────────────────────────────────
export const AI_TRANSITIONS = [
  { label: 'Moreover',        pattern: si('Moreover'),        category: 'transition' },
  { label: 'Furthermore',     pattern: si('Furthermore'),     category: 'transition' },
  { label: 'Notably',         pattern: si('Notably'),         category: 'transition' },
  { label: 'Additionally',    pattern: si('Additionally'),    category: 'transition' },
  { label: 'Consequently',    pattern: si('Consequently'),    category: 'transition' },
  { label: 'Ultimately',      pattern: si('Ultimately'),      category: 'transition' },
  { label: 'Therefore (sentence-initial)', pattern: si('Therefore'), category: 'transition' },
  { label: 'However (sentence-initial)',   pattern: si('However'),   category: 'transition' },
  { label: 'Indeed',          pattern: si('Indeed'),          category: 'transition' },
  { label: 'Thus',            pattern: si('Thus'),            category: 'transition' },
  { label: 'Subsequently',    pattern: si('Subsequently'),    category: 'transition' },
  { label: 'Nonetheless',     pattern: si('Nonetheless'),     category: 'transition' },
  { label: 'Firstly',         pattern: si('Firstly'),         category: 'transition' },
  { label: 'In conclusion',   pattern: p('in conclusion'),    category: 'transition' },
];

// ─── High-frequency AI phrases ───────────────────────────────────────────────
export const AI_PHRASES = [
  { label: 'provide(s) valuable insights', pattern: p('provides? valuable insights'),  category: 'phrase' },
  { label: 'gain(s) valuable insights',    pattern: p('gains? valuable insights'),     category: 'phrase' },
  { label: 'valuable insights',            pattern: p('valuable insights'),            category: 'phrase' },
  { label: 'a rich tapestry',              pattern: p('a rich tapestry'),              category: 'phrase' },
  { label: 'plays a crucial role',         pattern: p('plays a crucial role'),         category: 'phrase' },
  { label: "in today's digital age/era",   pattern: /in today[’']s digital (?:age|era)/gi, category: 'phrase' },
  { label: 'in the fast-paced world',      pattern: /in (?:today[’']s |the )?fast[- ]paced world/gi, category: 'phrase' },
  { label: 'at its core',                  pattern: p('at its core'),                  category: 'phrase' },
  { label: 'that being said',              pattern: p('that being said'),              category: 'phrase' },
  { label: 'to put it simply',             pattern: p('to put it simply'),             category: 'phrase' },
  { label: "it's worth noting",            pattern: /it[’']s worth noting/gi,     category: 'phrase' },
  { label: "it's important to note",       pattern: /it[’']s important to note/gi, category: 'phrase' },
  { label: 'delve into',                   pattern: p('delve into'),                   category: 'phrase' },
  { label: 'dive into',                    pattern: p('dive into'),                    category: 'phrase' },
  { label: 'navigate the complexities',    pattern: p('navigat(?:e|ing) the complexit'), category: 'phrase' },
  { label: 'the intricate relationship',   pattern: p('the intricate relationship'),   category: 'phrase' },
  { label: 'a nuanced understanding',      pattern: p('a nuanced understanding'),      category: 'phrase' },
  { label: 'opens new avenues',            pattern: p('opens? new avenues'),           category: 'phrase' },
  { label: 'leaves an indelible mark',     pattern: p('leaves? an indelible mark'),    category: 'phrase' },
  { label: 'stands as a testament',        pattern: p('stands? as a testament'),       category: 'phrase' },
  { label: 'paves the way',                pattern: p('paves? the way'),               category: 'phrase' },
  { label: 'a stark reminder',             pattern: p('a stark reminder'),             category: 'phrase' },
  { label: 'a beacon of',                  pattern: p('a beacon of'),                  category: 'phrase' },
];

// ─── Em-dash (highest punctuation tell) ──────────────────────────────────────
export const AI_PUNCTUATION = [
  { label: 'em-dashes', pattern: /—/g, category: 'punctuation' },
];

export const AI_TELLS = [...AI_WORDS, ...AI_TRANSITIONS, ...AI_PHRASES, ...AI_PUNCTUATION];
export const AI_TELL_LABELS = new Set(AI_TELLS.map(t => t.label));

// ─── Structural patterns (banned unconditionally or via voting) ──────────────
// These are too varied in surface form to regex. The first one is banned
// for everyone (too detectable). The rest are advisory in the v1 skill —
// users can manually add to never-rules.md if they want them enforced.
export const AI_STRUCTURAL_PATTERNS = [
  {
    key: 'contrastive_negation',
    description: 'Contrastive negation ("It\'s not X, it\'s Y", "Not just X but Y", "Rather than X, Y", "Less X, more Y")',
    negative_rule: "NEVER contrastive negation (It's not X, it's Y / Not just X but Y / Rather than X, Y).",
    category: 'syntax',
    unconditional: true,
  },
  {
    key: 'tricolon_abstractions',
    description: 'Rule-of-three lists of abstract nouns ("innovation, collaboration, and excellence") as signature flourishes',
    negative_rule: 'NEVER rule-of-three lists of abstractions as a flourish.',
    category: 'syntax',
  },
  {
    key: 'soft_repetition',
    description: 'Soft repetition — restating the same point with only minor wording changes across consecutive sentences',
    negative_rule: 'NEVER restate the same point in the next sentence with minor wording changes.',
    category: 'syntax',
  },
  {
    key: 'mismatched_enthusiasm',
    description: 'Enthusiasm beyond what the content warrants',
    negative_rule: 'NEVER encouragement or enthusiasm beyond what the content warrants.',
    category: 'diction',
  },
  {
    key: 'representational_hedging',
    description: 'Telling the reader what things "represent" / "underscore" / "reflect"',
    negative_rule: 'NEVER telling the reader what things "represent", "underscore", "reflect", or "stand as a testament to".',
    category: 'syntax',
  },
];

// ─── Authenticity thresholds ─────────────────────────────────────────────────
// Below these → corpus contamination, not signature use → emit NEVER rule.
// At or above → preserve the author's voice, no rule.
export const AUTHENTICITY_THRESHOLDS = {
  word:        { min_count: 2,  min_rate_per_1k: 0.15 },
  transition:  { min_count: 2,  min_rate_per_1k: 0.15 },
  phrase:      { min_count: 2,  min_rate_per_1k: 0.05 },
  punctuation: { min_count: 15, min_rate_per_1k: 1.5 },
};

export function passesAuthenticityHurdle(tell, count, words) {
  if (count <= 0) return false;
  const t = AUTHENTICITY_THRESHOLDS[tell.category];
  const rate = (count / Math.max(1, words)) * 1000;
  return count >= t.min_count && rate >= t.min_rate_per_1k;
}
