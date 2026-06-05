import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { CalendarModal } from '@/components/ui/CalendarModal'
import { TimeModal } from '@/components/ui/TimeModal'
import { Calendar, Clock } from 'lucide-react'
import type { Event } from '@/types'

interface EditEventModalProps {
  event: Event
  onClose: () => void
  onSaved: (updated: Partial<Event>) => void
}

const SIZE_TIERS = [
  { value: 'intimate', label: 'Intimate (1–50)' },
  { value: 'standard', label: 'Standard (51–200)' },
  { value: 'large', label: 'Large (200+)' },
]

export function EditEventModal({ event, onClose, onSaved }: EditEventModalProps) {
  const showNotification = useUIStore((s) => s.showNotification)
  const [saving, setSaving] = useState(false)
  const [showEventDateCal, setShowEventDateCal] = useState(false)
  const [showEndDateCal, setShowEndDateCal] = useState(false)
  const [showEventTimeCal, setShowEventTimeCal] = useState(false)
  const [showEndTimeCal, setShowEndTimeCal] = useState(false)

  const formatTime12h = (time24: string) => {
    if (!time24) return 'Select Time'
    const [hStr, mStr] = time24.split(':')
    const h = parseInt(hStr, 10)
    const m = parseInt(mStr, 10)
    const period = h >= 12 ? 'PM' : 'AM'
    let h12 = h % 12
    if (h12 === 0) h12 = 12
    return `${h12}:${String(m).padStart(2, '0')} ${period}`
  }
  
  const [form, setForm] = useState({
    name: event.name,
    event_type: event.event_type || '',
    event_date: event.event_date ? event.event_date.slice(0, 16) : '',
    end_date: event.end_date ? event.end_date.slice(0, 16) : '',
    venue_name: event.venue_name || '',
    venue_address: event.venue_address || '',
    guest_count: event.guest_count?.toString() || '',
    size_tier: event.size_tier || 'standard',
    budget_total: event.budget_total ? (event.budget_total / 100).toString() : '',
    notes: event.notes || '',
  })

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const eventDatePart = form.event_date ? form.event_date.split('T')[0] : ''
  const eventTimePart = form.event_date && form.event_date.includes('T') ? form.event_date.split('T')[1] : ''

  const endDatePart = form.end_date ? form.end_date.split('T')[0] : ''
  const endTimePart = form.end_date && form.end_date.includes('T') ? form.end_date.split('T')[1] : ''

  const handleDateChange = (field: 'event_date' | 'end_date', newDate: string) => {
    const currentVal = form[field]
    const timePart = currentVal && currentVal.includes('T') ? currentVal.split('T')[1] : '09:00'
    handleChange(field, `${newDate}T${timePart}`)
  }

  const handleTimeChange = (field: 'event_date' | 'end_date', newTime: string) => {
    const currentVal = form[field]
    const datePart = currentVal ? currentVal.split('T')[0] : new Date().toISOString().split('T')[0]
    handleChange(field, `${datePart}T${newTime}`)
  }

  const handleSave = async () => {
    setSaving(true)
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      event_type: form.event_type.trim() || null,
      event_date: form.event_date ? new Date(form.event_date).toISOString() : null,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      venue_name: form.venue_name.trim() || null,
      venue_address: form.venue_address.trim() || null,
      guest_count: form.guest_count ? parseInt(form.guest_count, 10) : null,
      size_tier: form.size_tier || null,
      budget_total: form.budget_total ? Math.round(parseFloat(form.budget_total) * 100) : null,
      notes: form.notes.trim() || null,
    }

    const { error } = await supabase.from('events').update(payload).eq('id', event.id)
    if (error) {
      showNotification({ variant: 'error', title: 'Failed to save', message: error.message })
    } else {
      onSaved(payload as Partial<Event>)
      showNotification({ variant: 'success', title: 'Event updated' })
      onClose()
    }
    setSaving(false)
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [saving, onClose])

  return (
    <div className="overlay" onClick={() => !saving && onClose()}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-card-header">
          <div className="modal-card-title">Edit Event</div>
          <button className="modal-card-close" onClick={onClose} disabled={saving}>
            &times;
          </button>
        </div>
        <div className="modal-card-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Event Name</label>
              <input className="input" value={form.name} onChange={(e) => handleChange('name', e.target.value)} disabled={saving} />
            </div>
            <div>
              <label className="label">Event Type</label>
              <input className="input" value={form.event_type} onChange={(e) => handleChange('event_type', e.target.value)} disabled={saving} placeholder="e.g. Corporate Event" />
            </div>
            <div>
              <label className="label">Size Tier</label>
              <DropdownMenu
                trigger={SIZE_TIERS.find((t) => t.value === form.size_tier)?.label || 'Select Size Tier'}
                items={SIZE_TIERS}
                onSelect={(item) => handleChange('size_tier', item.value)}
                disabled={saving}
              />
            </div>
            <div>
              <label className="label">Event Date</label>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  type="button"
                  className="input"
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 40,
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-2) var(--space-3)',
                    color: eventDatePart ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  }}
                  onClick={() => setShowEventDateCal(true)}
                  disabled={saving}
                >
                  {eventDatePart ? new Date(eventDatePart + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select Date'}
                  <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
                </button>
                <button
                  type="button"
                  className="input"
                  style={{
                    width: 120,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 40,
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-2) var(--space-3)',
                    color: eventTimePart ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  }}
                  onClick={() => setShowEventTimeCal(true)}
                  disabled={saving}
                >
                  {formatTime12h(eventTimePart)}
                  <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />
                </button>
              </div>
            </div>
            <div>
              <label className="label">End Date</label>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  type="button"
                  className="input"
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 40,
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-2) var(--space-3)',
                    color: endDatePart ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  }}
                  onClick={() => setShowEndDateCal(true)}
                  disabled={saving}
                >
                  {endDatePart ? new Date(endDatePart + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select Date'}
                  <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
                </button>
                <button
                  type="button"
                  className="input"
                  style={{
                    width: 120,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 40,
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-2) var(--space-3)',
                    color: endTimePart ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  }}
                  onClick={() => setShowEndTimeCal(true)}
                  disabled={saving}
                >
                  {formatTime12h(endTimePart)}
                  <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />
                </button>
              </div>
            </div>
            <div>
              <label className="label">Venue Name</label>
              <input className="input" value={form.venue_name} onChange={(e) => handleChange('venue_name', e.target.value)} disabled={saving} />
            </div>
            <div>
              <label className="label">Guest Count</label>
              <input className="input" type="number" min="0" value={form.guest_count} onChange={(e) => handleChange('guest_count', e.target.value)} disabled={saving} />
            </div>
            <div>
              <label className="label">Budget (₦)</label>
              <input className="input" type="number" min="0" step="1000" value={form.budget_total} onChange={(e) => handleChange('budget_total', e.target.value)} disabled={saving} placeholder="e.g. 500000" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Venue Address</label>
              <input className="input" value={form.venue_address} onChange={(e) => handleChange('venue_address', e.target.value)} disabled={saving} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Notes</label>
              <textarea className="input" rows={3} value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} disabled={saving} style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          </div>
      <CalendarModal
        open={showEventDateCal}
        value={eventDatePart}
        onChange={(d) => handleDateChange('event_date', d)}
        onClose={() => setShowEventDateCal(false)}
      />
      <CalendarModal
        open={showEndDateCal}
        value={endDatePart}
        onChange={(d) => handleDateChange('end_date', d)}
        onClose={() => setShowEndDateCal(false)}
      />
      <TimeModal
        open={showEventTimeCal}
        value={eventTimePart}
        onChange={(t) => handleTimeChange('event_date', t)}
        onClose={() => setShowEventTimeCal(false)}
      />
      <TimeModal
        open={showEndTimeCal}
        value={endTimePart}
        onChange={(t) => handleTimeChange('end_date', t)}
        onClose={() => setShowEndTimeCal(false)}
      />
        </div>
      </div>
    </div>
  )
}
