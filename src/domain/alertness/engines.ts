import { MotionAnalysisResult, MotionBaseline, VoiceAnalysisResult, VoiceBaseline } from '../../models';

/**
 * Section 49: AI is accessed only through these interfaces so a mock/rule
 * engine (Phase 7) can be swapped for real ONNX models (Phase 13) without
 * touching any caller.
 */
export interface SpeakerVerificationResult {
  isMatch: boolean;
  similarity: number;
}

export interface SpeakerVerificationEngine {
  verify(audioBuffer: Float32Array, baselineEmbedding: number[]): Promise<SpeakerVerificationResult>;
}

export interface MotionSampleBuffer {
  accelerometer: readonly [number, number, number][];
  gyroscope: readonly [number, number, number][];
}

export interface VoiceAnalysisEngine {
  analyze(audioBuffer: Float32Array, baseline: VoiceBaseline): Promise<VoiceAnalysisResult>;
}

export interface MotionAnalysisEngine {
  analyze(samples: MotionSampleBuffer, baseline: MotionBaseline): Promise<MotionAnalysisResult>;
}

export interface AlertnessEngineInput {
  voiceScore: number;
  motionScore: number;
  trendScore: number;
  confidenceScore: number;
}

export interface AlertnessEngine {
  computeAlertnessScore(input: AlertnessEngineInput): number;
}
