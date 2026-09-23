// Section 27/16: weights and thresholds live here, never hard-coded inline.
export const AlertnessConfig = {
  weights: {
    voice: 0.4,
    motion: 0.4,
    trend: 0.2,
  },
  levelThresholds: {
    normalMin: 80,
    noticeMin: 65,
    warningMin: 45,
    // below warningMin => STOP_RECOMMENDED
  },
  alertCooldownMs: 15 * 60 * 1000,
  suddenDropThreshold: 20,
  // Section 30: STOP_RECOMMENDED only fires when confidence is high enough.
  stopRecommendedMinConfidence: 50,
} as const;
