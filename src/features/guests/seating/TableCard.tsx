import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Star, X, Pencil, Diamond as Crown, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { SeatingTable, Guest } from '@/types'
import styles from './TableCard.module.css'

interface Props {
  table: SeatingTable
  guests: (Guest & { table_name?: string })[]
  onUnassign: (guestId: string) => void
  onUpdateTable: (updates: Partial<SeatingTable>) => void
  onDeleteTable: () => void
}

function getOccupancyColor(seated: number, capacity: number): string {
  if (seated === 0) return 'var(--color-border)'
  if (seated > capacity) return 'var(--color-status-red)'
  if (seated === capacity) return 'var(--color-status-green)'
  return 'var(--color-status-yellow)'
}

const SHOW_LIMIT = 5

export function TableCard({ table, guests, onUnassign, onUpdateTable, onDeleteTable }: Props) {
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(table.table_name)
  const [menuOpen, setMenuOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const seated = guests.length
  const occColor = getOccupancyColor(seated, table.capacity)

  const saveName = async () => {
    const trimmed = nameValue.trim()
    if (trimmed && trimmed !== table.table_name) {
      const { error } = await supabase.from('seating_tables').update({ table_name: trimmed }).eq('id', table.id)
      if (!error) onUpdateTable({ table_name: trimmed })
    }
    setEditingName(false)
  }

  const toggleVip = async () => {
    const next = !table.is_vip
    await supabase.from('seating_tables').update({ is_vip: next }).eq('id', table.id)
    onUpdateTable({ is_vip: next })
    setMenuOpen(false)
  }

  const setCapacity = async () => {
    const input = prompt('New capacity:', String(table.capacity))
    if (!input) { setMenuOpen(false); return }
    const cap = parseInt(input, 10)
    if (isNaN(cap) || cap < 1) { setMenuOpen(false); return }
    await supabase.from('seating_tables').update({ capacity: cap }).eq('id', table.id)
    onUpdateTable({ capacity: cap })
    setMenuOpen(false)
  }

  const displayedGuests = expanded ? guests : guests.slice(0, SHOW_LIMIT)
  const remaining = guests.length - SHOW_LIMIT

  return (
    <div className={styles.card} style={{ borderLeftColor: occColor }}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          {table.is_vip && <Star size={12} className={styles.vipStar} />}
          {editingName ? (
            <input
              ref={inputRef}
              className={styles.nameInput}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setNameValue(table.table_name); setEditingName(false) } }}
              autoFocus
            />
          ) : (
            <button className={styles.tableName} onClick={() => { setNameValue(table.table_name); setEditingName(true) }} title="Click to rename">
              {table.table_name}
            </button>
          )}
          <span className={styles.occupancy}>{seated}/{table.capacity} seated</span>
        </div>
        <div className={styles.overflowMenu} ref={menuRef}>
          <button className={styles.menuBtn} onClick={() => setMenuOpen(!menuOpen)}><MoreVertical size={14} /></button>
          {menuOpen && (
            <div className={styles.menuDropdown}>
              <button className={styles.menuItem} onClick={() => { setNameValue(table.table_name); setEditingName(true); setMenuOpen(false); setTimeout(() => inputRef.current?.focus(), 0) }}>
                <Pencil size={12} /> Rename
              </button>
              <button className={styles.menuItem} onClick={toggleVip}>
                <Crown size={12} /> {table.is_vip ? 'Remove VIP' : 'Set as VIP'}
              </button>
              <button className={styles.menuItem} onClick={setCapacity}>
                <Pencil size={12} /> Set Capacity
              </button>
              <button className={`${styles.menuItem} ${styles.menuDanger}`} onClick={() => { if (confirm(`Delete ${table.table_name}?`)) onDeleteTable(); setMenuOpen(false) }}>
                <Trash2 size={12} /> Delete Table
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.guestList}>
        {guests.length === 0 ? (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', padding: '4px 0' }}>No guests assigned</span>
        ) : (
          <>
            {displayedGuests.map((g) => (
              <div key={g.id} className={styles.guestRow}>
                <span className={styles.guestName}>
                  {g.is_vip && <span className={styles.vipDot}>★</span>}
                  {g.first_name} {g.last_name || ''}
                </span>
                <button className={styles.unassignBtn} onClick={() => onUnassign(g.id)} title="Unassign"><X size={12} /></button>
              </div>
            ))}
            {remaining > 0 && !expanded && (
              <button className={styles.expandToggle} onClick={() => setExpanded(true)}>+{remaining} more</button>
            )}
            {expanded && remaining > 0 && (
              <button className={styles.expandToggle} onClick={() => setExpanded(false)}>Show less</button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
