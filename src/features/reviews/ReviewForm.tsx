import { useState } from 'react'
import { Star, Loader2, Send, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'

interface ReviewFormProps {
  reviewedId: string
  eventId: string
  reviewerRole: 'vendor' | 'client'
  onSubmitted?: () => void
  anonymous?: boolean
}

export function ReviewForm({ reviewedId, eventId, reviewerRole, onSubmitted, anonymous }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [reviewerName, setReviewerName] = useState('')
  const [sending, setSending] = useState(false)
  const showNotification = useUIStore((s) => s.showNotification)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return
    if (anonymous && !reviewerName.trim()) return
    setSending(true)
    const user = await supabase.auth.getUser()
    const payload: Record<string, unknown> = {
      reviewed_id: reviewedId,
      event_id: eventId,
      reviewer_role: reviewerRole,
      rating,
      comment: comment.trim() || null,
    }
    if (anonymous) {
      payload.reviewer_name = reviewerName.trim()
      payload.reviewer_id = null
    } else {
      payload.reviewer_id = user.data.user?.id
    }
    const { error } = await supabase.from('reviews').insert(payload)
    setSending(false)
    if (error) {
      showNotification({ variant: 'error', title: 'Failed to submit review', message: error.message })
      return
    }
    showNotification({ variant: 'success', title: 'Review submitted' })
    onSubmitted?.()
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
      <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>Rate your experience</h4>

      {anonymous && (
        <div className="input-wrapper" style={{ marginBottom: 'var(--space-3)' }}>
          <label className="input-label" style={{ fontSize: 'var(--text-xs)' }}>Your Name</label>
          <div style={{ position: 'relative' }}>
            <User size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              className="input"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="e.g. Adebayo Benson"
              required
              style={{ paddingLeft: 32 }}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--space-3)' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: (hover || rating) >= star ? '#D4A017' : 'var(--color-border)' }}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            <Star size={22} fill={(hover || rating) >= star ? '#D4A017' : 'none'} />
          </button>
        ))}
      </div>

      <textarea
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your feedback (optional)"
        style={{ width: '100%', boxSizing: 'border-box', background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', color: 'inherit', fontFamily: 'inherit', fontSize: 'var(--text-sm)', resize: 'vertical' }}
      />

      <button type="submit" disabled={sending || rating === 0 || (anonymous && !reviewerName.trim())} className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-3)' }}>
        {sending ? <><Loader2 size={14} className="spin" /> Sending...</> : <><Send size={14} /> Submit Review</>}
      </button>
    </form>
  )
}
