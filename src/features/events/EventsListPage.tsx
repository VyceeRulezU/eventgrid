import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, Calendar, Pencil, Trash2, ExternalLink,
} from 'lucide-react'
import { useSearch } from '@/hooks/useSearch'
import { SearchBar } from '@/components/shared/SearchBar'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { PhaseSegmentBar } from '@/components/shared/PhasePipeline'
import { Checkbox } from '@/components/ui/Checkbox'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { AdminPageHero } from '@/components/shared/AdminPageHero'
import type { Event, EventPhase } from '@/types'
import styles from './EventsListPage.module.css'

const STATUS_BADGE: Record<string, string> = {
  draft: 'grey',
  active: 'green',
  in_progress: 'yellow',
  completed: 'green',
  cancelled: 'red',
}

function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatType(type: string | null): string {
  if (!type) return '—'
  return type
}

export function EventsListPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const org = useAuthStore((s) => s.org)
  const role = useAuthStore((s) => s.role)
  const showNotification = useUIStore((s) => s.showNotification)
  const showModal = useUIStore((s) => s.showModal)
  const [events, setEvents] = useState<(Event & { phases?: EventPhase[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState('all')
  const { query, setQuery, filtered: searched } = useSearch(events, ['name', 'event_type', 'venue_name'])
  const [deleting, setDeleting] = useState(false)

  const loadEvents = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    const { data } = org
      ? await supabase
          .from('events')
          .select('*')
          .eq('org_id', org.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
      : await supabase
          .from('events')
          .select('*, event_access!inner(user_id)')
          .eq('event_access.user_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })

    if (!data) {
      setLoading(false)
      return
    }

    const eventsWithPhases = await Promise.all(
      (data as unknown as Event[]).map(async (event) => {
        const { data: phases } = await supabase
          .from('event_phases')
          .select('*')
          .eq('event_id', event.id)
          .order('phase_number', { ascending: true })
        return { ...event, phases: (phases as unknown as EventPhase[]) || [] }
      })
    )

    setEvents(eventsWithPhases)
    setLoading(false)
  }

  useEffect(() => {
    loadEvents()
  }, [user, org])

  const filtered = useMemo(() => {
    if (statusFilter !== 'all') {
      return searched.filter((e) => e.status === statusFilter)
    }
    return searched
  }, [searched, statusFilter])

  const allSelected = filtered.length > 0 && filtered.every((e) => selected.has(e.id))
  const someSelected = selected.size > 0

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((e) => e.id)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const handleDelete = (ids: string[]) => {
    showModal({
      variant: 'confirm',
      title: 'Delete event?',
      message: `Delete ${ids.length} event${ids.length > 1 ? 's' : ''}? This cannot be undone.`,
      actions: [
        { label: 'Cancel', variant: 'secondary' as const, onClick: () => {} },
        {
          label: 'Delete',
          variant: 'danger' as const,
          onClick: async () => {
            setDeleting(true)
            const { error } = await supabase.rpc('soft_delete_events', { event_ids: ids })

            if (error) {
              showNotification({ variant: 'error', title: 'Delete failed', message: error.message })
            } else {
              setEvents((prev) => prev.filter((e) => !ids.includes(e.id)))
              setSelected(new Set())
              showNotification({ variant: 'success', title: 'Deleted', message: `${ids.length} event(s) removed.` })
            }
            setDeleting(false)
          },
        },
      ],
    })
  }

  const handleEdit = () => {
    if (selected.size !== 1) {
      showNotification({ variant: 'warning', title: 'Select one event', message: 'Choose a single event to open its details.' })
      return
    }
    navigate(`/events/${[...selected][0]}`)
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <AdminPageHero icon={Calendar} title="Events" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 'var(--space-4)' }}>
          <img src="/EventGrid-favicon.svg" alt="Loading" style={{ width: 48, height: 48, opacity: 0.5 }} />
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading events...</div>
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className={styles.page}>
        <AdminPageHero
          icon={Calendar}
          title="Events"
          subtitle="Manage all your events in one place"
          actions={org || role === 'super_admin' ? <Link to="/events/new" className="btn btn-primary btn-sm" style={{ borderRadius: 'var(--radius-sm)' }}><Plus size={16} /> Create Event</Link> : undefined}
        />
        <div className="empty-state">
          <div className="empty-state__icon"><Calendar size={24} /></div>
          <div className="empty-state__title">No events yet</div>
          {org ? (
            <div className="empty-state__description">Create your first event to get started</div>
          ) : role === 'planner' ? (
            <div className="empty-state__description">Complete your organization setup to start creating events</div>
          ) : (
            <div className="empty-state__description">You haven't been added to any events yet</div>
          )}
          {(org || role === 'super_admin') && <Link to="/events/new" className="btn btn-primary"><Plus size={16} /> Create Event</Link>}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <AdminPageHero
        icon={Calendar}
        title="Events"
        subtitle={`${events.length} event${events.length !== 1 ? 's' : ''}${org ? ' in your organisation' : ''}`}
        actions={org || role === 'super_admin' ? <Link to="/events/new" className="btn btn-primary btn-sm" style={{ borderRadius: 'var(--radius-sm)' }}><Plus size={16} /> Create Event</Link> : undefined}
      />

      <div className={styles.tableCard}>
        {someSelected && org && (
          <div className={styles.bulkBar}>
            <span className={styles.bulkInfo}>{selected.size} selected</span>
            <div className={styles.bulkActions}>
              <button type="button" className="btn btn-secondary btn-sm" style={{ borderRadius: 'var(--radius-sm)' }} onClick={handleEdit}>
                <Pencil size={14} /> Open
              </button>
              <button
                type="button"
                className="btn btn-destructive btn-sm"
                style={{ borderRadius: 'var(--radius-sm)' }}
                onClick={() => handleDelete([...selected])}
                disabled={deleting}
              >
                <Trash2 size={14} /> Delete
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>
                Clear
              </button>
            </div>
          </div>
        )}

        <div className={styles.toolbar}>
          <SearchBar value={query} onChange={setQuery} placeholder="Search events..." containerStyle={{ flex: 1, maxWidth: 320 }} />
          <div className={styles.filterWrap}>
            <DropdownMenu
              trigger={<span>{statusFilter === 'all' ? 'All status' : statusFilter.replace('_', ' ')}</span>}
              items={[
                { label: 'All status', value: 'all' },
                { label: 'Draft', value: 'draft' },
                { label: 'Active', value: 'active' },
                { label: 'In Progress', value: 'in_progress' },
                { label: 'Completed', value: 'completed' },
                { label: 'Cancelled', value: 'cancelled' },
              ]}
              onSelect={(item) => setStatusFilter(item.value)}
            />
          </div>
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                {org && (
                  <th className={`${styles.th} ${styles.thCheck}`}>
                    <Checkbox
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Select all events"
                    />
                  </th>
                )}
                <th className={styles.th}>Event</th>
                <th className={styles.th}>Type</th>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>Venue</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Guests</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Status</th>
                <th className={styles.th}>Progress</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Payment</th>
                {org && <th className={`${styles.th} ${styles.thCenter}`}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => {
                const isSelected = selected.has(event.id)
                const badge = STATUS_BADGE[event.status] || 'grey'
                return (
                  <tr
                    key={event.id}
                    className={`${styles.tr} ${isSelected ? styles.trSelected : ''}`}
                  >
                    {org && (
                      <td className={`${styles.td} ${styles.tdCheck}`}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleOne(event.id)}
                          aria-label={`Select ${event.name}`}
                        />
                      </td>
                    )}
                    <td className={`${styles.td} ${styles.eventCell}`}>
                      <button
                        type="button"
                        className={styles.clickableName}
                        onClick={() => navigate(`/events/${event.slug || event.id}`)}
                      >
                        <div className={styles.eventName}>{event.name}</div>
                        <div className={styles.eventMeta}>
                          Updated {formatDate(event.updated_at)}
                        </div>
                      </button>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.cellMuted}>{formatType(event.event_type)}</span>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.cellMuted}>{formatDate(event.event_date)}</span>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.cellMuted}>{event.venue_name || '—'}</span>
                    </td>
                    <td className={`${styles.td} ${styles.cellCenter}`}>
                      <span className={styles.cellMuted}>{event.guest_count?.toLocaleString() ?? '—'}</span>
                    </td>
                    <td className={`${styles.td} ${styles.cellCenter}`}>
                      <span className={`badge badge-${badge}`}>
                        <span className="badge-dot" />
                        {event.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={`${styles.td} ${styles.progressWrap}`}>
                      {event.phases && event.phases.length > 0 ? (
                        <PhaseSegmentBar phases={event.phases} showMeta={false} />
                      ) : (
                        <span className={styles.cellMuted}>—</span>
                      )}
                    </td>
                    <td className={`${styles.td} ${styles.cellCenter}`}>
                      <span className={`badge badge-${event.payment_status === 'paid' ? 'paid' : 'unpaid'}`}>
                        {event.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    {org && (
                      <td className={styles.td}>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => navigate(`/events/${event.slug || event.id}`)}
                            aria-label={`Open ${event.name}`}
                          >
                            <ExternalLink size={14} />
                          </button>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => navigate(`/events/${event.slug || event.id}`)}
                            aria-label={`Edit ${event.name}`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            onClick={() => handleDelete([event.id])}
                            aria-label={`Delete ${event.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className={styles.tableFooter}>
          <span>Showing {filtered.length} of {events.length} events</span>
        </div>
      </div>
    </div>
  )
}
