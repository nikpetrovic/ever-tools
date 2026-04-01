import React from 'react'

interface SearchBoxProps {
  value: string
  onChange: (v: string) => void
}

export default function SearchBox({ value, onChange }: SearchBoxProps): React.JSX.Element {
  return (
    <div className="pt-[10px] px-3 pb-2 border-b border-border shrink-0">
      <div className="flex items-center gap-2 bg-surface-hover rounded-lg px-[10px] py-[6px] border border-border">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-3)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent border-0 outline-none w-full text-xs text-fg-1"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="bg-transparent border-0 cursor-pointer text-fg-3 p-0 leading-none text-sm"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
