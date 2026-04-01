import React, { useState } from 'react'
import type { EmailRecord } from '../../types/email'
import PreviewHeader, { type PreviewTab } from './PreviewHeader'
import HtmlView from './HtmlView'
import TextView from './TextView'
import SourceView from './SourceView'
import HeadersView from './HeadersView'
import { useDeleteEmail } from '../../hooks/useEmails'

interface PreviewProps {
  email: EmailRecord | null
}

export default function Preview({ email }: PreviewProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<PreviewTab>('html')
  const deleteEmail = useDeleteEmail()

  if (!email) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-3)',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.3 }}
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        <p style={{ margin: 0, fontSize: 12 }}>Select an email to preview</p>
      </div>
    )
  }

  // Pick the best default tab based on content
  const effectiveTab: PreviewTab =
    activeTab === 'html' && !email.html
      ? email.text
        ? 'text'
        : 'source'
      : activeTab

  return (
    <div
      style={{
        flex: 1,
        background: 'var(--bg-panel)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      <PreviewHeader
        email={email}
        activeTab={effectiveTab}
        onTabChange={setActiveTab}
        onDelete={() => deleteEmail(email.id)}
      />

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {effectiveTab === 'html' && email.html && <HtmlView html={email.html} />}
        {effectiveTab === 'text' && <TextView text={email.text ?? '(no plain text)'} />}
        {effectiveTab === 'source' && <SourceView raw={email.raw} />}
        {effectiveTab === 'headers' && <HeadersView headers={email.headers} />}
      </div>
    </div>
  )
}
