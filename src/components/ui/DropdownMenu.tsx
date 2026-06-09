import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import styles from './DropdownMenu.module.css'

export interface DropdownItem {
  label: string
  value: string
  icon?: ReactNode
  disabled?: boolean
  danger?: boolean
}

interface DropdownMenuProps {
  trigger: ReactNode
  items: DropdownItem[]
  onSelect: (item: DropdownItem) => void
  align?: 'start' | 'end'
  className?: string
  disabled?: boolean
}

export function DropdownMenu({ trigger, items, onSelect, align = 'start', className, disabled }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: align === 'end' ? rect.right : rect.left,
      transform: align === 'end' ? 'translateX(-100%)' : 'none',
      minWidth: rect.width,
      zIndex: 9999,
    })
  }, [align])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      const insideWrapper = ref.current?.contains(target)
      const insideMenu = menuRef.current?.contains(target)
      if (!insideWrapper && !insideMenu) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open) {
      updatePosition()
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [open, updatePosition])

  return (
    <div className={`${styles.wrapper} ${className || ''}`} ref={ref}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        onClick={() => { if (!disabled) { setOpen(!open); if (!open) setTimeout(updatePosition, 0) } }}
        disabled={disabled}
        type="button"
      >
        {trigger}
        <ChevronDown size={14} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </button>
      {open && createPortal(
        <div ref={menuRef} className={`${styles.menu} ${align === 'end' ? styles.menuEndPortal : ''}`} style={menuStyle}>
          {items.map((item) => (
            <button
              key={item.value}
              className={`${styles.item} ${item.danger ? styles.itemDanger : ''}`}
              disabled={item.disabled}
              onClick={() => {
                onSelect(item)
                setOpen(false)
              }}
              type="button"
            >
              {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
