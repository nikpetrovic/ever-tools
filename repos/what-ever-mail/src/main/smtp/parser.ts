import { simpleParser } from 'mailparser'
import { v4 as uuidv4 } from 'uuid'
import type { EmailRecord, Attachment } from '../../renderer/types/email'

function headerValueToString(value: unknown): string {
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toUTCString()
  if (Array.isArray(value)) return value.map(headerValueToString).join(', ')
  if (value !== null && typeof value === 'object') {
    // Address object from mailparser: { text, value, html }
    if ('text' in value && typeof (value as Record<string, unknown>).text === 'string') {
      return (value as { text: string }).text
    }
    // Structured header (e.g. content-type): { value, params }
    if ('value' in value && typeof (value as Record<string, unknown>).value === 'string') {
      const v = value as { value: string; params?: Record<string, string> }
      const params = v.params
        ? Object.entries(v.params).map(([k, p]) => `${k}=${p}`).join('; ')
        : ''
      return params ? `${v.value}; ${params}` : v.value
    }
  }
  return String(value)
}

export async function parseRawEmail(rawBuffer: Buffer): Promise<EmailRecord> {
  const parsed = await simpleParser(rawBuffer)

  const from = parsed.from?.text ?? ''

  const to = parsed.to
    ? Array.isArray(parsed.to)
      ? parsed.to.flatMap((a) => a.text)
      : [parsed.to.text]
    : []

  const cc = parsed.cc
    ? Array.isArray(parsed.cc)
      ? parsed.cc.flatMap((a) => a.text)
      : [parsed.cc.text]
    : []

  const headers: Record<string, string> = {}
  parsed.headers.forEach((value, key) => {
    headers[key] = headerValueToString(value)
  })

  const attachments: Attachment[] = (parsed.attachments ?? []).map((att) => ({
    filename: att.filename ?? 'attachment',
    size: att.size ?? 0,
    mimeType: att.contentType ?? 'application/octet-stream',
  }))

  const now = new Date().toISOString()

  return {
    id: uuidv4(),
    messageId: parsed.messageId ?? null,
    from,
    to,
    cc,
    subject: parsed.subject ?? '(no subject)',
    date: parsed.date?.toISOString() ?? now,
    html: parsed.html !== false ? (parsed.html ?? null) : null,
    text: parsed.text ?? null,
    raw: rawBuffer.toString('utf-8'),
    headers,
    attachments,
    read: false,
    createdAt: now,
  }
}
