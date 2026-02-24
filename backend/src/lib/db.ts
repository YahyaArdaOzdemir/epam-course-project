import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let dbInstance: Database.Database | null = null;

const defaultDatabasePath = path.resolve(__dirname, '../../data/app.db');

export const getDb = (): Database.Database => {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = process.env.DATABASE_PATH ?? defaultDatabasePath;
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  dbInstance = new Database(dbPath);
  dbInstance.pragma('foreign_keys = ON');
  return dbInstance;
};
