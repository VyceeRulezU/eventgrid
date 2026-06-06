import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Users, Plus, Search, Pencil, Tag, Star, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { Checkbox } from '@/components/ui/Checkbox'
import { EditVendorModal } from './EditVendorModal'
import { AddVendorModal } from './AddVendorModal'
import { AddTypeModal } from './AddTypeModal'
import type { Vendor } from '@/types'
import styles from './VendorsPage.module.css'

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

export function VendorsPage() {
  const [searchParams] = useSearchParams()
  const eventId = searchParams.get('event')
  const user = useAuthStore((s) => s.user)
  const org = useAuthStore((s) => s.org)
  const showNotification = useUIStore((s) => s.showNotification)
  const showModal = useUIStore((s) => s.showModal)

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [events, setEvents] = useState<{ id: string; name: string }[]>([])
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set())
  const [showAddType, setShowAddType] = useState(false)
  const [showAddVendor, setShowAddVendor] = useState(false)

  const availableTypes = [...new Set([...DEFAULT_TYPES, ...vendors.map((v) => v.category)])]

  useEffect(() => {
    if (!user || !org) { setLoading(false); return }

    const orgId = org.id

    async function load() {
      const { data: evts } = await supabase
        .from('events')
        .select('id, name')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .order('event_date', { ascending: false })

      if (evts) setEvents(evts as unknown as { id: string; name: string }[])

      const { data: vends } = await supabase
        .from('vendors')
        .select('*')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .order('name', { ascending: true })

      if (vends) setVendors(vends as unknown as Vendor[])

      setLoading(false)
    }

    load()
  }, [user, org])

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.category || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor)
  }

  const handleEditSaved = (updated: Vendor) => {
    setVendors(vendors.map((v) => (v.id === updated.id ? updated : v)))
  }

  const handleAdd = (vendor: Vendor) => {
    setVendors([vendor, ...vendors])
  }

  const handleDelete = async (id: string) => {
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



  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 'var(--space-4)' }}>
        <div style={{ width: 48, height: 48 }}>
          <img src="/EventGrid-favicon.svg" alt="Loading" style={{ width: 48, height: 48, opacity: 0.5 }} />
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading vendors...</div>
      </div>
    )
  }

  const allSelected = filtered.length > 0 && filtered.every((v) => selectedVendors.has(v.id))
  const someSelected = selectedVendors.size > 0

  const toggleAll = () => {
    if (allSelected) {
      setSelectedVendors(new Set())
    } else {
      setSelectedVendors(new Set(filtered.map((v) => v.id)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selectedVendors)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedVendors(next)
  }

  const handleBulkDelete = async () => {
    showModal({
      variant: 'confirm',
      title: 'Delete vendors?',
      message: `Delete ${selectedVendors.size} vendor(s)? This cannot be undone.`,
      actions: [
        { label: 'Cancel', variant: 'secondary' as const, onClick: () => {} },
        {
          label: 'Delete',
          variant: 'danger' as const,
          onClick: async () => {
            const ids = [...selectedVendors]
            const { error } = await supabase
              .from('vendors')
              .update({ deleted_at: new Date().toISOString() })
              .in('id', ids)

            if (error) {
              showNotification({ variant: 'error', title: 'Delete failed', message: error.message })
            } else {
              setVendors((prev) => prev.filter((v) => !ids.includes(v.id)))
              setSelectedVendors(new Set())
              showNotification({ variant: 'success', title: 'Deleted', message: `${ids.length} vendor(s) removed.` })
            }
          },
        },
      ],
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.headerTitle}>Vendors</h2>
          <p className={styles.headerDesc}>{vendors.length} vendor{vendors.length !== 1 ? 's' : ''} in your organisation</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div className={styles.eventFilterLabel}>Event filter</div>
            <div className={styles.eventFilterWrap}>
              <DropdownMenu
              trigger={
                <span className={styles.eventFilterTrigger}>
                  {events.find((e) => e.id === (eventId || events[0]?.id))?.name || 'Select event'}
                </span>
              }
              items={events.map((e) => ({ label: e.name, value: e.id }))}
              onSelect={(item) => { window.location.href = `/vendors?event=${item.value}` }}
            />
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAddType(true)} style={{ borderRadius: 'var(--radius-sm)' }}>
            <Tag size={14} />
            Add Type
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddVendor(true)} style={{ borderRadius: 'var(--radius-sm)' }}>
            <Plus size={14} />
            Add Vendor
          </button>
        </div>
      </div>

      {showAddType && org && (
        <AddTypeModal
          orgId={org.id}
          onClose={() => setShowAddType(false)}
          onSaved={handleAdd}
        />
      )}

      {showAddVendor && org && (
        <AddVendorModal
          orgId={org.id}
          availableTypes={availableTypes}
          defaultCategory={DEFAULT_TYPES[0]}
          onClose={() => setShowAddVendor(false)}
          onSaved={handleAdd}
        />
      )}

      {!(showAddVendor || showAddType) && filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <Users size={24} />
          </div>
          <div className="empty-state__title">No vendors found</div>
          <div className="empty-state__description">
            {search ? 'Try a different search term' : 'Add your first vendor type or vendor'}
          </div>
          {!search && (
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <button className="btn btn-secondary" onClick={() => setShowAddType(true)} style={{ minHeight: 40 }}>
                <Tag size={16} />
                Add Vendor Type
              </button>
              <button className="btn btn-primary" onClick={() => setShowAddVendor(true)} style={{ minHeight: 40 }}>
                <Plus size={16} />
                Add Vendor
              </button>
            </div>
          )}
        </div>
      ) : null}

      {!(showAddVendor || showAddType) && filtered.length > 0 ? (
        <div className={styles.tableCard}>
          {someSelected && (
            <div className={styles.bulkBar}>
              <span className={styles.bulkInfo}>{selectedVendors.size} selected</span>
              <div className={styles.bulkActions}>
                <button
                  type="button"
                  className="btn btn-destructive btn-sm"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                  onClick={handleBulkDelete}
                >
                  <Trash2 size={14} /> Delete
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedVendors(new Set())}>
                  Clear
                </button>
              </div>
            </div>
          )}

          <div style={{ padding: 'var(--space-3) var(--space-5)', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <div style={{ position: 'relative', maxWidth: 320 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                className="input"
                placeholder="Search by name or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={`${styles.th} ${styles.thCheck}`}>
                    <Checkbox
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Select all vendors"
                    />
                  </th>
                  <th className={styles.th}>Type</th>
                  <th className={styles.th}>Name</th>
                  <th className={styles.th}>Contact</th>
                  <th className={styles.th}>Phone</th>
                  <th className={styles.th}>Rating</th>
                  <th className={`${styles.th} ${styles.thActions}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((vendor) => {
                  const isSelected = selectedVendors.has(vendor.id)
                  return (
                    <tr
                      key={vendor.id}
                      className={`${styles.tr} ${isSelected ? styles.trSelected : ''}`}
                    >
                      <td className={`${styles.td} ${styles.tdCheck}`}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleOne(vendor.id)}
                          aria-label={`Select ${vendor.name || vendor.category}`}
                        />
                      </td>
                      <td className={styles.td}>
                        <span className={`badge badge-medium ${styles.typeBadge}`}>
                          {vendor.category}
                        </span>
                      </td>
                      <td className={`${styles.td} ${styles.vendorNameWrap}`}>
                        <span className={vendor.name ? styles.vendorName : styles.vendorNameMuted}>
                          {vendor.name || 'Not assigned'}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.cellMuted}>
                          {vendor.contact_name || '—'}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.cellMuted}>
                          {vendor.phone || '—'}
                        </span>
                      </td>
                      <td className={styles.td}>
                        {vendor.rating ? (
                          <div className={styles.starWrap}>
                            <Star size={14} className={styles.starIcon} />
                            <span className={styles.starValue}>{vendor.rating}</span>
                          </div>
                        ) : (
                          <span className={styles.cellMuted}>—</span>
                        )}
                      </td>
                      <td className={styles.td}>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => handleEdit(vendor)}
                            aria-label={`Edit ${vendor.name || vendor.category}`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            onClick={() => handleDelete(vendor.id)}
                            aria-label={`Delete ${vendor.name || vendor.category}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.tableFooter}>
            <span>Showing {filtered.length} of {vendors.length} vendors</span>
          </div>
        </div>
      ) : null}

      {editingVendor && (
        <EditVendorModal
          vendor={editingVendor}
          availableTypes={availableTypes}
          onClose={() => setEditingVendor(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  )
}
