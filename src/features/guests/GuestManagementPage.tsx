import { useEffect, useState } from 'react'
import { useResolvedEventId } from '@/hooks/useResolvedEventId'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import {
  Users, Search, Plus, X, Upload, Check, UserCheck,
  LayoutGrid, Star, List, ArrowLeft,
} from 'lucide-react'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { sendGuestNotification } from '@/lib/email'
import type { Guest, SeatingTable } from '@/types'
import { Checkbox } from '@/components/ui/Checkbox'
import styles from './GuestManagementPage.module.css'

type RSVP = 'pending' | 'confirmed' | 'declined' | 'maybe'

export function GuestManagementPage() {
  const { eventId } = useResolvedEventId()
  const navigate = useNavigate()
  const showToast = useUIStore((s) => s.showToast)

  const [guests, setGuests] = useState<(Guest & { table_name?: string })[]>([])
  const [tables, setTables] = useState<SeatingTable[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [rsvpFilter, setRsvpFilter] = useState<RSVP | 'all'>('all')
  const [eventName, setEventName] = useState('')
  const [tab, setTab] = useState<'list' | 'checkin' | 'seating'>('list')
  const [showAdd, setShowAdd] = useState(false)
  const [showCSV, setShowCSV] = useState(false)
  const [newGuest, setNewGuest] = useState({ first_name: '', last_name: '', phone: '', email: '', group_name: '', is_vip: false, plus_one: false })
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[]>([])
  const [showTableForm, setShowTableForm] = useState(false)
  const [tableForm, setTableForm] = useState({ table_name: '', capacity: 8 })

  useEffect(() => {
    if (!eventId) return
    setLoading(true)
    Promise.all([
      supabase.from('guests').select('*').eq('event_id', eventId).order('created_at'),
      supabase.from('seating_tables').select('*').eq('event_id', eventId).order('table_name'),
      supabase.from('events').select('name').eq('id', eventId).single(),
    ]).then(([gRes, tRes, eRes]) => {
      setGuests((gRes.data || []) as unknown as Guest[])
      setTables((tRes.data || []) as unknown as SeatingTable[])
      if (eRes.data) setEventName((eRes.data as { name: string }).name)
      setLoading(false)
    })
  }, [eventId])

  const filteredGuests = guests.filter((g) => {
    const name = `${g.first_name} ${g.last_name || ''}`.toLowerCase()
    const phone = (g.phone || '').toLowerCase()
    const q = search.toLowerCase()
    return (name.includes(q) || phone.includes(q)) && (rsvpFilter === 'all' || g.rsvp_status === rsvpFilter)
  })

  const rsvpCounts = { confirmed: guests.filter(g => g.rsvp_status === 'confirmed').length, declined: guests.filter(g => g.rsvp_status === 'declined').length, pending: guests.filter(g => g.rsvp_status === 'pending').length, maybe: guests.filter(g => g.rsvp_status === 'maybe').length, total: guests.length }

  const handleAddGuest = async () => {
    if (!newGuest.first_name.trim() || !eventId) { showToast({ type: 'warning', title: 'First name is required' }); return }
    const { error } = await supabase.from('guests').insert({ event_id: eventId, ...newGuest, rsvp_status: 'pending' })
    if (error) { showToast({ type: 'error', title: 'Failed to add guest', body: error.message }); return }
    if (newGuest.email && eventName) {
      sendGuestNotification(newGuest.email, eventName, `Hi ${newGuest.first_name}, you've been added as a guest.`).catch(() => {})
    }
    showToast({ type: 'success', title: 'Guest added' })
    setShowAdd(false)
    setNewGuest({ first_name: '', last_name: '', phone: '', email: '', group_name: '', is_vip: false, plus_one: false })
    const { data } = await supabase.from('guests').select('*').eq('event_id', eventId).order('created_at')
    setGuests((data || []) as unknown as Guest[])
  }

  const handleCheckin = async (guestId: string) => {
    const guest = guests.find(g => g.id === guestId)
    const now = new Date().toISOString()
    const { error } = await supabase.from('guests').update({
      checked_in: !guest?.checked_in,
      checked_in_at: guest?.checked_in ? null : now,
    }).eq('id', guestId)
    if (!error) {
      setGuests(guests.map(g => g.id === guestId ? { ...g, checked_in: !g.checked_in, checked_in_at: g.checked_in ? null : now } as Guest : g))
    }
  }

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    import('papaparse').then(({ default: Papa }) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => setCsvPreview(results.data as Record<string, string>[]),
      })
    })
  }

  const handleCSVImport = async () => {
    if (!eventId) return
    const rows = csvPreview.map((r) => ({
      event_id: eventId,
      first_name: r.first_name || r['First Name'] || r.name || r.Name || '',
      last_name: r.last_name || r['Last Name'] || null,
      phone: r.phone || r.Phone || r.telephone || null,
      email: r.email || r.Email || null,
      group_name: r.group_name || r.Group || r['Group Name'] || null,
      rsvp_status: 'pending' as const,
    })).filter(r => r.first_name)

    if (rows.length === 0) { showToast({ type: 'warning', title: 'No valid rows found' }); return }
    const { error } = await supabase.from('guests').insert(rows as any)
    if (error) { showToast({ type: 'error', title: 'Import failed', body: error.message }); return }
    if (eventName) {
      for (const row of rows) {
        if (row.email) {
          sendGuestNotification(row.email, eventName, `Hi ${row.first_name}, you've been added as a guest.`).catch(() => {})
        }
      }
    }
    showToast({ type: 'success', title: `${rows.length} guests imported` })
    setShowCSV(false)
    setCsvPreview([])
    const { data } = await supabase.from('guests').select('*').eq('event_id', eventId).order('created_at')
    setGuests((data || []) as unknown as Guest[])
  }

  const handleAddTable = async () => {
    if (!tableForm.table_name.trim() || !eventId) return
    const { error } = await supabase.from('seating_tables').insert({ event_id: eventId, table_name: tableForm.table_name, capacity: tableForm.capacity })
    if (error) { showToast({ type: 'error', title: 'Failed to add table', body: error.message }); return }
    setShowTableForm(false)
    setTableForm({ table_name: '', capacity: 8 })
    const { data } = await supabase.from('seating_tables').select('*').eq('event_id', eventId).order('table_name')
    setTables((data || []) as unknown as SeatingTable[])
  }

  const getTableOccupancy = (tableId: string) => guests.filter(g => g.table_id === tableId).length

  const RSVPSummary = () => (
    <div className={styles.rsvpBar}>
      <div className={styles.rsvpStat}><span className={styles.rsvpNum}>{rsvpCounts.total}</span> Total</div>
      <div className={styles.rsvpStat}><span className={styles.rsvpNum} style={{ color: 'var(--color-success)' }}>{rsvpCounts.confirmed}</span> Confirmed</div>
      <div className={styles.rsvpStat}><span className={styles.rsvpNum} style={{ color: 'var(--color-warning)' }}>{rsvpCounts.pending}</span> Pending</div>
      <div className={styles.rsvpStat}><span className={styles.rsvpNum} style={{ color: 'var(--color-error)' }}>{rsvpCounts.declined}</span> Declined</div>
    </div>
  )

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 'var(--space-4)' }}>
          <img src="/EventGrid-favicon.svg" alt="Loading" style={{ width: 48, height: 48, opacity: 0.5 }} />
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading guests...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button type="button" className={styles.headerBack} onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className={styles.headerTitle}>Guests</h2>
            <p className={styles.headerDesc}>{guests.length} guest{guests.length !== 1 ? 's' : ''} on this event</p>
          </div>
        </div>
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input className={styles.searchInput} placeholder="Search name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className={styles.filterSelect}>
            <DropdownMenu
              trigger={rsvpFilter === 'all' ? 'All RSVP' : rsvpFilter.charAt(0).toUpperCase() + rsvpFilter.slice(1)}
              items={[
                { label: 'All RSVP', value: 'all' },
                { label: 'Confirmed', value: 'confirmed' },
                { label: 'Pending', value: 'pending' },
                { label: 'Declined', value: 'declined' },
                { label: 'Maybe', value: 'maybe' },
              ]}
              onSelect={(item) => setRsvpFilter(item.value as RSVP | 'all')}
            />
          </div>
          <button className="btn btn-primary btn-sm" style={{ borderRadius: 'var(--radius-sm)' }} onClick={() => setShowAdd(true)}><Plus size={14} /> Add</button>
          <button className="btn btn-secondary btn-sm" style={{ borderRadius: 'var(--radius-sm)' }} onClick={() => setShowCSV(true)}><Upload size={14} /> CSV</button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'list' ? styles.activeTab : ''}`} onClick={() => setTab('list')}><List size={16} /> <span>List</span></button>
        <button className={`${styles.tab} ${tab === 'checkin' ? styles.activeTab : ''}`} onClick={() => setTab('checkin')}><UserCheck size={16} /> <span>Check-In</span></button>
        <button className={`${styles.tab} ${tab === 'seating' ? styles.activeTab : ''}`} onClick={() => setTab('seating')}><LayoutGrid size={16} /> <span>Seating</span></button>
      </div>

      <RSVPSummary />

      {tab === 'list' && (
        <>
          {filteredGuests.length === 0 ? (
            <div className={styles.tableCard}>
              <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)', color: 'var(--color-text-muted)' }}>
                <Users size={24} style={{ marginBottom: 'var(--space-2)', opacity: 0.4 }} />
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>No guests found</div>
                <div style={{ fontSize: 'var(--text-xs)', marginTop: 4 }}>Add guests manually or import via CSV</div>
              </div>
            </div>
          ) : (
            <div className={styles.tableCard}>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead className={styles.thead}>
                    <tr>
                      <th className={styles.th}>Name</th>
                      <th className={styles.th}>Phone</th>
                      <th className={styles.th}>RSVP</th>
                      <th className={styles.th}>Group</th>
                      <th className={styles.th}>Table</th>
                      <th className={`${styles.th} ${styles.thCenter}`}>Check-In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGuests.map((g) => (
                      <tr key={g.id} className={styles.tr}>
                        <td className={styles.td}>
                          <span className={styles.nameCell}>
                            {g.is_vip && <Star size={12} className={styles.vipStar} />}
                            {g.first_name} {g.last_name || ''}
                          </span>
                        </td>
                        <td className={`${styles.td} ${styles.cellMuted}`}>{g.phone || '-'}</td>
                        <td className={styles.td}>
                          <span className={`badge badge-${g.rsvp_status === 'confirmed' ? 'green' : g.rsvp_status === 'declined' ? 'red' : g.rsvp_status === 'maybe' ? 'yellow' : 'grey'}`}>
                            <span className="badge-dot" />
                            {g.rsvp_status}
                          </span>
                        </td>
                        <td className={`${styles.td} ${styles.cellMuted}`}>{g.group_name || '-'}</td>
                        <td className={`${styles.td} ${styles.cellMuted}`}>{g.table_id ? tables.find(t => t.id === g.table_id)?.table_name || '-' : '-'}</td>
                        <td className={styles.td} style={{ textAlign: 'center' }}>
                          <button
                            className={`btn btn-sm ${g.checked_in ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ borderRadius: 'var(--radius-sm)' }}
                            onClick={() => handleCheckin(g.id)}
                          >
                            {g.checked_in ? <Check size={12} /> : <UserCheck size={12} />}
                            {g.checked_in ? ' In' : ' Out'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.tableFooter}>
                <span>Showing {filteredGuests.length} of {guests.length} guests</span>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'checkin' && (
        <div className={styles.checkinView}>
          <div className={styles.searchWrap} style={{ marginBottom: 'var(--space-3)', maxWidth: 400 }}>
            <Search size={16} className={styles.searchIcon} />
            <input className={styles.searchInput} placeholder="Search guest name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
          </div>
          <div className={styles.chipGroup}>
            <button className={`${styles.chip} ${rsvpFilter === 'all' ? styles.chipActive : ''}`} onClick={() => setRsvpFilter('all')}>All</button>
            <button className={`${styles.chip} ${rsvpFilter === 'confirmed' ? styles.chipActive : ''}`} onClick={() => setRsvpFilter('confirmed')}>Confirmed</button>
            <button className={`${styles.chip} ${rsvpFilter === 'pending' ? styles.chipActive : ''}`} onClick={() => setRsvpFilter('pending')}>Pending</button>
          </div>
          <div className={styles.checkinGrid}>
            {filteredGuests.map((g) => (
              <button key={g.id} className={`${styles.checkinCard} ${g.checked_in ? styles.checkedIn : ''}`} onClick={() => handleCheckin(g.id)}>
                <div className={styles.checkinName}>{g.first_name} {g.last_name || ''}</div>
                <div className={styles.checkinMeta}>{g.phone || g.email || ''}</div>
                {g.checked_in && <div className={styles.checkinBadge}><Check size={14} /> Checked In</div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'seating' && (
        <>
          <div className={styles.seatingHeader}>
            <button className="btn btn-secondary btn-sm" style={{ borderRadius: 'var(--radius-sm)' }} onClick={() => setShowTableForm(true)}><Plus size={14} /> Add Table</button>
          </div>
          <div className={styles.seatingGrid}>
            {tables.map((t) => {
              const occ = getTableOccupancy(t.id)
              const pct = occ / t.capacity
              return (
                <div key={t.id} className={`${styles.tableCard} ${pct >= 1 ? styles.tableCardFull : ''} ${t.is_vip ? styles.tableCardVIP : ''}`}>
                  <div className={styles.tableHeader}>
                    <span className={styles.tableName}>{t.table_name}</span>
                    {t.is_vip && <span className={styles.vipTag}>VIP</span>}
                  </div>
                  <div className={styles.tableOccupancy}>{occ}/{t.capacity}</div>
                  <div className={styles.tableBar}><div className={styles.tableBarFill} style={{ width: `${Math.min(pct * 100, 100)}%` }} /></div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {showAdd && (
        <div className={styles.overlay} onClick={() => setShowAdd(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}><h3>Add Guest</h3><button className={styles.closeBtn} onClick={() => setShowAdd(false)}><X size={18} /></button></div>
            <div className={styles.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div className="input-wrapper"><label className="input-label">First Name *</label><input className="input" value={newGuest.first_name} onChange={(e) => setNewGuest({ ...newGuest, first_name: e.target.value })} /></div>
                <div className="input-wrapper"><label className="input-label">Last Name</label><input className="input" value={newGuest.last_name} onChange={(e) => setNewGuest({ ...newGuest, last_name: e.target.value })} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div className="input-wrapper"><label className="input-label">Phone</label><input className="input" value={newGuest.phone} onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })} /></div>
                <div className="input-wrapper"><label className="input-label">Email</label><input className="input" value={newGuest.email} onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })} /></div>
              </div>
              <div className="input-wrapper" style={{ marginBottom: 'var(--space-3)' }}><label className="input-label">Group</label><input className="input" value={newGuest.group_name} onChange={(e) => setNewGuest({ ...newGuest, group_name: e.target.value })} /></div>
              <div className={styles.checkboxRow}>
                <label className={styles.checkboxLabel}>
                  <Checkbox checked={newGuest.is_vip} onChange={(e) => setNewGuest({ ...newGuest, is_vip: e.target.checked })} /> VIP
                </label>
                <label className={styles.checkboxLabel}>
                  <Checkbox checked={newGuest.plus_one} onChange={(e) => setNewGuest({ ...newGuest, plus_one: e.target.checked })} /> Plus One
                </label>
              </div>
              <button className={`btn btn-primary ${styles.fullBtn}`} onClick={handleAddGuest}>Add Guest</button>
            </div>
          </div>
        </div>
      )}

      {showCSV && (
        <div className={styles.overlay} onClick={() => setShowCSV(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}><h3>Import CSV</h3><button className={styles.closeBtn} onClick={() => setShowCSV(false)}><X size={18} /></button></div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>CSV headers: first_name, last_name, phone, email, group_name</p>
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="input" style={{ marginBottom: 'var(--space-3)' }} />
              {csvPreview.length > 0 && (
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>{csvPreview.length} rows ready to import</p>
                  <div style={{ maxHeight: 160, overflowY: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    {csvPreview.slice(0, 10).map((r, i) => <div key={i}>{r.first_name || r['First Name'] || r.name || r.Name || '?'}</div>)}
                  </div>
                </div>
              )}
              <button className={`btn btn-primary ${styles.fullBtn}`} onClick={handleCSVImport} disabled={csvPreview.length === 0}>Import {csvPreview.length} Guests</button>
            </div>
          </div>
        </div>
      )}

      {showTableForm && (
        <div className={styles.overlay} onClick={() => setShowTableForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}><h3>Add Table</h3><button className={styles.closeBtn} onClick={() => setShowTableForm(false)}><X size={18} /></button></div>
            <div className={styles.modalBody}>
              <div className="input-wrapper" style={{ marginBottom: 'var(--space-3)' }}><label className="input-label">Table Name</label><input className="input" value={tableForm.table_name} onChange={(e) => setTableForm({ ...tableForm, table_name: e.target.value })} placeholder="e.g. Table 1" /></div>
              <div className="input-wrapper" style={{ marginBottom: 'var(--space-4)' }}><label className="input-label">Capacity</label><input className="input" type="number" min={1} value={tableForm.capacity} onChange={(e) => setTableForm({ ...tableForm, capacity: Number(e.target.value) })} /></div>
              <button className={`btn btn-primary ${styles.fullBtn}`} onClick={handleAddTable}>Add Table</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
