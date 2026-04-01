import React from 'react'
import type { EmailRecord } from '../../types/email'

interface EmailRowProps {
  email: EmailRecord
  selected: boolean
  onSelect: () => void
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

function getInitials(from: string): string {
  const match = from.match(/^([^<@\s]+)/)
  if (!match) return '?'
  return match[1].substring(0, 2).toUpperCase()
}

function hashColor(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  const hue = h % 360
  return `hsl(${hue}, 65%, 50%)`
}

export default function EmailRow({ email, selected, onSelect }: EmailRowProps): React.JSX.Element {
  const initials = getInitials(email.from)
  const avatarColor = hashColor(email.from)
  const preview = email.text?.replace(/\s+/g, ' ').trim().substring(0, 80) ?? ''

  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 12px',
        cursor: 'pointer',
        background: selected
          ? 'var(--accent-soft, rgba(249,115,22,0.1))'
          : 'transparent',
        borderLeft: selected
          ? '3px solid var(--accent, #f97316)'
          : '3px solid transparent',
        transition: 'background 0.12s',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.background = 'var(--bg-hover)'
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.background = 'transparent'
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: selected
            ? 'var(--grad, #f97316)'
            : avatarColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          flexShrink: 0,
          transition: 'background 0.2s',
        }}
      >
        {initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: email.read ? 400 : 600,
              color: 'var(--text-1)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {email.from.replace(/<[^>]+>/, '').trim() || email.from}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>
            {formatTime(email.createdAt)}
          </span>
        </div>

        <div
          style={{
            fontSize: 12,
            fontWeight: email.read ? 400 : 500,
            color: email.read ? 'var(--text-2)' : 'var(--text-1)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginTop: 1,
          }}
        >
          {email.subject}
        </div>

        {preview && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-3)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginTop: 1,
            }}
          >
            {preview}
          </div>
        )}
      </div>

      {/* Unread dot */}
      {!email.read && (
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--accent, #f97316)',
            flexShrink: 0,
            marginTop: 5,
          }}
        />
      )}
    </div>
  )
}
