import { AlertnessEngine, AlertnessEngineInput } from './engines';
import { AlertnessConfig } from './config';

// Section 27 MVP formula, implementing the AlertnessEngine interface so a
// real model can replace it later without changing any caller.
export class MockAlertnessEngine implements AlertnessEngine {
  computeAlertnessScore({ voiceScore, motionScore, trendScore }: AlertnessEngineInput): number {
    const { weights } = AlertnessConfig;
    const score = voiceScore * weights.voice + motionScore * weights.motion + trendScore * weights.trend;
    return Math.round(Math.max(0, Math.min(100, score)));
  }
}
