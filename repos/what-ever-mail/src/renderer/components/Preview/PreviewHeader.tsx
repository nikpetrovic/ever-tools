import React from 'react'
import clsx from 'clsx'
import type { EmailRecord } from '../../types/email'

type PreviewTab = 'html' | 'text' | 'source' | 'headers'

interface PreviewHeaderProps {
  email: EmailRecord
  activeTab: PreviewTab
  onTabChange: (tab: PreviewTab) => void
  onDelete: () => void
  showDelete?: boolean
}

const TABS: { id: PreviewTab; label: string }[] = [
  { id: 'html',    label: 'HTML'    },
  { id: 'text',    label: 'Text'    },
  { id: 'source',  label: 'Source'  },
  { id: 'headers', label: 'Headers' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function PreviewHeader({
  email,
  activeTab,
  onTabChange,
  onDelete,
  showDelete = true,
}: PreviewHeaderProps): React.JSX.Element {
  return (
    <div className="border-b border-border bg-surface-panel shrink-0">
      {/* Meta section */}
      <div className="pt-[14px] px-5 pb-[10px]">
        <div className="flex justify-between items-start gap-3 mb-[10px]">
          <h2 className="m-0 text-[15px] font-semibold text-fg-1 leading-[1.3]">
            {email.subject || '(no subject)'}
          </h2>

          {showDelete && (
            <button
              onClick={onDelete}
              title="Delete email"
              className="bg-transparent border-0 cursor-pointer text-fg-3 p-1 rounded-md shrink-0 transition-colors duration-150 hover:text-red-500"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          )}
        </div>

        <div className="grid grid-cols-[48px_1fr] gap-y-[2px] text-xs text-fg-2">
          <span className="font-medium">From</span>
          <span className="text-fg-1">{email.from}</span>
          <span className="font-medium">To</span>
          <span>{email.to.join(', ')}</span>
          {email.cc.length > 0 && (
            <>
              <span className="font-medium">Cc</span>
              <span>{email.cc.join(', ')}</span>
            </>
          )}
          <span className="font-medium">Date</span>
          <span>{formatDate(email.date)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-5 gap-1">
        {TABS.map((tab) => {
          const active = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'bg-transparent border-x-0 border-t-0 border-b-2 cursor-pointer pt-[6px] px-[10px] pb-2 text-xs transition-[color,border-color] duration-150',
                active
                  ? 'font-semibold text-accent border-accent'
                  : 'font-normal text-fg-2 border-transparent hover:text-fg-1'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export type { PreviewTab }
