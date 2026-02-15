-- Learning analytics + remediation subsystem (SQLite)

CREATE TABLE IF NOT EXISTS la_students (
  student_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  meta_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS la_questions (
  question_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  meta_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS la_skill_tags (
  skill_tag TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS la_attempt_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  is_correct INTEGER NOT NULL,
  answer_raw TEXT NOT NULL,
  duration_ms INTEGER,
  hints_viewed_count INTEGER NOT NULL DEFAULT 0,
  hint_steps_viewed_json TEXT NOT NULL DEFAULT '[]',
  mistake_code TEXT,
  unit TEXT,
  topic TEXT,
  question_type TEXT,
  session_id TEXT,
  device_json TEXT NOT NULL DEFAULT '{}',
  extra_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY(student_id) REFERENCES la_students(student_id),
  FOREIGN KEY(question_id) REFERENCES la_questions(question_id)
);

CREATE INDEX IF NOT EXISTS idx_la_attempt_student_ts ON la_attempt_events(student_id, ts);
CREATE INDEX IF NOT EXISTS idx_la_attempt_topic ON la_attempt_events(topic);
CREATE INDEX IF NOT EXISTS idx_la_attempt_unit ON la_attempt_events(unit);
CREATE INDEX IF NOT EXISTS idx_la_attempt_qtype ON la_attempt_events(question_type);

CREATE TABLE IF NOT EXISTS la_attempt_skill_tags (
  attempt_id INTEGER NOT NULL,
  skill_tag TEXT NOT NULL,
  PRIMARY KEY (attempt_id, skill_tag),
  FOREIGN KEY(attempt_id) REFERENCES la_attempt_events(id),
  FOREIGN KEY(skill_tag) REFERENCES la_skill_tags(skill_tag)
);

CREATE INDEX IF NOT EXISTS idx_la_skill_tag ON la_attempt_skill_tags(skill_tag);

CREATE TABLE IF NOT EXISTS la_hint_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attempt_id INTEGER NOT NULL,
  step_index INTEGER NOT NULL,
  FOREIGN KEY(attempt_id) REFERENCES la_attempt_events(id)
);

CREATE INDEX IF NOT EXISTS idx_la_hint_attempt ON la_hint_usage(attempt_id);

CREATE TABLE IF NOT EXISTS la_remediation_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  window_days INTEGER NOT NULL,
  dataset_name TEXT,
  plan_json TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  FOREIGN KEY(student_id) REFERENCES la_students(student_id)
);

CREATE INDEX IF NOT EXISTS idx_la_plan_student_time ON la_remediation_plans(student_id, generated_at);
