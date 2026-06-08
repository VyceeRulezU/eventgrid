import { Search, X } from 'lucide-react'
import type { CSSProperties } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  containerStyle?: CSSProperties
  autoFocus?: boolean
}

export function SearchBar({ value, onChange, placeholder = 'Search...', containerStyle, autoFocus }: SearchBarProps) {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 320, ...containerStyle }}>
      <Search
        size={16}
        style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--color-text-muted)',
          pointerEvents: 'none',
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: '100%',
          padding: '8px 36px 8px 36px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-base)',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--text-sm)',
          outline: 'none',
          fontFamily: 'var(--font-base)',
          boxSizing: 'border-box',
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            display: 'flex',
            padding: 4,
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
