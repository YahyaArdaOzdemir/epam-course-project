ALTER TABLE sessions ADD COLUMN jwt_id TEXT;
ALTER TABLE sessions ADD COLUMN created_from_ip TEXT;
ALTER TABLE sessions ADD COLUMN created_from_user_agent TEXT;

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_jwt_id ON sessions(jwt_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  consumed_at TEXT,
  requested_from_ip TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);

CREATE TABLE IF NOT EXISTS csrf_tokens (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY(session_id) REFERENCES sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_csrf_tokens_session_id ON csrf_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_token_hash ON csrf_tokens(token_hash);

CREATE TABLE IF NOT EXISTS auth_throttle_windows (
  id TEXT PRIMARY KEY,
  action_type TEXT NOT NULL CHECK(action_type IN ('login', 'password_reset')),
  account_key TEXT NOT NULL,
  source_ip TEXT NOT NULL,
  window_start TEXT NOT NULL,
  account_failures INTEGER NOT NULL DEFAULT 0,
  ip_failures INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_throttle_unique ON auth_throttle_windows(action_type, account_key, source_ip, window_start);
