import React from 'react'

interface SearchBoxProps {
  value: string
  onChange: (v: string) => void
}

export default function SearchBox({ value, onChange }: SearchBoxProps): React.JSX.Element {
  return (
    <div
      style={{
        padding: '10px 12px 8px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg-hover)',
          borderRadius: 8,
          padding: '6px 10px',
          border: '1px solid var(--border)',
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-3)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            width: '100%',
            fontFamily: 'inherit',
            fontSize: 12,
            color: 'var(--text-1)',
          }}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-3)',
              padding: 0,
              lineHeight: 1,
              fontSize: 14,
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
