import { useState, useMemo } from 'react'
import { CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SearchBar } from '@/components/shared/SearchBar'
import type { SeatingTable, Guest } from '@/types'
import styles from './GuestAssignmentPanel.module.css'

interface Props {
  unassignedGuests: (Guest & { table_name?: string })[]
  tables: SeatingTable[]
  onAssign: (guestId: string, tableId: string) => void
}

export function GuestAssignmentPanel({ unassignedGuests, tables, onAssign }: Props) {
  const [search, setSearch] = useState('')
  const [openGuestId, setOpenGuestId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return unassignedGuests
    const q = search.toLowerCase()
    return unassignedGuests.filter(
      (g) => g.first_name.toLowerCase().includes(q) || (g.last_name || '').toLowerCase().includes(q)
    )
  }, [unassignedGuests, search])

  const handleAssign = async (guestId: string, tableId: string) => {
    await supabase.from('guests').update({ table_id: tableId }).eq('id', guestId)
    onAssign(guestId, tableId)
    setOpenGuestId(null)
  }

  if (unassignedGuests.length === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.emptyState}>
          <CheckCircle size={32} />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>All guests are seated</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Unassigned Guests ({unassignedGuests.length})</span>
        <div className={styles.searchInput}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search name..." containerStyle={{ width: '100%' }} />
        </div>
      </div>
      <div className={styles.guestList}>
        {filtered.length === 0 ? (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', padding: 'var(--space-4)', textAlign: 'center' }}>No guests match</span>
        ) : (
          filtered.map((g) => (
            <div key={g.id} className={styles.guestRow}>
              <div className={styles.guestRowContent}>
                <span className={styles.guestInfo}>
                  {g.is_vip && <span className={styles.vipTag}>★ VIP</span>}
                  {g.first_name} {g.last_name || ''}
                </span>
                <button
                  className={styles.assignBtn}
                  onClick={() => setOpenGuestId(openGuestId === g.id ? null : g.id)}
                >
                  {openGuestId === g.id ? 'Close' : 'Assign'}
                </button>
              </div>
              {openGuestId === g.id && (
                <div className={styles.tableGrid}>
                  {tables.map((t) => (
                    <button
                      key={t.id}
                      className={styles.tableOption}
                      onClick={() => handleAssign(g.id, t.id)}
                    >
                      {t.table_name} (cap. {t.capacity})
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
