import { useEffect, useState, useMemo, useCallback } from 'react'
import { useResolvedEventId } from '@/hooks/useResolvedEventId'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import {
  Users, Plus, X, Upload, Check, UserCheck,
  LayoutGrid, Star, List, User, ChevronLeft,
  Trash2, Save,
} from 'lucide-react'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { Tabs } from '@/components/ui/Tabs'
import { sendInvite } from '@/lib/edgeFunctions'
import type { Guest, SeatingTable } from '@/types'
import { Checkbox } from '@/components/ui/Checkbox'
import { PageHero } from '@/components/shared/PageHero'
import { useSearch } from '@/hooks/useSearch'
import { SearchBar } from '@/components/shared/SearchBar'
import styles from './GuestManagementPage.module.css'

type RSVP = 'pending' | 'confirmed' | 'declined' | 'maybe'

export function GuestManagementPage() {
  const { eventId } = useResolvedEventId()
  const showToast = useUIStore((s) => s.showToast)
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)

  const [guests, setGuests] = useState<(Guest & { table_name?: string })[]>([])
  const [tables, setTables] = useState<SeatingTable[]>([])
  const [loading, setLoading] = useState(true)
  const [rsvpFilter, setRsvpFilter] = useState<RSVP | 'all'>('all')
  const [eventName, setEventName] = useState('')
  const [tab, setTab] = useState<'list' | 'checkin' | 'seating'>('list')
  const { query: listSearch, setQuery: setListSearch, filtered: listSearched } = useSearch(guests, ['first_name', 'last_name', 'phone'])
  const { query: checkinSearch, setQuery: setCheckinSearch, filtered: checkinSearched } = useSearch(guests, ['first_name', 'last_name', 'phone'])
  const [showAdd, setShowAdd] = useState(false)
  const [showCSV, setShowCSV] = useState(false)
  const [newGuest, setNewGuest] = useState({ first_name: '', last_name: '', phone: '', email: '', group_name: '', is_vip: false, plus_one: false })
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[]>([])
  const [showTableForm, setShowTableForm] = useState(false)
  const [tableForm, setTableForm] = useState({ table_name: '', capacity: 8 })
  const [selectedGuest, setSelectedGuest] = useState<(Guest & { table_name?: string }) | null>(null)
  const [editGuest, setEditGuest] = useState<Partial<Guest> | null>(null)
  const [saving, setSaving] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

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

  const filteredGuests = useMemo(() => {
    const base = tab === 'checkin' ? checkinSearched : listSearched
    if (rsvpFilter === 'all') return base
    return base.filter((g) => g.rsvp_status === rsvpFilter)
  }, [listSearched, checkinSearched, rsvpFilter, tab])

  const rsvpCounts = { confirmed: guests.filter(g => g.rsvp_status === 'confirmed').length, declined: guests.filter(g => g.rsvp_status === 'declined').length, pending: guests.filter(g => g.rsvp_status === 'pending').length, maybe: guests.filter(g => g.rsvp_status === 'maybe').length, total: guests.length }

  const handleAddGuest = async () => {
    if (!newGuest.first_name.trim() || !eventId) { showToast({ type: 'warning', title: 'First name is required' }); return }
    const { error } = await supabase.from('guests').insert({ event_id: eventId, ...newGuest, rsvp_status: 'pending' })
    if (error) { showToast({ type: 'error', title: 'Failed to add guest', body: error.message }); return }
    if (newGuest.email && eventName && eventId) {
      const invitedByName = profile?.display_name || user?.user_metadata?.display_name || user?.email || 'A planner'
      sendInvite({
        type: 'guest_invite',
        event_id: eventId,
        email: newGuest.email,
        invited_by_name: invitedByName,
        guest_name: newGuest.first_name,
      }).catch(() => {})
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
    if (eventName && eventId) {
      const invitedByName = profile?.display_name || user?.user_metadata?.display_name || user?.email || 'A planner'
      for (const row of rows) {
        if (row.email) {
          sendInvite({
            type: 'guest_invite',
            event_id: eventId,
            email: row.email,
            invited_by_name: invitedByName,
            guest_name: row.first_name,
          }).catch(() => {})
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

  const handleSelectGuest = useCallback((guest: Guest & { table_name?: string }) => {
    setSelectedGuest(guest)
    setEditGuest({ ...guest })
    setShowDetail(true)
  }, [])

  const handleSaveGuest = async () => {
    if (!editGuest || !selectedGuest || !eventId) return
    setSaving(true)
    const { error } = await supabase.from('guests').update({
      first_name: editGuest.first_name,
      last_name: editGuest.last_name,
      phone: editGuest.phone,
      email: editGuest.email,
      rsvp_status: editGuest.rsvp_status,
      table_id: editGuest.table_id,
      is_vip: editGuest.is_vip,
      plus_one: editGuest.plus_one,
      group_name: editGuest.group_name,
      notes: editGuest.notes,
      checked_in: editGuest.checked_in,
      checked_in_at: editGuest.checked_in ? (selectedGuest.checked_in ? selectedGuest.checked_in_at : new Date().toISOString()) : null,
    }).eq('id', selectedGuest.id)
    setSaving(false)
    if (error) { showToast({ type: 'error', title: 'Failed to save', body: error.message }); return }
    showToast({ type: 'success', title: 'Guest updated' })
    setGuests(guests.map(g => g.id === selectedGuest.id ? { ...g, ...editGuest } as Guest : g))
    setSelectedGuest({ ...selectedGuest, ...editGuest } as Guest & { table_name?: string })
  }

  const handleDeleteGuest = async () => {
    if (!selectedGuest) return
    if (!confirm(`Delete ${selectedGuest.first_name} ${selectedGuest.last_name || ''}?`)) return
    const { error } = await supabase.from('guests').delete().eq('id', selectedGuest.id)
    if (error) { showToast({ type: 'error', title: 'Failed to delete', body: error.message }); return }
    showToast({ type: 'success', title: 'Guest deleted' })
    setGuests(guests.filter(g => g.id !== selectedGuest.id))
    setSelectedGuest(null)
    setEditGuest(null)
    setShowDetail(false)
  }

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
    <div className={styles.pageWrapper}>
    <div className={styles.page}>
      <PageHero
        icon={Users}
        title="Guests"
        subtitle={`${guests.length} guest${guests.length !== 1 ? 's' : ''} on this event`}
      />

      <Tabs
        tabs={[
          { key: 'list', label: 'Guest List', icon: <List size={16} />, badge: rsvpCounts.total },
          { key: 'checkin', label: 'Check-In', icon: <UserCheck size={16} />, badge: rsvpCounts.confirmed },
          { key: 'seating', label: 'Seating', icon: <LayoutGrid size={16} />, badge: tables.length },
        ]}
        activeTab={tab}
        onChange={(key) => setTab(key as 'list' | 'checkin' | 'seating')}
      />

      <div className={styles.toolbar} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
        <SearchBar value={listSearch} onChange={setListSearch} placeholder="Search name or phone..." containerStyle={{ maxWidth: 260 }} />
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

      <RSVPSummary />

      {tab === 'list' && (
        <div className={styles.guestSplitPanel}>
          {/* Left panel: guest list */}
          <div className={`${styles.guestListPanel} ${showDetail && isMobile ? styles.guestListPanelFull : ''}`} style={{ display: showDetail && isMobile ? 'none' : 'flex' }}>
            <div className={styles.guestListHeader}>
              <span>{filteredGuests.length} of {guests.length} guests</span>
            </div>
            <div className={styles.guestListScroll}>
              {filteredGuests.length === 0 ? (
                <div className={styles.guestDetailEmpty}>
                  <Users size={28} className={styles.guestDetailEmptyIcon} />
                  <div style={{ fontSize: 'var(--text-sm)' }}>No guests found</div>
                </div>
              ) : filteredGuests.map((g) => {
                const initial = (g.first_name || '?').charAt(0).toUpperCase()
                const isSelected = selectedGuest?.id === g.id
                return (
                  <div
                    key={g.id}
                    className={`${styles.guestListItem} ${isSelected ? styles.guestListItemSelected : ''}`}
                    onClick={() => handleSelectGuest(g)}
                  >
                    <div className={styles.guestListAvatar} style={{ background: g.checked_in ? 'var(--color-success)' : 'var(--color-surface-3)', color: g.checked_in ? '#fff' : undefined }}>
                      {initial}
                    </div>
                    <div className={styles.guestListInfo}>
                      <div className={styles.guestListRow}>
                        <span className={styles.guestListName}>
                          {g.is_vip && <Star size={10} className={styles.vipStar} />}
                          {g.first_name} {g.last_name || ''}
                        </span>
                        <span className={`badge badge-${g.rsvp_status === 'confirmed' ? 'green' : g.rsvp_status === 'declined' ? 'red' : g.rsvp_status === 'maybe' ? 'yellow' : 'grey'}`} style={{ fontSize: 9, padding: '1px 6px' }}>
                          {g.rsvp_status}
                        </span>
                      </div>
                      <div className={styles.guestListMeta}>{g.phone || g.email || '-'}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right panel: guest detail */}
          <div className={styles.guestDetailPanel} style={{ display: !showDetail && isMobile ? 'none' : 'flex' }}>
            {selectedGuest && editGuest ? (
              <>
                <div className={styles.guestDetailHeader}>
                  {isMobile && (
                    <button className={styles.guestDetailBack} onClick={() => setShowDetail(false)}>
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  <div className={styles.guestDetailName}>{selectedGuest.first_name} {selectedGuest.last_name || ''}</div>
                  <span className={`badge badge-${selectedGuest.rsvp_status === 'confirmed' ? 'green' : selectedGuest.rsvp_status === 'declined' ? 'red' : selectedGuest.rsvp_status === 'maybe' ? 'yellow' : 'grey'}`}>
                    {selectedGuest.rsvp_status}
                  </span>
                </div>
                <div className={styles.guestDetailScroll}>
                  <div className={styles.guestDetailRow}>
                    <div className={styles.guestDetailField}>
                      <label className={styles.guestDetailLabel}>First Name</label>
                      <input className="input" value={editGuest.first_name || ''} onChange={(e) => setEditGuest({ ...editGuest, first_name: e.target.value })} />
                    </div>
                    <div className={styles.guestDetailField}>
                      <label className={styles.guestDetailLabel}>Last Name</label>
                      <input className="input" value={editGuest.last_name || ''} onChange={(e) => setEditGuest({ ...editGuest, last_name: e.target.value })} />
                    </div>
                  </div>
                  <div className={styles.guestDetailRow}>
                    <div className={styles.guestDetailField}>
                      <label className={styles.guestDetailLabel}>Phone</label>
                      <input className="input" value={editGuest.phone || ''} onChange={(e) => setEditGuest({ ...editGuest, phone: e.target.value })} />
                    </div>
                    <div className={styles.guestDetailField}>
                      <label className={styles.guestDetailLabel}>Email</label>
                      <input className="input" value={editGuest.email || ''} onChange={(e) => setEditGuest({ ...editGuest, email: e.target.value })} />
                    </div>
                  </div>
                  <div className={styles.guestDetailRow}>
                    <div className={styles.guestDetailField}>
                      <label className={styles.guestDetailLabel}>RSVP Status</label>
                      <select className="input" value={editGuest.rsvp_status || 'pending'} onChange={(e) => setEditGuest({ ...editGuest, rsvp_status: e.target.value as RSVP })}>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="declined">Declined</option>
                        <option value="maybe">Maybe</option>
                      </select>
                    </div>
                    <div className={styles.guestDetailField}>
                      <label className={styles.guestDetailLabel}>Group</label>
                      <input className="input" value={editGuest.group_name || ''} onChange={(e) => setEditGuest({ ...editGuest, group_name: e.target.value })} />
                    </div>
                  </div>
                  <div className={styles.guestDetailRow}>
                    <div className={styles.guestDetailField}>
                      <label className={styles.guestDetailLabel}>Table Assignment</label>
                      <select className="input" value={editGuest.table_id || ''} onChange={(e) => setEditGuest({ ...editGuest, table_id: e.target.value || null })}>
                        <option value="">— No table —</option>
                        {tables.map((t) => (
                          <option key={t.id} value={t.id}>{t.table_name} (cap. {t.capacity})</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.guestDetailField}>
                      <label className={styles.guestDetailLabel}>Notes</label>
                      <input className="input" value={editGuest.notes || ''} onChange={(e) => setEditGuest({ ...editGuest, notes: e.target.value })} />
                    </div>
                  </div>
                  <div className={styles.guestDetailCheckRow}>
                    <Checkbox
                      checked={editGuest.is_vip || false}
                      onChange={(e) => setEditGuest({ ...editGuest, is_vip: e.target.checked })}
                    />
                    <span style={{ fontSize: 'var(--text-sm)', flex: 1 }}>VIP Guest</span>
                    <Checkbox
                      checked={editGuest.plus_one || false}
                      onChange={(e) => setEditGuest({ ...editGuest, plus_one: e.target.checked })}
                    />
                    <span style={{ fontSize: 'var(--text-sm)' }}>Plus One</span>
                  </div>
                  <div className={styles.guestDetailCheckRow}>
                    <button
                      className={`btn btn-sm ${editGuest.checked_in ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ borderRadius: 'var(--radius-sm)' }}
                      onClick={() => setEditGuest({ ...editGuest, checked_in: !editGuest.checked_in })}
                    >
                      {editGuest.checked_in ? <Check size={14} /> : <UserCheck size={14} />}
                      {editGuest.checked_in ? ' Checked In' : ' Mark Checked In'}
                    </button>
                    {editGuest.checked_in && (
                      <span className={styles.guestDetailNote}>
                        Checked in at {new Date(selectedGuest.checked_in_at || '').toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className={styles.guestDetailActions}>
                    <button className="btn btn-primary" style={{ borderRadius: 'var(--radius-sm)' }} onClick={handleSaveGuest} disabled={saving}>
                      <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn btn-ghost btn-icon" style={{ color: 'var(--color-error)' }} onClick={handleDeleteGuest}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.guestDetailEmpty}>
                <Users size={40} className={styles.guestDetailEmptyIcon} />
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Select a guest</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Choose a guest from the list to view and edit details</div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'checkin' && (
        <div className={styles.checkinView}>
          <div className={styles.checkinHeaderRow}>
            <div className={styles.checkinStats}>
              <div className={styles.checkinStatItem}>
                <span className={styles.checkinStatNum}>{guests.filter(g => g.checked_in).length}</span>
                <span className={styles.checkinStatLabel}>Checked In</span>
              </div>
              <div className={styles.checkinStatDivider} />
              <div className={styles.checkinStatItem}>
                <span className={styles.checkinStatNum}>{guests.length}</span>
                <span className={styles.checkinStatLabel}>Total Guests</span>
              </div>
              <div className={styles.checkinStatDivider} />
              <div className={styles.checkinStatItem}>
                <span className={styles.checkinStatNum}>
                  {guests.length > 0 ? Math.round((guests.filter(g => g.checked_in).length / guests.length) * 100) : 0}%
                </span>
                <span className={styles.checkinStatLabel}>Attendance</span>
              </div>
            </div>
            <div className={styles.checkinSearchRow}>
              <SearchBar value={checkinSearch} onChange={setCheckinSearch} placeholder="Search name or phone..." containerStyle={{ width: 280 }} autoFocus />
              <div className={styles.checkinChips}>
                <button className={`${styles.checkinChip} ${rsvpFilter === 'all' ? styles.checkinChipActive : ''}`} onClick={() => setRsvpFilter('all')}>All</button>
                <button className={`${styles.checkinChip} ${rsvpFilter === 'confirmed' ? styles.checkinChipActive : ''}`} onClick={() => setRsvpFilter('confirmed')}>Confirmed</button>
                <button className={`${styles.checkinChip} ${rsvpFilter === 'pending' ? styles.checkinChipActive : ''}`} onClick={() => setRsvpFilter('pending')}>Pending</button>
              </div>
            </div>
          </div>
          <div className={styles.checkinGrid}>
            {filteredGuests.length === 0 ? (
              <div className={styles.checkinEmpty}>
                <User size={32} />
                <div>No guests match your search</div>
              </div>
            ) : (
              filteredGuests.map((g) => {
                const initial = (g.first_name || '?').charAt(0).toUpperCase()
                return (
                  <div key={g.id} className={`${styles.checkinCard} ${g.checked_in ? styles.checkedIn : ''}`} onClick={() => handleCheckin(g.id)}>
                    <div className={styles.checkinAvatar} style={{ background: g.checked_in ? 'var(--color-success)' : 'var(--color-surface-3)' }}>
                      {initial}
                    </div>
                    <div className={styles.checkinInfo}>
                      <div className={styles.checkinName}>{g.first_name} {g.last_name || ''}</div>
                      <div className={styles.checkinMeta}>{g.phone || g.email || ''}</div>
                      {g.is_vip && <span className={styles.checkinVip}>VIP</span>}
                    </div>
                    <div className={styles.checkinToggle}>
                      {g.checked_in ? (
                        <span className={styles.checkinToggleIn}>
                          <Check size={16} />
                        </span>
                      ) : (
                        <span className={styles.checkinToggleOut}>
                          <UserCheck size={16} />
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
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
            <div className={styles.modalHeader}><h3>Add Guest</h3><button className={styles.closeBtn} onClick={() => setShowAdd(false)} data-tooltip="Close"><X size={18} /></button></div>
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
            <div className={styles.modalHeader}><h3>Import CSV</h3><button className={styles.closeBtn} onClick={() => setShowCSV(false)} data-tooltip="Close"><X size={18} /></button></div>
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
            <div className={styles.modalHeader}><h3>Add Table</h3><button className={styles.closeBtn} onClick={() => setShowTableForm(false)} data-tooltip="Close"><X size={18} /></button></div>
            <div className={styles.modalBody}>
              <div className="input-wrapper" style={{ marginBottom: 'var(--space-3)' }}><label className="input-label">Table Name</label><input className="input" value={tableForm.table_name} onChange={(e) => setTableForm({ ...tableForm, table_name: e.target.value })} placeholder="e.g. Table 1" /></div>
              <div className="input-wrapper" style={{ marginBottom: 'var(--space-4)' }}><label className="input-label">Capacity</label><input className="input" type="number" min={1} value={tableForm.capacity} onChange={(e) => setTableForm({ ...tableForm, capacity: Number(e.target.value) })} /></div>
              <button className={`btn btn-primary ${styles.fullBtn}`} onClick={handleAddTable}>Add Table</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
