PRAGMA foreign_keys = OFF;

CREATE TABLE users_next (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('submitter', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT 'Unknown User'
);

INSERT INTO users_next (id, email, password_hash, role, status, created_at, updated_at, full_name)
SELECT
  id,
  email,
  password_hash,
  CASE WHEN role = 'evaluator_admin' THEN 'admin' ELSE role END,
  status,
  created_at,
  updated_at,
  COALESCE(full_name, 'Unknown User')
FROM users;

DROP TABLE users;
ALTER TABLE users_next RENAME TO users;

PRAGMA foreign_keys = ON;
