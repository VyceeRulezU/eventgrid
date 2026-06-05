import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { CalendarModal } from '@/components/ui/CalendarModal'
import { Calendar } from 'lucide-react'
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
              <select className="input" value={form.size_tier} onChange={(e) => handleChange('size_tier', e.target.value)} disabled={saving}>
                {SIZE_TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Event Date</label>
              <input className="input" type="datetime-local" value={form.event_date} onChange={(e) => handleChange('event_date', e.target.value)} disabled={saving} />
            </div>
            <div>
              <label className="label">End Date</label>
              <input className="input" type="datetime-local" value={form.end_date} onChange={(e) => handleChange('end_date', e.target.value)} disabled={saving} />
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
        </div>
      </div>
    </div>
  )
}
