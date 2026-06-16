import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Guest, SeatingTable } from '@/types'

interface SeatingData {
  tables: SeatingTable[]
  guests: (Guest & { table_name?: string })[]
  loading: boolean
  setTables: (tables: SeatingTable[]) => void
  setGuests: (guests: (Guest & { table_name?: string })[]) => void
  reload: () => void
}

export function useSeatingData(eventId: string): SeatingData {
  const [tables, setTables] = useState<SeatingTable[]>([])
  const [guests, setGuests] = useState<(Guest & { table_name?: string })[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (!eventId) return
    setLoading(true)
    Promise.all([
      supabase.from('guests').select('*').eq('event_id', eventId).order('created_at'),
      supabase.from('seating_tables').select('*').eq('event_id', eventId).order('table_name'),
    ]).then(([gRes, tRes]) => {
      setGuests((gRes.data || []) as unknown as (Guest & { table_name?: string })[])
      setTables((tRes.data || []) as unknown as SeatingTable[])
      setLoading(false)
    })
  }, [eventId])

  useEffect(() => { load() }, [load])

  return { tables, guests, loading, setTables, setGuests, reload: load }
}
