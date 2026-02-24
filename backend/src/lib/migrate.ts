import fs from 'fs';
import path from 'path';
import { getDb } from './db';

export const migrate = (): void => {
  const db = getDb();
  db.exec(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )`,
  );

  const sourceMigrationsDir = path.resolve(__dirname, 'migrations');
  const distFallbackMigrationsDir = path.resolve(__dirname, '../../src/lib/migrations');
  const migrationsDir = fs.existsSync(sourceMigrationsDir) ? sourceMigrationsDir : distFallbackMigrationsDir;

  if (!fs.existsSync(migrationsDir)) {
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const alreadyApplied = db.prepare('SELECT 1 FROM schema_migrations WHERE id = ?').get(file);
    if (alreadyApplied) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const transaction = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)').run(file, new Date().toISOString());
    });

    transaction();
  }
};
