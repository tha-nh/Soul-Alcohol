import { VoiceBaselineFeatures } from '../../models';
import { VoiceCaptureSample } from '../../services/audio/MockVoiceCaptureService';

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Placeholder for real acoustic feature extraction (Phase 12/Section 9).
 * Produces plausible values in the expected ranges so downstream scoring
 * and UI can be built and tested before the real model exists.
 */
export function extractVoiceFeatures(_samples: VoiceCaptureSample[]): VoiceBaselineFeatures {
  return {
    speakingRate: 3.6 + Math.random() * 0.6,
    articulationRate: 4.0 + Math.random() * 0.6,
    pauseRatio: 0.12 + Math.random() * 0.05,
    pitchVariation: 0.15 + Math.random() * 0.05,
    energyVariation: 0.2 + Math.random() * 0.05,
    speechRhythm: 0.7 + Math.random() * 0.1,
    voiceStability: 0.75 + Math.random() * 0.1,
    spectralFeatures: Array.from({ length: 8 }, () => Math.random()),
    pronunciationConsistency: 0.8 + Math.random() * 0.1,
  };
}

export function computeVoiceQualityScore(samples: VoiceCaptureSample[]): number {
  return Math.round(average(samples.map(s => s.audioQuality)) * 100);
}
