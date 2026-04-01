import React from 'react'
import type { EmailRecord } from '../../types/email'
import { useDeleteEmail } from '../../hooks/useEmails'

type PreviewTab = 'html' | 'text' | 'source' | 'headers'

interface PreviewHeaderProps {
  email: EmailRecord
  activeTab: PreviewTab
  onTabChange: (tab: PreviewTab) => void
  onDelete: () => void
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
}: PreviewHeaderProps): React.JSX.Element {
  return (
    <div
      style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-panel)',
        flexShrink: 0,
      }}
    >
      {/* Meta section */}
      <div style={{ padding: '14px 20px 10px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 10,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-1)',
              lineHeight: 1.3,
            }}
          >
            {email.subject || '(no subject)'}
          </h2>

          <button
            onClick={onDelete}
            title="Delete email"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-3)',
              padding: 4,
              borderRadius: 6,
              flexShrink: 0,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr', rowGap: 2, fontSize: 12, color: 'var(--text-2)' }}>
          <span style={{ fontWeight: 500 }}>From</span>
          <span style={{ color: 'var(--text-1)' }}>{email.from}</span>
          <span style={{ fontWeight: 500 }}>To</span>
          <span>{email.to.join(', ')}</span>
          {email.cc.length > 0 && (
            <>
              <span style={{ fontWeight: 500 }}>Cc</span>
              <span>{email.cc.join(', ')}</span>
            </>
          )}
          <span style={{ fontWeight: 500 }}>Date</span>
          <span>{formatDate(email.date)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '0 20px', gap: 4 }}>
        {TABS.map((tab) => {
          const active = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: active
                  ? '2px solid var(--accent, #f97316)'
                  : '2px solid transparent',
                padding: '6px 10px 8px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--accent, #f97316)' : 'var(--text-2)',
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.color = 'var(--text-1)'
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.color = 'var(--text-2)'
              }}
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
