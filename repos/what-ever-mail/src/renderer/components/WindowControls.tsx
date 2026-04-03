import React, { useEffect, useState } from 'react'

export function WindowControls(): React.JSX.Element {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const unsub = window.api.window.onMaximizedChange(setIsMaximized)
    return unsub
  }, [])

  return (
    <div className="flex items-stretch h-full app-no-drag">
      {/* Minimize */}
      <button
        onClick={() => window.api.window.minimize()}
        className="w-11 h-full flex items-center justify-center text-fg-2 hover:bg-surface-2 hover:text-fg-1 transition-colors duration-100"
        title="Minimize"
      >
        <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
          <rect width="10" height="1" />
        </svg>
      </button>

      {/* Maximize / Restore */}
      <button
        onClick={() => window.api.window.maximizeToggle()}
        className="w-11 h-full flex items-center justify-center text-fg-2 hover:bg-surface-2 hover:text-fg-1 transition-colors duration-100"
        title={isMaximized ? 'Restore' : 'Maximize'}
      >
        {isMaximized ? (
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.1">
            <rect x="3" y="0.5" width="7" height="7" />
            <polyline points="0.5,3.5 0.5,10.5 7.5,10.5 7.5,7.5" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.1">
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        )}
      </button>

      {/* Close */}
      <button
        onClick={() => window.api.window.close()}
        className="w-11 h-full flex items-center justify-center text-fg-2 hover:bg-red-500 hover:text-white transition-colors duration-100"
        title="Close"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <line x1="0" y1="0" x2="10" y2="10" />
          <line x1="10" y1="0" x2="0" y2="10" />
        </svg>
      </button>
    </div>
  )
}
