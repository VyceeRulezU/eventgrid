import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { Calendar, Users, MapPin, Building, ExternalLink } from 'lucide-react'
import { MyFeedback } from '@/components/shared/MyFeedback'

interface GuestEvent {
  id: string
  name: string
  date: string
  location: string
  status: string
  org_name?: string
}

export function ClientDashboard() {
  const user = useAuthStore((s) => s.user)

  const [events, setEvents] = useState<GuestEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userEmail = user?.email
    if (!userEmail) { setLoading(false); return }

    async function load() {
      const { data: guestEntries } = await supabase
        .from('guests')
        .select('event_id, status, events!inner(id, name, date, location, org_id, organizations!inner(name))')
        .eq('email', userEmail)
        .is('deleted_at', null)

      if (guestEntries) {
        const mapped = guestEntries.map((g: Record<string, unknown>) => {
          const ev = (g as { event_id: string; status: string; events: Record<string, unknown> }).events as {
            id: string; name: string; date: string; location: string; org_id: string
            organizations: { name: string }
          }
          return {
            id: ev.id,
            name: ev.name,
            date: ev.date,
            location: ev.location,
            status: (g as Record<string, unknown>).status as string,
            org_name: ev.organizations?.name || 'Unknown',
          }
        })
        setEvents(mapped)
      }
      setLoading(false)
    }

    load()
  }, [user])

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ marginBottom: 'var(--space-1)' }}>My Events</h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
          Events you've been invited to as a guest
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 160 }} />)}
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon"><Calendar size={32} /></div>
          <div className="empty-state__title">No events yet</div>
          <div className="empty-state__description">
            When an event planner invites you to an event, it will appear here.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {events.map((ev) => (
            <div key={ev.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    <Building size={11} />
                    {ev.org_name}
                  </div>
                </div>
                <span className={`badge ${ev.status === 'confirmed' ? 'badge-success' : ev.status === 'declined' ? 'badge-error' : 'badge-medium'}`} style={{ fontSize: 'var(--text-xs)', flexShrink: 0 }}>
                  {ev.status || 'pending'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
                  {new Date(ev.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                {ev.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <MapPin size={14} style={{ color: 'var(--color-text-muted)' }} />
                    {ev.location}
                  </div>
                )}
              </div>

              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-2)' }}>
                Contact your event planner for more details
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <Users size={20} style={{ color: 'var(--color-accent)' }} />
          <h3 style={{ margin: 0 }}>Vendor Directory</h3>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Browse trusted vendors across Nigeria — from planners and coordinators to MCs and DJs.
        </p>
        <Link to="/vendors/directory" className="btn btn-primary btn-sm">
          <ExternalLink size={16} />
          Browse All Vendors
        </Link>
      </div>
      <div style={{ marginTop: 'var(--space-6)' }}>
        <MyFeedback />
      </div>
    </div>
  )
}
