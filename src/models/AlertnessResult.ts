export interface AlertnessResult {
  id: string;
  sessionId: string;
  timestamp: string;
  voiceScore: number;
  motionScore: number;
  trendScore: number;
  alertnessScore: number;
  confidenceScore: number;
  voiceAvailable: boolean;
  motionAvailable: boolean;
}
