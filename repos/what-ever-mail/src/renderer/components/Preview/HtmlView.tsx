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

    // Extract ALL <style> contents before DOMPurify runs — it strips @keyframes,
    // animation properties, and @import, breaking animated email templates.
    // Injecting directly into <head> bypasses that sanitization.
    const rawStyles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
      .map(m => m[1])
      .join('\n')

    // Sanitize only the HTML markup; style tags are stripped here (already extracted above)
    const clean = DOMPurify.sanitize(html, {
      FORBID_TAGS: ['style'],
      ADD_ATTR: ['target', 'rel'],
    })

    const doc = iframe.contentDocument
    if (!doc) return

    doc.open()
    doc.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data: cid:;">
      <style>body { font-family: 'Poppins', system-ui, -apple-system, sans-serif; }</style>
      <style>${rawStyles}</style>
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
