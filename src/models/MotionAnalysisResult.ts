export interface MotionAnalysisResult {
  timestamp: string;
  motionAvailable: boolean;
  walkingStability: number;
  lateralSway: number;
  stepRegularity: number;
  stepIntervalVariability: number;
  motionVariance: number;
  rotationVariance: number;
  suddenMovement: number;
  motionScore: number;
}
