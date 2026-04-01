import React from 'react'

interface TextViewProps {
  text: string
}

export default function TextView({ text }: TextViewProps): React.JSX.Element {
  return (
    <pre className="m-0 p-5 font-mono text-xs leading-[1.7] text-fg-1 whitespace-pre-wrap break-words overflow-y-auto h-full">
      {text}
    </pre>
  )
}
