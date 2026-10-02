import { AlertLevel, MonitoringSession, SessionStatus } from '../../../models';
import { SessionRepository } from '../../../repositories';
import { SessionManager } from '../SessionManager';

jest.mock('../../../repositories', () => ({
  SessionRepository: {
    create: jest.fn(),
    update: jest.fn(),
    getActiveSession: jest.fn(),
  },
}));

const baseSession: MonitoringSession = {
  id: 's1',
  startTime: '2026-09-23T20:00:00.000Z',
  endTime: null,
  status: SessionStatus.READY,
  initialScore: null,
  lowestScore: null,
  finalScore: null,
  maxAlertLevel: null,
  createdAt: '2026-09-23T20:00:00.000Z',
};

const repo = SessionRepository as jest.Mocked<typeof SessionRepository>;

beforeEach(() => {
  jest.resetAllMocks();
  repo.create.mockResolvedValue(baseSession);
  repo.update.mockResolvedValue(undefined);
});

describe('SessionManager', () => {
  it('start() creates a session and persists it as MONITORING', async () => {
    const session = await SessionManager.start();

    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(session.status).toBe(SessionStatus.MONITORING);
    expect(repo.update).toHaveBeenCalledWith(expect.objectContaining({ id: 's1', status: SessionStatus.MONITORING }));
  });

  it('pause() and resume() flip between PAUSED and MONITORING', async () => {
    const monitoring = { ...baseSession, status: SessionStatus.MONITORING };

    const paused = await SessionManager.pause(monitoring);
    expect(paused.status).toBe(SessionStatus.PAUSED);

    const resumed = await SessionManager.resume(paused);
    expect(resumed.status).toBe(SessionStatus.MONITORING);
    expect(repo.update).toHaveBeenCalledTimes(2);
  });

  it('complete() stores the final scores, the alert level and an end time', async () => {
    const completed = await SessionManager.complete(baseSession, {
      initialScore: 94,
      lowestScore: 38,
      finalScore: 46,
      maxAlertLevel: AlertLevel.STOP_RECOMMENDED,
    });

    expect(completed).toMatchObject({
      status: SessionStatus.COMPLETED,
      initialScore: 94,
      lowestScore: 38,
      finalScore: 46,
      maxAlertLevel: AlertLevel.STOP_RECOMMENDED,
    });
    expect(completed.endTime).not.toBeNull();
    expect(repo.update).toHaveBeenCalledWith(completed);
  });

  it('cancel() and markError() close the session with an end time', async () => {
    const cancelled = await SessionManager.cancel(baseSession);
    expect(cancelled.status).toBe(SessionStatus.CANCELLED);
    expect(cancelled.endTime).not.toBeNull();

    const errored = await SessionManager.markError(baseSession);
    expect(errored.status).toBe(SessionStatus.ERROR);
    expect(errored.endTime).not.toBeNull();
  });

  it('does not mutate the session it was given', async () => {
    await SessionManager.complete(baseSession, {
      initialScore: 1,
      lowestScore: 1,
      finalScore: 1,
      maxAlertLevel: AlertLevel.NORMAL,
    });
    expect(baseSession.status).toBe(SessionStatus.READY);
    expect(baseSession.endTime).toBeNull();
  });

  it('getActiveSession() returns whatever the repository finds (Section 44 recovery)', async () => {
    const active = { ...baseSession, status: SessionStatus.MONITORING };
    repo.getActiveSession.mockResolvedValue(active);
    await expect(SessionManager.getActiveSession()).resolves.toBe(active);

    repo.getActiveSession.mockResolvedValue(null);
    await expect(SessionManager.getActiveSession()).resolves.toBeNull();
  });
});
