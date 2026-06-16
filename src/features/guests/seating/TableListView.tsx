import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TableCard } from './TableCard'
import { GuestAssignmentPanel } from './GuestAssignmentPanel'
import type { SeatingTable, Guest } from '@/types'
import styles from './TableListView.module.css'

interface Props {
  eventId: string
  tables: SeatingTable[]
  guests: (Guest & { table_name?: string })[]
  onTablesChange: (tables: SeatingTable[]) => void
  onGuestsChange: (guests: (Guest & { table_name?: string })[]) => void
}

export function TableListView({ eventId, tables, guests, onTablesChange, onGuestsChange }: Props) {
  const unassignedGuests = guests.filter(g => !g.table_id)

  async function addTable() {
    const count = tables.length + 1
    const { data } = await supabase
      .from('seating_tables')
      .insert({ event_id: eventId, table_name: `Table ${count}`, capacity: 8 })
      .select('*')
      .single()
    if (data) onTablesChange([...tables, data as unknown as SeatingTable])
  }

  async function unassignGuest(guestId: string) {
    await supabase.from('guests').update({ table_id: null }).eq('id', guestId)
    onGuestsChange(guests.map((g) => g.id === guestId ? { ...g, table_id: null, table_name: undefined } : g))
  }

  function updateTable(tableId: string, updates: Partial<SeatingTable>) {
    onTablesChange(tables.map((t) => t.id === tableId ? { ...t, ...updates } : t))
  }

  async function deleteTable(tableId: string) {
    await supabase.from('seating_tables').delete().eq('id', tableId)
    await supabase.from('guests').update({ table_id: null }).eq('table_id', tableId)
    onTablesChange(tables.filter((t) => t.id !== tableId))
    onGuestsChange(guests.map((g) => g.table_id === tableId ? { ...g, table_id: null, table_name: undefined } : g))
  }

  function assignGuest(guestId: string, tableId: string) {
    onGuestsChange(guests.map((g) => g.id === guestId ? { ...g, table_id: tableId } : g))
  }

  return (
    <div className={styles.listViewGrid}>
      <div className={styles.tablesColumn}>
        <div className={styles.columnHeader}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: 0 }}>Tables ({tables.length})</h3>
          <button className="btn btn-secondary btn-sm" onClick={addTable}>
            <Plus size={14} /> Add Table
          </button>
        </div>
        {tables.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-1)' }}>No tables yet</div>
            <div style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-3)' }}>Add your first table to start assigning guests.</div>
            <button className="btn btn-primary btn-sm" onClick={addTable}><Plus size={14} /> Add Table</button>
          </div>
        ) : (
          <div className={styles.tableList}>
            {tables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                guests={guests.filter(g => g.table_id === table.id)}
                onUnassign={(guestId) => unassignGuest(guestId)}
                onUpdateTable={(updates) => updateTable(table.id, updates)}
                onDeleteTable={() => deleteTable(table.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className={styles.guestsColumn}>
        <GuestAssignmentPanel
          unassignedGuests={unassignedGuests}
          tables={tables}
          onAssign={assignGuest}
        />
      </div>
    </div>
  )
}
