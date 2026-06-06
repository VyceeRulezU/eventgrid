import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { DropdownMenu } from '@/components/ui/DropdownMenu'

interface AddVendorModalProps {
  orgId: string
  availableTypes: string[]
  defaultCategory: string
  onClose: () => void
  onSaved: (vendor: import('@/types').Vendor) => void
}

const RATINGS = [
  { value: '0', label: 'No rating' },
  { value: '1', label: '1 Star' },
  { value: '2', label: '2 Stars' },
  { value: '3', label: '3 Stars' },
  { value: '4', label: '4 Stars' },
  { value: '5', label: '5 Stars' },
]

export function AddVendorModal({ orgId, availableTypes, defaultCategory, onClose, onSaved }: AddVendorModalProps) {
  const showNotification = useUIStore((s) => s.showNotification)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    category: defaultCategory,
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    instagram: '',
    rating: '0',
    notes: '',
  })

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)

    const { data, error } = await supabase
      .from('vendors')
      .insert({
        org_id: orgId,
        name: form.name.trim(),
        category: form.category,
        contact_name: form.contact_name.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        instagram: form.instagram.trim() || null,
        rating: form.rating !== '0' ? parseInt(form.rating, 10) : null,
        notes: form.notes.trim() || null,
      })
      .select()
      .single()

    setSaving(false)

    if (error) {
      showNotification({ variant: 'error', title: 'Failed to add vendor', message: error.message })
      return
    }

    onSaved(data as unknown as import('@/types').Vendor)
    showNotification({ variant: 'success', title: `"${form.name.trim()}" added` })
    onClose()
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
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-card-header">
          <div className="modal-card-title">Add Vendor</div>
          <button className="modal-card-close" onClick={onClose} disabled={saving}><X size={20} /></button>
        </div>
        <div className="modal-card-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label className="label">Category</label>
              <DropdownMenu
                trigger={form.category}
                items={availableTypes.map((t) => ({ label: t, value: t }))}
                onSelect={(item) => setForm({ ...form, category: item.value })}
                disabled={saving}
              />
            </div>
            <div>
              <label className="label">Rating</label>
              <DropdownMenu
                trigger={RATINGS.find((r) => r.value === form.rating)?.label || 'No rating'}
                items={RATINGS}
                onSelect={(item) => setForm({ ...form, rating: item.value })}
                disabled={saving}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Vendor Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={saving} placeholder="Vendor name" />
            </div>
            <div>
              <label className="label">Contact Name</label>
              <input className="input" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} disabled={saving} placeholder="Contact person" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={saving} placeholder="Phone number" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={saving} placeholder="Email address" />
            </div>
            <div>
              <label className="label">Instagram</label>
              <input className="input" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} disabled={saving} placeholder="@handle" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Notes</label>
              <textarea className="input" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} disabled={saving} style={{ resize: 'vertical' }} placeholder="Optional notes..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving...' : 'Save Vendor'}
            </button>
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
