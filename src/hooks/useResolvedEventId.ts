import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useEventStore } from '@/store/event.store'
import { UUID_RE } from '@/lib/slug'

/**
 * Resolves the `:id` URL param (which may be a slug or a UUID) to the actual
 * event UUID needed for Supabase foreign key queries.
 *
 * Resolution order:
 *  1. Param is a UUID → use it directly (no DB call)
 *  2. Param matches active event in store → use store's id (no DB call)
 *  3. Param is a slug → one DB query to resolve (deep-link case)
 */
export function useResolvedEventId() {
  const { id: paramId } = useParams<{ id: string }>()
  const activeEvent = useEventStore((s) => s.activeEvent)

  const resolveSync = (): string | null => {
    if (!paramId) return null
    if (UUID_RE.test(paramId)) return paramId
    if (activeEvent?.id === paramId) return activeEvent.id
    if (activeEvent?.slug === paramId) return activeEvent.id
    return null
  }

  const [eventId, setEventId] = useState<string | null>(resolveSync)
  const [loading, setLoading] = useState(() => resolveSync() === null && !!paramId)

  useEffect(() => {
    const fast = resolveSync()
    if (fast) {
      setEventId(fast)
      setLoading(false)
      return
    }

    if (!paramId) {
      setEventId(null)
      setLoading(false)
      return
    }

    setLoading(true)
    supabase
      .from('events')
      .select('id')
      .eq('slug', paramId)
      .single()
      .then(({ data }) => {
        setEventId(data?.id ?? null)
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramId])

  return { eventId, paramId, loading }
}
