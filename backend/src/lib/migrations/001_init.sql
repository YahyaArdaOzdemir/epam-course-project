CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('submitter', 'evaluator_admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('Submitted', 'Under Review', 'Accepted', 'Rejected')),
  is_shared INTEGER NOT NULL DEFAULT 0,
  row_version INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(owner_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL UNIQUE,
  original_file_name TEXT NOT NULL,
  stored_file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  FOREIGN KEY(idea_id) REFERENCES ideas(id)
);

CREATE TABLE IF NOT EXISTS evaluation_decisions (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL,
  evaluator_user_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK(decision IN ('Accepted', 'Rejected')),
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(idea_id) REFERENCES ideas(id),
  FOREIGN KEY(evaluator_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS status_history_entries (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by_user_id TEXT NOT NULL,
  comment_snapshot TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(idea_id) REFERENCES ideas(id),
  FOREIGN KEY(changed_by_user_id) REFERENCES users(id)
);
