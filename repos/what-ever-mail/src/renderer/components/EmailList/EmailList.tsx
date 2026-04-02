import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import type { EmailRecord } from '../../types/email'
import type { NavItem } from '../../store/ui'
import EmailRow from './EmailRow'
import SearchBox from './SearchBox'
import { useMarkRead, useTrashEmail, useRestoreEmail, usePermanentDeleteEmail, useClearTrashedEmails } from '../../hooks/useEmails'

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
  const trashEmail = useTrashEmail()
  const restoreEmail = useRestoreEmail()
  const permanentDeleteEmail = usePermanentDeleteEmail()
  const clearTrashedEmails = useClearTrashedEmails()

  const [multiSelectedIds, setMultiSelectedIds] = useState<Set<string>>(new Set())
  const [lastClickedId, setLastClickedId] = useState<string | null>(null)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Clear multiselect when navigating away from inbox
  useEffect(() => {
    if (navItem !== 'inbox') setMultiSelectedIds(new Set())
  }, [navItem])

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
      // Use == null (loose) to safely handle both null and undefined
      if (navItem === 'inbox') return e.deletedAt == null
      if (navItem === 'trash') return e.deletedAt != null
      return false
    })
  }, [emails, navItem, searchQuery])

  function handleSelect(id: string): void {
    setMultiSelectedIds(new Set())
    setLastClickedId(id)
    onSelect(id)
    const email = emails.find((e) => e.id === id)
    if (email && !email.read) markRead(id)
  }

  const handleMultiToggle = useCallback((id: string) => {
    setMultiSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    setLastClickedId(id)
  }, [])

  const handleRangeSelect = useCallback((id: string) => {
    const anchorId = lastClickedId
    if (!anchorId) {
      handleMultiToggle(id)
      return
    }
    const anchorIdx = filtered.findIndex((e) => e.id === anchorId)
    const targetIdx = filtered.findIndex((e) => e.id === id)
    if (anchorIdx === -1 || targetIdx === -1) {
      handleMultiToggle(id)
      return
    }
    const [start, end] = anchorIdx < targetIdx ? [anchorIdx, targetIdx] : [targetIdx, anchorIdx]
    const rangeIds = filtered.slice(start, end + 1).map((e) => e.id)
    setMultiSelectedIds((prev) => {
      const next = new Set(prev)
      rangeIds.forEach((rid) => next.add(rid))
      return next
    })
  }, [lastClickedId, filtered, handleMultiToggle])

  const handleBulkTrash = useCallback(async () => {
    await Promise.all([...multiSelectedIds].map((id) => trashEmail(id)))
    setMultiSelectedIds(new Set())
  }, [multiSelectedIds, trashEmail])

  // Keep focusedIndex in sync with selectedId (e.g. when user clicks a row)
  useEffect(() => {
    if (!selectedId) return
    const idx = filtered.findIndex((e) => e.id === selectedId)
    if (idx !== -1) setFocusedIndex(idx)
  }, [selectedId, filtered])

  // Scroll focused email into view on keyboard navigation
  useEffect(() => {
    if (focusedIndex === -1 || !scrollContainerRef.current) return
    const focusedEmail = filtered[focusedIndex]
    if (!focusedEmail) return
    const el = scrollContainerRef.current.querySelector(`[data-email-id="${focusedEmail.id}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [focusedIndex, filtered])

  // Keyboard navigation: arrow keys, shift+arrow select, delete
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (filtered.length === 0) return

      const isUp = e.key === 'ArrowUp'
      const isDown = e.key === 'ArrowDown'
      const isDelete =
        e.key === 'Delete' ||
        (e.key === 'Backspace' && (e.metaKey || e.ctrlKey))

      if (isUp || isDown) {
        e.preventDefault()

        const currentIdx = focusedIndex !== -1
          ? focusedIndex
          : selectedId
            ? filtered.findIndex((em) => em.id === selectedId)
            : -1

        const startIdx = currentIdx === -1 ? 0 : currentIdx
        const nextIdx = isDown
          ? Math.min(startIdx + 1, filtered.length - 1)
          : Math.max(startIdx - 1, 0)

        if (nextIdx === currentIdx && currentIdx !== -1) return

        const nextEmail = filtered[nextIdx]
        if (!nextEmail) return

        if (e.shiftKey && navItem === 'inbox') {
          setMultiSelectedIds((prev) => {
            const next = new Set(prev)
            if (currentIdx !== -1) {
              const anchor = filtered[currentIdx]
              if (anchor) next.add(anchor.id)
            }
            next.add(nextEmail.id)
            return next
          })
          setFocusedIndex(nextIdx)
        } else {
          setMultiSelectedIds(new Set())
          setFocusedIndex(nextIdx)
          setLastClickedId(nextEmail.id)
          onSelect(nextEmail.id)
          if (!nextEmail.read) markRead(nextEmail.id)
        }
        return
      }

      if (isDelete) {
        if (navItem === 'inbox') {
          if (multiSelectedIds.size > 0) {
            void handleBulkTrash()
          } else if (selectedId) {
            void trashEmail(selectedId)
          }
        } else if (navItem === 'trash') {
          if (selectedId) {
            void permanentDeleteEmail(selectedId)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    filtered,
    focusedIndex,
    selectedId,
    multiSelectedIds,
    navItem,
    handleBulkTrash,
    trashEmail,
    permanentDeleteEmail,
    markRead,
    onSelect,
  ])

  const isMultiSelectActive = navItem === 'inbox' && multiSelectedIds.size > 0

  return (
    <div className="w-[280px] bg-surface-panel border-r border-border flex flex-col shrink-0 overflow-hidden">
      {isMultiSelectActive ? (
        <BulkActionBar
          count={multiSelectedIds.size}
          onDelete={handleBulkTrash}
          onCancel={() => setMultiSelectedIds(new Set())}
        />
      ) : (
        <SearchBox value={searchQuery} onChange={onSearchChange} />
      )}

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState hasSearch={searchQuery.length > 0} navItem={navItem} />
        ) : (
          <>
            {navItem === 'trash' && (
              <div className="flex flex-col gap-[1px] px-3 py-[4px] text-[11px] text-fg-3 border-b border-border bg-surface-base">
                <span className="flex items-center gap-[6px]">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Emails older than 15 days are automatically deleted
                </span>
                <button
                  onClick={() => clearTrashedEmails()}
                  className="bg-transparent border-0 cursor-pointer text-fg-1 hover:text-red-500 transition-colors duration-100 text-[11px] font-bold text-center w-full p-0"
                >
                  Empty trash now
                </button>
              </div>
            )}
            {filtered.map((email) => (
              <EmailRow
                key={email.id}
                email={email}
                selected={email.id === selectedId && !isMultiSelectActive}
                isMultiSelected={multiSelectedIds.has(email.id)}
                onSelect={() => handleSelect(email.id)}
                onMultiToggle={navItem === 'inbox' ? () => handleMultiToggle(email.id) : undefined}
                onRangeSelect={navItem === 'inbox' ? () => handleRangeSelect(email.id) : undefined}
                {...(navItem === 'inbox'
                  ? { onTrash: () => trashEmail(email.id) }
                  : { onRestore: () => restoreEmail(email.id), onDeleteForever: () => permanentDeleteEmail(email.id) }
                )}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

interface BulkActionBarProps {
  count: number
  onDelete: () => void
  onCancel: () => void
}

function BulkActionBar({ count, onDelete, onCancel }: BulkActionBarProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 px-3 border-b border-border bg-surface-base shrink-0" style={{ height: '41px' }}>
      <span className="text-xs text-fg-2 font-medium flex-1">{count} selected</span>
      <button
        onClick={onDelete}
        title="Move to trash"
        className="flex items-center gap-[5px] bg-transparent border-0 cursor-pointer text-fg-3 hover:text-red-500 transition-colors duration-100 text-xs px-[6px] py-[4px] rounded hover:bg-surface-hover"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
        Delete
      </button>
      <button
        onClick={onCancel}
        title="Cancel selection"
        className="bg-transparent border-0 cursor-pointer text-fg-3 hover:text-fg-1 transition-colors duration-100 p-[4px] rounded hover:bg-surface-hover"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

function EmptyState({ hasSearch, navItem }: { hasSearch: boolean; navItem: NavItem }): React.JSX.Element {
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
      ) : navItem === 'trash' ? (
        <p className="text-xs m-0 font-medium text-fg-2">Trash is empty</p>
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
