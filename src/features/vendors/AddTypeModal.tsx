import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'

interface AddTypeModalProps {
  orgId: string
  onClose: () => void
  onSaved: (vendor: import('@/types').Vendor) => void
}

export function AddTypeModal({ orgId, onClose, onSaved }: AddTypeModalProps) {
  const showNotification = useUIStore((s) => s.showNotification)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)

    const { data, error } = await supabase
      .from('vendors')
      .insert({
        org_id: orgId,
        name: '',
        category: name.trim(),
      })
      .select()
      .single()

    setSaving(false)

    if (error) {
      showNotification({ variant: 'error', title: 'Failed to add type', message: error.message })
      return
    }

    onSaved(data as unknown as import('@/types').Vendor)
    showNotification({ variant: 'success', title: `Vendor type "${name.trim()}" added` })
    onClose()
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && name.trim() && !saving) handleSave()
      if (e.key === 'Escape' && !saving) onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [saving, onClose, name])

  return (
    <div className="overlay" onClick={() => !saving && onClose()}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-card-header">
          <div className="modal-card-title">Add Vendor Type</div>
          <button className="modal-card-close" onClick={onClose} disabled={saving} data-tooltip="Close"><X size={20} /></button>
        </div>
        <div className="modal-card-body">
          <label className="label">Category Name</label>
          <input
            className="input"
            placeholder="e.g. DJ, Caterer, Decor..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? 'Adding...' : 'Add Type'}
            </button>
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
