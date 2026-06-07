import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, CheckSquare, Radio, AlertTriangle,
  Clock, TrendingUp, ChevronRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { PhaseProgressBar } from '@/components/shared/PhasePipeline'
import type { Event, EventPhase } from '@/types'

interface AssignedEvent extends Event {
  phases?: EventPhase[]
  taskCount?: number
  overdueCount?: number
}

export function CoordinatorDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const org = useAuthStore((s) => s.org)
  const profile = useAuthStore((s) => s.profile)

  const [events, setEvents] = useState<AssignedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalEvents: 0, myTasks: 0, overdueTasks: 0, openIssues: 0 })

  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'Coordinator'
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  useEffect(() => {
    if (!user || !org) { setLoading(false); return }

    async function load() {
      // Coordinators see all events in their org they're assigned to
      const { data: evts } = await supabase
        .from('events')
        .select('*')
        .eq('org_id', org!.id)
        .is('deleted_at', null)
        .order('event_date', { ascending: true })

      if (!evts) { setLoading(false); return }

      const today = new Date().toISOString()

      const eventsWithDetails: AssignedEvent[] = await Promise.all(
        evts.map(async (ev) => {
          const [{ data: phases }, { count: tasks }, { count: overdue }] = await Promise.all([
            supabase.from('event_phases').select('*').eq('event_id', ev.id).order('phase_number'),
            supabase.from('tasks').select('id', { count: 'exact' }).eq('event_id', ev.id).neq('status', 'done'),
            supabase.from('tasks').select('id', { count: 'exact' }).eq('event_id', ev.id).neq('status', 'done').lte('due_datetime', today),
          ])
          return { ...ev, phases: phases || [], taskCount: tasks || 0, overdueCount: overdue || 0 } as AssignedEvent
        })
      )

      setEvents(eventsWithDetails)

      const { count: myTasks } = await supabase
        .from('tasks')
        .select('id', { count: 'exact' })
        .eq('assignee_id', user!.id)
        .neq('status', 'done')

      const { count: overdueTasks } = await supabase
        .from('tasks')
        .select('id', { count: 'exact' })
        .eq('assignee_id', user!.id)
        .neq('status', 'done')
        .lte('due_datetime', today)

      const { count: openIssues } = await supabase
        .from('issues')
        .select('id', { count: 'exact' })
        .is('resolved_at', null)

      setStats({
        totalEvents: evts.length,
        myTasks: myTasks || 0,
        overdueTasks: overdueTasks || 0,
        openIssues: openIssues || 0,
      })

      setLoading(false)
    }

    load()
  }, [user, org])

  if (loading) {
    return (
      <div>
        <div className="skeleton skeleton-title" style={{ width: 280, marginBottom: 'var(--space-6)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          {[1,2,3,4].map((i) => <div key={i} className="skeleton skeleton-card" style={{ height: 88 }} />)}
        </div>
        <div className="skeleton skeleton-card" style={{ height: 300 }} />
      </div>
    )
  }

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ marginBottom: 'var(--space-1)' }}>
          {greeting}, {displayName.split(' ')[0]} 👋
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
          {org?.name} · {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-6)',
      }}>
        {[
          { icon: Calendar, label: 'My Projects', value: stats.totalEvents, color: 'var(--color-accent)', bg: 'var(--color-accent-muted)' },
          { icon: CheckSquare, label: 'Open Tasks', value: stats.myTasks, color: 'var(--color-info)', bg: 'var(--color-info-bg)' },
          { icon: Clock, label: 'Overdue', value: stats.overdueTasks, color: stats.overdueTasks > 0 ? 'var(--color-error)' : 'var(--color-success)', bg: stats.overdueTasks > 0 ? 'var(--color-error-bg)' : 'var(--color-success-bg)' },
          { icon: AlertTriangle, label: 'Open Issues', value: stats.openIssues, color: stats.openIssues > 0 ? 'var(--color-warning)' : 'var(--color-success)', bg: stats.openIssues > 0 ? 'var(--color-warning-bg)' : 'var(--color-success-bg)' },
        ].map((card) => (
          <div key={card.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-md)',
              background: card.bg, color: card.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <card.icon size={20} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 2 }}>{card.label}</div>
              <div style={{ fontSize: 'var(--text-title)', fontWeight: 700, color: card.color }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 'var(--space-4)', alignItems: 'start' }}>

        {/* Projects List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }} id="tour-my-projects">
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>My Projects</h3>
          </div>

          {events.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state__icon"><Calendar size={24} /></div>
              <div className="empty-state__title">No projects assigned</div>
              <div className="empty-state__description">Projects assigned to you will appear here</div>
            </div>
          ) : (
            events.map((event, i) => {
              const phases = event.phases || []
              const completed = phases.filter((p) => p.status === 'completed').length

              return (
                <div
                  key={event.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-4) var(--space-5)',
                    borderBottom: i < events.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)',
                  }}
                  onClick={() => navigate(`/events/${event.id}`)}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = ''}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-md)',
                    background: 'var(--color-accent-muted)', color: 'var(--color-accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 'var(--text-base)', flexShrink: 0,
                  }}>
                    {event.name.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{event.name}</span>
                      <span className={`badge badge-${event.status === 'active' || event.status === 'in_progress' ? 'green' : event.status === 'completed' ? 'green' : 'grey'}`}>
                        <span className="badge-dot" />{event.status?.replace('_', ' ')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 6 }}>
                      {event.event_date && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                          📅 {new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {event.taskCount! > 0 && (
                        <span style={{ fontSize: 'var(--text-xs)', color: event.overdueCount! > 0 ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                          {event.overdueCount! > 0 ? `⚠ ${event.overdueCount} overdue` : `${event.taskCount} tasks`}
                        </span>
                      )}
                      {phases.length > 0 && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          {completed}/{phases.length} phases
                        </span>
                      )}
                    </div>

                    {phases.length > 0 && <PhaseProgressBar phases={phases} />}
                  </div>

                  <ChevronRight size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                </div>
              )
            })
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} id="tour-quick-actions">
          <div className="card">
            <h3 style={{
              fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-3)',
              color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {[
                { icon: CheckSquare, label: 'My Tasks', onClick: () => events[0] && navigate(`/events/${events[0].id}/tasks`), color: 'var(--color-info)' },
                { icon: Radio, label: 'Live Board', onClick: () => events[0] && navigate(`/events/${events[0].id}/live-board`), color: 'var(--color-success)' },
                { icon: TrendingUp, label: 'Event Dashboard', onClick: () => events[0] && navigate(`/events/${events[0].id}`), color: 'var(--color-accent)' },
              ].map((action) => (
                <button
                  key={action.label}
                  className="btn btn-ghost"
                  style={{ justifyContent: 'flex-start', width: '100%', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)' }}
                  onClick={action.onClick}
                  disabled={events.length === 0}
                >
                  <action.icon size={16} style={{ color: action.color, flexShrink: 0 }} />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
