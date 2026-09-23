export enum AlertLevel {
  NORMAL = 'NORMAL',
  NOTICE = 'NOTICE',
  WARNING = 'WARNING',
  STOP_RECOMMENDED = 'STOP_RECOMMENDED',
}

export interface AlertEvent {
  id: string;
  sessionId: string;
  timestamp: string;
  level: AlertLevel;
  message: string;
  userResponse: string | null;
}
