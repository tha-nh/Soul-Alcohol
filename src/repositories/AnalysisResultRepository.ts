import { getDatabase } from '../database/db';
import { AlertnessResult } from '../models';
import { generateId } from '../utils/id';

function mapRow(row: Record<string, unknown>): AlertnessResult {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    timestamp: row.timestamp as string,
    voiceScore: row.voice_score as number,
    motionScore: row.motion_score as number,
    trendScore: row.trend_score as number,
    alertnessScore: row.alertness_score as number,
    confidenceScore: row.confidence_score as number,
    voiceAvailable: (row.voice_available as number) === 1,
    motionAvailable: (row.motion_available as number) === 1,
  };
}

type AnalysisResultInput = Omit<AlertnessResult, 'id'>;

export const AnalysisResultRepository = {
  async insert(input: AnalysisResultInput): Promise<AlertnessResult> {
    const db = await getDatabase();
    const result: AlertnessResult = { ...input, id: generateId() };
    await db.execute(
      `INSERT INTO analysis_result
        (id, session_id, timestamp, voice_score, motion_score, trend_score, alertness_score, confidence_score, voice_available, motion_available)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        result.id,
        result.sessionId,
        result.timestamp,
        result.voiceScore,
        result.motionScore,
        result.trendScore,
        result.alertnessScore,
        result.confidenceScore,
        result.voiceAvailable ? 1 : 0,
        result.motionAvailable ? 1 : 0,
      ],
    );
    return result;
  },

  async listBySession(sessionId: string): Promise<AlertnessResult[]> {
    const db = await getDatabase();
    const result = await db.execute(
      'SELECT * FROM analysis_result WHERE session_id = ? ORDER BY timestamp ASC;',
      [sessionId],
    );
    return result.rows.map(mapRow);
  },
};
