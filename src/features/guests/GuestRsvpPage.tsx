import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  venue_name: string | null
}

type PageStatus = 'loading' | 'form' | 'done' | 'error'

const APP_URL = import.meta.env.VITE_APP_URL || 'https://eventgrid.ng'
const isProd = APP_URL.includes('eventgrid.ng')
const HERO_URL = isProd
  ? 'https://menmpyyrqevonepbpfai.supabase.co/storage/v1/object/public/org-assets/emails/corporate_event_hall.png'
  : APP_URL + '/emails/corporate_event_hall.png'
const LOGO_URL = isProd
  ? 'https://menmpyyrqevonepbpfai.supabase.co/storage/v1/object/public/org-assets/EventGrid-logo-white.svg'
  : APP_URL + '/EventGrid-logo-white.svg'

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
        setError('Network error: ' + (e instanceof Error ? e.message : String(e)))
        setStatus('error')
      }
    })()
  }, [params])

  const handleRsvp = async (rsvpStatus: string) => {
    if (!guest) return
    setSubmitting(true)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/guest-rsvp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'rsvp',
            guest_id: guest.id,
            rsvp_status: rsvpStatus,
            rsvp_note: rsvpNote || null,
          }),
        }
      )
      const text = await res.text()
      let body: Record<string, unknown>
      try { body = JSON.parse(text) } catch { body = {} }
      if (!res.ok || body?.error) {
        setError(String(body?.error || text || `HTTP ${res.status}`))
        setSubmitting(false)
        return
      }
      setSelectedRsvp(rsvpStatus)
      setGuest({ ...guest, rsvp_status: rsvpStatus, notes: rsvpNote })
    } catch (e) {
      setError('Network error: ' + (e instanceof Error ? e.message : String(e)))
    }
    setSubmitting(false)
  }

  const handleSaveNote = async () => {
    if (!guest) return
    setSubmitting(true)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/guest-rsvp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'rsvp',
            guest_id: guest.id,
            rsvp_status: guest.rsvp_status,
            rsvp_note: rsvpNote || null,
          }),
        }
      )
      const text = await res.text()
      let body: Record<string, unknown>
      try { body = JSON.parse(text) } catch { body = {} }
      if (!res.ok || body?.error) {
        setError(String(body?.error || text || `HTTP ${res.status}`))
        setSubmitting(false)
        return
      }
      setError('')
      setGuest({ ...guest, notes: rsvpNote })
    } catch (e) {
      setError('Network error: ' + (e instanceof Error ? e.message : String(e)))
    }
    setSubmitting(false)
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
          <div style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 300, marginBottom: 8 }}>Invitation not found</div>
          <div style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.5 }}>{error || 'This link may be invalid or expired.'}</div>
        </div>
      </div>
    )
  }

  const doneLabels: Record<string, string> = { confirmed: 'Accepted', declined: 'Declined', maybe: 'Maybe' }
  const doneIcons: Record<string, React.ReactNode> = {
    confirmed: <Check size={28} />,
    declined: <X size={28} />,
    maybe: <HelpCircle size={28} />,
  }
  const isDone = selectedRsvp !== null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B1120', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ backgroundColor: '#1a2432', border: '1px solid #2a3a4e', borderRadius: 16, maxWidth: 480, width: '100%', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
        <div style={{
          backgroundImage: `url('${HERO_URL}')`, backgroundSize: 'cover', backgroundPosition: 'center',
          padding: '44px 32px', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(11,17,32,0.95) 0%, rgba(11,17,32,0.75) 50%, rgba(11,17,32,0.6) 100%), ' +
            `url('${HERO_URL}') center/cover no-repeat`,
        }}>
          <table cellPadding={0} cellSpacing={0} style={{ margin: '0 auto 14px' }}><tbody><tr><td style={{ width: 44, height: 3, backgroundColor: '#D4A017', borderRadius: 2 }} /></tr></tbody></table>
          <img src={LOGO_URL} alt="EventGrid" style={{ maxWidth: 160, height: 'auto', display: 'block', margin: '0 auto' }} />
        </div>

        <div style={{ padding: '28px 28px 32px' }}>
          <div style={{ color: '#F9FAFB', fontSize: 22, fontWeight: 300, marginBottom: 4, textAlign: 'center', letterSpacing: '-0.02em' }}>
            You're invited!
          </div>
          {guest?.first_name && (
            <div style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginBottom: 2 }}>
              Hi {guest.first_name},
            </div>
          )}
          <div style={{ color: '#D4A017', fontSize: 16, fontWeight: 300, textAlign: 'center', marginBottom: 16 }}>
            {event?.name || 'an event'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            {event?.event_date && (
              <div style={{ color: '#6B7280', fontSize: 12, textAlign: 'center' }}>
                {new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
            {event?.venue_name && (
              <div style={{ color: '#6B7280', fontSize: 12, textAlign: 'center' }}>
                {event.venue_name}
              </div>
            )}
          </div>

          <div style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>
            {isDone ? 'Your response' : 'Will you attend?'}
          </div>

          {isDone ? (
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <div style={{ color: '#D4A017', marginBottom: 8 }}>{doneIcons[selectedRsvp || 'confirmed']}</div>
              <div style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 300, marginBottom: 4 }}>
                {doneLabels[selectedRsvp || 'confirmed']}
              </div>
              <div style={{ color: '#9CA3AF', fontSize: 12, lineHeight: 1.5 }}>
                Your response for <strong style={{ color: '#D4A017', fontWeight: 300 }}>{event?.name}</strong> has been recorded.
              </div>
              {rsvpNote && (
                <div style={{ color: '#6B7280', fontSize: 11, marginTop: 10, fontStyle: 'italic', borderTop: '1px solid #2a3a4e', paddingTop: 10 }}>
                  "{rsvpNote}"
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleRsvp('confirmed')}
                  disabled={submitting}
                  style={{
                    flex: '1 1 120px', padding: '10px 12px', border: 'none', borderRadius: 10, cursor: 'pointer',
                    backgroundColor: '#22c55e', color: '#fff', fontSize: 13, fontWeight: 400,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    opacity: submitting ? 0.5 : 1,
                  }}
                >
                  <Check size={16} /> Accept
                </button>
                <button
                  onClick={() => handleRsvp('declined')}
                  disabled={submitting}
                  style={{
                    flex: '1 1 120px', padding: '10px 12px', border: 'none', borderRadius: 10, cursor: 'pointer',
                    backgroundColor: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 400,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    opacity: submitting ? 0.5 : 1,
                  }}
                >
                  <X size={16} /> Decline
                </button>
                <button
                  onClick={() => handleRsvp('maybe')}
                  disabled={submitting}
                  style={{
                    flex: '1 1 120px', padding: '10px 12px', border: 'none', borderRadius: 10, cursor: 'pointer',
                    backgroundColor: '#D4A017', color: '#111827', fontSize: 13, fontWeight: 400,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    opacity: submitting ? 0.5 : 1,
                  }}
                >
                  <HelpCircle size={16} /> Maybe
                </button>
              </div>
            </>
          )}

          <div style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 8 }}>Leave a note (optional)</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <textarea
              value={rsvpNote}
              onChange={(e) => setRsvpNote(e.target.value)}
              disabled={submitting}
              placeholder="e.g. Looking forward to it! I'll bring a guest."
              rows={3}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #2a3a4e',
                backgroundColor: '#0B1120', color: '#F9FAFB', fontSize: 13, resize: 'vertical',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleSaveNote}
              disabled={submitting || !rsvpNote.trim()}
              style={{
                padding: '10px 16px', border: 'none', borderRadius: 8, cursor: 'pointer',
                backgroundColor: '#D4A017', color: '#111827', fontSize: 12, fontWeight: 400, whiteSpace: 'nowrap',
                opacity: (submitting || !rsvpNote.trim()) ? 0.5 : 1,
              }}
            >
              Save
            </button>
          </div>

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
