import fs from 'fs';
import path from 'path';
import { getDb } from './db';

export const migrate = (): void => {
  const db = getDb();
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
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec(sql);
  }
};
