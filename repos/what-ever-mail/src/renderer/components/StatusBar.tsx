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
    <footer className="h-[26px] bg-surface-base border-t border-border flex items-center px-[14px] gap-4 text-[11px] text-fg-3 shrink-0 select-none">
      <span className="flex items-center gap-[5px]">
        <span className={`w-[6px] h-[6px] rounded-full inline-block shrink-0 ${smtpRunning ? 'bg-emerald-500' : 'bg-red-500'}`} />
        SMTP :{smtpPort} {smtpRunning ? 'listening' : 'stopped'}
      </span>
      <span>{emailCount} email{emailCount !== 1 ? 's' : ''}</span>
    </footer>
  )
}
