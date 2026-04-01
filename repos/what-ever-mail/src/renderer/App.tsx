import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import StatusBar from './components/StatusBar'
import EmailList from './components/EmailList/EmailList'
import Preview from './components/Preview/Preview'
import { useUiStore } from './store/ui'
import { useEmails } from './hooks/useEmails'
import SettingsPanel from './components/SettingsPanel'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: Infinity } },
})

function AppInner(): React.JSX.Element {
  const { selectedEmailId, navItem, searchQuery, selectEmail, navigate, setSearchQuery } = useUiStore()
  const { emails } = useEmails()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const selectedEmail = emails.find((e) => e.id === selectedEmailId) ?? null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--bg-base)',
        color: 'var(--text-1)',
      }}
    >
      <TitleBar onSettingsClick={() => setSettingsOpen(!settingsOpen)} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar navItem={navItem} emails={emails} onNavigate={navigate} />

        <EmailList
          emails={emails}
          navItem={navItem}
          selectedId={selectedEmailId}
          searchQuery={searchQuery}
          onSelect={selectEmail}
          onSearchChange={setSearchQuery}
        />

        <Preview email={selectedEmail} />
      </div>

      <StatusBar emailCount={emails.length} />

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}

export default function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  )
}
