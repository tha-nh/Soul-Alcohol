/**
 * Section 38/39: only aggregated analysis results are persisted here.
 * Raw microphone/sensor samples never reach SQLite — they live only in the
 * in-memory rolling buffers inside the audio/motion services.
 */
export const CREATE_TABLE_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS profile (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS voice_baseline (
    id TEXT PRIMARY KEY NOT NULL,
    speaker_embedding TEXT NOT NULL,
    voice_features TEXT NOT NULL,
    quality_score REAL NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS motion_baseline (
    id TEXT PRIMARY KEY NOT NULL,
    walking_stability REAL NOT NULL,
    step_regularity REAL NOT NULL,
    step_interval_variability REAL NOT NULL,
    lateral_sway REAL NOT NULL,
    motion_variance REAL NOT NULL,
    rotation_variance REAL NOT NULL,
    quality_score REAL NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    status TEXT NOT NULL,
    initial_score REAL,
    lowest_score REAL,
    final_score REAL,
    max_alert_level TEXT,
    created_at TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS analysis_result (
    id TEXT PRIMARY KEY NOT NULL,
    session_id TEXT NOT NULL REFERENCES session(id) ON DELETE CASCADE,
    timestamp TEXT NOT NULL,
    voice_score REAL NOT NULL,
    motion_score REAL NOT NULL,
    trend_score REAL NOT NULL,
    alertness_score REAL NOT NULL,
    confidence_score REAL NOT NULL,
    voice_available INTEGER NOT NULL,
    motion_available INTEGER NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_analysis_result_session_id ON analysis_result(session_id);`,

  `CREATE TABLE IF NOT EXISTS alert (
    id TEXT PRIMARY KEY NOT NULL,
    session_id TEXT NOT NULL REFERENCES session(id) ON DELETE CASCADE,
    timestamp TEXT NOT NULL,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    user_response TEXT
  );`,
  `CREATE INDEX IF NOT EXISTS idx_alert_session_id ON alert(session_id);`,
];
