import { useState, useEffect, useRef } from 'react'
import { X, Search, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { sendInvite } from '@/lib/edgeFunctions'

interface AddVendorModalProps {
  orgId: string
  availableTypes: string[]
  defaultCategory: string
  existingVendors?: import('@/types').Vendor[]
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
  const user = useAuthStore((s) => s.user)
  const [mode, setMode] = useState<'search' | 'create'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<import('@/types').Vendor[]>([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [bulkNote, setBulkNote] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
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

  useEffect(() => {
    if (searchQuery.trim().length < 1) { setSearchResults([]); setSearching(false); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const q = searchQuery.trim()
      const { data } = await supabase
        .from('vendors')
        .select('*')
        .or(`name.ilike.%${q}%,email.ilike.%${q}%,contact_name.ilike.%${q}%,phone.ilike.%${q}%`)
        .is('deleted_at', null)
        .order('name', { ascending: true })
        .limit(10)
      const raw = (data || []) as unknown as import('@/types').Vendor[]
      const seen = new Set<string>()
      const deduped = raw.filter((v) => {
        if (v.category === 'Coordinator' && v.email) {
          const key = v.email.toLowerCase()
          if (seen.has(key)) return false
          seen.add(key)
        }
        return true
      })
      setSearchResults(deduped)
      setSearching(false)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery])

  const handleCreateNew = () => {
    setForm(f => ({ ...f, name: searchQuery }))
    setMode('create')
    setSearchResults([])
  }

  const handleSelectExisting = (vendor: import('@/types').Vendor) => {
    onSaved(vendor)
    setAddedIds((prev) => new Set(prev).add(vendor.id))
    setBulkNote(`"${vendor.name}" added`)
    setTimeout(() => setBulkNote(''), 2000)
  }

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
      setSaving(false)
      return
    }
    onSaved(data as unknown as import('@/types').Vendor)
    showNotification({ variant: 'success', title: `"${form.name.trim()}" added` })

    if (form.email.trim()) {
      const { error: inviteError } = await sendInvite({
        type: 'vendor_welcome',
        email: form.email.trim(),
        vendor_name: form.name.trim(),
        invited_by_name: user?.user_metadata?.display_name || user?.email || 'A planner',
      })
      if (inviteError) {
        console.error('Failed to send vendor welcome email:', inviteError)
      }
    }

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
          <div className="modal-card-title">{mode === 'search' ? 'Add Vendor' : 'Create New Vendor'}</div>
          <button className="modal-card-close" onClick={onClose} disabled={saving} data-tooltip="Close"><X size={20} /></button>
        </div>
        <div className="modal-card-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {mode === 'search' ? (
            <>
              <div className="input-wrapper">
                <label className="label">Search existing vendors</label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                  <input
                    ref={searchRef}
                    className="input"
                    style={{ paddingLeft: 36 }}
                    placeholder="Search by name, email, or contact..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              {bulkNote && (
                <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-success-bg, var(--color-accent-muted))', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--color-accent)', fontWeight: 500, textAlign: 'center' }}>
                  {bulkNote}
                </div>
              )}

              {searchQuery.trim().length >= 1 && searching && (
                <div style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-4)', color: 'var(--color-text-muted)' }}>
                  <div style={{ fontSize: 'var(--text-sm)' }}>Searching vendors...</div>
                </div>
              )}

              {searchQuery.trim().length >= 1 && !searching && searchResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-4)', color: 'var(--color-text-muted)' }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>No vendors found</div>
                  <div style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-3)' }}>No existing vendor matches your search.</div>
                  <button className="btn btn-primary btn-sm" onClick={handleCreateNew}>
                    <Plus size={14} /> Create "{searchQuery}"
                  </button>
                </div>
              )}

              {searchResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  {searchResults.map((vendor) => (
                    <div
                      key={vendor.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                        padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border-subtle)',
                        background: 'var(--color-surface-3)', cursor: 'pointer',
                      }}
                      onClick={() => handleSelectExisting(vendor)}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: 'var(--radius-full)',
                        background: 'var(--color-accent-muted)', color: 'var(--color-accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 'var(--text-sm)', fontWeight: 700, flexShrink: 0,
                      }}>
                        {(vendor.name || '?')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{vendor.name}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          {vendor.category}{vendor.email ? ` · ${vendor.email}` : ''}{vendor.phone ? ` · ${vendor.phone}` : ''}
                        </div>
                      </div>
                      {addedIds.has(vendor.id) ? (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          Added
                        </span>
                      ) : (
                        <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); handleSelectExisting(vendor) }}>
                          <Plus size={12} /> Add
                        </button>
                      )}
                    </div>
                  ))}
                  <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'center', marginTop: 'var(--space-2)' }} onClick={handleCreateNew}>
                    <Plus size={14} /> Create new vendor instead
                  </button>
                </div>
              )}

              {!searchQuery.trim() && (
                <div style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-4)', color: 'var(--color-text-muted)' }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Search or create</div>
                  <div style={{ fontSize: 'var(--text-xs)' }}>Search for an existing vendor or type a name to create one.</div>
                </div>
              )}
            </>
          ) : (
            <>
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
                <button className="btn btn-ghost" onClick={() => setMode('search')} disabled={saving}>Back to Search</button>
                <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
