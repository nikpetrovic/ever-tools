import Database from 'better-sqlite3'

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS emails (
      id          TEXT PRIMARY KEY,
      message_id  TEXT,
      "from"      TEXT NOT NULL,
      "to"        TEXT NOT NULL DEFAULT '[]',
      cc          TEXT NOT NULL DEFAULT '[]',
      subject     TEXT NOT NULL DEFAULT '',
      date        TEXT NOT NULL,
      html        TEXT,
      text        TEXT,
      raw         TEXT NOT NULL DEFAULT '',
      headers     TEXT NOT NULL DEFAULT '{}',
      attachments TEXT NOT NULL DEFAULT '[]',
      read        INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL
    )
  `)

  try {
    db.exec(`ALTER TABLE emails ADD COLUMN deleted_at TEXT DEFAULT NULL`)
  } catch {
    // column already exists — safe to ignore
  }
}
