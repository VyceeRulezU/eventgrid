import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { Calendar, MapPin, Clock, Users, ExternalLink } from 'lucide-react'

export function ClientDashboard() {
  const user = useAuthStore((s) => s.user)

  const [event, setEvent] = useState<{
    id: string
    name: string
    event_date: string | null
    venue_name: string | null
    venue_address: string | null
    status: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.email) { setLoading(false); return }

    supabase
      .from('guests')
      .select('status, events!inner(id, name, event_date, venue_name, venue_address)')
      .eq('email', user.email)
      .is('deleted_at', null)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const ev = (data as Record<string, unknown>).events as Record<string, unknown>
          setEvent({
            id: ev.id as string,
            name: ev.name as string,
            event_date: ev.event_date as string | null,
            venue_name: ev.venue_name as string | null,
            venue_address: ev.venue_address as string | null,
            status: data.status as string,
          })
        }
        setLoading(false)
      })
  }, [user])

  const eventDate = event?.event_date ? new Date(event.event_date) : null
  const daysAway = eventDate
    ? Math.max(0, Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-4)', maxWidth: 600, margin: '0 auto' }}>
        <div className="skeleton skeleton-card" style={{ height: 130 }} />
      </div>
    )
  }

  return (
    <div style={{ padding: 'var(--space-4)', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Event Card */}
      {event ? (
        <div
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-5)',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 'var(--space-3)' }}>
            {event.name}
          </div>
          {eventDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
              <Calendar size={14} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
              {eventDate.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {daysAway !== null && (
                <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: daysAway <= 7 ? 'var(--color-error)' : 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  <Clock size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  {daysAway === 0 ? 'Today!' : `${daysAway} day${daysAway === 1 ? '' : 's'} away`}
                </span>
              )}
            </div>
          )}
          {(event.venue_name || event.venue_address) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
              <MapPin size={14} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
              {[event.venue_name, event.venue_address].filter(Boolean).join(', ')}
            </div>
          )}
          <div>
            <span
              className={`badge ${event.status === 'confirmed' ? 'badge-success' : event.status === 'declined' ? 'badge-error' : 'badge-medium'}`}
              style={{ fontSize: 'var(--text-xs)' }}
            >
              {event.status || 'pending'}
            </span>
          </div>
        </div>
      ) : (
        <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
          <div className="empty-state__icon"><Calendar size={24} /></div>
          <div className="empty-state__title">No events yet</div>
          <div className="empty-state__description">
            When a planner invites you, your event will appear here.
          </div>
        </div>
      )}

      {/* Vendor Directory CTA */}
      <div
        style={{
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-5)',
          textAlign: 'center',
        }}
      >
        <Users size={28} style={{ color: 'var(--color-accent)', marginBottom: 'var(--space-3)' }} />
        <h3 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-base)', fontWeight: 700 }}>
          Vendor Directory
        </h3>
        <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Browse trusted vendors across Nigeria
        </p>
        <Link to="/vendors/directory" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <ExternalLink size={16} />
          Browse All Vendors
        </Link>
      </div>
    </div>
  )
}
