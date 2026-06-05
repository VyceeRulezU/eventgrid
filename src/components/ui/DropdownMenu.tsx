import { useState, useRef, useEffect, type ReactNode } from 'react'
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
}

export function DropdownMenu({ trigger, items, onSelect, align = 'start', className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`${styles.wrapper} ${className || ''}`} ref={ref}>
      <button className={styles.trigger} onClick={() => setOpen(!open)} type="button">
        {trigger}
        <ChevronDown size={14} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </button>
      {open && (
        <div className={`${styles.menu} ${align === 'end' ? styles.menuEnd : ''}`}>
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
        </div>
      )}
    </div>
  )
}
