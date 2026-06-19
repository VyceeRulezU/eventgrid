import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { useNavigate } from 'react-router-dom'
import { Tabs } from '@/components/ui/Tabs'
import { Checkbox } from '@/components/ui/Checkbox'
import { Calendar, Users, Building, CreditCard, Eye, ExternalLink, Pencil, Trash2, X } from 'lucide-react'
import { EVENT_FEE_KOBO } from '@/lib/pricing'
import { AdminPageHero } from '@/components/shared/AdminPageHero'
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
  creator_role: string
  org_name: string
}

interface PaymentRow {
  id: string
  created_at: string
  event_name: string
  organization: string
  creator_name: string
  amount: number
  payment_provider: string | null
  paystack_ref: string | null
  payment_status: string
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
        creator_role: '',
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
            <button className={styles.closeBtn} onClick={onClose} data-tooltip="Close"><X size={18} /></button>
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
              {person.phone && (
                <div className={styles.modalMeta} style={{ marginTop: 2 }}>
                  📞 {person.phone}
                </div>
              )}
              {person.org_name && (
                <div className={styles.modalMeta} style={{ marginTop: 2 }}>
                  🏢 {person.org_name}
                </div>
              )}
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} data-tooltip="Close"><X size={18} /></button>
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

function PaymentDetailModal({ payment, onClose }: { payment: PaymentRow; onClose: () => void }) {
  const method = payment.payment_provider
    ? payment.payment_provider.charAt(0).toUpperCase() + payment.payment_provider.slice(1)
    : '—'

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.payModal} onClick={e => e.stopPropagation()}>
        <button className={styles.payCloseBtn} onClick={onClose} data-tooltip="Close"><X size={18} /></button>

        <div className={styles.payHero}>
          <div className={styles.payAmount}>
            {formatCurrency(payment.amount)}
          </div>
          <div className={styles.paySubtitle}>Event Subscription</div>
          <span className={`${styles.statusBadge} ${styles.status_paid}`}>Paid</span>
        </div>

        <div className={styles.paySection}>
          <div className={styles.paySectionTitle}>Details</div>
          <div className={styles.payCard}>
            <PayRow label="Event" value={payment.event_name} />
            <PayRow label="Organization" value={payment.organization} />
            <PayRow label="Created by" value={payment.creator_name} />
            <PayRow label="Date" value={formatDate(payment.created_at)} last />
          </div>
        </div>

        <div className={styles.paySection}>
          <div className={styles.paySectionTitle}>Payment Info</div>
          <div className={styles.payCard}>
            <PayRow label="Method" value={method} />
            <PayRow label="Reference" value={payment.paystack_ref ? `${payment.paystack_ref}` : '—'} last />
          </div>
        </div>
      </div>
    </div>
  )
}

function PayRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`${styles.payRow} ${last ? styles.payRowLast : ''}`}>
      <span className={styles.payLabel}>{label}</span>
      <span className={styles.payValue}>{value}</span>
    </div>
  )
}

function formatCurrency(kobo: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(kobo / 100)
}

