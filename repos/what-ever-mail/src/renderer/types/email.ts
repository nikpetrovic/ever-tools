export interface Attachment {
  filename: string
  size: number
  mimeType: string
}

export interface EmailRecord {
  id: string
  messageId: string | null
  from: string
  to: string[]
  cc: string[]
  subject: string
  date: string
  html: string | null
  text: string | null
  raw: string
  headers: Record<string, string>
  attachments: Attachment[]
  read: boolean
  createdAt: string
  deletedAt: string | null
}
