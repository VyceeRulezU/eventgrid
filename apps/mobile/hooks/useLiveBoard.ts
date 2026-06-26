import { useState, useEffect, useCallback } from 'react'
import * as Haptics from 'expo-haptics'
import { supabase } from '../lib/supabase'
import type { Database } from '@naligrid/shared'

type LiveBoardItem = Database['public']['Tables']['live_board_items']['Row']
type Issue = Database['public']['Tables']['issues']['Row']

export function useLiveBoard(eventId: string) {
  const [items, setItems] = useState<LiveBoardItem[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [guestCount, setGuestCount] = useState(0)
  const [totalGuests, setTotalGuests] = useState(0)
  const [eventName, setEventName] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    const [boardRes, issuesRes, eventRes, guestRes] = await Promise.all([
      supabase.from('live_board_items').select('*').eq('event_id', eventId).order('sort_order'),
      supabase.from('issues').select('*').eq('event_id', eventId).order('raised_at', { ascending: false }),
      supabase.from('events').select('name').eq('id', eventId).single(),
      supabase.from('guests').select('checked_in', { count: 'exact' }).eq('event_id', eventId),
    ])

    if (boardRes.data) setItems(boardRes.data)
    if (issuesRes.data) setIssues(issuesRes.data)
    if (eventRes.data) setEventName(eventRes.data.name)

    const checkedIn = guestRes.data?.filter(g => g.checked_in).length ?? 0
    setGuestCount(checkedIn)
    setTotalGuests(guestRes.count ?? 0)
    setIsLoading(false)
  }, [eventId])

  useEffect(() => {
    fetchAll()

    const boardChannel = supabase
      .channel(`mobile_board:${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_board_items', filter: `event_id=eq.${eventId}` },
        (payload) => {
          setItems(prev => prev.map(item =>
            item.id === (payload.new as LiveBoardItem).id
              ? { ...item, ...(payload.new as LiveBoardItem) }
              : item,
          ))
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        },
      )
      .subscribe()

    const issueChannel = supabase
      .channel(`mobile_issues:${eventId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'issues', filter: `event_id=eq.${eventId}` },
        (payload) => {
          setIssues(prev => [payload.new as Issue, ...prev])
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(boardChannel)
      supabase.removeChannel(issueChannel)
    }
  }, [eventId, fetchAll])

  const updateStatus = useCallback(async (itemId: string, status: string, note: string) => {
    await supabase
      .from('live_board_items')
      .update({ status, status_label: note || null } as any)
      .eq('id', itemId)
  }, [])

  return {
    items, issues, guestCount, totalGuests,
    eventName, isLoading, refresh: fetchAll, updateStatus,
  }
}
