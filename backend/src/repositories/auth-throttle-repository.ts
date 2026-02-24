import { v4 as uuid } from 'uuid';
import { getDb } from '../lib/db';

export type ThrottleActionType = 'login' | 'password_reset';

type ThrottleRow = {
  id: string;
  actionType: ThrottleActionType;
  accountKey: string;
  sourceIp: string;
  windowStart: string;
  accountFailures: number;
  ipFailures: number;
  updatedAt: string;
};

const WINDOW_MS = 15 * 60 * 1000;
const LIMIT = 5;

const mapRow = (row: Record<string, unknown>): ThrottleRow => ({
  id: String(row.id),
  actionType: row.action_type as ThrottleActionType,
  accountKey: String(row.account_key),
  sourceIp: String(row.source_ip),
  windowStart: String(row.window_start),
  accountFailures: Number(row.account_failures),
  ipFailures: Number(row.ip_failures),
  updatedAt: String(row.updated_at),
});

const getWindowStartIso = (timestamp: number): string => {
  const bucketStart = Math.floor(timestamp / WINDOW_MS) * WINDOW_MS;
  return new Date(bucketStart).toISOString();
};

export const authThrottleRepository = {
  isBlocked(input: { actionType: ThrottleActionType; accountKey: string; sourceIp: string; now?: Date }): boolean {
    const db = getDb();
    const now = input.now ?? new Date();
    const windowStart = getWindowStartIso(now.getTime());

    const row = db
      .prepare(
        `SELECT * FROM auth_throttle_windows
         WHERE action_type = ? AND account_key = ? AND source_ip = ? AND window_start = ?
         LIMIT 1`,
      )
      .get(input.actionType, input.accountKey, input.sourceIp, windowStart);

    if (!row) {
      return false;
    }

    const mapped = mapRow(row as Record<string, unknown>);
    return mapped.accountFailures >= LIMIT || mapped.ipFailures >= LIMIT;
  },

  recordFailure(input: { actionType: ThrottleActionType; accountKey: string; sourceIp: string; now?: Date }): void {
    const db = getDb();
    const now = input.now ?? new Date();
    const nowIso = now.toISOString();
    const windowStart = getWindowStartIso(now.getTime());

    const row = db
      .prepare(
        `SELECT * FROM auth_throttle_windows
         WHERE action_type = ? AND account_key = ? AND source_ip = ? AND window_start = ?
         LIMIT 1`,
      )
      .get(input.actionType, input.accountKey, input.sourceIp, windowStart);

    if (!row) {
      db.prepare(
        `INSERT INTO auth_throttle_windows
         (id, action_type, account_key, source_ip, window_start, account_failures, ip_failures, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, 1, ?)`,
      ).run(uuid(), input.actionType, input.accountKey, input.sourceIp, windowStart, nowIso);
      return;
    }

    db.prepare(
      `UPDATE auth_throttle_windows
       SET account_failures = account_failures + 1,
           ip_failures = ip_failures + 1,
           updated_at = ?
       WHERE action_type = ? AND account_key = ? AND source_ip = ? AND window_start = ?`,
    ).run(nowIso, input.actionType, input.accountKey, input.sourceIp, windowStart);
  },

  clearWindow(input: { actionType: ThrottleActionType; accountKey: string; sourceIp: string; now?: Date }): void {
    const db = getDb();
    const windowStart = getWindowStartIso((input.now ?? new Date()).getTime());
    db.prepare(
      'DELETE FROM auth_throttle_windows WHERE action_type = ? AND account_key = ? AND source_ip = ? AND window_start = ?',
    ).run(input.actionType, input.accountKey, input.sourceIp, windowStart);
  },
};
