export interface MotionCaptureResult {
  walkingStability: number;
  stepRegularity: number;
  stepIntervalVariability: number;
  lateralSway: number;
  motionVariance: number;
  rotationVariance: number;
  qualityScore: number;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Stands in for Android SensorManager / iOS Core Motion capture (Phase 9-10).
 * Reports progress over `durationMs` like a real walk-test would.
 */
export class MockMotionCaptureService {
  async captureWalk(durationMs: number, onProgress?: (ratio: number) => void): Promise<MotionCaptureResult> {
    const steps = 20;
    const stepMs = durationMs / steps;
    for (let i = 1; i <= steps; i++) {
      await delay(stepMs);
      onProgress?.(i / steps);
    }

    return {
      walkingStability: 0.8 + Math.random() * 0.1,
      stepRegularity: 0.75 + Math.random() * 0.1,
      stepIntervalVariability: 0.1 + Math.random() * 0.05,
      lateralSway: 0.15 + Math.random() * 0.05,
      motionVariance: 0.2 + Math.random() * 0.05,
      rotationVariance: 0.18 + Math.random() * 0.05,
      qualityScore: 80 + Math.round(Math.random() * 15),
    };
  }
}
