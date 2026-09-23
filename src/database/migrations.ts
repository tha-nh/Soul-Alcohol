import { DB } from '@op-engineering/op-sqlite';
import { CREATE_TABLE_STATEMENTS } from './schema';

interface Migration {
  version: number;
  statements: readonly string[];
}

const MIGRATIONS: readonly Migration[] = [{ version: 1, statements: CREATE_TABLE_STATEMENTS }];

export async function runMigrations(db: DB): Promise<void> {
  const result = await db.execute('PRAGMA user_version;');
  const currentVersion = (result.rows[0]?.user_version as number) ?? 0;

  const pending = MIGRATIONS.filter(migration => migration.version > currentVersion).sort(
    (a, b) => a.version - b.version,
  );

  for (const migration of pending) {
    for (const statement of migration.statements) {
      await db.execute(statement);
    }
    await db.execute(`PRAGMA user_version = ${migration.version};`);
  }
}
