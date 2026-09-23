// Section 29: trend is judged from a short rolling window, not a single point.
export function movingAverage(scores: readonly number[], window = 3): number {
  const slice = scores.slice(-window);
  return slice.reduce((sum, s) => sum + s, 0) / slice.length;
}

/**
 * 0-100: high when scores are flat/rising, low under a fast, sustained drop.
 * Mirrors Section 29's examples (90→88→87 mild vs 90→77→63→48 fast).
 */
export function computeTrendScore(scoreHistory: readonly number[]): number {
  if (scoreHistory.length < 2) {
    return 100;
  }
  const recent = scoreHistory.slice(-5);
  const totalDecline = recent[0] - recent[recent.length - 1];
  const ratePerStep = totalDecline / (recent.length - 1);
  const trendScore = 100 - Math.max(0, ratePerStep) * 4;
  return Math.round(Math.max(0, Math.min(100, trendScore)));
}
