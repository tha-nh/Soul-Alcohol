export interface MotionBaseline {
  id: string;
  walkingStability: number;
  stepRegularity: number;
  stepIntervalVariability: number;
  lateralSway: number;
  motionVariance: number;
  rotationVariance: number;
  qualityScore: number;
  createdAt: string;
  updatedAt: string;
}
