import React from 'react'
import clsx from 'clsx'
import type { NavItem } from '../store/ui'
import type { EmailRecord } from '../types/email'
import ThemePicker from './ThemePicker'
import { SupportButton } from './SupportButton'
import { useSetting } from '../hooks/useSettings'
import { SHOW_SUPPORT_BUTTON } from '../config'

interface SidebarProps {
  navItem: NavItem
  emails: EmailRecord[]
  onNavigate: (item: NavItem) => void
}

export default function Sidebar({ navItem, emails, onNavigate }: SidebarProps): React.JSX.Element {
  const unreadCount = emails.filter((e) => !e.read && e.deletedAt === null).length
  const trashUnreadCount = emails.filter((e) => !e.read && e.deletedAt !== null).length
  const { value: hasDonated } = useSetting<boolean>('hasDonated')

  return (
    <aside className="w-[176px] bg-surface-base border-r border-border flex flex-col py-3 px-2 shrink-0 gap-[2px]">
      <NavButton
        label="Inbox"
        badge={unreadCount > 0 ? unreadCount : undefined}
        active={navItem === 'inbox'}
        onClick={() => onNavigate('inbox')}
        icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
          </svg>
        }
      />
      <NavButton
        label="Trash"
        badge={trashUnreadCount > 0 ? trashUnreadCount : undefined}
        active={navItem === 'trash'}
        onClick={() => onNavigate('trash')}
        icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        }
      />

      <div className="flex-1" />

      <div>
        {SHOW_SUPPORT_BUTTON && !hasDonated && (
          <div className="px-1 mb-2">
            <SupportButton variant="sidebar" />
          </div>
        )}
        <div className="border-t border-border mx-[2px]" />
        <p className="m-0 mb-3 pt-4 text-[16px] font-semibold text-fg-3 uppercase tracking-[0.16em] text-center">
          Theme
        </p>
        <div className="flex justify-center pb-4">
          <ThemePicker />
        </div>
      </div>
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
      className={clsx(
        'flex items-center gap-2 py-[7px] px-[10px] rounded-lg border-0 text-[13px] cursor-pointer w-full text-left transition-[background,color] duration-150',
        active
          ? 'bg-accent-soft text-accent font-semibold'
          : 'bg-transparent text-fg-2 font-normal hover:bg-surface-hover hover:text-fg-1'
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className="bg-grad text-fg-1 rounded-[10px] px-[6px] py-px text-[11px] font-semibold min-w-[18px] text-center">
          {badge}
        </span>
      )}
    </button>
  )
}
