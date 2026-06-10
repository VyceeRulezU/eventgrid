import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Check, X, HelpCircle } from 'lucide-react'

interface GuestInfo {
  id: string
  first_name: string
  last_name: string | null
  rsvp_status: string
  notes: string | null
}

interface EventInfo {
  name: string
  event_date: string | null
  location: string | null
  description: string | null
}

type PageStatus = 'loading' | 'form' | 'done' | 'error'

export function GuestRsvpPage() {
  const [params] = useSearchParams()
  const [guest, setGuest] = useState<GuestInfo | null>(null)
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [status, setStatus] = useState<PageStatus>('loading')
  const [error, setError] = useState('')
  const [rsvpNote, setRsvpNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedRsvp, setSelectedRsvp] = useState<string | null>(null)

  useEffect(() => {
    const eventId = params.get('e')
    const encodedEmail = params.get('g')
    if (!eventId || !encodedEmail) {
      setError('Invalid link')
      setStatus('error')
      return
    }

    let email: string
    try {
      email = atob(decodeURIComponent(encodedEmail))
    } catch {
      setError('Invalid link - could not decode')
      setStatus('error')
      return
    }

    console.log('[RSVP] eventId:', eventId, 'email:', email)
    console.log('[RSVP] raw g param:', encodedEmail)

    ;(async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/guest-rsvp`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'lookup', event_id: eventId, email }),
          }
        )
        const text = await res.text()
        console.log('[RSVP] raw response:', res.status, text)
        let body: Record<string, unknown>
        try { body = JSON.parse(text) } catch { body = {} }
        if (!res.ok || body?.error) {
          setError(String(body?.error || text || `HTTP ${res.status}`))
          setStatus('error')
          return
        }
        setGuest(body.guest as GuestInfo)
        setEvent(body.event as EventInfo)
        setRsvpNote((body.guest as GuestInfo)?.notes || '')
        if ((body.guest as GuestInfo)?.rsvp_status !== 'pending') {
          setSelectedRsvp((body.guest as GuestInfo).rsvp_status)
        }
        setStatus('form')
      } catch (e) {
        console.error('[RSVP] fetch error:', e)
        setError('Network error: ' + (e instanceof Error ? e.message : String(e)))
        setStatus('error')
      }
    })()
  }, [params])

  const handleRsvp = async (rsvpStatus: string) => {
    if (!guest) return
    setSubmitting(true)
    const { data, error: fnErr } = await supabase.functions.invoke('guest-rsvp', {
      body: {
        action: 'rsvp',
        guest_id: guest.id,
        rsvp_status: rsvpStatus,
        rsvp_note: rsvpNote || null,
      },
    })
    setSubmitting(false)
    if (fnErr || data?.error) {
      setError(data?.error || 'Failed to submit RSVP')
      return
    }
    setSelectedRsvp(rsvpStatus)
    setGuest({ ...guest, rsvp_status: rsvpStatus, notes: rsvpNote })
    setStatus('done')
  }

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0B1120', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ color: '#9CA3AF', fontSize: 14 }}>Loading your invitation...</div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0B1120', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ backgroundColor: '#1a2432', border: '1px solid #2a3a4e', borderRadius: 16, padding: '40px 32px', maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Invitation not found</div>
          <div style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.5 }}>{error || 'This link may be invalid or expired.'}</div>
        </div>
      </div>
    )
  }

  if (status === 'done') {
    const labels: Record<string, string> = { confirmed: 'Accepted', declined: 'Declined', maybe: 'Maybe' }
    const icons: Record<string, React.ReactNode> = {
      confirmed: <Check size={20} />,
      declined: <X size={20} />,
      maybe: <HelpCircle size={20} />,
    }
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0B1120', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ backgroundColor: '#1a2432', border: '1px solid #2a3a4e', borderRadius: 16, padding: '40px 32px', maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ color: '#D4A017', marginBottom: 16 }}>{icons[selectedRsvp || 'confirmed']}</div>
          <div style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
            {labels[selectedRsvp || 'confirmed']}
          </div>
          <div style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.5 }}>
            Your response for <strong style={{ color: '#D4A017' }}>{event?.name}</strong> has been recorded.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B1120', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ backgroundColor: '#1a2432', border: '1px solid #2a3a4e', borderRadius: 16, maxWidth: 480, width: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '36px 32px 24px', textAlign: 'center', borderBottom: '1px solid #2a3a4e' }}>
          <div style={{ width: 44, height: 3, backgroundColor: '#D4A017', borderRadius: 2, margin: '0 auto 16px' }} />
          <div style={{ color: '#F9FAFB', fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
            You're invited!
          </div>
          <div style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.5 }}>
            {guest?.first_name ? `Hi ${guest.first_name},` : ''} you have been invited to
          </div>
          <div style={{ color: '#D4A017', fontSize: 18, fontWeight: 600, marginTop: 8 }}>
            {event?.name || 'an event'}
          </div>
          {event?.event_date && (
            <div style={{ color: '#6B7280', fontSize: 12, marginTop: 6 }}>
              {new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}
          {event?.location && (
            <div style={{ color: '#6B7280', fontSize: 12 }}>
              {event.location}
            </div>
          )}
        </div>

        <div style={{ padding: '24px 32px' }}>
          <div style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Will you attend?
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <button
              onClick={() => handleRsvp('confirmed')}
              disabled={submitting}
              style={{
                flex: 1, padding: '12px 16px', border: 'none', borderRadius: 10, cursor: 'pointer',
                backgroundColor: '#22c55e', color: '#fff', fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: submitting ? 0.5 : 1,
              }}
            >
              <Check size={18} /> Accept
            </button>
            <button
              onClick={() => handleRsvp('declined')}
              disabled={submitting}
              style={{
                flex: 1, padding: '12px 16px', border: 'none', borderRadius: 10, cursor: 'pointer',
                backgroundColor: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: submitting ? 0.5 : 1,
              }}
            >
              <X size={18} /> Decline
            </button>
            <button
              onClick={() => handleRsvp('maybe')}
              disabled={submitting}
              style={{
                flex: 1, padding: '12px 16px', border: 'none', borderRadius: 10, cursor: 'pointer',
                backgroundColor: '#D4A017', color: '#111827', fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: submitting ? 0.5 : 1,
              }}
            >
              <HelpCircle size={18} /> Maybe
            </button>
          </div>

          <div style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 8 }}>Leave a note (optional)</div>
          <textarea
            value={rsvpNote}
            onChange={(e) => setRsvpNote(e.target.value)}
            disabled={submitting}
            placeholder="e.g. Looking forward to it! I'll bring a guest."
            rows={3}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2a3a4e',
              backgroundColor: '#0B1120', color: '#F9FAFB', fontSize: 13, resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />

          {error && (
            <div style={{ marginTop: 12, fontSize: 12, color: '#ef4444', textAlign: 'center' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
