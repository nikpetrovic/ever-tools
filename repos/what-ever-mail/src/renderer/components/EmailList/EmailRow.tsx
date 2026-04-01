import React from 'react'
import clsx from 'clsx'
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
      className={clsx(
        'flex items-start gap-[10px] px-3 py-[10px] cursor-pointer border-l-[3px] transition-[background] duration-[120ms] relative',
        selected
          ? 'bg-accent-soft border-accent'
          : 'bg-transparent border-transparent hover:bg-surface-hover'
      )}
    >
      {/* Avatar */}
      <div
        className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 transition-[background] duration-200"
        style={{ background: selected ? 'var(--grad, #f97316)' : avatarColor }}
      >
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center gap-2">
          <span className={clsx('text-xs text-fg-1 overflow-hidden text-ellipsis whitespace-nowrap flex-1', email.read ? 'font-normal' : 'font-semibold')}>
            {email.from.replace(/<[^>]+>/, '').trim() || email.from}
          </span>
          <span className="text-[10px] text-fg-3 shrink-0">
            {formatTime(email.createdAt)}
          </span>
        </div>

        <div className={clsx('text-xs overflow-hidden text-ellipsis whitespace-nowrap mt-[1px]', email.read ? 'font-normal text-fg-2' : 'font-medium text-fg-1')}>
          {email.subject}
        </div>

        {preview && (
          <div className="text-[11px] text-fg-3 overflow-hidden text-ellipsis whitespace-nowrap mt-[1px]">
            {preview}
          </div>
        )}
      </div>

      {/* Unread dot */}
      {!email.read && (
        <div className="w-[7px] h-[7px] rounded-full bg-accent shrink-0 mt-[5px]" />
      )}
    </div>
  )
}
