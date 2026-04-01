import React, { useEffect, useState } from 'react'

interface StatusBarProps {
  emailCount: number
}

export default function StatusBar({ emailCount }: StatusBarProps): React.JSX.Element {
  const [smtpRunning, setSmtpRunning] = useState(false)
  const [smtpPort, setSmtpPort] = useState(1025)

  useEffect(() => {
    const refresh = (): void => {
      window.api.smtp.getStatus().then(({ running, port }) => {
        setSmtpRunning(running)
        setSmtpPort(port)
      })
    }
    refresh()
    const id = setInterval(refresh, 5000)
    const handleStatusChange = (e: Event): void => {
      const { running, port } = (e as CustomEvent<{ running: boolean; port: number }>).detail
      setSmtpRunning(running)
      setSmtpPort(port)
    }
    window.addEventListener('smtp-status-changed', handleStatusChange)
    return () => {
      clearInterval(id)
      window.removeEventListener('smtp-status-changed', handleStatusChange)
    }
  }, [])

  return (
    <footer
      style={{
        height: 26,
        background: 'var(--bg-base)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: 16,
        fontSize: 11,
        color: 'var(--text-3)',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: smtpRunning ? '#10b981' : '#ef4444',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        SMTP :{smtpPort} {smtpRunning ? 'listening' : 'stopped'}
      </span>
      <span>{emailCount} email{emailCount !== 1 ? 's' : ''}</span>
    </footer>
  )
}
