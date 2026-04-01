import React, { useMemo } from 'react'
import type { EmailRecord } from '../../types/email'
import type { NavItem } from '../../store/ui'
import EmailRow from './EmailRow'
import SearchBox from './SearchBox'
import { useMarkRead } from '../../hooks/useEmails'

interface EmailListProps {
  emails: EmailRecord[]
  navItem: NavItem
  selectedId: string | null
  searchQuery: string
  onSelect: (id: string) => void
  onSearchChange: (q: string) => void
}

export default function EmailList({
  emails,
  navItem,
  selectedId,
  searchQuery,
  onSelect,
  onSearchChange,
}: EmailListProps): React.JSX.Element {
  const markRead = useMarkRead()

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return emails.filter((e) => {
      if (q) {
        const match =
          e.from.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          e.to.some((t) => t.toLowerCase().includes(q))
        if (!match) return false
      }
      // For now all emails are in "inbox"; trash would require a deleted flag
      return navItem === 'inbox'
    })
  }, [emails, navItem, searchQuery])

  function handleSelect(id: string): void {
    onSelect(id)
    const email = emails.find((e) => e.id === id)
    if (email && !email.read) {
      markRead(id)
    }
  }

  return (
    <div
      style={{
        width: 280,
        background: 'var(--bg-panel)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <SearchBox value={searchQuery} onChange={onSearchChange} />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <EmptyState hasSearch={searchQuery.length > 0} />
        ) : (
          filtered.map((email) => (
            <EmailRow
              key={email.id}
              email={email}
              selected={email.id === selectedId}
              onSelect={() => handleSelect(email.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function EmptyState({ hasSearch }: { hasSearch: boolean }): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: 32,
        gap: 12,
        color: 'var(--text-3)',
        textAlign: 'center',
      }}
    >
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.4 }}
      >
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
      {hasSearch ? (
        <p style={{ fontSize: 12, margin: 0 }}>No emails match your search</p>
      ) : (
        <>
          <p style={{ fontSize: 12, margin: 0, fontWeight: 500, color: 'var(--text-2)' }}>
            No emails yet
          </p>
          <p style={{ fontSize: 11, margin: 0 }}>
            Point your app's SMTP config at{' '}
            <code
              style={{
                fontFamily: 'IBM Plex Mono, monospace',
                background: 'var(--bg-hover)',
                padding: '1px 5px',
                borderRadius: 4,
              }}
            >
              localhost:1025
            </code>
          </p>
        </>
      )}
    </div>
  )
}
