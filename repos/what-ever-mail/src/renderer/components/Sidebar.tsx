import React from 'react'
import type { NavItem } from '../store/ui'
import type { EmailRecord } from '../types/email'

interface SidebarProps {
  navItem: NavItem
  emails: EmailRecord[]
  onNavigate: (item: NavItem) => void
}

export default function Sidebar({ navItem, emails, onNavigate }: SidebarProps): React.JSX.Element {
  const unreadCount = emails.filter((e) => !e.read).length

  return (
    <aside
      style={{
        width: 176,
        background: 'var(--bg-base)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 8px',
        flexShrink: 0,
        gap: 2,
      }}
    >
      <NavButton
        label="Inbox"
        badge={unreadCount > 0 ? unreadCount : undefined}
        active={navItem === 'inbox'}
        onClick={() => onNavigate('inbox')}
        icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
          </svg>
        }
      />
      <NavButton
        label="Trash"
        active={navItem === 'trash'}
        onClick={() => onNavigate('trash')}
        icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        }
      />
    </aside>
  )
}

interface NavButtonProps {
  label: string
  active: boolean
  badge?: number
  icon: React.ReactNode
  onClick: () => void
}

function NavButton({ label, active, badge, icon, onClick }: NavButtonProps): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 10px',
        borderRadius: 8,
        border: 'none',
        background: active ? 'var(--accent-soft, rgba(249,115,22,0.12))' : 'transparent',
        color: active ? 'var(--accent, #f97316)' : 'var(--text-2)',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--bg-hover)'
          e.currentTarget.style.color = 'var(--text-1)'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-2)'
        }
      }}
    >
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
      {badge !== undefined && (
        <span
          style={{
            background: 'var(--grad, #f97316)',
            color: '#fff',
            borderRadius: 10,
            padding: '1px 6px',
            fontSize: 11,
            fontWeight: 600,
            minWidth: 18,
            textAlign: 'center',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  )
}
