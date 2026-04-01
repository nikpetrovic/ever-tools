import React, { useEffect, useState } from 'react'
import clsx from 'clsx'

type Theme = 'ember' | 'midnight' | 'jade' | 'rose' | 'azure'

const THEMES: { id: Theme; color: string; label: string }[] = [
  { id: 'ember',    color: '#f97316', label: 'Ember'    },
  { id: 'midnight', color: '#6366f1', label: 'Midnight' },
  { id: 'jade',     color: '#10b981', label: 'Jade'     },
  { id: 'rose',     color: '#f43f5e', label: 'Rose'     },
  { id: 'azure',    color: '#0ea5e9', label: 'Azure'    },
]

export default function ThemePicker(): React.JSX.Element {
  const [active, setActive] = useState<Theme>('ember')

  useEffect(() => {
    window.api.settings.get<Theme>('theme').then((t) => {
      const theme = t ?? 'ember'
      setActive(theme)
      document.documentElement.setAttribute('data-theme', theme)
    })
  }, [])

  function handleSelect(theme: Theme): void {
    setActive(theme)
    document.documentElement.setAttribute('data-theme', theme)
    window.api.settings.set('theme', theme)
  }

  return (
    <div className="flex gap-2 px-1">
      {THEMES.map(({ id, color, label }) => (
        <button
          key={id}
          title={label}
          onClick={() => handleSelect(id)}
          className={clsx('w-[18px] h-[18px] rounded-full cursor-pointer p-0 transition-transform duration-150', {
            'scale-[1.2]': active === id,
          })}
          style={{
            background: color,
            border: active === id ? `2px solid ${color}` : '2px solid transparent',
            outline: active === id ? `2px solid var(--border)` : 'none',
            outlineOffset: 2,
          }}
        />
      ))}
    </div>
  )
}
