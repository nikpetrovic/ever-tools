import React from 'react'

interface SourceViewProps {
  raw: string
}

export default function SourceView({ raw }: SourceViewProps): React.JSX.Element {
  return (
    <pre
      style={{
        margin: 0,
        padding: 20,
        fontFamily: 'IBM Plex Mono, Fira Code, monospace',
        fontSize: 11,
        lineHeight: 1.65,
        color: 'var(--text-2)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        overflowY: 'auto',
        height: '100%',
      }}
    >
      {raw}
    </pre>
  )
}
