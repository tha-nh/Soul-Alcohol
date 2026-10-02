import { averageEmbedding, cosineSimilarity } from '../speakerEnrollment';
import { computeVoiceQualityScore, extractVoiceFeatures } from '../extractVoiceFeatures';
import { VOICE_BASELINE_SENTENCES } from '../voiceSentences';
import { BaselineConfig } from '../config';
import { VoiceCaptureSample } from '../../../services/audio/MockVoiceCaptureService';

describe('cosineSimilarity', () => {
  it('is 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it('is 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('is -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 2], [-1, -2])).toBeCloseTo(-1);
  });

  it('is 0 (not NaN) when either vector is all zeros', () => {
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0);
    expect(cosineSimilarity([1, 2], [0, 0])).toBe(0);
  });

  it('ignores vector magnitude', () => {
    expect(cosineSimilarity([1, 2, 3], [10, 20, 30])).toBeCloseTo(1);
  });
});

describe('averageEmbedding', () => {
  it('averages component-wise', () => {
    expect(averageEmbedding([[1, 2], [3, 4], [5, 6]])).toEqual([3, 4]);
  });

  it('returns the same vector for a single embedding', () => {
    expect(averageEmbedding([[7, 8, 9]])).toEqual([7, 8, 9]);
  });
});

describe('voice baseline features', () => {
  const sample = (audioQuality: number): VoiceCaptureSample => ({
    embedding: [0],
    durationMs: 2000,
    audioQuality,
  });

  it('computes the quality score as the rounded mean quality x 100', () => {
    expect(computeVoiceQualityScore([sample(0.8), sample(0.9)])).toBe(85);
  });

  it('produces every Section 9 feature', () => {
    const features = extractVoiceFeatures([sample(0.9)]);
    expect(features.spectralFeatures).toHaveLength(8);
    for (const key of [
      'speakingRate',
      'articulationRate',
      'pauseRatio',
      'pitchVariation',
      'energyVariation',
      'speechRhythm',
      'voiceStability',
      'pronunciationConsistency',
    ]) {
      expect(typeof features[key]).toBe('number');
    }
  });
});

describe('baseline config', () => {
  it('has exactly one sentence per required voice sample', () => {
    expect(VOICE_BASELINE_SENTENCES).toHaveLength(BaselineConfig.requiredVoiceSamples);
  });

  it('needs fewer samples to form a profile than are required overall', () => {
    expect(BaselineConfig.minValidSamplesForProfile).toBeLessThan(BaselineConfig.requiredVoiceSamples);
  });
});
