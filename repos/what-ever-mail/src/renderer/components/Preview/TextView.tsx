import React from 'react'

interface TextViewProps {
  text: string
}

export default function TextView({ text }: TextViewProps): React.JSX.Element {
  return (
    <pre
      style={{
        margin: 0,
        padding: 20,
        fontFamily: 'IBM Plex Mono, Fira Code, monospace',
        fontSize: 12,
        lineHeight: 1.7,
        color: 'var(--text-1)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowY: 'auto',
        height: '100%',
      }}
    >
      {text}
    </pre>
  )
}
