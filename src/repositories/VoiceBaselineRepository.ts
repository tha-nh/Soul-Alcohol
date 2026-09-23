import { getDatabase } from '../database/db';
import { VoiceBaseline, VoiceBaselineFeatures } from '../models';
import { generateId } from '../utils/id';

function mapRow(row: Record<string, unknown>): VoiceBaseline {
  return {
    id: row.id as string,
    speakerEmbedding: JSON.parse(row.speaker_embedding as string),
    voiceFeatures: JSON.parse(row.voice_features as string) as VoiceBaselineFeatures,
    qualityScore: row.quality_score as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export const VoiceBaselineRepository = {
  async getLatest(): Promise<VoiceBaseline | null> {
    const db = await getDatabase();
    const result = await db.execute(
      'SELECT * FROM voice_baseline ORDER BY updated_at DESC LIMIT 1;',
    );
    return result.rows.length > 0 ? mapRow(result.rows[0]) : null;
  },

  async save(
    speakerEmbedding: number[],
    voiceFeatures: VoiceBaselineFeatures,
    qualityScore: number,
  ): Promise<VoiceBaseline> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const baseline: VoiceBaseline = {
      id: generateId(),
      speakerEmbedding,
      voiceFeatures,
      qualityScore,
      createdAt: now,
      updatedAt: now,
    };
    await db.execute(
      `INSERT INTO voice_baseline (id, speaker_embedding, voice_features, quality_score, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        baseline.id,
        JSON.stringify(baseline.speakerEmbedding),
        JSON.stringify(baseline.voiceFeatures),
        baseline.qualityScore,
        baseline.createdAt,
        baseline.updatedAt,
      ],
    );
    return baseline;
  },

  async clear(): Promise<void> {
    const db = await getDatabase();
    await db.execute('DELETE FROM voice_baseline;');
  },
};
