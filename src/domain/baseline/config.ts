/**
 * Section 16: thresholds are never hard-coded inline in UI/logic — they live
 * here so they can be tuned centrally once real models replace the mocks.
 */
export const BaselineConfig = {
  requiredVoiceSamples: 6,
  minValidSamplesForProfile: 3,
  speakerSimilarityThreshold: 0.75,
  motionWalkDurationMs: 20000,
} as const;
