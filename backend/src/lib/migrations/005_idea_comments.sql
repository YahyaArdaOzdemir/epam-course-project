CREATE TABLE IF NOT EXISTS idea_comments (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL,
  author_user_id TEXT NOT NULL,
  parent_comment_id TEXT,
  depth INTEGER NOT NULL CHECK(depth >= 1 AND depth <= 5),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(idea_id) REFERENCES ideas(id) ON DELETE CASCADE,
  FOREIGN KEY(author_user_id) REFERENCES users(id),
  FOREIGN KEY(parent_comment_id) REFERENCES idea_comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_idea_comments_idea_id_created_at ON idea_comments (idea_id, created_at);
CREATE INDEX IF NOT EXISTS idx_idea_comments_parent ON idea_comments (parent_comment_id);
