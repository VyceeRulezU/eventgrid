import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, ArrowLeft, Check, CreditCard, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { processPayment, getEventPrice } from '@/lib/payment'
import { generateSlug } from '@/lib/slug'
import { CalendarModal } from '@/components/ui/CalendarModal'
import { DropdownMenu } from '@/components/ui/DropdownMenu'

async function ensureOwnOrg(userId: string, displayName: string): Promise<{ id: string; name: string; logo_url: string | null } | null> {
  const { data: ownedOrgs } = await supabase
    .from('organizations')
    .select('id, name, logo_url')
    .eq('owner_id', userId)
    .limit(1)

  if (ownedOrgs && ownedOrgs.length > 0) {
    return ownedOrgs[0]
  }

  let newOrg: unknown
  try {
    const { data, error: orgErr } = await supabase
      .rpc('create_org', {
        p_name: `${displayName || 'User'}'s Events`,
        p_owner_id: userId,
        p_city: 'Lagos, Lagos',
        p_logo_url: null,
      })
    if (orgErr || !data) return null
    newOrg = data
  } catch {
    return null
  }

  const orgData = newOrg as { id: string; name: string; logo_url: string | null }

  try {
    await supabase
      .from('profiles')
      .update({ org_id: orgData.id })
      .eq('id', userId)
  } catch {
    // profile update is best-effort
  }

  return orgData
}

const eventTypes = [
  { value: 'Wedding', label: 'Wedding' },
  { value: 'Corporate Event', label: 'Corporate Event' },
  { value: 'Birthday', label: 'Birthday' },
  { value: 'Naming Ceremony', label: 'Naming Ceremony' },
  { value: 'Anniversary', label: 'Anniversary' },
  { value: 'Graduation', label: 'Graduation' },
  { value: 'Private Party', label: 'Private Party' },
  { value: 'Conference', label: 'Conference' },
  { value: 'Fashion Show', label: 'Fashion Show' },
  { value: 'Product Launch', label: 'Product Launch' },
  { value: 'Other', label: 'Other' },
]

const STEPS = ['Event Details', 'Activation', 'Payment']

function StepIndicator({ stepIndex }: { stepIndex: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
      {STEPS.map((label, i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: i < STEPS.length - 1 ? 1 : undefined }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--text-xs)', fontWeight: 700,
            background: i < stepIndex ? 'var(--color-success)' : i === stepIndex ? 'var(--color-accent)' : 'var(--color-surface-2)',
            color: i <= stepIndex ? 'white' : 'var(--color-text-muted)',
            transition: 'all 0.3s ease',
          }}>
            {i < stepIndex ? <Check size={14} /> : i + 1}
          </div>
          <span style={{
            fontSize: 'var(--text-xs)', fontWeight: i === stepIndex ? 600 : 400,
            color: i <= stepIndex ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          }}>
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < stepIndex ? 'var(--color-success)' : 'var(--color-border-subtle)', borderRadius: 1, margin: '0 var(--space-2)' }} />
          )}
        </div>
      ))}
    </div>
  )
}

const DEFAULT_TEMPLATE = {
  name: '',
  eventType: '',
  eventDate: '',
  venueName: '',
  venueAddress: '',
  guestCount: 0,
  budgetTotal: 0,
}

