import { getDatabase } from '../database/db';
import { UserProfile } from '../models';
import { generateId } from '../utils/id';

function mapRow(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    name: row.name as string,
    createdAt: row.created_at as string,
  };
}

export const ProfileRepository = {
  async get(): Promise<UserProfile | null> {
    const db = await getDatabase();
    const result = await db.execute('SELECT * FROM profile LIMIT 1;');
    return result.rows.length > 0 ? mapRow(result.rows[0]) : null;
  },

  async save(name: string): Promise<UserProfile> {
    const db = await getDatabase();
    const existing = await this.get();
    if (existing) {
      await db.execute('UPDATE profile SET name = ? WHERE id = ?;', [name, existing.id]);
      return { ...existing, name };
    }
    const profile: UserProfile = {
      id: generateId(),
      name,
      createdAt: new Date().toISOString(),
    };
    await db.execute('INSERT INTO profile (id, name, created_at) VALUES (?, ?, ?);', [
      profile.id,
      profile.name,
      profile.createdAt,
    ]);
    return profile;
  },
};
