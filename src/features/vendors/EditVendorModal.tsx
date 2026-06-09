import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import type { Vendor } from '@/types'

const RATINGS = [
  { value: '0', label: 'No rating' },
  { value: '1', label: '1 Star' },
  { value: '2', label: '2 Stars' },
  { value: '3', label: '3 Stars' },
  { value: '4', label: '4 Stars' },
  { value: '5', label: '5 Stars' },
]

interface EditVendorModalProps {
  vendor: Vendor
  availableTypes: string[]
  onClose: () => void
  onSaved: (updated: Vendor) => void
}

export function EditVendorModal({ vendor, availableTypes, onClose, onSaved }: EditVendorModalProps) {
  const showNotification = useUIStore((s) => s.showNotification)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    category: vendor.category,
    name: vendor.name,
    contact_name: vendor.contact_name || '',
    phone: vendor.phone || '',
    email: vendor.email || '',
    instagram: vendor.instagram || '',
    rating: vendor.rating?.toString() || '0',
    notes: vendor.notes || '',
  })

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    const payload: Record<string, unknown> = {
      category: form.category,
      name: form.name.trim(),
      contact_name: form.contact_name.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      instagram: form.instagram.trim() || null,
      rating: form.rating !== '0' ? parseInt(form.rating, 10) : null,
      notes: form.notes.trim() || null,
    }

    const { data, error } = await supabase
      .from('vendors')
      .update(payload)
      .eq('id', vendor.id)
      .select()
      .single()

    if (error) {
      showNotification({ variant: 'error', title: 'Failed to save', message: error.message })
    } else {
      onSaved(data as unknown as Vendor)
      showNotification({ variant: 'success', title: 'Vendor updated' })
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
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-card-header">
          <div className="modal-card-title">Edit Vendor</div>
          <button className="modal-card-close" onClick={onClose} disabled={saving} data-tooltip="Close"><X size={20} /></button>
        </div>
        <div className="modal-card-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label className="label">Category</label>
              <DropdownMenu
                trigger={form.category}
                items={availableTypes.map((t) => ({ label: t, value: t }))}
                onSelect={(item) => handleChange('category', item.value)}
                disabled={saving}
              />
            </div>
            <div>
              <label className="label">Rating</label>
              <DropdownMenu
                trigger={RATINGS.find((r) => r.value === form.rating)?.label || 'No rating'}
                items={RATINGS}
                onSelect={(item) => handleChange('rating', item.value)}
                disabled={saving}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Vendor Name</label>
              <input className="input" value={form.name} onChange={(e) => handleChange('name', e.target.value)} disabled={saving} />
            </div>
            <div>
              <label className="label">Contact Name</label>
              <input className="input" value={form.contact_name} onChange={(e) => handleChange('contact_name', e.target.value)} disabled={saving} placeholder="Contact person" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} disabled={saving} placeholder="Phone number" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} disabled={saving} placeholder="Email address" />
            </div>
            <div>
              <label className="label">Instagram</label>
              <input className="input" value={form.instagram} onChange={(e) => handleChange('instagram', e.target.value)} disabled={saving} placeholder="@handle" />
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
