import { app } from 'electron'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { v4 as uuid } from 'uuid'
import type { EmailRecord } from '../renderer/types/email'
import { insertEmail, hasAnyEmails } from './db/emails'
import { getSetting, setSetting } from './settings'
import { logError, logInfo } from './logger'

interface ReleaseNoteEmail {
  number: number
  type: 'html' | 'txt'
  filename: string
  content: string
}

interface ReleaseNotesBundle {
  bundleId: string
  meta: { from: string; to: string; subject: string }
  emails: ReleaseNoteEmail[]
}

function getBundlePath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'release-notes-bundle.json')
  }
  // In dev mode, process.resourcesPath points to Electron internals — use project build dir instead
  return join(__dirname, '../../build/release-notes-bundle.json')
}

function replacePlaceholders(text: string, date: string): string {
  return text.replaceAll('${current_date}', date)
}

function buildRaw(fields: {
  from: string
  to: string
  subject: string
  messageId: string
  date: string
  contentType: string
  body: string
}): string {
  return [
    `From: ${fields.from}`,
    `To: ${fields.to}`,
    `Subject: ${fields.subject}`,
    `Message-ID: ${fields.messageId}`,
    `Date: ${fields.date}`,
    `MIME-Version: 1.0`,
    `Content-Type: ${fields.contentType}`,
    '',
    fields.body,
  ].join('\r\n')
}

export function loadReleaseNotesIfNewBundle(): void {
  const bundlePath = getBundlePath()

  if (!existsSync(bundlePath)) return

  let bundle: ReleaseNotesBundle
  try {
    bundle = JSON.parse(readFileSync(bundlePath, 'utf-8')) as ReleaseNotesBundle
  } catch {
    return
  }

  if (!bundle.bundleId) return

  const lastLoadedBundleId = getSetting('lastLoadedBundleId')
  // If the bundle ID matches but the DB is empty (e.g. fresh install on Windows
  // where a previous run stored the ID but emails were never written), reload.
  if (bundle.bundleId === lastLoadedBundleId && hasAnyEmails()) return

  const localDate = new Date().toLocaleString()
  const from = replacePlaceholders(bundle.meta.from, localDate)
  const to = replacePlaceholders(bundle.meta.to, localDate)
  const subject = replacePlaceholders(bundle.meta.subject, localDate)

  const emails = bundle.emails.slice().sort((a, b) => a.number - b.number)
  const now = Date.now()

  logInfo('release-notes', `Loading bundle ${bundle.bundleId} (${emails.length} email(s))`)

  for (let i = 0; i < emails.length; i++) {
    const entry = emails[i]
    // Email 001 (index 0) gets the most recent timestamp → appears at top of inbox
    const timestamp = new Date(now - (emails.length - 1 - i) * 1000)
    const dateIso = timestamp.toISOString()
    const messageId = `<${uuid()}@whatever-mail.local>`
    const isHtml = entry.type === 'html'
    const contentType = isHtml ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8'
    const body = replacePlaceholders(entry.content, localDate)

    const record: EmailRecord = {
      id: uuid(),
      messageId,
      from,
      to: [to],
      cc: [],
      subject,
      date: dateIso,
      html: isHtml ? body : null,
      text: isHtml ? null : body,
      raw: buildRaw({ from, to, subject, messageId, date: dateIso, contentType, body }),
      headers: {
        date: dateIso,
        'message-id': messageId,
        'mime-version': '1.0',
        'content-type': contentType,
      },
      attachments: [],
      read: false,
      createdAt: dateIso,
      deletedAt: null,
    }

    try {
      insertEmail(record)
      logInfo('release-notes', `Inserted email ${i + 1}/${emails.length}: ${entry.filename}`)
    } catch (err) {
      logError('release-notes', err)
    }
  }

  // Always persist the bundleId — if inserts failed due to a permanent error
  // (e.g. schema mismatch), retrying on every launch won't help.
  setSetting('lastLoadedBundleId', bundle.bundleId)
  logInfo('release-notes', `Bundle ${bundle.bundleId} marked as loaded`)
}
