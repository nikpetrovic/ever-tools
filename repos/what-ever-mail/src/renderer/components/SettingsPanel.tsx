import React, { useState, useEffect } from 'react'
import { useClearEmails } from '../hooks/useEmails'

interface SettingsPanelProps {
  onClose: () => void
}

export default function SettingsPanel({ onClose }: SettingsPanelProps): React.JSX.Element {
  const clearEmails = useClearEmails()
  const [port, setPort] = useState(1025)
  const [smtpStatus, setSmtpStatus] = useState<{ running: boolean; port: number } | null>(null)
  const [restarting, setRestarting] = useState(false)
  const [stopping, setStopping] = useState(false)

  useEffect(() => {
    window.api.settings.get<number>('smtpPort').then((p) => setPort(p ?? 1025))
    window.api.smtp.getStatus().then(setSmtpStatus)
  }, [])

  function broadcastStatus(status: { running: boolean; port: number }): void {
    window.dispatchEvent(new CustomEvent('smtp-status-changed', { detail: status }))
  }

  async function handleRestartSmtp(): Promise<void> {
    setRestarting(true)
    await window.api.smtp.restart(port)
    const status = await window.api.smtp.getStatus()
    setSmtpStatus(status)
    broadcastStatus(status)
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
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: 'var(--bg-panel)',
          borderRadius: 12,
          border: '1px solid var(--border)',
          width: 400,
          boxShadow: 'var(--shadow)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Settings</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-2)',
              fontSize: 18,
              lineHeight: 1,
              padding: 2,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* SMTP Port */}
          <Section label="SMTP Server">
            {/* Port + status indicator row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--text-2)', width: 36 }}>Port</label>
              <input
                type="number"
                value={port}
                min={1}
                max={65535}
                onChange={(e) => setPort(Number(e.target.value))}
                style={{
                  width: 80,
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 12,
                  color: 'var(--text-1)',
                  outline: 'none',
                }}
              />
              {smtpStatus && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    border: `1px solid ${smtpStatus.running ? '#10b981' : '#ef4444'}`,
                    borderRadius: 20,
                    padding: '3px 8px',
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#888',
                    letterSpacing: '0.04em',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: smtpStatus.running ? '#10b981' : '#ef4444',
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  {smtpStatus.running ? 'LISTENING' : 'STOPPED'}
                </div>
              )}
            </div>
            {/* Action buttons row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 44 }}>
              <button
                className="btn-primary"
                onClick={handleRestartSmtp}
                disabled={restarting || stopping}
                style={{ opacity: restarting ? 0.6 : 1, minWidth: 72, textAlign: 'center' }}
              >
                {restarting ? 'Starting…' : smtpStatus?.running ? 'Restart' : 'Start'}
              </button>
              <button
                className="btn-ghost"
                onClick={handleStopSmtp}
                disabled={stopping || restarting || !smtpStatus?.running}
                style={{ opacity: (stopping || !smtpStatus?.running) ? 0.5 : 1, minWidth: 72, textAlign: 'center' }}
              >
                {stopping ? 'Stopping…' : 'Stop'}
              </button>
            </div>
          </Section>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0' }} />

          {/* Data */}
          <Section label="Data">
            <button
              className="btn-ghost"
              onClick={handleClearAll}
              style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
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
    <div style={{ marginBottom: 4 }}>
      <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
      {children}
    </div>
  )
}
