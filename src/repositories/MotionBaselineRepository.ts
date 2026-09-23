import { getDatabase } from '../database/db';
import { MotionBaseline } from '../models';
import { generateId } from '../utils/id';

function mapRow(row: Record<string, unknown>): MotionBaseline {
  return {
    id: row.id as string,
    walkingStability: row.walking_stability as number,
    stepRegularity: row.step_regularity as number,
    stepIntervalVariability: row.step_interval_variability as number,
    lateralSway: row.lateral_sway as number,
    motionVariance: row.motion_variance as number,
    rotationVariance: row.rotation_variance as number,
    qualityScore: row.quality_score as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

type MotionBaselineInput = Omit<MotionBaseline, 'id' | 'createdAt' | 'updatedAt'>;

export const MotionBaselineRepository = {
  async getLatest(): Promise<MotionBaseline | null> {
    const db = await getDatabase();
    const result = await db.execute(
      'SELECT * FROM motion_baseline ORDER BY updated_at DESC LIMIT 1;',
    );
    return result.rows.length > 0 ? mapRow(result.rows[0]) : null;
  },

  async save(input: MotionBaselineInput): Promise<MotionBaseline> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const baseline: MotionBaseline = { ...input, id: generateId(), createdAt: now, updatedAt: now };
    await db.execute(
      `INSERT INTO motion_baseline
        (id, walking_stability, step_regularity, step_interval_variability, lateral_sway, motion_variance, rotation_variance, quality_score, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        baseline.id,
        baseline.walkingStability,
        baseline.stepRegularity,
        baseline.stepIntervalVariability,
        baseline.lateralSway,
        baseline.motionVariance,
        baseline.rotationVariance,
        baseline.qualityScore,
        baseline.createdAt,
        baseline.updatedAt,
      ],
    );
    return baseline;
  },

  async clear(): Promise<void> {
    const db = await getDatabase();
    await db.execute('DELETE FROM motion_baseline;');
  },
};