export function CreateEventPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const org = useAuthStore((s) => s.org)
  const setOrg = useAuthStore((s) => s.setOrg)
  const showToast = useUIStore((s) => s.showToast)
  const [step, setStep] = useState<'details' | 'activate' | 'payment'>('details')
  const [saving, setSaving] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [templateMode, setTemplateMode] = useState<'default' | 'copy'>('default')
  const [existingEvents, setExistingEvents] = useState<{ id: string; name: string; event_type: string; event_date: string | null; venue_name: string | null; guest_count: number | null }[]>([])
  const [form, setForm] = useState(DEFAULT_TEMPLATE)
  const [createdEventId, setCreatedEventId] = useState<string | null>(null)
  const [createdEventSlug, setCreatedEventSlug] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'cancelled' | 'failed'>('idle')
  const [paying, setPaying] = useState(false)
  const paySucceededRef = useRef(false)

  useEffect(() => {
    if (!user || !org && !profile?.org_id) return
    const orgId = org?.id || profile?.org_id
    if (!orgId) return
    supabase
      .from('events')
      .select('id, name, event_type, event_date, venue_name, guest_count')
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setExistingEvents(data as typeof existingEvents)
      })
  }, [user, org, profile])

  const handleCopyTemplate = (eventId: string) => {
    const evt = existingEvents.find(e => e.id === eventId)
    if (!evt) return
    setForm({
      name: `${evt.name} (Copy)`,
      eventType: evt.event_type || '',
      eventDate: evt.event_date || '',
      venueName: evt.venue_name || '',
      venueAddress: '',
      guestCount: evt.guest_count || 0,
      budgetTotal: 0,
    })
  }

  const suggestedTier = form.guestCount <= 0 ? '' :
    form.guestCount <= 100 ? 'intimate' :
    form.guestCount <= 300 ? 'standard' : 'large'

  const stepIndex = step === 'details' ? 0 : step === 'activate' ? 1 : 2

  const handleContinue = () => {
    if (!form.name) {
      showToast({ type: 'warning', title: 'Event name is required' })
      return
    }
    if (!form.eventType) {
      showToast({ type: 'warning', title: 'Please select an event type' })
      return
    }
    setStep('activate')
  }

  const handleSaveDraft = async () => {
    if (!user) {
      showToast({ type: 'error', title: 'Not authenticated' })
      return
    }

    let activeOrg = org
    if (!activeOrg) {
      const owned = await ensureOwnOrg(user.id, profile?.display_name || '')
      if (!owned) {
        showToast({ type: 'warning', title: 'Organization not set up', body: 'Please complete onboarding first' })
        return
      }
      activeOrg = owned
      setOrg(owned)
    }

    setSaving(true)

    const { data, error } = await supabase
      .from('events')
      .insert({
        org_id: activeOrg.id,
        created_by: user.id,
        name: form.name,
        event_type: form.eventType,
        event_date: form.eventDate || null,
        venue_name: form.venueName || null,
        venue_address: form.venueAddress || null,
        guest_count: form.guestCount || null,
        size_tier: suggestedTier || 'standard',
        budget_total: form.budgetTotal * 100 || null,
        status: 'draft',
        payment_status: 'unpaid',
        slug: generateSlug(form.name),
      })
      .select()
      .single()

    if (error) {
      showToast({ type: 'error', title: 'Failed to save draft', body: error.message })
      setSaving(false)
      return
    }

    showToast({ type: 'success', title: 'Draft saved', body: 'Your event draft has been saved.' })
    setSaving(false)
    navigate(`/events/${data.slug || data.id}`)
  }

  const handleActivate = async () => {
    if (!user) {
      showToast({ type: 'error', title: 'Not authenticated' })
      return
    }

    let activeOrg = org
    if (!activeOrg) {
      const owned = await ensureOwnOrg(user.id, profile?.display_name || '')
      if (!owned) {
        showToast({ type: 'warning', title: 'Organization not set up', body: 'Please complete onboarding first' })
        return
      }
      activeOrg = owned
      setOrg(owned)
    }

    setSaving(true)

    const { data, error } = await supabase
      .from('events')
      .insert({
        org_id: activeOrg.id,
        created_by: user.id,
        name: form.name,
        event_type: form.eventType,
        event_date: form.eventDate || null,
        venue_name: form.venueName || null,
        venue_address: form.venueAddress || null,
        guest_count: form.guestCount || null,
        size_tier: 'standard',
        budget_total: form.budgetTotal * 100 || null,
        status: 'draft',
        payment_status: 'unpaid',
        slug: generateSlug(form.name),
      })
      .select()
      .single()

    if (error || !data) {
      showToast({ type: 'error', title: 'Failed to create event', body: error?.message })
      setSaving(false)
      return
    }

    setCreatedEventId(data.id)
    setCreatedEventSlug(data.slug ?? null)
    setSaving(false)
    setStep('payment')
  }

  const handlePaymentSuccess = async (provider: 'paystack' | 'flutterwave', reference: string) => {
    paySucceededRef.current = true
    setPaying(true)
    if (createdEventId) {
      const { data, error: verifyErr } = await supabase.functions.invoke('verify-payment', {
        body: {
          provider,
          reference,
          event_id: createdEventId
        }
      })

      if (verifyErr || (data && data.error)) {
        let errMsg = verifyErr?.message || data?.error || 'Payment verification failed'
        if (verifyErr && 'context' in verifyErr && verifyErr.context) {
          try {
            const res = verifyErr.context as Response
            const body = await res.clone().json()
            if (body && body.error) {
              errMsg = body.error
            }
          } catch (e) {
            console.error('Failed to parse verification error:', e)
          }
        }
        showToast({ type: 'error', title: 'Verification failed', body: errMsg })
        setPaying(false)
        setPaymentStatus('failed')
        return
      }
    }
    setPaying(false)
    setPaymentStatus('success')
    showToast({ type: 'success', title: 'Payment successful!', body: 'Your event is now live.' })
  }

  const handlePaymentCancel = () => {
    if (paySucceededRef.current) return
    setPaymentStatus('cancelled')
    setPaying(false)
    showToast({ type: 'info', title: 'Payment cancelled', body: 'You can complete payment later from the event page.' })
  }

  const handlePayWithPaystack = async () => {
    if (!user || !createdEventId) return
    setPaying(true)
    setPaymentStatus('idle')
    paySucceededRef.current = false
    try {
      await processPayment({
        provider: 'paystack',
        email: user.email || '',
        amount: getEventPrice('standard'),
        metadata: { event_id: createdEventId },
        onSuccess: (reference) => handlePaymentSuccess('paystack', reference),
        onClose: handlePaymentCancel,
      })
    } catch {
      if (!paySucceededRef.current) {
        setPaymentStatus('failed')
        showToast({ type: 'error', title: 'Payment failed', body: 'Could not load payment provider' })
        setPaying(false)
      }
    }
  }

  const handlePayWithFlutterwave = async () => {
    if (!user || !createdEventId) return
    setPaying(true)
    setPaymentStatus('idle')
    paySucceededRef.current = false
    try {
      await processPayment({
        provider: 'flutterwave',
        email: user.email || '',
        amount: getEventPrice('standard'),
        metadata: { event_id: createdEventId },
        onSuccess: (reference) => handlePaymentSuccess('flutterwave', reference),
        onClose: handlePaymentCancel,
      })
    } catch {
      if (!paySucceededRef.current) {
        setPaymentStatus('failed')
        showToast({ type: 'error', title: 'Payment failed', body: 'Could not load payment provider' })
        setPaying(false)
      }
    }
  }

  const handleGoToEvent = () => {
    if (createdEventSlug || createdEventId) {
      navigate(`/events/${createdEventSlug || createdEventId}`)
    } else {
      navigate('/events')
    }
  }

  if (step === 'details') {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <StepIndicator stepIndex={stepIndex} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/events')} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <h2>Create Event</h2>
        </div>

        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Template
            </span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
            <button
              type="button"
              className={`btn ${templateMode === 'default' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              onClick={() => { setTemplateMode('default'); setForm(DEFAULT_TEMPLATE) }}
            >
              Default
            </button>
            <button
              type="button"
              className={`btn ${templateMode === 'copy' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              onClick={() => setTemplateMode('copy')}
            >
              Copy from existing event
            </button>
          </div>
          {templateMode === 'copy' && existingEvents.length > 0 && (
            <div className="input-wrapper">
              <label className="input-label">Select event to copy</label>
              <DropdownMenu
                trigger={
                  <span style={{ color: 'var(--color-text-primary)' }}>
                    {form.name || 'Choose an event...'}
                  </span>
                }
                items={existingEvents.map(e => ({ label: `${e.name} (${e.event_type || 'N/A'})`, value: e.id }))}
                onSelect={(item) => handleCopyTemplate(item.value)}
              />
            </div>
          )}
          {templateMode === 'copy' && existingEvents.length === 0 && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              No existing events found to copy from.
            </div>
          )}
        </div>

      <div className="card">
          <div className="input-wrapper">
            <label className="input-label">Event Name <span className="required">*</span></label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Smith & Johnson Wedding"
            />
          </div>

          <div className="input-wrapper" style={{ marginTop: 'var(--space-4)' }}>
            <label className="input-label">Event Type <span className="required">*</span></label>
            <DropdownMenu
              trigger={
                <span style={{ color: form.eventType ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                  {form.eventType || 'Select type...'}
                </span>
              }
              items={eventTypes}
              onSelect={(item) => setForm({ ...form, eventType: item.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
            <div className="input-wrapper">
              <label className="input-label">Event Date</label>
              <button className="input" type="button" onClick={() => setCalendarOpen(true)} style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                <Calendar size={16} />
                <span style={{ color: form.eventDate ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                  {form.eventDate ? form.eventDate : 'Pick a date'}
                </span>
              </button>
              <CalendarModal open={calendarOpen} value={form.eventDate} onChange={(d) => setForm({ ...form, eventDate: d })} onClose={() => setCalendarOpen(false)} />
            </div>
            <div className="input-wrapper">
              <label className="input-label">Est. Guest Count</label>
              <input className="input" type="number" min={0} value={form.guestCount || ''} onChange={(e) => setForm({ ...form, guestCount: Number(e.target.value) })} placeholder="0" />
            </div>
          </div>

          <div className="input-wrapper" style={{ marginTop: 'var(--space-4)' }}>
            <label className="input-label">Venue Name</label>
            <input className="input" value={form.venueName} onChange={(e) => setForm({ ...form, venueName: e.target.value })} placeholder="e.g. Transcorp Hilton" />
          </div>

          <div className="input-wrapper" style={{ marginTop: 'var(--space-4)' }}>
            <label className="input-label">Venue Address</label>
            <input className="input" value={form.venueAddress} onChange={(e) => setForm({ ...form, venueAddress: e.target.value })} placeholder="e.g. 1 Aguiyi Ironsi St, Abuja" />
          </div>

          {suggestedTier && (
            <div className="card" style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', backgroundColor: 'var(--color-accent-muted)', border: '1px solid var(--color-accent-border)' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-accent)' }}>
                Suggested tier: {suggestedTier === 'intimate' ? 'Intimate (Under 100)' : suggestedTier === 'standard' ? 'Standard (100–300)' : 'Large (300+)'}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleContinue} disabled={saving}>
              Continue
            </button>
            <button className="btn btn-secondary btn-lg" onClick={handleSaveDraft} disabled={saving}>
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'activate') {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <StepIndicator stepIndex={stepIndex} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => setStep('details')} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ margin: 0 }}>Activate Event</h2>
        </div>

        <div style={{
          borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-5)',
          height: 220, position: 'relative',
        }}>
          <img
            src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80"
            alt="Event celebration"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)',
          }} />
          <div style={{
            position: 'absolute', bottom: 'var(--space-4)', left: 'var(--space-4)',
            color: 'white',
          }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{form.name}</div>
            <div style={{ fontSize: 'var(--text-sm)', opacity: 0.85 }}>{form.eventType}{form.eventDate ? ` · ${form.eventDate}` : ''}</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 'var(--space-5)', textAlign: 'center', padding: 'var(--space-6)' }}>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
            Event Activation Fee
          </div>
          <div style={{ fontSize: 'var(--text-display)', fontWeight: 800, color: 'var(--color-accent)', letterSpacing: '-0.02em' }}>
            ₦20,000
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
            One-time payment · All event sizes included
          </div>
        </div>

        <div className="card" style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
          <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
            <ShieldCheck size={14} style={{ display: 'inline', marginRight: 'var(--space-1)', verticalAlign: 'middle' }} />
            What you get:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            <span>✓ Full planning dashboard</span>
            <span>✓ Vendor management</span>
            <span>✓ Budget & financial tracking</span>
            <span>✓ Guest list management</span>
            <span>✓ Task & phase management</span>
            <span>✓ Client portal access</span>
          </div>
          <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border-subtle)' }}>
            <strong>Note:</strong> This is a one-time payment per event. No recurring fees. You can save as a draft for free and activate later.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleActivate} disabled={saving}>
            <CreditCard size={18} />
            {saving ? 'Creating...' : 'Activate Event — ₦20,000'}
          </button>
          <button className="btn btn-secondary btn-lg" onClick={handleSaveDraft} disabled={saving}>
            Save Draft (Free)
          </button>
        </div>
      </div>
    )
  }

  const isPaid = paymentStatus === 'success'

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <StepIndicator stepIndex={stepIndex} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => setStep('activate')} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0 }}>Payment</h2>
      </div>

      {isPaid ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--color-success-bg)', color: 'var(--color-success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-4)',
          }}>
            <Check size={32} />
          </div>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Payment Successful!</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)', fontSize: 'var(--text-sm)' }}>
            <strong>{form.name}</strong> has been activated. You can now start planning.
          </p>
          <button className="btn btn-primary btn-lg" onClick={handleGoToEvent}>
            Go to Event
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Event Activation</div>
            <div style={{ fontSize: 'var(--text-title-lg)', fontWeight: 700, marginTop: 'var(--space-1)' }}>
              {form.name}
            </div>
            <div style={{ fontSize: 'var(--text-display)', fontWeight: 800, color: 'var(--color-accent)', marginTop: 'var(--space-3)' }}>
              ₦20,000
            </div>
          </div>

          {paymentStatus === 'cancelled' && (
            <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', textAlign: 'center', background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)', fontSize: 'var(--text-sm)', color: 'var(--color-warning)' }}>
              Payment was cancelled. You can try again or save as draft.
            </div>
          )}
          {paymentStatus === 'failed' && (
            <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', textAlign: 'center', background: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)', fontSize: 'var(--text-sm)', color: 'var(--color-error)' }}>
              Payment provider unavailable. Check your internet and try again.
            </div>
          )}

          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: 'var(--space-5)' }}>
            Choose your payment provider to activate this event
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <button className="btn btn-primary btn-lg" onClick={handlePayWithPaystack} disabled={paying}>
              {paying ? 'Processing...' : <><CreditCard size={18} /> Pay with Paystack</>}
            </button>
            <button className="btn btn-secondary btn-lg" onClick={handlePayWithFlutterwave} disabled={paying}>
              {paying ? 'Processing...' : 'Pay with Flutterwave'}
            </button>
          </div>

          <div className="card" style={{ marginTop: 'var(--space-5)', padding: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', background: 'var(--color-surface-1)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--color-text-secondary)' }}>Testing (Demo Mode):</strong><br />
            Use Flutterwave test card: <strong style={{ color: 'var(--color-text-primary)' }}>4181 0000 0000 0007</strong><br />
            Expiry: any future date · CVV: any 3 digits · PIN: <strong style={{ color: 'var(--color-text-primary)' }}>0000</strong><br />
            OTP: <strong style={{ color: 'var(--color-text-primary)' }}>123456</strong>
          </div>

          <button className="btn btn-ghost" style={{ marginTop: 'var(--space-4)', width: '100%' }} onClick={handleSaveDraft}>
            Skip — Save as Draft
          </button>
        </div>
      )}
    </div>
  )
}
