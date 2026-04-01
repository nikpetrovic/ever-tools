import React, { useRef, useEffect } from 'react'
import DOMPurify from 'dompurify'

interface HtmlViewProps {
  html: string
}

export default function HtmlView({ html }: HtmlViewProps): React.JSX.Element {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const clean = DOMPurify.sanitize(html, {
      ADD_TAGS: ['style'],
      ADD_ATTR: ['target', 'rel'],
    })

    const doc = iframe.contentDocument
    if (!doc) return

    doc.open()
    doc.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'unsafe-inline'; img-src data: cid:;">
      <style>
        body { font-family: sans-serif; margin: 0; padding: 16px; font-size: 14px; line-height: 1.6; }
      </style>
    </head><body>${clean}</body></html>`)
    doc.close()
  }, [html])

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-same-origin"
      referrerPolicy="no-referrer"
      className="w-full h-full border-0 block"
      title="Email HTML preview"
    />
  )
}
