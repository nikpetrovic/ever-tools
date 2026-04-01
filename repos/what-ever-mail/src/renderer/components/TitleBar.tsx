import React, { useEffect, useState } from 'react'
import clsx from 'clsx'

interface SmtpStatus {
  running: boolean
  port: number
}

interface TitleBarProps {
  onSettingsClick: () => void
}

export default function TitleBar({ onSettingsClick }: TitleBarProps): React.JSX.Element {
  const [smtp, setSmtp] = useState<SmtpStatus>({ running: false, port: 1025 })
  const isMac = navigator.platform.includes('Mac')

  useEffect(() => {
    window.api.smtp.getStatus().then(setSmtp)
    const interval = setInterval(() => {
      window.api.smtp.getStatus().then(setSmtp)
    }, 5000)
    const handleStatusChange = (e: Event): void => {
      setSmtp((e as CustomEvent<SmtpStatus>).detail)
    }
    window.addEventListener('smtp-status-changed', handleStatusChange)
    return () => {
      clearInterval(interval)
      window.removeEventListener('smtp-status-changed', handleStatusChange)
    }
  }, [])

  return (
    <header
      className={clsx(
        'h-11 bg-surface-panel border-b border-accent flex items-center gap-3 shrink-0 select-none relative app-drag',
        isMac ? 'pl-20 pr-4' : 'px-4'
      )}
    >
      {/* Wordmark — horizontally centered */}
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-[15px] tracking-[-0.4px] whitespace-nowrap pointer-events-none">
        <span className="text-fg-1">What </span>
        <span className="text-accent">Ever</span>
        <span className="text-fg-1"> Mail</span>
      </span>

      <div className="flex-1" />

      {/* SMTP status */}
      <div
        className={clsx(
          'flex items-center gap-[5px] rounded-[20px] px-[10px] py-[3px] text-[11px] font-medium text-[#888] tracking-[0.04em] app-no-drag border',
          smtp.running ? 'border-emerald-500' : 'border-red-500'
        )}
      >
        <span className={`w-[6px] h-[6px] rounded-full inline-block shrink-0 ${smtp.running ? 'bg-emerald-500' : 'bg-red-500'}`} />
        SMTP :{smtp.port}
      </div>

      {/* Settings icon */}
      <button
        onClick={onSettingsClick}
        title="Settings"
        className="bg-transparent border-0 cursor-pointer text-fg-2 p-1 rounded-md flex items-center app-no-drag transition-colors duration-150 hover:text-fg-1"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </header>
  )
}
