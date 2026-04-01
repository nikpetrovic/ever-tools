import React from 'react'

interface HeadersViewProps {
  headers: Record<string, string>
}

export default function HeadersView({ headers }: HeadersViewProps): React.JSX.Element {
  const entries = Object.entries(headers).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '8px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <tbody>
          {entries.map(([key, value]) => (
            <tr
              key={key}
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <td
                style={{
                  padding: '5px 16px',
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontWeight: 500,
                  color: 'var(--accent, #f97316)',
                  whiteSpace: 'nowrap',
                  verticalAlign: 'top',
                  width: 220,
                }}
              >
                {key}
              </td>
              <td
                style={{
                  padding: '5px 16px 5px 0',
                  fontFamily: 'IBM Plex Mono, monospace',
                  color: 'var(--text-2)',
                  wordBreak: 'break-all',
                }}
              >
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
