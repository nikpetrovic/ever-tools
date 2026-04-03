import type { EmailRecord, Attachment } from '../../renderer/types/email'
import { getDb } from './index'

interface EmailRow {
  id: string
  message_id: string | null
  from: string
  to: string
  cc: string
  subject: string
  date: string
  html: string | null
  text: string | null
  raw: string
  headers: string
  attachments: string
  read: number
  created_at: string
  deleted_at: string | null
}

function rowToRecord(row: EmailRow): EmailRecord {
  return {
    id: row.id,
    messageId: row.message_id,
    from: row.from,
    to: JSON.parse(row.to) as string[],
    cc: JSON.parse(row.cc) as string[],
    subject: row.subject,
    date: row.date,
    html: row.html,
    text: row.text,
    raw: row.raw,
    headers: JSON.parse(row.headers) as Record<string, string>,
    attachments: JSON.parse(row.attachments) as Attachment[],
    read: row.read === 1,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
  }
}

export function insertEmail(email: EmailRecord): void {
  const db = getDb()
  db.prepare(`
    INSERT INTO emails (id, message_id, "from", "to", cc, subject, date, html, text, raw, headers, attachments, read, created_at)
    VALUES (@id, @messageId, @from, @to, @cc, @subject, @date, @html, @text, @raw, @headers, @attachments, @read, @createdAt)
  `).run({
    id: email.id,
    messageId: email.messageId,
    from: email.from,
    to: JSON.stringify(email.to),
    cc: JSON.stringify(email.cc),
    subject: email.subject,
    date: email.date,
    html: email.html,
    text: email.text,
    raw: email.raw,
    headers: JSON.stringify(email.headers),
    attachments: JSON.stringify(email.attachments),
    read: email.read ? 1 : 0,
    createdAt: email.createdAt,
  })
}

export function listEmails(): EmailRecord[] {
  const db = getDb()
  const rows = db.prepare(`
    SELECT * FROM emails ORDER BY created_at DESC
  `).all() as EmailRow[]
  return rows.map(rowToRecord)
}

export function getEmail(id: string): EmailRecord | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM emails WHERE id = ?').get(id) as EmailRow | undefined
  return row ? rowToRecord(row) : null
}

export function deleteEmail(id: string): void {
  const db = getDb()
  db.prepare('DELETE FROM emails WHERE id = ?').run(id)
}

export function clearEmails(): void {
  const db = getDb()
  db.prepare('DELETE FROM emails').run()
}

export function markRead(id: string): void {
  const db = getDb()
  db.prepare('UPDATE emails SET read = 1 WHERE id = ?').run(id)
}

export function trashEmail(id: string): void {
  const db = getDb()
  db.prepare('UPDATE emails SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), id)
}

export function restoreEmail(id: string): void {
  const db = getDb()
  db.prepare('UPDATE emails SET deleted_at = NULL WHERE id = ?').run(id)
}

export function permanentDeleteEmail(id: string): void {
  const db = getDb()
  db.prepare('DELETE FROM emails WHERE id = ?').run(id)
}

export function clearTrashedEmails(): void {
  const db = getDb()
  db.prepare('DELETE FROM emails WHERE deleted_at IS NOT NULL').run()
}

export function hasAnyEmails(): boolean {
  const db = getDb()
  const row = db.prepare('SELECT 1 FROM emails LIMIT 1').get()
  return row !== undefined
}

export function purgeOldTrashedEmails(daysOld: number): void {
  const db = getDb()
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString()
  db.prepare('DELETE FROM emails WHERE deleted_at IS NOT NULL AND deleted_at < ?').run(cutoff)
}
