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
    <div className="w-[280px] bg-surface-panel border-r border-border flex flex-col shrink-0 overflow-hidden">
      <SearchBox value={searchQuery} onChange={onSearchChange} />

      <div className="flex-1 overflow-y-auto">
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
    <div className="flex flex-col items-center justify-center h-full p-8 gap-3 text-fg-3 text-center">
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-40"
      >
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
      {hasSearch ? (
        <p className="text-xs m-0">No emails match your search</p>
      ) : (
        <>
          <p className="text-xs m-0 font-medium text-fg-2">
            No emails yet
          </p>
          <p className="text-[11px] m-0">
            Point your app's SMTP config at{' '}
            <code className="font-mono bg-surface-hover px-[5px] py-px rounded">
              localhost:1025
            </code>
          </p>
        </>
      )}
    </div>
  )
}
