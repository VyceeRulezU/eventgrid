import { useEffect, useState, useMemo } from 'react'
import { LayoutGrid, List, Users, Plus, Pencil, Star, Trash2, Phone, Mail, Building, X, ChevronLeft, ChevronRight, BadgeCheck, Globe, GitMerge } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { AdminPageHero } from '@/components/shared/AdminPageHero'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { useSearch } from '@/hooks/useSearch'
import { SearchBar } from '@/components/shared/SearchBar'
import { sendInvite } from '@/lib/edgeFunctions'
import type { Vendor } from '@/types'
import styles from '@/features/vendors/VendorDirectoryPage.module.css'

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

export function AdminVendorDirectoryPage() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const showNotification = useUIStore((s) => s.showNotification)

  const [vendors, setVendors] = useState<(Vendor & { org_name?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const { query, setQuery, filtered: searched } = useSearch(vendors, ['name', 'category', 'contact_name', 'org_name'])
  const [showForm, setShowForm] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 15

  // Claims state
  const [myClaims, setMyClaims] = useState<any[]>([])
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [claimingVendor, setClaimingVendor] = useState<Vendor | null>(null)
  const [claimForm, setClaimForm] = useState({
    business_email: '',
    business_phone: '',
    website: '',
    proof_url: '',
  })

  // Edit suggestions state
  const [showSuggestModal, setShowSuggestModal] = useState(false)
  const [suggestingVendor, setSuggestingVendor] = useState<Vendor | null>(null)
  const [suggestForm, setSuggestForm] = useState({
    name: '',
    category: '',
    contact_name: '',
    phone: '',
    email: '',
    instagram: '',
    website: '',
    notes: '',
  })

  // Merge state (super admin only)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [targetVendorId, setTargetVendorId] = useState<string>('')
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([])

  const filtered = useMemo(() => {
    if (!categoryFilter) return searched
    return searched.filter((v) => v.category === categoryFilter)
  }, [searched, categoryFilter])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, page])

  useEffect(() => { setPage(1) }, [filtered.length])

  const [form, setForm] = useState({
    category: DEFAULT_TYPES[0],
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    rating: 0,
    notes: '',
    instagram: '',
    website: '',
  })

  useEffect(() => {
    if (!user) { setLoading(false); return }

    async function load() {
      // Left join so vendors without organizations still appear
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

      // Load user's claims
      const { data: claimsData } = await supabase
        .from('vendor_claims')
        .select('*')
        .eq('user_id', user?.id)
      if (claimsData) {
        setMyClaims(claimsData)
      }

      setLoading(false)
    }

    load()
  }, [user])

  const availableTypes = [...new Set([...DEFAULT_TYPES, ...vendors.map((v) => v.category)])]

  /* ══════════════════════════════════════════════
     Vendor form / CRUD — scoped to user's org
     ══════════════════════════════════════════════ */
  const org = useAuthStore((s) => s.org)
  const resetForm = () => {
    setForm({ 
      category: DEFAULT_TYPES[0], 
      name: '', 
      contact_name: '', 
      phone: '', 
      email: '', 
      rating: 0, 
      notes: '',
      instagram: '',
      website: '',
    })
    setEditingVendor(null)
  }

  const openEdit = (vendor: Vendor) => {
    const isOwner = vendor.claimed_by_vendor_id === user?.id && vendor.is_verified === true
    const isCreatorOrg = vendor.org_id === org?.id && vendor.is_verified === false
    const isSuperAdmin = role === 'super_admin'

    if (isOwner || isCreatorOrg || isSuperAdmin) {
      setEditingVendor(vendor)
      setForm({
        category: vendor.category,
        name: vendor.name,
        contact_name: vendor.contact_name || '',
        phone: vendor.phone || '',
        email: vendor.email || '',
        rating: vendor.rating || 0,
        notes: vendor.notes || '',
        instagram: vendor.instagram || '',
        website: vendor.website || '',
      })
      setShowForm(true)
    } else {
      setSuggestingVendor(vendor)
      setSuggestForm({
        name: vendor.name,
        category: vendor.category,
        contact_name: vendor.contact_name || '',
        phone: vendor.phone || '',
        email: vendor.email || '',
        instagram: vendor.instagram || '',
        website: vendor.website || '',
        notes: vendor.notes || '',
      })
      setShowSuggestModal(true)
    }
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
          instagram: form.instagram || null,
          website: form.website || null,
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
          instagram: form.instagram || null,
          website: form.website || null,
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
      }
      showNotification({ variant: 'success', title: 'Vendor added' })
    }

    resetForm()
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    const vendor = vendors.find(v => v.id === id)
    if (role !== 'super_admin' && vendor && vendor.org_id !== org?.id) {
      showNotification({ variant: 'warning', title: 'Permission denied', message: 'You can only delete vendors from your own organization.' })
      return
    }

    const { data, error } = await supabase
      .from('vendors')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select('id')

    if (error || !data || data.length === 0) {
      console.error('[VendorDirectoryPage] delete failed', { error, data, id })
      showNotification({ variant: 'error', title: 'Failed to delete', message: error?.message || 'No rows were updated. You may not have permission to delete this vendor.' })
      return
    }

    setVendors(vendors.filter((v) => v.id !== id))
    showNotification({ variant: 'success', title: 'Vendor deleted' })
  }

  const handleClaim = async () => {
    if (!claimingVendor || !user) return
    if (!claimForm.business_email.trim() && !claimForm.business_phone.trim()) {
      showNotification({ variant: 'warning', title: 'Missing info', message: 'Please enter a contact email or phone number to verify ownership.' })
      return
    }
    setSaving(true)
    const { data: claimData, error } = await supabase
      .from('vendor_claims')
      .insert({
        vendor_id: claimingVendor.id,
        user_id: user.id,
        business_email: claimForm.business_email.trim() || null,
        business_phone: claimForm.business_phone.trim() || null,
        proof_url: claimForm.proof_url.trim() || null,
        status: 'pending',
      })
      .select()
      .single()

    setSaving(false)
    if (error) {
      showNotification({ variant: 'error', title: 'Claim failed', message: error.message })
      return
    }
    if (claimData) {
      setMyClaims([...myClaims, claimData])
      showNotification({ variant: 'success', title: 'Claim submitted', message: 'Your ownership claim request has been submitted for verification.' })
    }
    setShowClaimModal(false)
    setClaimingVendor(null)
  }

  const handleSuggestEdit = async () => {
    if (!suggestingVendor || !user) return
    setSaving(true)
    const { error } = await supabase
      .from('vendor_edit_suggestions')
      .insert({
        vendor_id: suggestingVendor.id,
        suggested_by: user.id,
        suggested_data: {
          name: suggestForm.name.trim(),
          category: suggestForm.category,
          contact_name: suggestForm.contact_name.trim() || null,
          phone: suggestForm.phone.trim() || null,
          email: suggestForm.email.trim() || null,
          instagram: suggestForm.instagram.trim() || null,
          website: suggestForm.website.trim() || null,
          notes: suggestForm.notes.trim() || null,
        },
        status: 'pending',
      })

    setSaving(false)
    if (error) {
      showNotification({ variant: 'error', title: 'Failed to submit', message: error.message })
      return
    }
    showNotification({ variant: 'success', title: 'Suggestion submitted', message: 'Thank you! Your suggestion has been sent to the vendor owner and admin.' })
    setShowSuggestModal(false)
    setSuggestingVendor(null)
  }

  const handleMergeSelected = async () => {
    if (!targetVendorId) {
      showNotification({ variant: 'warning', title: 'Select Target', message: 'Please select which vendor profile should survive the merge.' })
      return
    }

    setSaving(true)
    const sourceIds = selectedVendorIds.filter(id => id !== targetVendorId)

    let successCount = 0
    let lastError = null

    for (const sourceId of sourceIds) {
      const { error } = await supabase.rpc('merge_vendors', {
        source_id: sourceId,
        target_id: targetVendorId,
      })
      if (error) {
        lastError = error
      } else {
        successCount++
      }
    }

    setSaving(false)

    if (lastError && successCount === 0) {
      showNotification({ variant: 'error', title: 'Merge failed', message: lastError.message })
      return
    }

    showNotification({ 
      variant: 'success', 
      title: 'Merge complete', 
      message: `Successfully merged ${successCount} duplicate profile(s) into the target.` 
    })

    setVendors(vendors.filter(v => !sourceIds.includes(v.id)))
    setSelectedVendorIds([])
    setShowMergeModal(false)
    setTargetVendorId('')
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
      <AdminPageHero
        icon={Building}
        title="Global Vendor Directory"
        subtitle="Manage and verify all vendor records on the platform"
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(true) }}>
            <Plus size={16} /> Add Vendor
          </button>
        }
      />

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <SearchBar value={query} onChange={setQuery} placeholder="Search vendors..." containerStyle={{ flex: 1, minWidth: 200, maxWidth: 320 }} />
          <div style={{ minWidth: 180, maxWidth: 220 }}>
            <DropdownMenu
              trigger={categoryFilter || 'All Categories'}
              items={[{ label: 'All Categories', value: '' }, ...availableTypes.map((t) => ({ label: t, value: t }))]}
              onSelect={(item) => setCategoryFilter(item.value)}
            />
          </div>
        </div>
        <div className={styles.toolbarRight}>
          <span className={styles.pageInfo}>{filtered.length} vendor{filtered.length !== 1 ? 's' : ''}</span>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewToggleBtn} ${view === 'grid' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setView('grid')}
              aria-label="Grid view"
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`${styles.viewToggleBtn} ${view === 'list' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setView('list')}
              aria-label="List view"
              title="List view"
            >
              <List size={16} />
            </button>
          </div>
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
              <div className={styles.formGrid}>
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
                <div className="input-wrapper">
                  <label className="input-label">Instagram</label>
                  <input className="input" placeholder="e.g. royal_bakes" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Website</label>
                  <input className="input" placeholder="e.g. royalbakes.com" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
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

      {showClaimModal && claimingVendor && (
        <div className="overlay" onClick={() => { if (!saving) { setShowClaimModal(false); setClaimingVendor(null) } }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-card-header">
              <div className="modal-card-title">Claim ownership of {claimingVendor.name}</div>
              <button className="modal-card-close" onClick={() => { setShowClaimModal(false); setClaimingVendor(null) }} disabled={saving}><X size={20} /></button>
            </div>
            <div className="modal-card-body">
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                Submit contact details to verify you are the authorized representative of this business.
              </p>
              <div className={styles.formGrid}>
                <div className="input-wrapper">
                  <label className="input-label">Official Email</label>
                  <input className="input" type="email" placeholder="e.g. contact@business.com" value={claimForm.business_email} onChange={(e) => setClaimForm({ ...claimForm, business_email: e.target.value })} />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Official Phone</label>
                  <input className="input" placeholder="e.g. +234..." value={claimForm.business_phone} onChange={(e) => setClaimForm({ ...claimForm, business_phone: e.target.value })} />
                </div>
                <div className="input-wrapper" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Website URL</label>
                  <input className="input" placeholder="e.g. business.com" value={claimForm.website} onChange={(e) => setClaimForm({ ...claimForm, website: e.target.value })} />
                </div>
                <div className="input-wrapper" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Verification Proof URL / Social Handle</label>
                  <input className="input" placeholder="e.g. instagram.com/business or corporate website URL" value={claimForm.proof_url} onChange={(e) => setClaimForm({ ...claimForm, proof_url: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleClaim} disabled={saving}>
                  {saving ? 'Submitting...' : 'Submit Claim'}
                </button>
                <button className="btn btn-ghost" onClick={() => { setShowClaimModal(false); setClaimingVendor(null) }} disabled={saving}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuggestModal && suggestingVendor && (
        <div className="overlay" onClick={() => { if (!saving) { setShowSuggestModal(false); setSuggestingVendor(null) } }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-card-header">
              <div className="modal-card-title">Suggest an Edit for {suggestingVendor.name}</div>
              <button className="modal-card-close" onClick={() => { setShowSuggestModal(false); setSuggestingVendor(null) }} disabled={saving}><X size={20} /></button>
            </div>
            <div className="modal-card-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                This is a verified listing. You can suggest edits to correct contact numbers, emails, or social profiles.
              </p>
              <div className={styles.formGrid}>
                <div className="input-wrapper" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Business Name</label>
                  <input className="input" value={suggestForm.name} onChange={(e) => setSuggestForm({ ...suggestForm, name: e.target.value })} />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Category</label>
                  <DropdownMenu
                    trigger={suggestForm.category}
                    items={availableTypes.map((t) => ({ label: t, value: t }))}
                    onSelect={(item) => setSuggestForm({ ...suggestForm, category: item.value })}
                  />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Contact Name</label>
                  <input className="input" value={suggestForm.contact_name} onChange={(e) => setSuggestForm({ ...suggestForm, contact_name: e.target.value })} />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Phone</label>
                  <input className="input" value={suggestForm.phone} onChange={(e) => setSuggestForm({ ...suggestForm, phone: e.target.value })} />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Email</label>
                  <input className="input" value={suggestForm.email} onChange={(e) => setSuggestForm({ ...suggestForm, email: e.target.value })} />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Instagram</label>
                  <input className="input" value={suggestForm.instagram} onChange={(e) => setSuggestForm({ ...suggestForm, instagram: e.target.value })} />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Website</label>
                  <input className="input" value={suggestForm.website} onChange={(e) => setSuggestForm({ ...suggestForm, website: e.target.value })} />
                </div>
                <div className="input-wrapper" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Corrected Details Notes</label>
                  <textarea className="input" style={{ minHeight: 80 }} placeholder="Please describe why this change is needed..." value={suggestForm.notes} onChange={(e) => setSuggestForm({ ...suggestForm, notes: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSuggestEdit} disabled={saving}>
                  {saving ? 'Submitting...' : 'Submit Suggestions'}
                </button>
                <button className="btn btn-ghost" onClick={() => { setShowSuggestModal(false); setSuggestingVendor(null) }} disabled={saving}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filtered.length > 0 ? (
        <>
          {view === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              {paginated.map((vendor) => (
                <div key={vendor.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-1)', minWidth: 0 }}>
                        {role === 'super_admin' && (
                          <input
                            type="checkbox"
                            checked={selectedVendorIds.includes(vendor.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedVendorIds([...selectedVendorIds, vendor.id])
                              } else {
                                setSelectedVendorIds(selectedVendorIds.filter(id => id !== vendor.id))
                              }
                            }}
                            style={{ cursor: 'pointer', accentColor: 'var(--color-accent)', margin: 0 }}
                          />
                        )}
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {vendor.name || 'Unnamed vendor'}
                        </div>
                        {vendor.is_verified && (
                          <span title="Verified business" style={{ display: 'inline-flex', flexShrink: 0 }}>
                            <BadgeCheck size={16} style={{ color: 'var(--color-accent)', fill: 'rgba(212,160,23,0.1)' }} />
                          </span>
                        )}
                      </div>
                      <span className="badge badge-medium" style={{ fontSize: 'var(--text-xs)' }}>
                        {vendor.category}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => openEdit(vendor)}
                        aria-label="Edit"
                        style={{ width: 32, minHeight: 32 }}
                        title={vendor.org_id === org?.id || role === 'super_admin' || (vendor.claimed_by_vendor_id === user?.id && vendor.is_verified) ? 'Edit details' : 'Suggest an edit'}
                      >
                        <Pencil size={12} />
                      </button>
                      {(vendor.org_id === org?.id || role === 'super_admin') && (
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDelete(vendor.id)} aria-label="Delete" style={{ width: 32, minHeight: 32, color: 'var(--color-error)' }}>
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
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
                    {vendor.website && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                        <Globe size={12} style={{ color: 'var(--color-text-muted)' }} />
                        <a href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
                          {vendor.website}
                        </a>
                      </div>
                    )}
                  </div>

                  {vendor.notes && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-2)' }}>
                      {vendor.notes}
                    </div>
                  )}

                  {!vendor.is_verified && (
                    <div style={{ marginTop: 'auto', paddingTop: 'var(--space-2)', borderTop: '1px dashed var(--color-border-subtle)' }}>
                      {myClaims.some(c => c.vendor_id === vendor.id && c.status === 'pending') ? (
                        <span style={{ fontSize: 11, color: 'var(--color-warning)', fontWeight: 500 }}>Claim pending validation</span>
                      ) : role === 'vendor' ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: 0, height: 'auto', minHeight: 'auto', color: 'var(--color-accent)', fontSize: 11 }}
                          onClick={() => { setClaimingVendor(vendor); setClaimForm({ business_email: vendor.email || '', business_phone: vendor.phone || '', website: vendor.website || '', proof_url: '' }); setShowClaimModal(true) }}
                        >
                          Claim this business
                        </button>
                      ) : (
                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Unclaimed profile</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.tableCard}>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead className={styles.thead}>
                    <tr>
                      {role === 'super_admin' && <th className={styles.th} style={{ width: 40 }}>Select</th>}
                      <th className={styles.th}>Type</th>
                      <th className={styles.th}>Name</th>
                      <th className={styles.th}>Organization</th>
                      <th className={styles.th}>Contact</th>
                      <th className={styles.th}>Phone</th>
                      <th className={styles.th}>Rating</th>
                      <th className={`${styles.th} ${styles.thActions}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((vendor) => (
                      <tr key={vendor.id} className={styles.tr}>
                        {role === 'super_admin' && (
                          <td className={styles.td}>
                            <input
                              type="checkbox"
                              checked={selectedVendorIds.includes(vendor.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedVendorIds([...selectedVendorIds, vendor.id])
                                } else {
                                  setSelectedVendorIds(selectedVendorIds.filter(id => id !== vendor.id))
                                }
                              }}
                              style={{ cursor: 'pointer', accentColor: 'var(--color-accent)' }}
                            />
                          </td>
                        )}
                        <td className={styles.td}>
                          <span className={`badge badge-medium ${styles.typeBadge}`}>
                            {vendor.category}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span className={vendor.name ? styles.vendorName : styles.vendorNameMuted} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {vendor.name || 'Unnamed vendor'}
                            {vendor.is_verified && (
                              <span title="Verified business" style={{ display: 'inline-flex' }}>
                                <BadgeCheck size={14} style={{ color: 'var(--color-accent)', fill: 'rgba(212,160,23,0.1)' }} />
                              </span>
                            )}
                          </span>
                          {!vendor.is_verified && (
                            <span style={{ fontSize: 10, marginLeft: 8, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                              {myClaims.some(c => c.vendor_id === vendor.id && c.status === 'pending') ? '(Claim pending)' : '(Unclaimed)'}
                            </span>
                          )}
                        </td>
                        <td className={styles.td}>
                          <span className={vendor.org_id === org?.id ? styles.orgLabelYours : styles.orgLabel}>
                            {vendor.org_name || '—'}
                            {vendor.org_id === org?.id && ' (yours)'}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.cellMuted}>{vendor.contact_name || '—'}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.cellMuted}>{vendor.phone || '—'}</span>
                        </td>
                        <td className={styles.td}>
                          {vendor.rating ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Star size={12} style={{ color: 'var(--color-accent)', fill: 'var(--color-accent)' }} />
                              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{vendor.rating}</span>
                            </div>
                          ) : (
                            <span className={styles.cellMuted}>—</span>
                          )}
                        </td>
                        <td className={`${styles.td} ${styles.tdActions}`}>
                          <div className={styles.rowActions}>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              onClick={() => openEdit(vendor)}
                              aria-label={`Edit ${vendor.name || vendor.category}`}
                              title={vendor.org_id === org?.id || role === 'super_admin' || (vendor.claimed_by_vendor_id === user?.id && vendor.is_verified) ? 'Edit details' : 'Suggest an edit'}
                            >
                              <Pencil size={13} />
                            </button>
                            {(vendor.org_id === org?.id || role === 'super_admin') && (
                              <button
                                type="button"
                                className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                onClick={() => handleDelete(vendor.id)}
                                aria-label={`Delete ${vendor.name || vendor.category}`}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                            {!vendor.is_verified && role === 'vendor' && !myClaims.some(c => c.vendor_id === vendor.id && c.status === 'pending') && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '2px 6px', fontSize: 10, height: 'auto', minHeight: 'auto', color: 'var(--color-accent)' }}
                                onClick={() => { setClaimingVendor(vendor); setClaimForm({ business_email: vendor.email || '', business_phone: vendor.phone || '', website: vendor.website || '', proof_url: '' }); setShowClaimModal(true) }}
                              >
                                Claim
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.tableFooter}>
                <span>Showing {paginated.length} of {filtered.length} vendors</span>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className={styles.pageBtn}
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state__icon">
            <Users size={24} />
          </div>
          <div className="empty-state__title">No vendors found</div>
          <div className="empty-state__description">
            {query || categoryFilter ? 'Try a different search or filter' : 'Add your first vendor to the directory'}
          </div>
          {!query && !categoryFilter && (
            <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true) }}>
              <Plus size={16} />
              Add Vendor
            </button>
          )}
        </div>
      )}

      {/* Floating Merge Bar (Super Admin Only) */}
      {role === 'super_admin' && selectedVendorIds.length >= 2 && (
        <div style={{
          position: 'fixed',
          bottom: 'var(--space-6)',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--color-surface-2)',
          border: '1px solid var(--color-accent)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-3) var(--space-6)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)',
          zIndex: 100,
        }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {selectedVendorIds.length} vendors selected
          </span>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={() => {
              setTargetVendorId(selectedVendorIds[0]);
              setShowMergeModal(true);
            }}
          >
            <GitMerge size={14} style={{ marginRight: 6 }} />
            Merge Selected
          </button>
          <button 
            type="button" 
            className="btn btn-ghost btn-sm"
            onClick={() => setSelectedVendorIds([])}
          >
            Clear
          </button>
        </div>
      )}

      {/* Merge Modal (Super Admin Only) */}
      {showMergeModal && selectedVendorIds.length >= 2 && (
        <div className="overlay" onClick={() => { if (!saving) { setShowMergeModal(false) } }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-card-header">
              <div className="modal-card-title">Merge Duplicate Vendors</div>
              <button className="modal-card-close" onClick={() => { setShowMergeModal(false) }} disabled={saving}><X size={20} /></button>
            </div>
            <div className="modal-card-body">
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                Select the primary vendor profile that you want to **KEEP**. All other selected profiles will be soft-deleted, and their linked event bookings will be moved to the primary profile.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                {vendors.filter(v => selectedVendorIds.includes(v.id)).map(vendor => (
                  <label 
                    key={vendor.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--space-3)', 
                      padding: 'var(--space-3)', 
                      borderRadius: 'var(--radius-md)', 
                      border: targetVendorId === vendor.id ? '1px solid var(--color-accent)' : '1px solid var(--color-border-subtle)',
                      backgroundColor: targetVendorId === vendor.id ? 'rgba(212, 160, 23, 0.05)' : 'var(--color-surface-3)',
                      cursor: 'pointer' 
                    }}
                  >
                    <input 
                      type="radio" 
                      name="target_vendor" 
                      checked={targetVendorId === vendor.id}
                      onChange={() => setTargetVendorId(vendor.id)}
                      style={{ accentColor: 'var(--color-accent)' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                        {vendor.name} {vendor.is_verified && '⭐ (Verified)'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {vendor.category} • {vendor.contact_name || 'No contact'} • {vendor.email || 'No email'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleMergeSelected} disabled={saving}>
                  {saving ? 'Merging...' : 'Confirm & Merge'}
                </button>
                <button className="btn btn-ghost" onClick={() => { setShowMergeModal(false) }} disabled={saving}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
