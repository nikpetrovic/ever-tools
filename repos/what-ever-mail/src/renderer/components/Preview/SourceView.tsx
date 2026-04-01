import React from 'react'

interface SourceViewProps {
  raw: string
}

export default function SourceView({ raw }: SourceViewProps): React.JSX.Element {
  return (
    <pre className="m-0 p-5 font-mono text-[11px] leading-[1.65] text-fg-2 whitespace-pre-wrap break-all overflow-y-auto h-full">
      {raw}
    </pre>
  )
}
