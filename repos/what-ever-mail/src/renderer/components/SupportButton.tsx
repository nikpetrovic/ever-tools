import React from 'react'
import { KO_FI_DONATION_URL } from '../config'

interface SupportButtonProps {
  variant?: 'sidebar' | 'settings'
}

export function SupportButton({ variant = 'sidebar' }: SupportButtonProps): React.JSX.Element {
  const handleClick = (): void => {
    window.api.shell.openExternal(KO_FI_DONATION_URL)
  }

  if (variant === 'settings') {
    return (
      <button
        onClick={handleClick}
        className="text-left text-sm text-accent hover:text-accent py-1 bg-transparent border border-border cursor-pointer rounded-md px-3"
      >
        ♥ Support our work →
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="w-full text-xs font-medium text-fg-2 hover:text-accent transition-colors py-2 px-3 rounded-md hover:bg-surface-hover text-left bg-transparent border border-border cursor-pointer"
    >
      ♥ Support our work
    </button>
  )
}
