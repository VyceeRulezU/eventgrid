import { useEffect, useState } from 'react'
import { Users, Plus, Search, Pencil, Star, Trash2, Phone, Mail, Building, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import type { Vendor } from '@/types'

const DEFAULT_TYPES = [
  'Wedding planner', 'Venue', 'Decor', 'DJ/Sound/Konga',
  'Ambiance lighting/special effects', 'VIP chairs', 'Drinks (exclusive of hard liquor)',
  'Chilling of drinks', 'LED Screens (live feed)', 'Food + 20% SC', 'Extra food',
  'Small chops (20% service charge)', 'Packed food', 'MC', 'Hypeman', 'Ushers',
  'Photography', 'Videography', 'Live band', 'Cakes 5 tiers', 'Desserts', 'Security',
  'Cocktails/mocktails', 'After party grills', 'Wedding programmes',
  'Extra hours (3 hour)', 'Hotel Accommodation', 'Popsicles', 'Hair', 'Makeup',
  'Wedding dress', 'Stylist', 'Miscellaneous', 'Extra table decor', 'Boutonniere',
]

export function VendorDirectoryPage() {
  const user = useAuthStore((s) => s.user)
  const showNotification = useUIStore((s) => s.showNotification)

  const [vendors, setVendors] = useState<(Vendor & { org_name?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [form, setForm] = useState({
    category: DEFAULT_TYPES[0],
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    rating: 0,
    notes: '',
  })

  useEffect(() => {
    if (!user) { setLoading(false); return }

    async function load() {
      // Left join (no !inner) so vendors without an org row still appear.
      // RLS on the vendors table must allow SELECT for all authenticated roles.
      const { data } = await supabase
        .from('vendors')
        .select('*, organizations(name)')
        .is('deleted_at', null)
        .order('name', { ascending: true })

      if (data) {
        const seen = new Set<string>()
        const mapped = (data as unknown as Array<Record<string, unknown>>).map((v: Record<string, unknown>) => {
          const orgEntry = (v.organizations as { name: string } | null)
          return { ...v, org_name: orgEntry?.name || '' } as Vendor & { org_name?: string }
        }).filter((v: any) => {
          if (v.category === 'Coordinator' && v.email) {
            const key = `${v.org_id}-${v.email.toLowerCase()}`
            if (seen.has(key)) return false
            seen.add(key)
          }
          return true
        })
        setVendors(mapped)
      }
      setLoading(false)
    }

    load()
  }, [user])

  const availableTypes = [...new Set([...DEFAULT_TYPES, ...vendors.map((v) => v.category)])]

  const filtered = vendors.filter((v) => {
    const matchSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.contact_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.org_name || '').toLowerCase().includes(search.toLowerCase())
    const matchCategory = !categoryFilter || v.category === categoryFilter
    return matchSearch && matchCategory
  })

  /* ══════════════════════════════════════════════
     Vendor form / CRUD — scoped to user's org
     ══════════════════════════════════════════════ */
  const org = useAuthStore((s) => s.org)
  const resetForm = () => {
    setForm({ category: DEFAULT_TYPES[0], name: '', contact_name: '', phone: '', email: '', rating: 0, notes: '' })
    setEditingVendor(null)
  }

  const openEdit = (vendor: Vendor) => {
    if (vendor.org_id !== org?.id) {
      showNotification({ variant: 'warning', title: 'Read-only', message: 'You can only edit vendors from your own organization.' })
      return
    }
    setEditingVendor(vendor)
    setForm({
      category: vendor.category,
      name: vendor.name,
      contact_name: vendor.contact_name || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      rating: vendor.rating || 0,
      notes: vendor.notes || '',
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      showNotification({ variant: 'warning', title: 'Missing fields', message: 'Vendor name is required' })
      return
    }

    const duplicate = vendors.find(
      (v) =>
        v.name.toLowerCase() === form.name.trim().toLowerCase() &&
        v.category === form.category &&
        v.id !== editingVendor?.id
    )
    if (duplicate) {
      showNotification({ variant: 'warning', title: 'Duplicate vendor', message: `"${form.name.trim()}" already exists under "${form.category}".` })
      return
    }

    setSaving(true)

    if (editingVendor) {
      const { error } = await supabase
        .from('vendors')
        .update({
          name: form.name.trim(),
          category: form.category,
          contact_name: form.contact_name || null,
          phone: form.phone || null,
          email: form.email || null,
          rating: form.rating || null,
          notes: form.notes || null,
        })
        .eq('id', editingVendor.id)

      setSaving(false)

      if (error) {
        showNotification({ variant: 'error', title: 'Failed to update', message: error.message })
        return
      }

      setVendors(vendors.map((v) => (v.id === editingVendor.id ? { ...v, ...form, rating: form.rating || null } : v)))
      showNotification({ variant: 'success', title: 'Vendor updated' })
    } else {
      const { data, error } = await supabase
        .from('vendors')
        .insert({
          org_id: org!.id,
          name: form.name.trim(),
          category: form.category,
          contact_name: form.contact_name || null,
          phone: form.phone || null,
          email: form.email || null,
          rating: form.rating || null,
          notes: form.notes || null,
        })
        .select()
        .single()

      setSaving(false)

      if (error) {
        showNotification({ variant: 'error', title: 'Failed to add', message: error.message })
        return
      }

      if (data) {
        const newVendor = { ...data as unknown as Vendor, org_name: org?.name || 'My Organization' }
        setVendors([newVendor, ...vendors])
      }
      showNotification({ variant: 'success', title: 'Vendor added' })
    }

    resetForm()
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    const vendor = vendors.find(v => v.id === id)
    if (vendor && vendor.org_id !== org?.id) {
      showNotification({ variant: 'warning', title: 'Permission denied', message: 'You can only delete vendors from your own organization.' })
      return
    }

    const { error } = await supabase
      .from('vendors')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      showNotification({ variant: 'error', title: 'Failed to delete', message: error.message })
      return
    }

    setVendors(vendors.filter((v) => v.id !== id))
    showNotification({ variant: 'success', title: 'Vendor deleted' })
  }

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={12}
            style={{
              color: star <= rating ? 'var(--color-accent)' : 'var(--color-surface-3)',
              fill: star <= rating ? 'var(--color-accent)' : 'transparent',
            }}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div>
        <div className="skeleton skeleton-card" style={{ height: 80, marginBottom: 'var(--space-4)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-card" style={{ height: 200 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <h2 style={{ marginBottom: 0 }}>Vendor Directory</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus size={16} />
          Add Vendor
        </button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        <div className="input-wrapper" style={{ flex: 1, minWidth: 200, maxWidth: 320 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              className="input"
              style={{ paddingLeft: 'var(--space-10)' }}
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div style={{ minWidth: 180, maxWidth: 220 }}>
          <DropdownMenu
            trigger={categoryFilter || 'All Categories'}
            items={[{ label: 'All Categories', value: '' }, ...availableTypes.map((t) => ({ label: t, value: t }))]}
            onSelect={(item) => setCategoryFilter(item.value)}
          />
        </div>
      </div>

      {showForm && (
        <div className="overlay" onClick={() => { if (!saving) { resetForm(); setShowForm(false) } }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-card-header">
              <div className="modal-card-title">{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</div>
              <button className="modal-card-close" onClick={() => { resetForm(); setShowForm(false) }} disabled={saving}><X size={20} /></button>
            </div>
            <div className="modal-card-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="input-wrapper" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Vendor Name</label>
                  <input className="input" placeholder="Vendor name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Category</label>
                  <DropdownMenu
                    trigger={form.category}
                    items={availableTypes.map((t) => ({ label: t, value: t }))}
                    onSelect={(item) => setForm({ ...form, category: item.value })}
                  />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Rating (1-5)</label>
                  <input className="input" type="number" min={0} max={5} placeholder="0" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Contact Name</label>
                  <input className="input" placeholder="Contact person" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Phone</label>
                  <input className="input" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Email</label>
                  <input className="input" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="input-wrapper" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Notes</label>
                  <textarea className="input" style={{ minHeight: 80, resize: 'vertical' }} placeholder="Additional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : editingVendor ? 'Update' : 'Save'}
                </button>
                <button className="btn btn-ghost" onClick={() => { resetForm(); setShowForm(false) }} disabled={saving}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {filtered.map((vendor) => (
            <div key={vendor.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {vendor.name || 'Unnamed vendor'}
                  </div>
                  <span className="badge badge-medium" style={{ fontSize: 'var(--text-xs)' }}>
                    {vendor.category}
                  </span>
                </div>
                {vendor.org_id === org?.id && (
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(vendor)} aria-label="Edit" style={{ width: 32, minHeight: 32 }}>
                      <Pencil size={12} />
                    </button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDelete(vendor.id)} aria-label="Delete" style={{ width: 32, minHeight: 32, color: 'var(--color-error)' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>

              {vendor.org_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: vendor.org_id === org?.id ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                  <Building size={11} />
                  {vendor.org_name}
                  {vendor.org_id === org?.id && (
                    <span style={{ marginLeft: 4, padding: '1px 6px', borderRadius: 'var(--radius-full)', background: 'var(--color-accent-muted)', color: 'var(--color-accent)', fontSize: 10, fontWeight: 600 }}>
                      yours
                    </span>
                  )}
                </div>
              )}

              {vendor.rating ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  {renderStars(vendor.rating)}
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{vendor.rating}/5</span>
                </div>
              ) : null}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {vendor.contact_name && (
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    {vendor.contact_name}
                  </div>
                )}
                {vendor.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                    <Phone size={12} style={{ color: 'var(--color-text-muted)' }} />
                    {vendor.phone}
                  </div>
                )}
                {vendor.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                    <Mail size={12} style={{ color: 'var(--color-text-muted)' }} />
                    {vendor.email}
                  </div>
                )}
              </div>

              {vendor.notes && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-2)' }}>
                  {vendor.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__icon">
            <Users size={24} />
          </div>
          <div className="empty-state__title">No vendors found</div>
          <div className="empty-state__description">
            {search || categoryFilter ? 'Try a different search or filter' : 'Add your first vendor to the directory'}
          </div>
          {!search && !categoryFilter && (
            <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true) }}>
              <Plus size={16} />
              Add Vendor
            </button>
          )}
        </div>
      )}
    </div>
  )
}
