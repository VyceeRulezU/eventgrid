import { useEffect, useRef } from 'react'

export function SkipLink({ href = '#main-content' }: { href?: string }) {
  const linkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && linkRef.current && !document.querySelector(':focus')) {
        linkRef.current.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <a
      ref={linkRef}
      href={href}
      className="skip-link"
      style={{
        position: 'absolute',
        top: '-100%',
        left: 0,
        zIndex: 10000,
        padding: '8px 16px',
        background: '#d4a017',
        color: '#111827',
        fontWeight: 600,
        fontSize: '14px',
        textDecoration: 'none',
        borderRadius: '0 0 4px 0',
        outline: 'none',
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '0'
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-100%'
      }}
    >
      Skip to content
    </a>
  )
}
