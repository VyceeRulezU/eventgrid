import { useEffect, useState, useMemo } from 'react'
import { Users, Plus, X, Pencil, ExternalLink, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { useResolvedEventId } from '@/hooks/useResolvedEventId'
import { notify } from '@/lib/notifications'
import { PageHero } from '@/components/shared/PageHero'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { RequestVendorQuoteModal } from './RequestVendorQuoteModal'
import styles from './EventVendorsPage.module.css'
import { useAuthStore } from '@/store/auth.store'

interface EventVendor {
  id: string
  vendor_id: string | null
  vendor_name: string
  category: string
  service_desc: string | null
  quantity: number
  total_amount: number
  advance_paid: number
  balance: number
  payment_status: string
  booking_status: string
  notes: string | null
  created_at: string
}

interface DirectoryVendor {
  id: string
  name: string
  category: string
  contact_name: string | null
  phone: string | null
  email: string | null
}

const BOOKING_STATUSES = [
  { value: 'sourcing', label: 'Sourcing' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
]

const PAYMENT_STATUSES = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'advance', label: 'Advance Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
]

function fmtNaira(kobo: number): string {
  return '\u20A6' + (kobo / 100).toLocaleString('en-NG')
}

export function EventVendorsPage({ standalone = true }: { standalone?: boolean }) {
  const { eventId, isReadOnly } = useResolvedEventId()
  const showNotification = useUIStore((s) => s.showNotification)
  const currentUser = useAuthStore((s) => s.user)
  const userRole = useAuthStore((s) => s.role)

  const [eventName, setEventName] = useState('')
  const [eventOrgId, setEventOrgId] = useState<string | null>(null)
  const [eventOwnerId, setEventOwnerId] = useState<string | null>(null)
  const [vendors, setVendors] = useState<EventVendor[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [editingVendor, setEditingVendor] = useState<EventVendor | null>(null)

  const isOwner = useMemo(() => {
    return (
      (currentUser && eventOwnerId && currentUser.id === eventOwnerId) ||
      userRole === 'super_admin'
    )
  }, [currentUser, eventOwnerId, userRole])

  async function loadVendors() {
    if (!eventId) return
    setLoading(true)
    
    const { data: eventData } = await supabase
      .from('events')
      .select('name, created_by, org_id')
      .eq('id', eventId)
      .single()

    if (eventData) {
      setEventName(eventData.name)
      setEventOwnerId(eventData.created_by)
      setEventOrgId(eventData.org_id)
    }

    const { data } = await supabase
      .from('event_vendors')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    if (data) setVendors(data as unknown as EventVendor[])
    setLoading(false)
  }

  useEffect(() => {
    loadVendors()
  }, [eventId])

  async function handleRemove(vendorId: string) {
    const { error } = await supabase.from('event_vendors').delete().eq('id', vendorId)
    if (error) {
      showNotification({ variant: 'error', title: 'Failed to remove', message: error.message })
      return
    }
    setVendors((prev) => prev.filter((v) => v.id !== vendorId))
    showNotification({ variant: 'success', title: 'Vendor removed from event' })
  }

  async function handleUpdateStatus(vendorId: string, field: 'booking_status' | 'payment_status', value: string) {
    const { error } = await supabase.from('event_vendors').update({ [field]: value }).eq('id', vendorId)
    if (error) {
      showNotification({ variant: 'error', title: 'Update failed', message: error.message })
      return
    }
    setVendors((prev) => prev.map((v) => v.id === vendorId ? { ...v, [field]: value } : v))
    if (field === 'booking_status' && value === 'confirmed') {
      const { data: eventData } = await supabase.from('events').select('created_by').eq('id', eventId).single()
      if (eventData?.created_by) {
        notify({ type: 'vendor_confirmed', recipientId: eventData.created_by!, eventId: eventId!, payload: { title: 'Vendor confirmed', body: 'A vendor has been confirmed for your event', url: `/events/${eventId}/vendors`, tag: `vendor-${vendorId}` } })
      }
    }
  }

  return (
    <div className={styles.page}>
      {standalone && <PageHero icon={Users} title={`Event Vendors${eventName ? ` | ${eventName}` : ''}`} subtitle={`${vendors.length} vendor${vendors.length !== 1 ? 's' : ''} assigned`} />}

      <div className={styles.content}>
        {!isReadOnly && (
          <div className={styles.toolbar}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)} style={{ borderRadius: 'var(--radius-sm)' }}>
              <Plus size={14} /> Add Vendor
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowQuoteModal(true)} style={{ borderRadius: 'var(--radius-sm)' }}>
              <FileText size={14} /> Request Quote
            </button>
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>
            <img src="/ng-new-logo.png" alt="Loading" style={{ width: 48, height: 48, opacity: 0.5 }} />
          </div>
        ) : vendors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon"><Users size={24} /></div>
            <div className="empty-state__title">No vendors assigned</div>
            <div className="empty-state__description">Add vendors from your directory or create new ones</div>
            {!isReadOnly && <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><Plus size={16} /> Add Vendor</button>}
          </div>
        ) : (
          <div className={styles.tableCard}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead className={styles.thead}>
                  <tr>
                    <th className={styles.th}>Vendor</th>
                    <th className={`${styles.th} ${styles.thService}`}>Service</th>
                    {isOwner && <th className={`${styles.th} ${styles.thCenter}`}>Amount</th>}
                    <th className={`${styles.th} ${styles.thCenter}`}>Booking</th>
                    <th className={`${styles.th} ${styles.thCenter}`}>Payment</th>
                    <th className={`${styles.th} ${styles.thCenter}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v) => (
                    <tr key={v.id} className={styles.tr}>
                      <td className={`${styles.td} ${styles.vendorCell}`}>
                        <div className={styles.vendorInfo}>
                          <div className={styles.vendorAvatar}>{v.vendor_name.charAt(0).toUpperCase()}</div>
                          <div>
                            <div className={styles.vendorName}>{v.vendor_name}</div>
                            <div className={styles.vendorCategory}>{v.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.serviceDesc}>{v.service_desc || '\u2014'}</span>
                      </td>
                      {isOwner && (
                        <td className={`${styles.td} ${styles.cellCenter}`}>
                          <span className={styles.amount}>{fmtNaira(v.total_amount)}</span>
                        </td>
                      )}
                      <td className={`${styles.td} ${styles.cellCenter}`}>
                        {isOwner && !isReadOnly ? (
                          <DropdownMenu
                            trigger={
                              <span className={`badge badge-${v.booking_status === 'confirmed' || v.booking_status === 'paid' ? 'green' : v.booking_status === 'cancelled' ? 'red' : v.booking_status === 'negotiating' ? 'yellow' : 'grey'} ${styles.pointer}`}>
                                <span className="badge-dot" />
                                {BOOKING_STATUSES.find((s) => s.value === v.booking_status)?.label || v.booking_status}
                              </span>
                            }
                            items={BOOKING_STATUSES.map((s) => ({ label: s.label, value: s.value }))}
                            onSelect={(item) => handleUpdateStatus(v.id, 'booking_status', item.value)}
                          />
                        ) : (
                          <span className={`badge badge-${v.booking_status === 'confirmed' || v.booking_status === 'paid' ? 'green' : v.booking_status === 'cancelled' ? 'red' : v.booking_status === 'negotiating' ? 'yellow' : 'grey'}`}>
                            <span className="badge-dot" />
                            {BOOKING_STATUSES.find((s) => s.value === v.booking_status)?.label || v.booking_status}
                          </span>
                        )}
                      </td>
                      <td className={`${styles.td} ${styles.cellCenter}`}>
                        {isOwner && !isReadOnly ? (
                          <DropdownMenu
                            trigger={
                              <span className={`badge badge-${v.payment_status === 'paid' ? 'green' : v.payment_status === 'advance' ? 'yellow' : v.payment_status === 'cancelled' ? 'red' : 'grey'} ${styles.pointer}`}>
                                <span className="badge-dot" />
                                {PAYMENT_STATUSES.find((s) => s.value === v.payment_status)?.label || v.payment_status}
                              </span>
                            }
                            items={PAYMENT_STATUSES.map((s) => ({ label: s.label, value: s.value }))}
                            onSelect={(item) => handleUpdateStatus(v.id, 'payment_status', item.value)}
                          />
                        ) : (
                          <span className={`badge badge-${v.payment_status === 'paid' ? 'green' : v.payment_status === 'advance' ? 'yellow' : v.payment_status === 'cancelled' ? 'red' : 'grey'}`}>
                            <span className="badge-dot" />
                            {PAYMENT_STATUSES.find((s) => s.value === v.payment_status)?.label || v.payment_status}
                          </span>
                        )}
                      </td>
                      <td className={`${styles.td} ${styles.cellCenter}`}>
                        <div className={styles.rowActions}>
                          {isOwner && !isReadOnly && (
                            <button className={styles.iconBtn} onClick={() => setEditingVendor(v)} aria-label="Edit vendor">
                              <Pencil size={14} />
                            </button>
                          )}
                          {!isReadOnly && (
                            <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => handleRemove(v.id)} aria-label="Remove vendor">
                              <X size={14} />
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
              <span>Showing {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}</span>
              <a href="/vendors" className={styles.directoryLink}><ExternalLink size={12} /> Vendor Directory</a>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddEventVendorModal
          eventId={eventId!}
          onClose={() => setShowAddModal(false)}
          onSaved={() => { setShowAddModal(false); loadVendors() }}
          isOwner={isOwner}
        />
      )}

      {editingVendor && (
        <EditEventVendorModal
          vendor={editingVendor}
          onClose={() => setEditingVendor(null)}
          onSaved={(updated) => {
            setVendors((prev) => prev.map((v) => v.id === updated.id ? updated : v))
            setEditingVendor(null)
          }}
        />
      )}

      {showQuoteModal && eventOrgId && (
        <RequestVendorQuoteModal
          eventId={eventId!}
          orgId={eventOrgId}
          onClose={() => setShowQuoteModal(false)}
          onSent={() => { setShowQuoteModal(false); showNotification({ variant: 'success', title: 'Quote request sent' }) }}
        />
      )}
    </div>
  )
}

function AddEventVendorModal({ eventId, onClose, onSaved, isOwner }: {
  eventId: string
  onClose: () => void
  onSaved: () => void
  isOwner: boolean
}) {
  const showNotification = useUIStore((s) => s.showNotification)
  const [step, setStep] = useState<'choose' | 'create'>('choose')
  const [directory, setDirectory] = useState<DirectoryVendor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    vendor_id: '' as string | null,
    vendor_name: '',
    category: 'Entertainment',
    service_desc: '',
    total_amount: '',
    quantity: 1,
  })

  useEffect(() => {
    supabase.from('vendors')
      .select('id, name, category, contact_name, phone, email')
      .is('deleted_at', null)
      .order('name', { ascending: true })
      .then(({ data }) => {
        if (data) {
          const raw = data as unknown as DirectoryVendor[]
          const seen = new Set<string>()
          const deduped = raw.filter((v) => {
            if (v.category === 'Coordinator' && v.email) {
              const key = v.email.toLowerCase()
              if (seen.has(key)) return false
              seen.add(key)
            }
            return true
          })
          setDirectory(deduped)
        }
        setLoading(false)
      })
  }, [])

  async function handleSave() {
    if (!form.vendor_name.trim()) return
    setSaving(true)

    const { error } = await supabase.from('event_vendors').insert({
      event_id: eventId,
      vendor_id: form.vendor_id || null,
      vendor_name: form.vendor_name.trim(),
      category: form.category,
      service_desc: form.service_desc.trim() || null,
      total_amount: form.total_amount ? parseInt(form.total_amount, 10) * 100 : 0,
      quantity: form.quantity,
    })

    setSaving(false)
    if (error) {
      showNotification({ variant: 'error', title: 'Failed to add vendor', message: error.message })
      return
    }
    showNotification({ variant: 'success', title: `"${form.vendor_name.trim()}" added to event` })
    onSaved()
  }

  function selectDirectoryVendor(v: DirectoryVendor) {
    setForm({
      vendor_id: v.id,
      vendor_name: v.name,
      category: v.category,
      service_desc: '',
      total_amount: '',
      quantity: 1,
    })
    setStep('create')
  }

  const [dirSearch, setDirSearch] = useState('')

  const filteredDirectory = useMemo(() => {
    if (!dirSearch.trim()) return directory
    const q = dirSearch.toLowerCase()
    return directory.filter((v) =>
      v.name.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      (v.contact_name || '').toLowerCase().includes(q)
    )
  }, [directory, dirSearch])

  if (step === 'choose') {
    return (
      <div className="overlay" onClick={() => !saving && onClose()}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
          <div className="modal-card-header">
            <div className="modal-card-title">Add Vendor to Event</div>
            <button className="modal-card-close" onClick={onClose} disabled={saving} data-tooltip="Close"><X size={20} /></button>
          </div>
          <div className="modal-card-body" style={{ maxHeight: 480, overflowY: 'auto', minHeight: 0 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <img src="/ng-new-logo.png" alt="Loading" style={{ width: 32, height: 32, opacity: 0.5 }} />
              </div>
            ) : (
              <>
                {directory.length > 0 && (
                  <>
                    <div className="input-wrapper" style={{ marginBottom: 'var(--space-3)' }}>
                      <label className="label">Search directory</label>
                      <input
                        className="input"
                        placeholder="Search by name, category, or contact..."
                        value={dirSearch}
                        onChange={(e) => setDirSearch(e.target.value)}
                      />
                    </div>
                    <div className="label" style={{ marginBottom: 'var(--space-2)' }}>From Directory</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                      {filteredDirectory.map((v) => (
                        <button key={v.id} className={styles.directoryItem} onClick={() => selectDirectoryVendor(v)}>
                          <div>
                            <div className={styles.vendorName}>{v.name}</div>
                            <div className={styles.vendorCategory}>{v.category}{v.contact_name ? ` \u2022 ${v.contact_name}` : ''}</div>
                          </div>
                          <Plus size={14} />
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => setStep('create')}>
                  <Plus size={14} /> Add New Vendor
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overlay" onClick={() => !saving && onClose()}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-card-header">
          <div className="modal-card-title">{form.vendor_id ? 'Assign from Directory' : 'New Vendor'}</div>
          <button className="modal-card-close" onClick={onClose} disabled={saving} data-tooltip="Close"><X size={20} /></button>
        </div>
        <div className="modal-card-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {!form.vendor_id && (
            <button className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-3)' }} onClick={() => setStep('choose')}>
              Choose from directory
            </button>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Vendor Name</label>
              <input className="input" value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} placeholder="Vendor name" />
            </div>
            <div>
              <label className="label">Category</label>
              <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Catering" />
            </div>
            <div>
              <label className="label">Quantity</label>
              <input className="input" type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Service Description</label>
              <input className="input" value={form.service_desc} onChange={(e) => setForm({ ...form, service_desc: e.target.value })} placeholder="What service are they providing?" />
            </div>
            {isOwner && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="label">Total Amount ({'\u20A6'})</label>
                <input className="input" type="number" min={0} value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} placeholder="Amount in Naira (e.g. 500000)" />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving || !form.vendor_name.trim()}>
              {saving ? 'Adding...' : 'Add to Event'}
            </button>
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditEventVendorModal({ vendor, onClose, onSaved }: {
  vendor: EventVendor
  onClose: () => void
  onSaved: (updated: EventVendor) => void
}) {
  const showNotification = useUIStore((s) => s.showNotification)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    vendor_name: vendor.vendor_name,
    category: vendor.category,
    service_desc: vendor.service_desc || '',
    total_amount: (vendor.total_amount / 100).toString(),
    quantity: vendor.quantity,
  })

  async function handleSave() {
    if (!form.vendor_name.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('event_vendors').update({
      vendor_name: form.vendor_name.trim(),
      category: form.category,
      service_desc: form.service_desc.trim() || null,
      total_amount: form.total_amount ? parseInt(form.total_amount, 10) * 100 : 0,
      quantity: form.quantity,
    }).eq('id', vendor.id).select().single()

    setSaving(false)
    if (error) {
      showNotification({ variant: 'error', title: 'Update failed', message: error.message })
      return
    }
    onSaved(data as unknown as EventVendor)
    showNotification({ variant: 'success', title: 'Vendor updated' })
  }

  return (
    <div className="overlay" onClick={() => !saving && onClose()}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-card-header">
          <div className="modal-card-title">Edit Vendor</div>
          <button className="modal-card-close" onClick={onClose} disabled={saving} data-tooltip="Close"><X size={20} /></button>
        </div>
        <div className="modal-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Vendor Name</label>
              <input className="input" value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Category</label>
              <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <label className="label">Quantity</label>
              <input className="input" type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Service Description</label>
              <input className="input" value={form.service_desc} onChange={(e) => setForm({ ...form, service_desc: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Total Amount ({'\u20A6'})</label>
              <input className="input" type="number" min={0} value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving || !form.vendor_name.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
