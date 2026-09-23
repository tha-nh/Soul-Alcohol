export interface VoiceAnalysisResult {
  timestamp: string;
  voiceAvailable: boolean;
  speakerConfidence: number;
  voiceQuality: number;
  voiceScore: number;
  voiceDeviation: number;
}
