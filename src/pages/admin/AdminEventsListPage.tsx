import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, ChevronLeft, ChevronRight, Plus,
} from 'lucide-react'
import { useSearch } from '@/hooks/useSearch'
import { SearchBar } from '@/components/shared/SearchBar'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { PhaseSegmentBar } from '@/components/shared/PhasePipeline'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { AdminPageHero } from '@/components/shared/AdminPageHero'
import { AdminCreateEventModal } from '@/pages/admin/AdminCreateEventModal'
import type { Event, EventPhase } from '@/types'
import styles from '@/features/events/EventsListPage.module.css'

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

export function AdminEventsListPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const org = useAuthStore((s) => s.org)
  const role = useAuthStore((s) => s.role)
  const [events, setEvents] = useState<(Event & { phases?: EventPhase[]; creator_name?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const PAGE_SIZE = 10
  const { query, setQuery, filtered: searched } = useSearch(events, ['name', 'event_type', 'venue_name'])

  const loadEvents = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    let query = supabase
      .from('events')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    const isAdminRole = role && ['super_admin', 'monitor', 'admin_support'].includes(role)

    if (!isAdminRole && org) {
      query = query.eq('org_id', org.id)
    } else if (role && !isAdminRole) {
      query = supabase
        .from('events')
        .select('*, event_access!inner(user_id)')
        .eq('event_access.user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
    }

    const { data } = await query

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
        return { ...event, phases: (phases as unknown as EventPhase[]) || [] } as Event & { phases?: EventPhase[] }
      })
    )

    const creatorIds = [...new Set(eventsWithPhases.map((e) => e.created_by).filter(Boolean))]
    const { data: creators } = creatorIds.length
      ? await supabase.from('profiles').select('id, display_name, email').in('id', creatorIds)
      : { data: [] }
    const creatorMap = new Map((creators || []).map((p) => [p.id, p.display_name || p.email]))

    setEvents(eventsWithPhases.map((e) => ({
      ...e,
      creator_name: e.created_by ? creatorMap.get(e.created_by) || 'Unknown' : '—',
    })))
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

  useEffect(() => {
    setPage(1)
  }, [filtered])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const displayed = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (loading) {
    return (
      <div className={styles.page}>
        <AdminPageHero icon={Calendar} title="Events" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 'var(--space-4)' }}>
          <img src="/ng-new-logo.png" alt="Loading" style={{ width: 48, height: 48, opacity: 0.5 }} />
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
          actions={role === 'super_admin' ? (
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <Plus size={16} /> Create Event
            </button>
          ) : undefined}
        />
        <div className="empty-state">
          <div className="empty-state__icon"><Calendar size={24} /></div>
          <div className="empty-state__title">No events yet</div>
          {org ? (
            <div className="empty-state__description">No events found on the platform</div>
          ) : role === 'planner' ? (
            <div className="empty-state__description">Complete your organization setup to start creating events</div>
          ) : (
            <div className="empty-state__description">You haven't been added to any events yet</div>
          )}
        </div>

        {showCreateModal && (
          <AdminCreateEventModal onClose={() => setShowCreateModal(false)} />
        )}
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <AdminPageHero
        icon={Calendar}
        title="Events"
        subtitle={`${events.length} event${events.length !== 1 ? 's' : ''}${org ? ' in your organisation' : ''}`}
        actions={role === 'super_admin' ? (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <Plus size={16} /> Create Event
          </button>
        ) : undefined}
      />

      <div className={styles.tableCard}>
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
                <th className={styles.th}>Event</th>
                <th className={styles.th}>Created by</th>
                <th className={styles.th}>Type</th>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>Venue</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Guests</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Status</th>
                <th className={styles.th}>Progress</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Payment</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((event) => {
                const badge = STATUS_BADGE[event.status] || 'grey'
                return (
                  <tr key={event.id} onClick={() => navigate(`/events/${event.slug || event.id}`)}>
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
                      <span className={styles.cellMuted}>{event.creator_name || '—'}</span>
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
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className={styles.tableFooter}>
          <span>Showing {displayed.length} of {filtered.length} events</span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginLeft: 'auto' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ minWidth: 32 }}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <AdminCreateEventModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}
