export type RootStackParamList = {
  Onboarding: undefined;
  VoiceBaseline: undefined;
  MotionBaseline: undefined;
  BaselineStatus: undefined;
  Home: undefined;
  StartSession: undefined;
  MonitoringSession: { sessionId: string };
  Alert: { sessionId: string; level: string };
  SessionSummary: { sessionId: string };
  History: undefined;
  SessionDetail: { sessionId: string };
  Settings: undefined;
};
