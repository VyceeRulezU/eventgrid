import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useNavigate } from 'react-router-dom'
import { Tabs } from '@/components/ui/Tabs'
import { Checkbox } from '@/components/ui/Checkbox'
import { Calendar, Users, Building, Eye, ExternalLink, X } from 'lucide-react'
import styles from './AdminManagePage.module.css'

interface PersonRow {
  id: string
  display_name: string | null
  email: string
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  org_name: string | null
  event_count: number
}

interface EventRow {
  id: string
  name: string
  event_type: string
  status: string
  event_date: string | null
  guest_count: number | null
  creator_name: string
  creator_email: string
  org_name: string
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', active: 'Active', in_progress: 'In Progress',
  completed: 'Completed', cancelled: 'Cancelled',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`${styles.statusBadge} ${styles[`status_${status}`] || ''}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

function ModalAvatar({ name, url }: { name: string | null; url: string | null }) {
  if (url) return <img src={url} alt="" className={styles.modalAvatar} />
  const initials = (name || '?').split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2)
  return <div className={styles.modalAvatarPlaceholder}>{initials}</div>
}

function TableAvatar({ name, url }: { name: string | null; url: string | null }) {
  if (url) return <img src={url} alt="" className={styles.avatar} />
  const initials = (name || '?').split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2)
  return <div className={styles.avatarPlaceholder}>{initials}</div>
}

const PAGE_SIZE = 10

function PersonModal({
  person,
  roleLabel,
  onClose,
}: {
  person: PersonRow
  roleLabel: string
  onClose: () => void
}) {
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'current' | 'previous' | 'pending'>('current')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('events')
        .select('id, name, event_type, status, event_date, guest_count, created_at, org_id')
        .is('deleted_at', null)
        .eq('created_by', person.id)
        .order('created_at', { ascending: false })

      const { data: orgs } = await supabase.from('organizations').select('id, name')
      const orgMap = new Map((orgs || []).map(o => [o.id, o.name]))
      setEvents((data || []).map(e => ({
        id: e.id,
        name: e.name,
        event_type: e.event_type,
        status: e.status,
        event_date: e.event_date,
        guest_count: e.guest_count,
        creator_name: person.display_name || person.email,
        creator_email: person.email,
        org_name: orgMap.get(e.org_id) || 'Unknown',
      })))
      setLoading(false)
    }
    load()
  }, [person])

  const currentEvents = events.filter(e => e.status === 'active' || e.status === 'in_progress')
  const previousEvents = events.filter(e => e.status === 'completed' || e.status === 'cancelled')
  const pendingEvents = events.filter(e => e.status === 'draft')

  function renderEventList(list: EventRow[]) {
    if (list.length === 0) {
      return (
        <div className={styles.emptyTab}>
          <Calendar size={32} />
          <div className={styles.emptyTabTitle}>No events</div>
          <div className={styles.emptyTabDesc}>No events in this category</div>
        </div>
      )
    }
    return (
      <div className={styles.modalEventList}>
        {list.map(e => (
          <div key={e.id} className={styles.modalEventCard}>
            <div className={styles.modalEventCardLeft}>
              <div className={styles.modalEventName}>{e.name}</div>
              <div className={styles.modalEventMeta}>
                {e.event_date ? formatDate(e.event_date) : 'No date'} · {e.event_type}
              </div>
            </div>
            <div className={styles.modalEventCardRight}>
              <StatusBadge status={e.status} />
              {e.guest_count != null && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  <Users size={12} />{e.guest_count}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderLeft}>
              <ModalAvatar name={person.display_name} url={person.avatar_url} />
              <div>
                <div className={styles.modalName}>{person.display_name || 'Unnamed'}</div>
                <div className={styles.modalMeta}>{roleLabel}</div>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
          </div>
          <div className={styles.modalBody}>
            {[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 48, marginBottom: 'var(--space-2)' }} />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <ModalAvatar name={person.display_name} url={person.avatar_url} />
            <div>
              <div className={styles.modalName}>{person.display_name || 'Unnamed'}</div>
              <div className={styles.modalMeta}>
                {person.email} · {person.event_count} event{person.event_count !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.modalBody}>
          <Tabs
            tabs={[
              { key: 'current', label: 'Current Events', badge: currentEvents.length },
              { key: 'previous', label: 'Previous Events', badge: previousEvents.length },
              { key: 'pending', label: 'Pending Events', badge: pendingEvents.length },
            ]}
            activeTab={tab}
            onChange={setTab}
          />

          <div style={{ marginTop: 'var(--space-3)' }}>
            {tab === 'current' && renderEventList(currentEvents)}
            {tab === 'previous' && renderEventList(previousEvents)}
            {tab === 'pending' && renderEventList(pendingEvents)}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminManagePage() {
  const role = useAuthStore((s) => s.role)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'planners' | 'coordinators' | 'events'>('planners')
  const [loading, setLoading] = useState(true)
  const [planners, setPlanners] = useState<PersonRow[]>([])
  const [coordinators, setCoordinators] = useState<PersonRow[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [page, setPage] = useState(0)
  const [selectedPerson, setSelectedPerson] = useState<PersonRow | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const loadData = useCallback(async () => {
    setLoading(true)

    const [{ data: profiles }, { data: orgs }, { data: allEvents }] = await Promise.all([
      supabase.from('profiles').select('id, display_name, email, phone, avatar_url, is_active, org_id, role, created_at').order('created_at', { ascending: false }),
      supabase.from('organizations').select('id, name'),
      supabase.from('events').select('id, name, event_type, status, event_date, guest_count, created_at, created_by, org_id, coordinator_id').is('deleted_at', null).order('created_at', { ascending: false }),
    ])

    const orgMap = new Map((orgs || []).map(o => [o.id, o.name]))
    const profileMap = new Map((profiles || []).map(p => [p.id, p]))

    const eventCountByCreator = new Map<string, number>()
    const eventCountByCoordinator = new Map<string, number>()
    ;(allEvents || []).forEach(e => {
      eventCountByCreator.set(e.created_by, (eventCountByCreator.get(e.created_by) || 0) + 1)
      if (e.coordinator_id) {
        eventCountByCoordinator.set(e.coordinator_id, (eventCountByCoordinator.get(e.coordinator_id) || 0) + 1)
      }
    })

    const plannerRows: PersonRow[] = []
    const coordinatorRows: PersonRow[] = []

    ;(profiles || []).forEach(p => {
      const row: PersonRow = {
        id: p.id,
        display_name: p.display_name,
        email: p.email,
        phone: p.phone,
        avatar_url: p.avatar_url,
        is_active: p.is_active,
        org_name: p.org_id ? orgMap.get(p.org_id) || null : null,
        event_count: 0,
      }
      if (p.role === 'planner') {
        row.event_count = eventCountByCreator.get(p.id) || 0
        plannerRows.push(row)
      } else if (p.role === 'coordinator') {
        row.event_count = eventCountByCoordinator.get(p.id) || 0
        coordinatorRows.push(row)
      }
    })

    setPlanners(plannerRows)
    setCoordinators(coordinatorRows)

    const eventRows: EventRow[] = (allEvents || []).map(e => {
      const orgName = orgMap.get(e.org_id) || 'Unknown'
      const cp = profileMap.get(e.created_by)
      return {
        id: e.id,
        name: e.name,
        event_type: e.event_type,
        status: e.status,
        event_date: e.event_date,
        guest_count: e.guest_count,
        creator_name: cp?.display_name || cp?.email || 'Unknown',
        creator_email: cp?.email || '',
        org_name: orgName,
      }
    })
    setEvents(eventRows)

    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData, role])

  const currentData = activeTab === 'planners' ? planners : activeTab === 'coordinators' ? coordinators : events
  const totalItems = currentData.length
  const totalPages = Math.ceil(totalItems / PAGE_SIZE)
  const pageData = currentData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const allSelected = pageData.length > 0 && (activeTab === 'events'
    ? pageData.every((e: EventRow) => selectedIds.has(e.id))
    : pageData.every((p: PersonRow) => selectedIds.has(p.id)))

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pageData.map(item => item.id)))
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedIds(next)
  }

  function renderPersonTable(data: PersonRow[], label: string) {
    return (
      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={`${styles.th} ${styles.thCheck}`}>
                  <Checkbox checked={allSelected} onChange={toggleSelectAll} aria-label={`Select all ${label}`} />
                </th>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Email</th>
                <th className={styles.th}>Phone</th>
                <th className={styles.th}>Organization</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Events</th>
                <th className={`${styles.th} ${styles.thActions}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(p => (
                <tr
                  key={p.id}
                  className={`${styles.tr} ${selectedIds.has(p.id) ? styles.trSelected : ''}`}
                  onClick={() => setSelectedPerson(p)}
                >
                  <td className={`${styles.td} ${styles.tdCheck}`} onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      aria-label={`Select ${p.display_name || p.email}`}
                    />
                  </td>
                  <td className={`${styles.td} ${styles.memberCell}`}>
                    <div className={styles.memberInfo}>
                      <TableAvatar name={p.display_name} url={p.avatar_url} />
                      <div>
                        <div className={styles.memberName}>{p.display_name || 'Unnamed'}</div>
                        <div className={styles.memberEmail}>{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.cellTruncate}>{p.email}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.cellMuted}>{p.phone || '—'}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.cellTruncate}>
                      {p.org_name ? <><Building size={14} style={{ verticalAlign: 'middle', marginRight: 4, color: 'var(--color-text-muted)' }} />{p.org_name}</> : '—'}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <StatusBadge status={p.is_active ? 'activePlanner' : 'inactivePlanner'} />
                  </td>
                  <td className={styles.td}>
                    <span style={{ fontWeight: 600 }}>{p.event_count}</span>
                  </td>
                  <td className={`${styles.td} ${styles.actionsCell}`}>
                    <button
                      className={styles.iconBtn}
                      onClick={(e) => { e.stopPropagation(); setSelectedPerson(p) }}
                      title="View details"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFooter}>
          <span>{totalItems} {label}</span>
          {totalPages > 1 && (
            <span>
              Page {page + 1} of {totalPages}
              <button className="btn btn-ghost btn-xs" style={{ marginLeft: 'var(--space-2)' }} disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</button>
              <button className="btn btn-ghost btn-xs" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
            </span>
          )}
        </div>
      </div>
    )
  }

  function renderEventsTable() {
    const data = pageData as EventRow[]
    return (
      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={`${styles.th} ${styles.thCheck}`}>
                  <Checkbox checked={allSelected} onChange={toggleSelectAll} aria-label="Select all events" />
                </th>
                <th className={styles.th}>Event Name</th>
                <th className={styles.th}>Created By</th>
                <th className={styles.th}>Type</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>Guests</th>
                <th className={`${styles.th} ${styles.thActions}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(e => (
                <tr
                  key={e.id}
                  className={`${styles.tr} ${selectedIds.has(e.id) ? styles.trSelected : ''}`}
                >
                  <td className={`${styles.td} ${styles.tdCheck}`} onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(e.id)}
                      onChange={() => toggleSelect(e.id)}
                      aria-label={`Select ${e.name}`}
                    />
                  </td>
                  <td className={styles.td}>
                    <span className={styles.cellTruncate} style={{ fontWeight: 600, maxWidth: 240 }}>{e.name}</span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.plannerStack}>
                      <span className={styles.orgLabel}>{e.org_name}</span>
                      <span className={styles.cellTruncate}>{e.creator_name}</span>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.cellMuted}>{e.event_type}</span>
                  </td>
                  <td className={styles.td}>
                    <StatusBadge status={e.status} />
                  </td>
                  <td className={styles.td}>
                    <span className={styles.cellMuted}>{e.event_date ? formatDate(e.event_date) : '—'}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.cellMuted}>{e.guest_count ?? '—'}</span>
                  </td>
                  <td className={`${styles.td} ${styles.actionsCell}`}>
                    <button
                      className={styles.iconBtn}
                      onClick={() => navigate(`/events/${e.id}`)}
                      title="Open event"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFooter}>
          <span>{totalItems} events</span>
          {totalPages > 1 && (
            <span>
              Page {page + 1} of {totalPages}
              <button className="btn btn-ghost btn-xs" style={{ marginLeft: 'var(--space-2)' }} disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</button>
              <button className="btn btn-ghost btn-xs" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
            </span>
          )}
        </div>
      </div>
    )
  }

  if (role !== 'super_admin') return null

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Users size={20} className={styles.headerIcon} />
          <div>
            <h2 className={styles.headerTitle}>Manage</h2>
            <p className={styles.headerSubtitle}>Users and events across the platform</p>
          </div>
        </div>
      </div>

      <Tabs
        tabs={[
          { key: 'planners', label: 'Planners', icon: <Users size={16} />, badge: planners.length },
          { key: 'coordinators', label: 'Coordinators', icon: <Users size={16} />, badge: coordinators.length },
          { key: 'events', label: 'Events', icon: <Calendar size={16} />, badge: events.length },
        ]}
        activeTab={activeTab}
        onChange={(k) => { setActiveTab(k); setPage(0); setSelectedPerson(null); setSelectedIds(new Set()) }}
      />

      {loading ? (
        <div className={styles.loadingGrid}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 56 }} />)}
        </div>
      ) : activeTab === 'planners' ? (
        renderPersonTable(planners, 'planners')
      ) : activeTab === 'coordinators' ? (
        renderPersonTable(coordinators, 'coordinators')
      ) : (
        renderEventsTable()
      )}

      {selectedPerson && (
        <PersonModal
          person={selectedPerson}
          roleLabel={activeTab === 'planners' ? 'Planner' : 'Coordinator'}
          onClose={() => setSelectedPerson(null)}
        />
      )}
    </div>
  )
}
