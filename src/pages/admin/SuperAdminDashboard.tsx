import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import {
  Users, Calendar, CircleDollarSign, Building, Activity,
  ArrowLeft, Shield, ExternalLink, TrendingUp, CheckCircle2
} from 'lucide-react'

interface OrgRow { id: string; name: string; city: string; state: string; created_at: string }
interface ProfileRow { id: string; email: string; display_name: string | null; role: string; created_at: string }

export function SuperAdminDashboard() {
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.role)
  const user = useAuthStore((s) => s.user)

  const [stats, setStats] = useState({ planners: 0, coordinators: 0, vendors: 0, events: 0, orgs: 0, guests: 0 })
  const [recentOrgs, setRecentOrgs] = useState<OrgRow[]>([])
  const [recentUsers, setRecentUsers] = useState<ProfileRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (role !== 'super_admin') { navigate('/'); return }

    async function load() {
      const [
        { count: plannerCount },
        { count: coordCount },
        { count: vendorCount },
        { count: eventCount },
        { count: orgCount },
        { count: guestCount },
        { data: orgs },
        { data: profiles },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'planner'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'coordinator'),
        supabase.from('vendors').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('events').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('guests').select('id', { count: 'exact', head: true }),
        supabase.from('organizations').select('id, name, city, state, created_at').order('created_at', { ascending: false }).limit(8),
        supabase.from('profiles').select('id, email, display_name, role, created_at').order('created_at', { ascending: false }).limit(10),
      ])

      setStats({
        planners: plannerCount || 0,
        coordinators: coordCount || 0,
        vendors: vendorCount || 0,
        events: eventCount || 0,
        orgs: orgCount || 0,
        guests: guestCount || 0,
      })
      if (orgs) setRecentOrgs(orgs as OrgRow[])
      if (profiles) setRecentUsers(profiles as ProfileRow[])
      setLoading(false)
    }

    load()
  }, [role, navigate])

  if (role !== 'super_admin') return null
  if (loading) return (
    <div>
      <div className="skeleton skeleton-title" style={{ width: 240, marginBottom: 'var(--space-6)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        {[1,2,3,4,5,6].map((i) => <div key={i} className="skeleton skeleton-card" style={{ height: 80 }} />)}
      </div>
    </div>
  )

  const statCards = [
    { label: 'Planners', value: stats.planners, icon: Users, color: 'var(--color-accent)', bg: 'var(--color-accent-muted)' },
    { label: 'Coordinators', value: stats.coordinators, icon: Users, color: 'var(--color-info)', bg: 'var(--color-info-bg)' },
    { label: 'Organisations', value: stats.orgs, icon: Building, color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
    { label: 'Events', value: stats.events, icon: Calendar, color: 'var(--color-accent)', bg: 'var(--color-accent-muted)' },
    { label: 'Vendors', value: stats.vendors, icon: CircleDollarSign, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
    { label: 'Guests', value: stats.guests, icon: Activity, color: 'var(--color-info)', bg: 'var(--color-info-bg)' },
  ]

  const roleColors: Record<string, string> = {
    planner: 'var(--color-accent)',
    coordinator: 'var(--color-info)',
    vendor: 'var(--color-warning)',
    client: 'var(--color-success)',
    super_admin: 'var(--color-error)',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/')} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 2 }}>
              <Shield size={20} style={{ color: 'var(--color-accent)' }} />
              <h2 style={{ margin: 0 }}>Super Admin</h2>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
              Platform-wide overview • Logged in as {user?.email}
            </p>
          </div>
        </div>
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
        >
          <ExternalLink size={14} />
          Open Supabase Dashboard
        </a>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-6)',
      }}>
        {statCards.map((card) => (
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

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 'var(--space-4)', alignItems: 'start' }}>

        {/* Recent Organisations */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>
              <Building size={16} style={{ marginRight: 'var(--space-2)', verticalAlign: 'middle', color: 'var(--color-success)' }} />
              Organisations
            </h3>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              {stats.orgs} total
            </span>
          </div>
          {recentOrgs.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state__title">No organisations yet</div>
            </div>
          ) : (
            recentOrgs.map((org, i) => (
              <div
                key={org.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-5)',
                  borderBottom: i < recentOrgs.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-md)',
                    background: 'var(--color-success-bg)', color: 'var(--color-success)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 'var(--text-sm)', flexShrink: 0,
                  }}>
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{org.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {org.city}, {org.state}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {new Date(org.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent Users */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>
              <TrendingUp size={16} style={{ marginRight: 'var(--space-2)', verticalAlign: 'middle', color: 'var(--color-info)' }} />
              Recent Sign-ups
            </h3>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              {stats.planners + stats.coordinators} users
            </span>
          </div>
          {recentUsers.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state__title">No users yet</div>
            </div>
          ) : (
            recentUsers.map((profile, i) => (
              <div
                key={profile.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-5)',
                  borderBottom: i < recentUsers.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 'var(--radius-full)',
                    background: `${roleColors[profile.role] || 'var(--color-accent)'}20`,
                    color: roleColors[profile.role] || 'var(--color-accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 'var(--text-xs)', flexShrink: 0,
                  }}>
                    {(profile.display_name || profile.email).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {profile.display_name || profile.email}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {profile.email}
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: 'var(--text-xs)', fontWeight: 600, padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: `${roleColors[profile.role] || 'var(--color-accent)'}20`,
                  color: roleColors[profile.role] || 'var(--color-accent)',
                  flexShrink: 0, textTransform: 'capitalize',
                }}>
                  {profile.role}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Super Admin Access Guide */}
      <div className="card" style={{ marginTop: 'var(--space-4)', background: 'var(--color-accent-muted)', border: '1px solid var(--color-accent-border)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
          <CheckCircle2 size={20} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: 'var(--space-2)', color: 'var(--color-accent)' }}>
              Super Admin Access Guide
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              <strong>To grant super admin access:</strong> Add the email address(es) to <code>VITE_SUPER_ADMIN_EMAILS</code> in <code>.env.local</code>, separated by commas.
              The user must then log in with that exact email address. No database changes needed.<br /><br />
              <strong>Client portal link:</strong> Generate per event from the Event Dashboard → "Client Portal" button. URL format: <code>/portal/&#123;token&#125;</code><br /><br />
              <strong>Coordinator access:</strong> Log in with an account that has <code>role: coordinator</code> in Supabase Auth user_metadata.
              Coordinators go to <code>/dashboard/coordinator</code>.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
