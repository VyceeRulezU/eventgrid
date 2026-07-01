import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Plus, Users, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { PageHero } from '@/components/shared/PageHero'
import styles from './ClientCreateEventPage.module.css'

interface PlannerProfile {
  id: string
  display_name: string | null
  org_name?: string
}

const EVENT_TYPES = [
  'Wedding', 'Birthday', 'Corporate Event', 'Conference', 'Concert',
  'Gallery', 'Festival', 'Product Launch', 'Baby Shower', 'Anniversary',
  'Graduation', 'Other',
]

export function ClientCreateEventPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const showToast = useUIStore((s) => s.showToast)
  const [step, setStep] = useState<'details' | 'team' | 'review'>('details')

  const [name, setName] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [venueName, setVenueName] = useState('')
  const [venueAddress, setVenueAddress] = useState('')
  const [guestCount, setGuestCount] = useState(0)
  const [description, setDescription] = useState('')
  const [budgetRange, setBudgetRange] = useState('')

  const [plannerSearch, setPlannerSearch] = useState('')
  const [planners, setPlanners] = useState<PlannerProfile[]>([])
  const [selectedPlanner, setSelectedPlanner] = useState<PlannerProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const searchPlanners = async (query: string) => {
    setPlannerSearch(query)
    if (!query.trim()) { setPlanners([]); return }
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, owner_id')
      .ilike('name', `%${query}%`)
      .limit(10)

    if (orgs && orgs.length > 0) {
      const ownerIds = orgs.map((o) => o.owner_id)
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('role', 'planner')
        .in('id', ownerIds)
      const profMap = new Map((profs || []).map((p) => [p.id, p.display_name]))
      setPlanners(
        orgs.map((o) => ({
          id: o.owner_id,
          display_name: profMap.get(o.owner_id) || null,
          org_name: o.name,
        }))
      )
    } else {
      setPlanners([])
    }
  }

  const handleSubmit = async () => {
    if (!user || !profile) return
    if (!name.trim() || !eventType) {
      showToast({ type: 'warning', title: 'Event name and type are required' })
      return
    }

    setSaving(true)
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        created_by: user.id,
        client_id: user.id,
        name: name.trim(),
        event_type: eventType,
        event_date: eventDate || null,
        venue_name: venueName || null,
        venue_address: venueAddress || null,
        guest_count: guestCount || null,
        size_tier: !guestCount || guestCount <= 0 ? null : guestCount <= 100 ? 'intimate' : guestCount <= 300 ? 'standard' : 'large',
        status: 'draft',
        payment_status: 'unpaid',
        notes: description || null,
        slug,
        managing_planner_id: selectedPlanner?.id || null,
      })
      .select()
      .single()

    if (error || !event) {
      showToast({ type: 'error', title: 'Failed to create event', body: error?.message })
      setSaving(false)
      return
    }

    // Add the client to event_access
    await supabase.from('event_access').insert({
      event_id: event.id,
      user_id: user.id,
      role: 'client',
      accepted_at: new Date().toISOString(),
    })

    // If planner selected, add them to event_access
    if (selectedPlanner) {
      await supabase.from('event_access').insert({
        event_id: event.id,
        user_id: selectedPlanner.id,
        role: 'coordinator',
        invited_by: user.id,
        accepted_at: null,
      })
    }

    showToast({ type: 'success', title: 'Event created!' })
    setSaving(false)
    navigate(`/events/${event.slug || event.id}`)
  }

  return (
    <div className={styles.page}>
      <PageHero icon={Calendar} title="Create Event" subtitle="Set up your event and build your team." />

      <div className={styles.stepsIndicator}>
        <div className={`${styles.step} ${step === 'details' ? styles.stepActive : ''}`}>1. Event Details</div>
        <div className={styles.stepConnector} />
        <div className={`${styles.step} ${step === 'team' ? styles.stepActive : ''}`}>2. Find a Planner</div>
        <div className={styles.stepConnector} />
        <div className={`${styles.step} ${step === 'review' ? styles.stepActive : ''}`}>3. Review</div>
      </div>

      <div className={styles.formCard}>
        {step === 'details' && (
          <div className={styles.formContent}>
            <div className={styles.field}>
              <label className={styles.label}>Event name *</label>
              <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah & John's Wedding" />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Event type *</label>
              <div className={styles.typeGrid}>
                {EVENT_TYPES.map((t) => (
                  <button
                    key={t}
                    className={`${styles.typeChip} ${eventType === t ? styles.typeChipActive : ''}`}
                    onClick={() => setEventType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Event date</label>
                <input className={styles.input} type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Guest count</label>
                <input className={styles.input} type="number" value={guestCount || ''} onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)} placeholder="0" />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Venue name</label>
              <input className={styles.input} value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="e.g. Eko Convention Centre" />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Description / Notes</label>
              <textarea className={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what you need..." rows={3} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Budget range</label>
              <input className={styles.input} value={budgetRange} onChange={(e) => setBudgetRange(e.target.value)} placeholder="e.g. 500,000 - 1,000,000" />
            </div>

            <div className={styles.navBtns}>
              <button className="btn btn-primary" onClick={() => setStep('team')}>Continue <Plus size={16} /></button>
            </div>
          </div>
        )}

        {step === 'team' && (
          <div className={styles.formContent}>
            <h3 className={styles.sectionTitle}>Find a Planner (optional)</h3>
            <p className={styles.hint}>Select a planner to manage your event. They'll handle coordination, vendors, and the team.</p>

            <div className={styles.field}>
              <label className={styles.label}>Search planners</label>
              <div className={styles.searchWrap}>
                <Search size={14} className={styles.searchIcon} />
                <input className={styles.searchInput} value={plannerSearch} onChange={(e) => searchPlanners(e.target.value)} placeholder="Search by organization name..." />
              </div>
            </div>

            {planners.length > 0 && (
              <div className={styles.plannerList}>
                {planners.map((p) => (
                  <label key={p.id} className={`${styles.plannerItem} ${selectedPlanner?.id === p.id ? styles.plannerItemActive : ''}`}>
                    <input
                      type="radio"
                      name="planner"
                      checked={selectedPlanner?.id === p.id}
                      onChange={() => setSelectedPlanner(p)}
                    />
                    <div>
                      <div className={styles.plannerName}>{p.display_name || 'Unknown'}</div>
                      <div className={styles.plannerOrg}>{p.org_name}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className={styles.navBtns}>
              <button className="btn btn-secondary" onClick={() => setStep('details')}>Back</button>
              <button className="btn btn-primary" onClick={() => setStep('review')}>Review <Plus size={16} /></button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className={styles.formContent}>
            <h3 className={styles.sectionTitle}>Review your event</h3>
            <div className={styles.reviewGrid}>
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Event name</span>
                <span className={styles.reviewValue}>{name || '—'}</span>
              </div>
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Type</span>
                <span className={styles.reviewValue}>{eventType || '—'}</span>
              </div>
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Date</span>
                <span className={styles.reviewValue}>{eventDate || '—'}</span>
              </div>
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Venue</span>
                <span className={styles.reviewValue}>{venueName || '—'}</span>
              </div>
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Guests</span>
                <span className={styles.reviewValue}>{guestCount || '—'}</span>
              </div>
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Planner</span>
                <span className={styles.reviewValue}>{selectedPlanner?.display_name || selectedPlanner?.org_name || 'None selected'}</span>
              </div>
            </div>

            <div className={styles.navBtns}>
              <button className="btn btn-secondary" onClick={() => setStep('team')}>Back</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
