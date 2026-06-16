import { useState } from 'react'
import { TableListView } from './TableListView'
import { FloorPlanCanvas } from '../FloorPlanCanvas'
import { useSeatingData } from './useSeatingData'
import type { SeatingTable, Guest } from '@/types'
import styles from './SeatingPage.module.css'

interface Props {
  eventId: string
}

export function SeatingPage({ eventId }: Props) {
  const [activeTab, setActiveTab] = useState<'list' | 'visual'>('list')
  const { tables, guests, setTables, setGuests } = useSeatingData(eventId)

  const handleTablesChange = (updated: SeatingTable[]) => {
    setTables(updated)
  }

  const handleGuestsChange = (updated: (Guest & { table_name?: string })[]) => {
    setGuests(updated)
  }

  return (
    <div className={styles.seatingPage}>
      <div className={styles.tabBar}>
        <button
          className={activeTab === 'list' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('list')}
        >
          Table List
        </button>
        <button
          className={activeTab === 'visual' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('visual')}
        >
          Visual Layout
        </button>
      </div>

      {activeTab === 'list' ? (
        <TableListView
          eventId={eventId}
          tables={tables}
          guests={guests}
          onTablesChange={handleTablesChange}
          onGuestsChange={handleGuestsChange}
        />
      ) : (
        <FloorPlanCanvas
          eventId={eventId}
          tables={tables}
          onTablesChange={handleTablesChange}
        />
      )}
    </div>
  )
}
