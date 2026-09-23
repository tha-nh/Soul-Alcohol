import { AlertLevel, MonitoringSession, SessionStatus } from '../../models';
import { SessionRepository } from '../../repositories';

interface SessionResult {
  initialScore: number;
  lowestScore: number;
  finalScore: number;
  maxAlertLevel: AlertLevel;
}

// Section 13 state machine, backed by SessionRepository (Phase 3).
export const SessionManager = {
  async start(): Promise<MonitoringSession> {
    const session = await SessionRepository.create();
    const monitoring: MonitoringSession = { ...session, status: SessionStatus.MONITORING };
    await SessionRepository.update(monitoring);
    return monitoring;
  },

  async pause(session: MonitoringSession): Promise<MonitoringSession> {
    const updated = { ...session, status: SessionStatus.PAUSED };
    await SessionRepository.update(updated);
    return updated;
  },

  async resume(session: MonitoringSession): Promise<MonitoringSession> {
    const updated = { ...session, status: SessionStatus.MONITORING };
    await SessionRepository.update(updated);
    return updated;
  },

  async complete(session: MonitoringSession, result: SessionResult): Promise<MonitoringSession> {
    const updated: MonitoringSession = {
      ...session,
      status: SessionStatus.COMPLETED,
      endTime: new Date().toISOString(),
      initialScore: result.initialScore,
      lowestScore: result.lowestScore,
      finalScore: result.finalScore,
      maxAlertLevel: result.maxAlertLevel,
    };
    await SessionRepository.update(updated);
    return updated;
  },

  async cancel(session: MonitoringSession): Promise<MonitoringSession> {
    const updated: MonitoringSession = {
      ...session,
      status: SessionStatus.CANCELLED,
      endTime: new Date().toISOString(),
    };
    await SessionRepository.update(updated);
    return updated;
  },

  async markError(session: MonitoringSession): Promise<MonitoringSession> {
    const updated: MonitoringSession = {
      ...session,
      status: SessionStatus.ERROR,
      endTime: new Date().toISOString(),
    };
    await SessionRepository.update(updated);
    return updated;
  },

  /** Section 44: lets the app detect a session left MONITORING/PAUSED by a kill/restart. */
  async getActiveSession(): Promise<MonitoringSession | null> {
    return SessionRepository.getActiveSession();
  },
};
