import { AlertLevel } from './AlertEvent';

export enum SessionStatus {
  READY = 'READY',
  MONITORING = 'MONITORING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ERROR = 'ERROR',
}

export interface MonitoringSession {
  id: string;
  startTime: string;
  endTime: string | null;
  status: SessionStatus;
  initialScore: number | null;
  lowestScore: number | null;
  finalScore: number | null;
  maxAlertLevel: AlertLevel | null;
  createdAt: string;
}
