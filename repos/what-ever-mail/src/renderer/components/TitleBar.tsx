import React, { useEffect, useState } from 'react'

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
      style={{
        height: 44,
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: isMac ? '0 16px 0 80px' : '0 16px',
        gap: 12,
        WebkitAppRegion: 'drag',
        flexShrink: 0,
        userSelect: 'none',
        position: 'relative',
      } as React.CSSProperties}
    >
      {/* Wordmark — horizontally centered */}
      <span
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: '-0.4px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        } as React.CSSProperties}
      >
        <span style={{ color: 'var(--text-1)' }}>What </span>
        <span style={{ color: 'var(--accent, #f97316)' }}>Ever</span>
        <span style={{ color: 'var(--text-1)' }}> Mail</span>
      </span>

      <div style={{ flex: 1 }} />

      {/* SMTP status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          border: `1px solid ${smtp.running ? '#10b981' : '#ef4444'}`,
          borderRadius: 20,
          padding: '3px 10px',
          fontSize: 11,
          fontWeight: 500,
          color: '#888',
          letterSpacing: '0.04em',
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: smtp.running ? '#10b981' : '#ef4444',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        SMTP :{smtp.port}
      </div>

      {/* Settings icon */}
      <button
        onClick={onSettingsClick}
        title="Settings"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-2)',
          padding: 4,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          WebkitAppRegion: 'no-drag',
          transition: 'color 0.15s',
        } as React.CSSProperties}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-1)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-2)')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
    </header>
  )
}
