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
    return () => clearInterval(id)
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
      <span
        style={{ color: smtpRunning ? 'var(--accent, #10b981)' : '#ef4444' }}
      >
        ● SMTP :{smtpPort} {smtpRunning ? 'listening' : 'stopped'}
      </span>
      <span>{emailCount} email{emailCount !== 1 ? 's' : ''}</span>
    </footer>
  )
}
