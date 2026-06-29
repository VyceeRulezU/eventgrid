import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useEventStore } from '@/store/event.store'
import { useAuthStore } from '@/store/auth.store'
import { UUID_RE } from '@/lib/slug'

/**
 * Resolves the `:id` URL param (which may be a slug or a UUID) to the actual
 * event UUID needed for Supabase foreign key queries. Also checks if the event
 * is archived and determines the isReadOnly status (overridden for super admins).
 */
export function useResolvedEventId() {
  const { id: paramId } = useParams<{ id: string }>()
  const activeEvent = useEventStore((s) => s.activeEvent)
  const profile = useAuthStore((s) => s.profile)
  const isSuperAdmin = profile?.role === 'super_admin'

  const [eventId, setEventId] = useState<string | null>(null)
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!paramId) {
      setEventId(null)
      setIsReadOnly(false)
      setLoading(false)
      return
    }

    // 1. If activeEvent in store matches the param (by ID or Slug), use it
    if (activeEvent && (activeEvent.id === paramId || activeEvent.slug === paramId)) {
      setEventId(activeEvent.id)
      setIsReadOnly(activeEvent.status === 'archived' && !isSuperAdmin)
      setLoading(false)
      return
    }

    // 2. Otherwise, fetch from database to resolve ID and status
    setLoading(true)
    const isUuid = UUID_RE.test(paramId)
    supabase
      .from('events')
      .select('id, status')
      .eq(isUuid ? 'id' : 'slug', paramId)
      .single()
      .then(
        ({ data }) => {
          setEventId(data?.id ?? null)
          setIsReadOnly(data?.status === 'archived' && !isSuperAdmin)
          setLoading(false)
        },
        () => {
          setEventId(null)
          setIsReadOnly(false)
          setLoading(false)
        }
      )
  }, [paramId, activeEvent, isSuperAdmin])

  return { eventId, paramId, loading, isReadOnly }
}
