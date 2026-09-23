import { open, DB } from '@op-engineering/op-sqlite';
import { runMigrations } from './migrations';

const DATABASE_NAME = 'soul_alcohol.db';

let dbInstance: DB | null = null;
let initPromise: Promise<DB> | null = null;

/**
 * SQLCipher support is enabled at the native layer (package.json
 * "op-sqlite.sqlcipher") per Section 46. Passing an encryptionKey here is
 * left as a TODO until a secure key provider (Keychain/Keystore) is wired
 * up in the security-hardening phase — opening without a key still works
 * against the plain-SQLite path in the meantime.
 */
export async function getDatabase(): Promise<DB> {
  if (dbInstance) {
    return dbInstance;
  }
  if (!initPromise) {
    initPromise = (async () => {
      const db = open({ name: DATABASE_NAME });
      await runMigrations(db);
      dbInstance = db;
      return db;
    })();
  }
  return initPromise;
}

export function closeDatabase(): void {
  dbInstance?.close();
  dbInstance = null;
  initPromise = null;
}
