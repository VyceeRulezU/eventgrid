import { useEffect, useState } from 'react'
import { Star, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type ReviewRow = Database['public']['Tables']['reviews']['Row']

interface ReviewWithReviewer extends ReviewRow {
  event_name?: string
}

export function ReviewsList({ userId, eventId }: { userId: string; eventId?: string }) {
  const [reviews, setReviews] = useState<ReviewWithReviewer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    let query = supabase.from('reviews').select('*').eq('reviewed_id', userId)
    if (eventId) query = query.eq('event_id', eventId)
    query = query.order('created_at', { ascending: false })
    Promise.all([
      query,
      supabase.from('profiles').select('id, display_name'),
      supabase.from('events').select('id, name'),
    ]).then(([reviewsRes, profilesRes, eventsRes]) => {
      if (reviewsRes.data) {
        const profiles = new Map((profilesRes.data || []).map((p) => [p.id, p.display_name]))
        const events = new Map((eventsRes.data || []).map((e: any) => [e.id, e.name]))
        setReviews(
          (reviewsRes.data as ReviewRow[]).map((r) => ({
            ...r,
            reviewer_name: profiles.get(r.reviewer_id) || r.reviewer_name || null,
            event_name: events.get(r.event_id) || undefined,
          }))
        )
      }
      setLoading(false)
    })
  }, [userId])

  if (loading) return <div className="skeleton skeleton-card" style={{ height: 80 }} />

  if (reviews.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-muted)' }}>
        <MessageSquare size={24} style={{ marginBottom: 'var(--space-2)', opacity: 0.4 }} />
        <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>No reviews yet</p>
      </div>
    )
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 2 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} size={16} fill={avgRating >= star ? '#D4A017' : 'none'} color={avgRating >= star ? '#D4A017' : 'var(--color-border)'} />
          ))}
        </div>
        <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{avgRating.toFixed(1)}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {reviews.map((review) => (
          <div key={review.id} style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <div>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{review.reviewer_name || 'Anonymous'}</span>
                {review.event_name && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: 'var(--space-2)' }}>— {review.event_name}</span>}
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={12} fill={review.rating >= star ? '#D4A017' : 'none'} color={review.rating >= star ? '#D4A017' : 'var(--color-border)'} />
                ))}
              </div>
            </div>
            {review.comment && <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{review.comment}</p>}
            <p style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
