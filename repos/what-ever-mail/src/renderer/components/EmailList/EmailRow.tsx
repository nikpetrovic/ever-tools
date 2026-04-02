import React from 'react'
import clsx from 'clsx'
import type { EmailRecord } from '../../types/email'

interface EmailRowProps {
  email: EmailRecord
  selected: boolean
  isMultiSelected?: boolean
  onSelect: () => void
  onMultiToggle?: () => void
  onRangeSelect?: () => void
  onTrash?: () => void
  onRestore?: () => void
  onDeleteForever?: () => void
}

interface ActionButtonProps {
  onClick: (e: React.MouseEvent) => void
  title: string
  className?: string
  children: React.ReactNode
}

function ActionButton({ onClick, title, className, children }: ActionButtonProps): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      title={title}
      className={clsx(
        'bg-transparent border-0 cursor-pointer text-fg-2 p-[5px] rounded transition-colors duration-100',
        className
      )}
    >
      {children}
    </button>
  )
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

export default function EmailRow({ email, selected, isMultiSelected, onSelect, onMultiToggle, onRangeSelect, onTrash, onRestore, onDeleteForever }: EmailRowProps): React.JSX.Element {
  const initials = getInitials(email.from)
  const avatarColor = hashColor(email.from)
  const preview = email.text
    ? email.text.replace(/\s+/g, ' ').trim().substring(0, 80)
    : (email.html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 80) ?? '')

  return (
    <div
      onClick={(e) => {
        if (e.shiftKey && onRangeSelect) {
          e.preventDefault()
          onRangeSelect()
        } else if ((e.metaKey || e.ctrlKey) && onMultiToggle) {
          e.preventDefault()
          onMultiToggle()
        } else {
          onSelect()
        }
      }}
      className={clsx(
        'group flex items-start gap-[10px] px-3 py-[10px] cursor-pointer border-l-[3px] transition-[background] duration-[120ms] relative select-none',
        isMultiSelected
          ? 'bg-accent-soft border-accent'
          : selected
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

      {/* Hover action overlay */}
      {(onTrash || onRestore || onDeleteForever) && (
        <div
          className="absolute right-0 top-0 bottom-0 w-[100px] flex items-center justify-end pr-1 gap-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto"
          style={{
            background: 'var(--hover-overlay)',
            backdropFilter: 'blur(0.5px)',
            WebkitBackdropFilter: 'blur(0.5px)',
          }}
        >
          {onTrash && (
            <ActionButton
              onClick={(e) => { e.stopPropagation(); onTrash() }}
              title="Move to trash"
              className="text-accent hover:text-red-500"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </ActionButton>
          )}
          {onRestore && (
            <ActionButton
              onClick={(e) => { e.stopPropagation(); onRestore() }}
              title="Restore to inbox"
              className="text-fg-3 hover:text-accent"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 14 4 9 9 4" />
                <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
              </svg>
            </ActionButton>
          )}
          {onDeleteForever && (
            <ActionButton
              onClick={(e) => { e.stopPropagation(); onDeleteForever() }}
              title="Delete forever"
              className="text-fg-3 hover:text-red-500"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </ActionButton>
          )}
        </div>
      )}
    </div>
  )
}