export function AdminManagePage() {
  const role = useAuthStore((s) => s.role)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'planners' | 'coordinators' | 'events' | 'payments' | 'users'>(() => {
    const tab = new URLSearchParams(window.location.search).get('tab')
    if (tab === 'coordinators' || tab === 'events' || tab === 'payments' || tab === 'users') return tab
    return 'planners'
  })
  const [loading, setLoading] = useState(true)
  const [planners, setPlanners] = useState<PersonRow[]>([])
  const [coordinators, setCoordinators] = useState<PersonRow[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [authUsers, setAuthUsers] = useState<{ id: string; email: string; created_at: string; last_sign_in_at: string | null; confirmed_at: string | null }[]>([])
  const [page, setPage] = useState(0)
  const [selectedPerson, setSelectedPerson] = useState<PersonRow | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null)
  const [eventFilter, setEventFilter] = useState<string>('all')

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
        creator_role: cp?.role || 'unknown',
        org_name: orgName,
      }
    })
    setEvents(eventRows)

    setLoading(false)
  }, [])

  const loadAuthUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('list-users')
      if (error) {
        console.error('list-users error:', error)
        return
      }
      if (data?.users && Array.isArray(data.users)) {
        setAuthUsers(data.users.map((u: any) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          confirmed_at: u.email_confirmed_at || u.confirmed_at,
        })))
      }
    } catch (err) {
      console.error('loadAuthUsers exception:', err)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData, role])

  useEffect(() => {
    loadAuthUsers()
  }, [loadAuthUsers])

  const loadPayments = useCallback(async () => {
    const { data: paidEvents } = await supabase
      .from('events')
      .select('id, name, created_at, payment_status, paystack_ref, payment_provider, created_by, org_id')
      .eq('payment_status', 'paid')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100)

    const orgIds = [...new Set((paidEvents || []).map(e => e.org_id).filter(Boolean))]
    const profileIds = [...new Set((paidEvents || []).map(e => e.created_by).filter(Boolean))]

    const [{ data: orgs }, { data: profiles }] = await Promise.all([
      orgIds.length > 0
        ? supabase.from('organizations').select('id, name').in('id', orgIds)
        : { data: [] },
      profileIds.length > 0
        ? supabase.from('profiles').select('id, display_name, email').in('id', profileIds)
        : { data: [] },
    ])

    const orgMap = new Map((orgs || []).map(o => [o.id, o.name]))
    const profileMap = new Map((profiles || []).map(p => [p.id, p]))

    setPayments((paidEvents || []).map(e => ({
      id: e.id,
      created_at: e.created_at,
      event_name: e.name,
      organization: orgMap.get(e.org_id) || 'Unknown',
      creator_name: profileMap.get(e.created_by)?.display_name || profileMap.get(e.created_by)?.email || 'Unknown',
      amount: EVENT_FEE_KOBO,
      payment_provider: e.payment_provider || null,
      paystack_ref: e.paystack_ref || null,
      payment_status: e.payment_status,
    })))
  }, [])

  useEffect(() => { loadPayments() }, [loadPayments])

  const showModal = useUIStore((s) => s.showModal)
  const showNotification = useUIStore((s) => s.showNotification)

  const handleDeletePerson = async (person: PersonRow, label: string) => {
    showModal({
      variant: 'confirm',
      title: `Delete ${label}?`,
      message: `This action is permanent and cannot be undone. All data associated with ${person.display_name || person.email} will be removed from the platform.`,
      actions: [
        { label: 'Cancel', variant: 'secondary' as const, onClick: () => {} },
        {
          label: 'Delete',
          variant: 'danger' as const,
          onClick: async () => {
            let result
            try {
              result = await supabase.functions.invoke('delete-user', {
                body: { user_id: person.id },
              })
            } catch (err) {
              console.error('[delete-person] unexpected error:', err)
              showNotification({ variant: 'error', title: 'Delete failed', message: err instanceof Error ? err.message : 'Unexpected error' })
              return
            }
            const { data, error: invokeError } = result
            if (invokeError) {
              console.error('[delete-person] invokeError:', invokeError.name, invokeError.message, invokeError.context)
              let detail = invokeError.message
              try {
                if (invokeError.context?.json) {
                  const body = await invokeError.context.json()
                  detail = body?.error || body?.message || detail
                }
              } catch {}
              showNotification({ variant: 'error', title: 'Delete failed', message: detail })
            } else if (data?.error) {
              showNotification({ variant: 'error', title: 'Delete failed', message: data.error })
            } else {
              showNotification({ variant: 'success', title: 'Deleted', message: `${person.display_name || person.email} has been permanently deleted.` })
              loadAuthUsers()
              loadData()
            }
          },
        },
      ],
    })
  }

  const handleDeleteEvent = async (event: EventRow) => {
    showModal({
      variant: 'confirm',
      title: 'Delete Event?',
      message: `Are you sure you want to delete "${event.name}"? This action cannot be undone.`,
      actions: [
        { label: 'Cancel', variant: 'secondary' as const, onClick: () => {} },
        {
          label: 'Delete',
          variant: 'danger' as const,
          onClick: async () => {
            const { error } = await supabase.rpc('soft_delete_events', { event_ids: [event.id] })
            if (error) {
              showNotification({ variant: 'error', title: 'Delete failed', message: error.message })
            } else {
              showNotification({ variant: 'success', title: 'Deleted', message: `"${event.name}" has been deleted.` })
              loadData()
            }
          },
        },
      ],
    })
  }

  const handleEditPerson = (person: PersonRow) => {
    setEditingPerson({ ...person })
  }

  const [editingPerson, setEditingPerson] = useState<PersonRow | null>(null)

  const handleEditSave = async () => {
    if (!editingPerson) return
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: editingPerson.display_name,
        phone: editingPerson.phone,
      })
      .eq('id', editingPerson.id)
    if (error) {
      showNotification({ variant: 'error', title: 'Update failed', message: error.message })
    } else {
      showNotification({ variant: 'success', title: 'Updated' })
      setEditingPerson(null)
      loadData()
    }
  }

  const filteredEvents = activeTab === 'events' && eventFilter !== 'all'
    ? events.filter(e => e.creator_role === eventFilter)
    : events
  const currentData = activeTab === 'planners' ? planners : activeTab === 'coordinators' ? coordinators : activeTab === 'payments' ? payments : filteredEvents
  const totalItems = currentData.length
  const totalPages = Math.ceil(totalItems / PAGE_SIZE)
  const pageData = currentData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const allSelected = pageData.length > 0 && pageData.every(item => selectedIds.has(item.id))

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
    const handleBulkDelete = () => {
      const ids = Array.from(selectedIds)
      const count = ids.length
      showModal({
        variant: 'confirm',
        title: `Delete ${count} ${label}?`,
        message: `This action is permanent and cannot be undone. All data associated with ${count > 1 ? 'these accounts' : 'this account'} will be removed from the platform.`,
        actions: [
          { label: 'Cancel', variant: 'secondary' as const, onClick: () => {} },
          {
            label: 'Delete',
            variant: 'danger' as const,
            onClick: async () => {
              let failed = 0
              for (const id of ids) {
                let errMsg
                try {
                  const { error: e, data: d } = await supabase.functions.invoke('delete-user', { body: { user_id: id } })
                  if (e) {
                    console.error('[bulk-delete] invokeError:', e.name, e.message, e.context)
                    errMsg = e.message
                    try { if (e.context?.json) { const b = await e.context.json(); errMsg = b?.error || errMsg } } catch {}
                    failed++
                  } else if (d?.error) {
                    console.error('[bulk-delete] data error:', d.error)
                    errMsg = d.error
                    failed++
                  }
                } catch (err) {
                  console.error('[bulk-delete] unexpected error:', err)
                  errMsg = err instanceof Error ? err.message : 'Unexpected error'
                  failed++
                }
              }
              setSelectedIds(new Set())
              loadAuthUsers()
              loadData()
            },
          },
        ],
      })
    }

    return (
      <div className={styles.tableCard}>
        {selectedIds.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }}>
            <span>{selectedIds.size} selected</span>
            <button className="btn btn-destructive btn-sm" onClick={handleBulkDelete}>
              Delete Selected
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds(new Set())}>
              Clear
            </button>
          </div>
        )}
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
                      data-tooltip="View details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className={styles.iconBtn}
                      onClick={(e) => { e.stopPropagation(); handleEditPerson(p) }}
                      data-tooltip="Edit"
                      style={{ marginLeft: 4 }}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      onClick={(e) => { e.stopPropagation(); handleDeletePerson(p, label) }}
                      data-tooltip="Delete"
                      style={{ marginLeft: 4 }}
                    >
                      <Trash2 size={16} />
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
    const handleBulkDeleteEvents = () => {
      const eventIds = Array.from(selectedIds)
      const count = eventIds.length
      showModal({
        variant: 'confirm',
        title: `Delete ${count} event${count !== 1 ? 's' : ''}?`,
        message: `Are you sure you want to delete ${count > 1 ? 'these events' : 'this event'}? This action cannot be undone.`,
        actions: [
          { label: 'Cancel', variant: 'secondary' as const, onClick: () => {} },
          {
            label: 'Delete',
            variant: 'danger' as const,
            onClick: async () => {
              const { error } = await supabase.rpc('soft_delete_events', { event_ids: eventIds })
              if (error) {
                showNotification({ variant: 'error', title: 'Delete failed', message: error.message })
              } else {
                showNotification({ variant: 'success', title: 'Deleted', message: `${count} event${count !== 1 ? 's' : ''} deleted.` })
              }
              setSelectedIds(new Set())
              loadData()
            },
          },
        ],
      })
    }

    return (
      <div className={styles.tableCard}>
        {selectedIds.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }}>
            <span>{selectedIds.size} selected</span>
            <button className="btn btn-destructive btn-sm" onClick={handleBulkDeleteEvents}>
              Delete Selected
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds(new Set())}>
              Clear
            </button>
          </div>
        )}
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
                      data-tooltip="Open event"
                    >
                      <ExternalLink size={16} />
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      onClick={(ev) => { ev.stopPropagation(); handleDeleteEvent(e) }}
                      data-tooltip="Delete event"
                      style={{ marginLeft: 4 }}
                    >
                      <Trash2 size={16} />
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

  function renderPaymentsTable() {
    const data = pageData as PaymentRow[]
    return (
      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>Event</th>
                <th className={styles.th}>Organization</th>
                <th className={styles.th}>Amount</th>
                <th className={styles.th}>Method</th>
                <th className={styles.th}>Status</th>
                <th className={`${styles.th} ${styles.thActions}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                    <div className="empty-state"><div className="empty-state__title">No payments yet</div></div>
                  </td>
                </tr>
              ) : data.map(p => (
                <tr key={p.id} className={styles.tr}>
                  <td className={styles.td} style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>
                    {formatDate(p.created_at)}
                  </td>
                  <td className={styles.td}>
                    <span className={styles.cellTruncate} style={{ fontWeight: 600 }}>{p.event_name}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.cellTruncate}>{p.organization}</span>
                  </td>
                  <td className={styles.td} style={{ fontWeight: 600, color: 'var(--color-accent)', whiteSpace: 'nowrap' }}>{formatCurrency(p.amount)}</td>
                  <td className={styles.td}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{p.payment_provider ? p.payment_provider.charAt(0).toUpperCase() + p.payment_provider.slice(1) : '—'}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={`${styles.statusBadge} ${styles[`status_${p.payment_status}`] || ''}`}>
                      {p.payment_status === 'paid' ? 'Paid' : p.payment_status}
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.actionsCell}`}>
                    <button
                      className={styles.iconBtn}
                      onClick={() => setSelectedPayment(p)}
                      data-tooltip="View details"
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
          <span>{payments.length} payments</span>
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

  if (!role) return <div className={styles.page}><div className="skeleton skeleton-title" style={{ width: 200, marginBottom: 'var(--space-4)' }} /></div>
  if (role !== 'super_admin') return null

  return (
    <div className={styles.page}>
      <AdminPageHero
        icon={Users}
        title="Manage"
        subtitle="Users and events across the platform"
        backTo="/admin"
      />

      <Tabs
        tabs={[
          { key: 'planners', label: 'Planners', icon: <Users size={16} />, badge: planners.length },
          { key: 'coordinators', label: 'Coordinators', icon: <Users size={16} />, badge: coordinators.length },
          { key: 'events', label: 'Events', icon: <Calendar size={16} />, badge: events.length },
          { key: 'payments', label: 'Payments', icon: <CreditCard size={16} />, badge: payments.length },
          { key: 'users', label: 'All Users', icon: <Users size={16} />, badge: authUsers.length },
        ]}
        activeTab={activeTab}
        onChange={(k) => { setActiveTab(k); setPage(0); setSelectedPerson(null); setSelectedPayment(null); setSelectedIds(new Set()); navigate(`/admin/manage?tab=${k}`, { replace: true }) }}
      />

      {loading ? (
        <div className={styles.loadingGrid}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 56 }} />)}
        </div>
      ) : activeTab === 'planners' ? (
        renderPersonTable(planners, 'planners')
      ) : activeTab === 'coordinators' ? (
        renderPersonTable(coordinators, 'coordinators')
      ) : activeTab === 'payments' ? (
        renderPaymentsTable()
      ) : activeTab === 'users' ? (
        <div className={styles.tableCard}>
          {selectedIds.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }}>
              <span>{selectedIds.size} selected</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds(new Set())}>
                Clear
              </button>
              <button
                className="btn btn-destructive btn-sm"
                onClick={() => {
                          const ids = Array.from(selectedIds)
                          const count = ids.length
                          showModal({
                            variant: 'confirm',
                            title: `Delete ${count} user${count !== 1 ? 's' : ''}?`,
                            message: `This action is permanent and cannot be undone. All data associated with ${count > 1 ? 'these accounts' : 'this account'} will be removed from the platform.`,
                            actions: [
                              { label: 'Cancel', variant: 'secondary', onClick: () => {} },
                              {
                                label: 'Delete',
                                variant: 'danger',
                                onClick: async () => {
                                  let failed = 0
                                  for (const id of ids) {
                                    let errMsg
                                    try {
                                      const { error: e, data: d } = await supabase.functions.invoke('delete-user', { body: { user_id: id } })
                                      if (e) {
                                        console.error('[bulk-delete-users] invokeError:', e.name, e.message, e.context)
                                        errMsg = e.message
                                        try { if (e.context?.json) { const b = await e.context.json(); errMsg = b?.error || errMsg } } catch {}
                                        failed++
                                      } else if (d?.error) {
                                        console.error('[bulk-delete-users] data error:', d.error)
                                        errMsg = d.error
                                        failed++
                                      }
                                    } catch (err) {
                                      console.error('[bulk-delete-users] unexpected error:', err)
                                      errMsg = err instanceof Error ? err.message : 'Unexpected error'
                                      failed++
                                    }
                                  }
                                  if (failed === 0) {
                                    showNotification({ variant: 'success', title: 'Deleted', message: `${count} user${count !== 1 ? 's' : ''} deleted.` })
                                  } else {
                                    showNotification({ variant: 'error', title: 'Delete failed', message: `${failed} of ${count} could not be deleted.` })
                                  }
                                  setSelectedIds(new Set())
                                  loadAuthUsers()
                                  loadData()
                                },
                              },
                            ],
                          })
                }}
              >
                Delete Selected
              </button>
            </div>
          )}
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={`${styles.th} ${styles.thCheck}`}>
                    <Checkbox
                      checked={authUsers.length > 0 && authUsers.every(u => selectedIds.has(u.id))}
                      onChange={() => {
                        if (authUsers.every(u => selectedIds.has(u.id))) {
                          setSelectedIds(new Set())
                        } else {
                          setSelectedIds(new Set(authUsers.map(u => u.id)))
                        }
                      }}
                      aria-label="Select all users"
                    />
                  </th>
                  <th className={styles.th}>Email</th>
                  <th className={styles.th}>Created</th>
                  <th className={styles.th}>Confirmed</th>
                  <th className={styles.th}>Last Sign In</th>
                  <th className={`${styles.th} ${styles.thActions}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {authUsers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(u => (
                  <tr key={u.id} className={`${styles.tr} ${selectedIds.has(u.id) ? styles.trSelected : ''}`}>
                    <td className={`${styles.td} ${styles.tdCheck}`} onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(u.id)}
                        onChange={() => {
                          const next = new Set(selectedIds)
                          if (next.has(u.id)) next.delete(u.id); else next.add(u.id)
                          setSelectedIds(next)
                        }}
                        aria-label={`Select ${u.email}`}
                      />
                    </td>
                    <td className={styles.td}>{u.email}</td>
                    <td className={styles.td}>{u.created_at ? formatDate(u.created_at) : '—'}</td>
                    <td className={styles.td}>{u.confirmed_at ? 'Yes' : 'No'}</td>
                    <td className={styles.td}>{u.last_sign_in_at ? formatDate(u.last_sign_in_at) : 'Never'}</td>
                    <td className={`${styles.td} ${styles.actionsCell}`}>
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          const p: PersonRow = { id: u.id, display_name: null, email: u.email, phone: null, avatar_url: null, is_active: !!u.confirmed_at, org_name: null, event_count: 0 }
                          handleDeletePerson(p, 'user')
                        }}
                        data-tooltip="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.tableFooter}>
            <span>{authUsers.length} users</span>
            {Math.ceil(authUsers.length / PAGE_SIZE) > 1 && (
              <span>
                Page {page + 1} of {Math.ceil(authUsers.length / PAGE_SIZE)}
                <button className="btn btn-ghost btn-xs" style={{ marginLeft: 'var(--space-2)' }} disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</button>
                <button className="btn btn-ghost btn-xs" disabled={page >= Math.ceil(authUsers.length / PAGE_SIZE) - 1} onClick={() => setPage(p => p + 1)}>Next</button>
              </span>
            )}
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
            {['all', 'planner', 'coordinator'].map(filter => (
              <button
                key={filter}
                className={`btn ${eventFilter === filter ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                onClick={() => { setEventFilter(filter); setPage(0) }}
              >
                {filter === 'all' ? 'All' : filter === 'planner' ? 'Planners' : 'Coordinators'}
              </button>
            ))}
          </div>
          {renderEventsTable()}
        </>
      )}

      {selectedPerson && (
        <PersonModal
          person={selectedPerson}
          roleLabel={activeTab === 'planners' ? 'Planner' : 'Coordinator'}
          onClose={() => setSelectedPerson(null)}
        />
      )}

      {selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}

      {editingPerson && (
        <div className={styles.overlay} onClick={() => setEditingPerson(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 480, height: 'auto' }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <ModalAvatar name={editingPerson.display_name} url={editingPerson.avatar_url} />
                <div>
                  <div className={styles.modalName}>Edit {activeTab === 'planners' ? 'Planner' : 'Coordinator'}</div>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setEditingPerson(null)} data-tooltip="Close"><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className="input-wrapper" style={{ marginBottom: 'var(--space-3)' }}>
                <label className="input-label">Display Name</label>
                <input
                  className="input"
                  value={editingPerson.display_name || ''}
                  onChange={(e) => setEditingPerson({ ...editingPerson, display_name: e.target.value })}
                />
              </div>
              <div className="input-wrapper" style={{ marginBottom: 'var(--space-3)' }}>
                <label className="input-label">Phone</label>
                <input
                  className="input"
                  value={editingPerson.phone || ''}
                  onChange={(e) => setEditingPerson({ ...editingPerson, phone: e.target.value })}
                />
              </div>
              <div className="input-wrapper" style={{ marginBottom: 'var(--space-3)' }}>
                <label className="input-label">Email (read-only)</label>
                <input className="input" value={editingPerson.email} disabled />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button className="btn btn-primary" onClick={handleEditSave}>Save Changes</button>
                <button className="btn btn-ghost" onClick={() => setEditingPerson(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
