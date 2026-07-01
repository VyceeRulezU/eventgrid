import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { PageHero } from '@/components/shared/PageHero'
import styles from './ClientRequestQuotePage.module.css'

const ROLES = [
  { value: 'planner', label: 'Planners', desc: 'Full-service event planning & management' },
  { value: 'coordinator', label: 'Coordinators', desc: 'On-the-day coordination & logistics' },
  { value: 'vendor', label: 'Vendors', desc: 'Catering, decor, photography & more' },
]

export function ClientRequestQuotePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const showToast = useUIStore((s) => s.showToast)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [guestCount, setGuestCount] = useState('')
  const [budgetRange, setBudgetRange] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  const toggleRole = (role: string) => {
    const next = new Set(selectedRoles)
    if (next.has(role)) next.delete(role)
    else next.add(role)
    setSelectedRoles(next)
  }

  const handleSubmit = async () => {
    if (!user) return
    if (!title.trim()) {
      showToast({ type: 'warning', title: 'Title is required' })
      return
    }
    if (selectedRoles.size === 0) {
      showToast({ type: 'warning', title: 'Select at least one role' })
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from('client_quote_requests')
      .insert({
        client_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        event_type: eventType || null,
        event_date: eventDate || null,
        guest_count: guestCount ? parseInt(guestCount) : null,
        budget_range: budgetRange || null,
        preferred_roles: [...selectedRoles],
        status: 'open',
      })

    if (error) {
      showToast({ type: 'error', title: 'Failed to create request', body: error.message })
      setSaving(false)
      return
    }

    showToast({ type: 'success', title: 'Quote request sent!', body: 'Providers will be able to view and respond.' })
    setSaving(false)
    navigate('/dashboard/client')
  }

  return (
    <div className={styles.page}>
      <PageHero icon={FileText} title="Request a Quote" subtitle="Get responses from planners, coordinators, and vendors." />

      <div className={styles.formCard}>
        <div className={styles.formContent}>
          <div className={styles.field}>
            <label className={styles.label}>Title *</label>
            <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Help planning my wedding" />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Describe what you need</label>
            <textarea className={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell providers about your event, what services you're looking for..." rows={4} />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Event type</label>
              <input className={styles.input} value={eventType} onChange={(e) => setEventType(e.target.value)} placeholder="e.g. Wedding, Birthday" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Event date</label>
              <input className={styles.input} type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Guest count</label>
              <input className={styles.input} type="number" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} placeholder="e.g. 100" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Budget range</label>
              <input className={styles.input} value={budgetRange} onChange={(e) => setBudgetRange(e.target.value)} placeholder="e.g. 500k - 1M" />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Who do you need? *</label>
            <div className={styles.roleGrid}>
              {ROLES.map((r) => (
                <label key={r.value} className={`${styles.roleCard} ${selectedRoles.has(r.value) ? styles.roleCardActive : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedRoles.has(r.value)}
                    onChange={() => toggleRole(r.value)}
                    className={styles.roleCheckbox}
                  />
                  <div className={styles.roleInfo}>
                    <div className={styles.roleLabel}>{r.label}</div>
                    <div className={styles.roleDesc}>{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.navBtns}>
            <button className="btn btn-secondary" onClick={() => navigate('/dashboard/client')}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
