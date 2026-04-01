import React from 'react'

interface HeadersViewProps {
  headers: Record<string, string>
}

export default function HeadersView({ headers }: HeadersViewProps): React.JSX.Element {
  const entries = Object.entries(headers).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="overflow-y-auto h-full py-2">
      <table className="w-full border-collapse text-xs">
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key} className="border-b border-border">
              <td className="py-[5px] px-4 font-mono font-medium text-accent whitespace-nowrap align-top w-[220px]">
                {key}
              </td>
              <td className="py-[5px] pr-4 font-mono text-fg-2 break-all">
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
