import { open } from '@op-engineering/op-sqlite';
import { CREATE_TABLE_STATEMENTS } from '../schema';
import { runMigrations } from '../migrations';
import { closeDatabase, getDatabase } from '../db';
import { wipeAllData, wipeHistory } from '..';

const fakeDb = (userVersion: number) => {
  const execute = jest.fn(async (sql: string) =>
    sql.startsWith('PRAGMA user_version;') ? { rows: [{ user_version: userVersion }] } : { rows: [] },
  );
  return { db: { execute } as never, execute };
};

describe('schema', () => {
  it('creates every table from Section 38', () => {
    const sql = CREATE_TABLE_STATEMENTS.join('\n');
    for (const table of ['profile', 'voice_baseline', 'motion_baseline', 'session', 'analysis_result', 'alert']) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS ${table} `);
    }
  });

  it('stores no raw audio or raw sensor columns (Section 39)', () => {
    const sql = CREATE_TABLE_STATEMENTS.join('\n').toLowerCase();
    expect(sql).not.toMatch(/raw|audio_data|waveform|pcm|accelerometer_data|gyroscope_data/);
  });

  it('cascades analysis results and alerts when a session is deleted', () => {
    const sql = CREATE_TABLE_STATEMENTS.join('\n');
    expect(sql.match(/ON DELETE CASCADE/g)).toHaveLength(2);
  });
});

describe('runMigrations', () => {
  it('applies the schema and bumps user_version on a fresh database', async () => {
    const { db, execute } = fakeDb(0);
    await runMigrations(db);

    const statements = execute.mock.calls.map(call => call[0] as string);
    expect(statements).toEqual(expect.arrayContaining(CREATE_TABLE_STATEMENTS as string[]));
    expect(statements[statements.length - 1]).toBe('PRAGMA user_version = 1;');
  });

  it('does nothing when the database is already at the latest version', async () => {
    const { db, execute } = fakeDb(1);
    await runMigrations(db);

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith('PRAGMA user_version;');
  });
});

describe('getDatabase', () => {
  afterEach(() => {
    closeDatabase();
    (open as jest.Mock).mockClear();
  });

  it('opens the database once and shares it across callers', async () => {
    const [a, b] = await Promise.all([getDatabase(), getDatabase()]);
    expect(a).toBe(b);
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith({ name: 'soul_alcohol.db' });
  });

  it('reopens after closeDatabase()', async () => {
    await getDatabase();
    closeDatabase();
    await getDatabase();
    expect(open).toHaveBeenCalledTimes(2);
  });
});

describe('data wipes (Section 41/42)', () => {
  const tablesDeleted = async (wipe: () => Promise<void>) => {
    const db = await getDatabase();
    (db.execute as jest.Mock).mockClear();
    await wipe();
    return (db.execute as jest.Mock).mock.calls.map(call => String(call[0]).replace('DELETE FROM ', '').replace(';', ''));
  };

  afterEach(() => closeDatabase());

  it('wipeAllData() deletes child rows before their parents', async () => {
    const order = await tablesDeleted(wipeAllData);
    expect(order).toEqual(['alert', 'analysis_result', 'session', 'voice_baseline', 'motion_baseline', 'profile']);
  });

  it('wipeHistory() keeps baselines and the profile', async () => {
    const order = await tablesDeleted(wipeHistory);
    expect(order).toEqual(['alert', 'analysis_result', 'session']);
  });
});
