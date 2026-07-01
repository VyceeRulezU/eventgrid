import { useEffect, useState } from 'react'
import { X, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { notify } from '@/lib/notifications'
import { CalendarModal } from '@/components/ui/CalendarModal'
import { Checkbox } from '@/components/ui/Checkbox'
import styles from './RequestVendorQuoteModal.module.css'

interface DirectoryVendor {
  id: string
  name: string
  category: string
  contact_name: string | null
  email: string | null
}

interface Props {
  eventId: string
  orgId: string
  onClose: () => void
  onSent: () => void
}

export function RequestVendorQuoteModal({ eventId, orgId, onClose, onSent }: Props) {
  const showToast = useUIStore((s) => s.showToast)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [deadline, setDeadline] = useState('')
  const [vendors, setVendors] = useState<DirectoryVendor[]>([])
  const [selectedVendorIds, setSelectedVendorIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('vendors')
        .select('id, name, category, contact_name, email')
        .is('deleted_at', null)
        .order('name')
      if (data) setVendors(data as unknown as DirectoryVendor[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = search
    ? vendors.filter((v) =>
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.category.toLowerCase().includes(search.toLowerCase())
      )
    : vendors

  const toggleVendor = (id: string) => {
    const next = new Set(selectedVendorIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedVendorIds(next)
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      showToast({ type: 'warning', title: 'Title is required' })
      return
    }
    if (selectedVendorIds.size === 0) {
      showToast({ type: 'warning', title: 'Select at least one vendor' })
      return
    }

    setSending(true)

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) { setSending(false); return }

    const { data: reqData, error: reqErr } = await supabase
      .from('vendor_quote_requests')
      .insert({
        event_id: eventId,
        org_id: orgId,
        created_by: user.user.id,
        title: title.trim(),
        description: description.trim() || null,
        category: category || null,
        budget_range_min: budgetMin ? parseInt(budgetMin) * 100 : null,
        budget_range_max: budgetMax ? parseInt(budgetMax) * 100 : null,
        response_deadline: deadline || null,
        status: 'open',
      })
      .select()
      .single()

    if (reqErr || !reqData) {
      showToast({ type: 'error', title: 'Failed to create request', body: reqErr?.message })
      setSending(false)
      return
    }

    const invitations = [...selectedVendorIds].map((vendorId) => ({
      quote_request_id: reqData.id,
      vendor_id: vendorId,
    }))

    const { error: invErr } = await supabase
      .from('vendor_quote_invitations')
      .insert(invitations)

    if (invErr) {
      showToast({ type: 'error', title: 'Failed to invite vendors', body: invErr.message })
      setSending(false)
      return
    }

    // Notify each invited vendor
    const { data: vendorUsers } = await supabase
      .from('vendors')
      .select('id, claimed_by_vendor_id')
      .in('id', [...selectedVendorIds])
    if (vendorUsers) {
      await Promise.all(vendorUsers.map((v) =>
        v.claimed_by_vendor_id
          ? notify({
              type: 'quote_request_received',
              recipientId: v.claimed_by_vendor_id,
              eventId,
              payload: {
                title: 'New Quote Request',
                body: title.trim(),
                url: '/vendor/quotes',
              },
            })
          : Promise.resolve()
      ))
    }

    showToast({ type: 'success', title: 'Quote request sent', body: `Sent to ${selectedVendorIds.size} vendor(s)` })
    setSending(false)
    onSent()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-card-header">
          <h3 className="modal-card-title">Request Vendor Quote</h3>
          <button className="modal-card-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-card-body">
          <div className={styles.field}>
            <label className={styles.label}>Title *</label>
            <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Catering for 200 guests" />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea className={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the scope of work..." rows={3} />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Category</label>
              <input className={styles.input} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Catering, Photography" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Response deadline</label>
              <button type="button" className="input" onClick={() => setShowCalendar(true)} style={{ textAlign: 'left' }}>
                {deadline ? new Date(deadline + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select date'}
              </button>
              <CalendarModal
                open={showCalendar}
                value={deadline}
                onChange={(d) => { setDeadline(d); setShowCalendar(false) }}
                onClose={() => setShowCalendar(false)}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Budget min (₦)</label>
              <input className={styles.input} type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="0" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Budget max (₦)</label>
              <input className={styles.input} type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Select vendors * ({selectedVendorIds.size} selected)</label>
            <div className={styles.searchWrap}>
              <Search size={14} className={styles.searchIcon} />
              <input className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vendors..." />
            </div>
            <div className={styles.vendorList}>
              {loading ? (
                <div className={styles.loadingText}>Loading vendors...</div>
              ) : filtered.length === 0 ? (
                <div className={styles.loadingText}>No vendors found</div>
              ) : (
                filtered.map((v) => (
                  <label key={v.id} className={styles.vendorItem}>
                    <Checkbox
                      checked={selectedVendorIds.has(v.id)}
                      onChange={() => toggleVendor(v.id)}
                    />
                    <div className={styles.vendorInfo}>
                      <span className={styles.vendorName}>{v.name}</span>
                      <span className={styles.vendorMeta}>{v.category}{v.contact_name ? ` · ${v.contact_name}` : ''}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="modal-card__footer" style={{ padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={sending}>
            {sending ? 'Sending...' : `Send Quote Request (${selectedVendorIds.size})`}
          </button>
        </div>
      </div>
    </div>
  )
}
