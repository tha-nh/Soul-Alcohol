/**
 * Extensible via index signature so new acoustic features (Section 9) can be
 * added later without changing every consumer of this type.
 */
export interface VoiceBaselineFeatures {
  speakingRate: number;
  articulationRate: number;
  pauseRatio: number;
  pitchVariation: number;
  energyVariation: number;
  speechRhythm: number;
  voiceStability: number;
  spectralFeatures: number[];
  pronunciationConsistency: number;
  [key: string]: number | number[] | undefined;
}

export interface VoiceBaseline {
  id: string;
  speakerEmbedding: number[];
  voiceFeatures: VoiceBaselineFeatures;
  qualityScore: number;
  createdAt: string;
  updatedAt: string;
}
