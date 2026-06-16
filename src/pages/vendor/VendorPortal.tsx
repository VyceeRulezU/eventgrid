import { useEffect, useState } from 'react'
import { Building, Star, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { ReviewForm } from '@/features/reviews/ReviewForm'
import { MyFeedback } from '@/components/shared/MyFeedback'
import styles from './VendorPortal.module.css'

interface VendorEvent {
  id: string
  event_id: string
  event_name: string
  event_status: string
  planner_id: string
  planner_name: string
  reviewed: boolean
}

export function VendorPortal() {
  const user = useAuthStore((s) => s.user)
  const [events, setEvents] = useState<VendorEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('event_vendors').select('id, event_id, vendor_name'),
      supabase.from('events').select('id, name, status, created_by'),
      supabase.from('profiles').select('id, display_name'),
      supabase.from('reviews').select('event_id').eq('reviewer_id', user.id),
    ]).then(([evRes, eventsRes, profilesRes, reviewsRes]) => {
      const reviewedEventIds = new Set((reviewsRes.data || []).map((r: any) => r.event_id))
      const eventsMap = new Map((eventsRes.data || []).map((e: any) => [e.id, e]))
      const profilesMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p.display_name]))
      const vendorEvents: VendorEvent[] = []
      for (const ev of (evRes.data || []) as any[]) {
        const event = eventsMap.get(ev.event_id)
        if (!event) continue
        vendorEvents.push({
          id: ev.id,
          event_id: ev.event_id,
          event_name: event.name,
          event_status: event.status,
          planner_id: event.created_by,
          planner_name: profilesMap.get(event.created_by) || '',
          reviewed: reviewedEventIds.has(ev.event_id),
        })
      }
      setEvents(vendorEvents)
      setLoading(false)
    })
  }, [user])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Building size={20} />
        <div>
          <h1 className={styles.title}>Vendor Portal</h1>
          <p className={styles.subtitle}>Your assigned events and reviews</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><Loader2 size={24} className="spin" /></div>
      ) : (
        <div className={styles.content}>
          {events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__title">No events assigned yet</div>
              <div className="empty-state__description">You'll see your events here once a planner assigns you.</div>
            </div>
          ) : (
            <div className={styles.eventsList}>
              {events.map((ev) => (
                <div key={ev.id} className={styles.eventCard}>
                  <div className={styles.eventInfo}>
                    <Star size={16} color={ev.reviewed ? '#D4A017' : 'var(--color-text-muted)'} fill={ev.reviewed ? '#D4A017' : 'none'} />
                    <div>
                      <strong>{ev.event_name}</strong>
                      <span className={styles.status} data-status={ev.event_status}>{ev.event_status}</span>
                    </div>
                  </div>
                  {!ev.reviewed && ev.event_status === 'completed' && ev.planner_id && (
                    <ReviewForm
                      reviewedId={ev.planner_id}
                      eventId={ev.event_id}
                      reviewerRole="vendor"
                      onSubmitted={() => setEvents((prev) => prev.map((e) => e.event_id === ev.event_id ? { ...e, reviewed: true } : e))}
                    />
                  )}
                  {ev.reviewed && (
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 'var(--space-2) 0 0' }}>✓ Review submitted</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 'var(--space-6)' }}>
            <MyFeedback />
          </div>
        </div>
      )}
    </div>
  )
}
