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
    const menuHeight = 200
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const top = spaceBelow < menuHeight && spaceAbove > spaceBelow
      ? rect.top - menuHeight - 4
      : rect.bottom + 4
    let left = align === 'end' ? rect.right : rect.left
    let transform = align === 'end' ? 'translateX(-100%)' : 'none'

    if (left + 200 > window.innerWidth) {
      left = window.innerWidth - 16
      transform = 'translateX(-100%)'
    }
    if (left < 8) {
      left = 8
      transform = 'none'
    }

    setMenuStyle({
      position: 'fixed',
      top,
      left,
      transform,
      minWidth: Math.max(rect.width, 160),
      maxHeight: Math.min(menuHeight, Math.max(spaceBelow - 8, spaceAbove - 8, 120)),
      overflowY: 'auto',
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
