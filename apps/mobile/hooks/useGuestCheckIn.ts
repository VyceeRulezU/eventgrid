import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '@naligrid/shared'

type Guest = Database['public']['Tables']['guests']['Row']

export function useGuestCheckIn(eventId: string) {
  const [guests, setGuests] = useState<Guest[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const fetchGuests = useCallback(async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('guests')
      .select('*')
      .eq('event_id', eventId)
      .order('first_name')
    if (data) setGuests(data)
    setIsLoading(false)
  }, [eventId])

  useEffect(() => {
    fetchGuests()
  }, [fetchGuests])

  const checkIn = useCallback(async (guestId: string) => {
    await supabase
      .from('guests')
      .update({ checked_in: true, checked_in_at: new Date().toISOString() } as any)
      .eq('id', guestId)
    setGuests(prev => prev.map(g => g.id === guestId ? { ...g, checked_in: true, checked_in_at: new Date().toISOString() } : g))
  }, [])

  const filtered = search.trim()
    ? guests.filter(g =>
        `${g.first_name} ${g.last_name || ''}`.toLowerCase().includes(search.toLowerCase()) ||
        g.phone?.includes(search),
      )
    : guests

  const checkedInCount = guests.filter(g => g.checked_in).length
  const totalCount = guests.length

  return { guests: filtered, allGuests: guests, search, setSearch, checkedInCount, totalCount, isLoading, refresh: fetchGuests, checkIn }
}
