export interface VoiceCaptureSample {
  embedding: number[];
  durationMs: number;
  audioQuality: number; // 0-1
}

const EMBEDDING_DIM = 32;
const NOISE_AMOUNT = 0.05;

function randomBaseVector(): number[] {
  return Array.from({ length: EMBEDDING_DIM }, () => Math.random() * 2 - 1);
}

function withNoise(vector: number[], amount: number): number[] {
  return vector.map(value => value + (Math.random() * 2 - 1) * amount);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Stands in for real on-device speaker-embedding extraction (Phase 12).
 * Samples drift slightly around a per-enrollment base vector so the flow
 * behaves like a single consistent speaker across all baseline sentences.
 */
export class MockVoiceCaptureService {
  private readonly baseVector = randomBaseVector();

  async captureSample(): Promise<VoiceCaptureSample> {
    await delay(1200);
    return {
      embedding: withNoise(this.baseVector, NOISE_AMOUNT),
      durationMs: 1800 + Math.random() * 600,
      audioQuality: 0.8 + Math.random() * 0.15,
    };
  }
}
