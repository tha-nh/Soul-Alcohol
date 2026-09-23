export * from './db';

import { getDatabase } from './db';

/**
 * Section 41/42: user-triggered full data wipe. Order matters — child rows
 * are deleted before their parent to respect the FK constraints.
 */
export async function wipeAllData(): Promise<void> {
  const db = await getDatabase();
  await db.execute('DELETE FROM alert;');
  await db.execute('DELETE FROM analysis_result;');
  await db.execute('DELETE FROM session;');
  await db.execute('DELETE FROM voice_baseline;');
  await db.execute('DELETE FROM motion_baseline;');
  await db.execute('DELETE FROM profile;');
}

/** Section 41: history-only wipe, keeps baselines and profile intact. */
export async function wipeHistory(): Promise<void> {
  const db = await getDatabase();
  await db.execute('DELETE FROM alert;');
  await db.execute('DELETE FROM analysis_result;');
  await db.execute('DELETE FROM session;');
}
