import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, Plus, ChevronRight, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { SEO } from '@/components/shared/SEO'
import styles from './ClientDashboard.module.css'

interface ClientEvent {
  id: string
  name: string
  event_type: string
  event_date: string | null
  status: string
  managing_planner_id: string | null
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ClientDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const [events, setEvents] = useState<ClientEvent[]>([])
  const [loading, setLoading] = useState(true)

  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'Client'
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const uid = user.id

    async function load() {
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, name, event_type, event_date, status, managing_planner_id')
        .eq('client_id', uid)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (eventsData) setEvents(eventsData as ClientEvent[])

      setLoading(false)
    }

    load()
  }, [user])

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loadingWrap}>
          <img src="/ng-new-logo.png" alt="Loading" style={{ width: 56, height: 56, opacity: 0.4 }} />
          <div className={styles.loadingText}>Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.dashboard}>
      <SEO title="Client Dashboard" description="Your event planning dashboard." />

      <div className={styles.header}>
        <div>
          <h2 className={styles.greeting}>{greeting}, {displayName.split(' ')[0]}!</h2>
          <p className={styles.date}>{new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className={styles.headerActions}>
          <Link to="/client/create-event" className="btn btn-primary">
            <Plus size={16} /> New Event
          </Link>
          <Link to="/client/request-quote" className="btn btn-secondary">
            <FileText size={16} /> Request Quote
          </Link>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{events.length}</div>
          <div className={styles.statLabel}>My Events</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{events.filter((e) => e.status === 'in_progress' || e.status === 'active').length}</div>
          <div className={styles.statLabel}>Active Projects</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{events.filter((e) => e.status === 'completed').length}</div>
          <div className={styles.statLabel}>Completed</div>
        </div>
      </div>

      <div className={styles.twoCol}>
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <Calendar size={16} style={{ color: 'var(--color-accent)' }} />
              My Events
            </h3>
            {events.length > 0 && <Link to="/events" className={styles.sectionLink}>View all →</Link>}
          </div>
          {events.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state__icon"><Calendar size={24} /></div>
              <div className="empty-state__title">No events yet</div>
              <div className="empty-state__description">Create your first event and invite a planner to manage it.</div>
              <Link to="/client/create-event" className="btn btn-primary"><Plus size={16} /> Create Event</Link>
            </div>
          ) : (
            <div>
              {events.slice(0, 5).map((ev) => (
                <div key={ev.id} className={styles.eventRow} onClick={() => navigate(`/events/${ev.id}`)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${ev.id}`)}>
                  <div>
                    <div className={styles.eventName}>{ev.name}</div>
                    <div className={styles.eventMeta}>{ev.event_type} · {formatDate(ev.event_date)}</div>
                  </div>
                  <div className={styles.eventRight}>
                    <span className={`badge badge-${ev.status === 'active' || ev.status === 'in_progress' ? 'green' : ev.status === 'completed' ? 'green' : ev.status === 'draft' ? 'grey' : 'red'}`}>
                      <span className="badge-dot" />
                      {ev.status}
                    </span>
                    {ev.managing_planner_id ? (
                      <span className={styles.plannerBadge}>Planner assigned</span>
                    ) : null}
                    <ChevronRight size={16} className={styles.chevron} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
