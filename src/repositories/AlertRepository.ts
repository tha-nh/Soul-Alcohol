import { getDatabase } from '../database/db';
import { AlertEvent, AlertLevel } from '../models';
import { generateId } from '../utils/id';

function mapRow(row: Record<string, unknown>): AlertEvent {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    timestamp: row.timestamp as string,
    level: row.level as AlertLevel,
    message: row.message as string,
    userResponse: (row.user_response as string | null) ?? null,
  };
}

type AlertEventInput = Omit<AlertEvent, 'id' | 'userResponse'>;

export const AlertRepository = {
  async insert(input: AlertEventInput): Promise<AlertEvent> {
    const db = await getDatabase();
    const alert: AlertEvent = { ...input, id: generateId(), userResponse: null };
    await db.execute(
      `INSERT INTO alert (id, session_id, timestamp, level, message, user_response)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [alert.id, alert.sessionId, alert.timestamp, alert.level, alert.message, alert.userResponse],
    );
    return alert;
  },

  async setUserResponse(id: string, userResponse: string): Promise<void> {
    const db = await getDatabase();
    await db.execute('UPDATE alert SET user_response = ? WHERE id = ?;', [userResponse, id]);
  },

  async listBySession(sessionId: string): Promise<AlertEvent[]> {
    const db = await getDatabase();
    const result = await db.execute(
      'SELECT * FROM alert WHERE session_id = ? ORDER BY timestamp ASC;',
      [sessionId],
    );
    return result.rows.map(mapRow);
  },
};
