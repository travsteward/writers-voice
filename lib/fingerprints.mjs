// Deterministic detection of exact-presentation choices.
// Ported from authors-voice (FingerprintDetector.ts) with TypeScript stripped.
//
// Each fingerprint is a binary or enumerable choice the author made
// consistently (em-dash spacing, Oxford comma, quote style, etc.).
// LLMs don't generalize these from few examples — they fall back to
// training defaults. So we measure in code and emit explicit one-liners.

function countMatches(text, re) {
  return (text.match(re) || []).length;
}

function ratio(a, b) {
  const total = a + b;
  if (total === 0) return 0;
  return a / total;
}

// Needs ≥3 total observations. ≥85% → high confidence, ≥70% → medium, else mixed.
function decideBinary(a, aLabel, b, bLabel) {
  const total = a + b;
  if (total < 3) return { value: 'n/a', confidence: 'low' };
  const r = ratio(a, b);
  if (r >= 0.85) return { value: aLabel, confidence: 'high' };
  if (r <= 0.15) return { value: bLabel, confidence: 'high' };
  if (r >= 0.70) return { value: aLabel, confidence: 'medium' };
  if (r <= 0.30) return { value: bLabel, confidence: 'medium' };
  return { value: 'mixed', confidence: 'low' };
}

function detectEmDashSpacing(text) {
  const spaced = countMatches(text, /\s—\s/g);
  const unspaced = countMatches(text, /\S—\S/g);
  return decideBinary(spaced, 'spaced', unspaced, 'unspaced');
}

function detectEllipsisStyle(text) {
  const threeDots = countMatches(text, /(?<!\.)\.\.\.(?!\.)/g);
  const unicode = countMatches(text, /…/g);
  const spacedDots = countMatches(text, /\. \. \./g);
  const total = threeDots + unicode + spacedDots;
  if (total < 3) return { value: 'n/a', confidence: 'low' };
  const max = Math.max(threeDots, unicode, spacedDots);
  if (max / total >= 0.85) {
    const value = max === threeDots ? 'three_dots' : max === unicode ? 'unicode' : 'spaced_dots';
    return { value, confidence: 'high' };
  }
  return { value: 'mixed', confidence: 'low' };
}

function detectSentenceInitialConjunctionCaps(text) {
  const caps = countMatches(text, /[.!?]\s+(?:But|And|So|Or|Yet)\b/g);
  const lower = countMatches(text, /[.!?]\s+(?:but|and|so|or|yet)\b/g);
  return decideBinary(caps, 'caps', lower, 'lower');
}

function detectOxfordComma(text) {
  const withOxford = countMatches(text, /\w+,\s\w+[\w\s]*,\s(?:and|or)\s\w+/g);
  const withoutOxford = countMatches(text, /\w+,\s\w+[\w\s]*\s(?:and|or)\s\w+(?![\w\s]*,)/g);
  return decideBinary(withOxford, 'yes', withoutOxford, 'no');
}

function detectQuoteStyle(text) {
  const straight = countMatches(text, /"/g);
  const curly = countMatches(text, /[“”]/g);
  return decideBinary(straight, 'straight', curly, 'curly');
}

function detectCapitalizationAfterColon(text) {
  const upper = countMatches(text, /:\s[A-Z]/g);
  const lower = countMatches(text, /:\s[a-z]/g);
  return decideBinary(upper, 'upper', lower, 'lower');
}

function detectContractions(text) {
  const contracted = countMatches(text, /\b\w+['’](?:s|re|ve|ll|d|t|m)\b/gi);
  const expanded = countMatches(text, /\b(?:do not|does not|did not|is not|are not|was not|were not|cannot|will not|would not|should not|could not|have not|has not|had not|I am|you are|we are|they are|it is|that is|there is|let us)\b/gi);
  return decideBinary(contracted, 'yes', expanded, 'no');
}

function detectParagraphLength(text) {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  if (paragraphs.length < 3) return { value: 'n/a', confidence: 'low' };
  const sentenceCounts = paragraphs.map(p =>
    p.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0).length
  );
  const avg = sentenceCounts.reduce((a, b) => a + b, 0) / sentenceCounts.length;
  if (avg <= 2) return { value: 'short', confidence: 'high' };
  if (avg <= 4) return { value: 'medium', confidence: 'high' };
  if (avg >= 6) return { value: 'long', confidence: 'high' };
  return { value: 'mixed', confidence: 'medium' };
}

export function detectFingerprints(corpus) {
  return {
    em_dash_spacing: detectEmDashSpacing(corpus),
    ellipsis_style: detectEllipsisStyle(corpus),
    sentence_initial_conjunction_caps: detectSentenceInitialConjunctionCaps(corpus),
    oxford_comma: detectOxfordComma(corpus),
    quote_style: detectQuoteStyle(corpus),
    capitalization_after_colon: detectCapitalizationAfterColon(corpus),
    contractions: detectContractions(corpus),
    paragraph_length: detectParagraphLength(corpus),
  };
}

export function renderFingerprints(fp) {
  const lines = [];
  const push = (label, v, map) => {
    if (v.value === 'n/a') return;
    const readable = map[v.value] ?? v.value;
    lines.push(`${label}: ${readable}`);
  };
  push('Em-dash spacing', fp.em_dash_spacing, {
    spaced: 'word — word', unspaced: 'word—word', mixed: 'inconsistent',
  });
  push('Ellipsis style', fp.ellipsis_style, {
    three_dots: '...', unicode: '…', spaced_dots: '. . .', mixed: 'inconsistent',
  });
  push('Sentence-initial "But/And/So"', fp.sentence_initial_conjunction_caps, {
    caps: 'capitalized (". But")', lower: 'lowercase (", but")', mixed: 'inconsistent',
  });
  push('Oxford comma', fp.oxford_comma, { yes: 'yes', no: 'no', mixed: 'inconsistent' });
  push('Quote style', fp.quote_style, {
    straight: 'straight "..."', curly: 'curly “...”', mixed: 'inconsistent',
  });
  push('Capitalization after colon', fp.capitalization_after_colon, {
    upper: 'upper', lower: 'lower', mixed: 'inconsistent',
  });
  push('Contractions', fp.contractions, {
    yes: 'uses contractions', no: 'avoids contractions', mixed: 'mixed',
  });
  push('Paragraph length', fp.paragraph_length, {
    short: '1–2 sentences', medium: '3–4 sentences', long: '5+ sentences', mixed: 'varied',
  });
  return lines;
}
