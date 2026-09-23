import { getDatabase } from '../database/db';
import { AlertLevel, MonitoringSession, SessionStatus } from '../models';
import { generateId } from '../utils/id';

function mapRow(row: Record<string, unknown>): MonitoringSession {
  return {
    id: row.id as string,
    startTime: row.start_time as string,
    endTime: (row.end_time as string | null) ?? null,
    status: row.status as SessionStatus,
    initialScore: (row.initial_score as number | null) ?? null,
    lowestScore: (row.lowest_score as number | null) ?? null,
    finalScore: (row.final_score as number | null) ?? null,
    maxAlertLevel: (row.max_alert_level as AlertLevel | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export const SessionRepository = {
  async create(): Promise<MonitoringSession> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const session: MonitoringSession = {
      id: generateId(),
      startTime: now,
      endTime: null,
      status: SessionStatus.READY,
      initialScore: null,
      lowestScore: null,
      finalScore: null,
      maxAlertLevel: null,
      createdAt: now,
    };
    await db.execute(
      `INSERT INTO session (id, start_time, end_time, status, initial_score, lowest_score, final_score, max_alert_level, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        session.id,
        session.startTime,
        session.endTime,
        session.status,
        session.initialScore,
        session.lowestScore,
        session.finalScore,
        session.maxAlertLevel,
        session.createdAt,
      ],
    );
    return session;
  },

  async update(session: MonitoringSession): Promise<void> {
    const db = await getDatabase();
    await db.execute(
      `UPDATE session
       SET start_time = ?, end_time = ?, status = ?, initial_score = ?, lowest_score = ?, final_score = ?, max_alert_level = ?
       WHERE id = ?;`,
      [
        session.startTime,
        session.endTime,
        session.status,
        session.initialScore,
        session.lowestScore,
        session.finalScore,
        session.maxAlertLevel,
        session.id,
      ],
    );
  },

  async getById(id: string): Promise<MonitoringSession | null> {
    const db = await getDatabase();
    const result = await db.execute('SELECT * FROM session WHERE id = ?;', [id]);
    return result.rows.length > 0 ? mapRow(result.rows[0]) : null;
  },

  async getActiveSession(): Promise<MonitoringSession | null> {
    const db = await getDatabase();
    const result = await db.execute(
      `SELECT * FROM session WHERE status IN (?, ?) ORDER BY start_time DESC LIMIT 1;`,
      [SessionStatus.MONITORING, SessionStatus.PAUSED],
    );
    return result.rows.length > 0 ? mapRow(result.rows[0]) : null;
  },

  async listAll(): Promise<MonitoringSession[]> {
    const db = await getDatabase();
    const result = await db.execute('SELECT * FROM session ORDER BY start_time DESC;');
    return result.rows.map(mapRow);
  },
};
