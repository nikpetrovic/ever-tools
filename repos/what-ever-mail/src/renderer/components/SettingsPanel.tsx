import React, { useState, useEffect } from 'react'
import clsx from 'clsx'
import { useClearEmails } from '../hooks/useEmails'

interface SettingsPanelProps {
  onClose: () => void
}

type SmtpStatus = { running: boolean; port: number; host: string; error: string | null }

export default function SettingsPanel({ onClose }: SettingsPanelProps): React.JSX.Element {
  const clearEmails = useClearEmails()
  const [port, setPort] = useState(1025)
  const [host, setHost] = useState('127.0.0.1')
  const [smtpStatus, setSmtpStatus] = useState<SmtpStatus | null>(null)
  const [smtpError, setSmtpError] = useState<string | null>(null)
  const [restarting, setRestarting] = useState(false)
  const [stopping, setStopping] = useState(false)

  useEffect(() => {
    window.api.settings.get<number>('smtpPort').then((p) => setPort(p ?? 1025))
    window.api.settings.get<string>('smtpHost').then((h) => setHost(h ?? '127.0.0.1'))
    window.api.smtp.getStatus().then(setSmtpStatus)
  }, [])

  function broadcastStatus(status: SmtpStatus): void {
    window.dispatchEvent(new CustomEvent('smtp-status-changed', { detail: status }))
  }

  async function handleRestartSmtp(): Promise<void> {
    setRestarting(true)
    await window.api.smtp.restart(port, host)
    const status = await window.api.smtp.getStatus()
    setSmtpStatus(status)
    broadcastStatus(status)
    setSmtpError(status.running ? null : (status.error ?? 'Failed to start'))
    setRestarting(false)
  }

  async function handleStopSmtp(): Promise<void> {
    setStopping(true)
    await window.api.smtp.stop()
    const status = await window.api.smtp.getStatus()
    setSmtpStatus(status)
    broadcastStatus(status)
    setStopping(false)
  }

  async function handleClearAll(): Promise<void> {
    if (!confirm('Delete all captured emails?')) return
    await clearEmails()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-surface-panel rounded-xl border border-border w-[480px] shadow-panel overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="m-0 text-sm font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="bg-transparent border-0 cursor-pointer text-fg-2 text-lg leading-none p-[2px]"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          {/* SMTP Server */}
          <Section label="SMTP Server">
            {/* Host row */}
            <div className="flex items-center gap-2 mb-[10px]">
              <label className="text-xs text-fg-2 w-9">Host</label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="w-36 bg-surface-hover border border-border rounded-md px-2 py-1 font-mono text-xs text-fg-1 outline-none"
                placeholder="127.0.0.1"
                spellCheck={false}
              />
            </div>
            {/* Port + status indicator row */}
            <div className="flex items-center gap-2 mb-[10px]">
              <label className="text-xs text-fg-2 w-9">Port</label>
              <input
                type="number"
                value={port}
                min={1}
                max={65535}
                onChange={(e) => setPort(Number(e.target.value))}
                className="w-20 bg-surface-hover border border-border rounded-md px-2 py-1 font-mono text-xs text-fg-1 outline-none"
              />
              {smtpStatus && (
                <div
                  className={clsx(
                    'flex items-center gap-[5px] rounded-[20px] px-2 py-[3px] text-[11px] font-medium text-[#888] tracking-[0.04em] border',
                    smtpStatus.running ? 'border-emerald-500' : 'border-red-500'
                  )}
                >
                  <span className={`w-[6px] h-[6px] rounded-full inline-block shrink-0 ${smtpStatus.running ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {smtpStatus.running ? 'LISTENING' : 'STOPPED'}
                </div>
              )}
            </div>
            {/* Action buttons row */}
            <div className="flex items-center gap-2 ml-11">
              <button
                className={clsx('btn-primary min-w-[72px] text-center', { 'opacity-60': restarting })}
                onClick={handleRestartSmtp}
                disabled={restarting || stopping}
              >
                {restarting ? 'Starting…' : smtpStatus?.running ? 'Restart' : 'Start'}
              </button>
              <button
                className={clsx('btn-ghost min-w-[72px] text-center', { 'opacity-50': stopping || !smtpStatus?.running })}
                onClick={handleStopSmtp}
                disabled={stopping || restarting || !smtpStatus?.running}
              >
                {stopping ? 'Stopping…' : 'Stop'}
              </button>
            </div>
            {/* Error message */}
            {smtpError && (
              <p className="mt-[10px] ml-11 text-[11px] text-red-400 leading-snug">
                ⚠ {smtpError}
              </p>
            )}
          </Section>

          {/* Divider */}
          <div className="border-t border-border my-4" />

          {/* Data */}
          <Section label="Data">
            <button
              className="btn-ghost text-red-500 border-red-500/30"
              onClick={handleClearAll}
            >
              Clear all emails
            </button>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="mb-1">
      <p className="m-0 mb-[10px] text-[11px] font-semibold text-fg-3 uppercase tracking-[0.06em]">
        {label}
      </p>
      {children}
    </div>
  )
}
