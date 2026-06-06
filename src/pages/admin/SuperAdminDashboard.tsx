import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { Checkbox } from '@/components/ui/Checkbox'
import {
  Users, Calendar, Building, Activity, TrendingUp, Shield,
  ArrowLeft, ExternalLink, UserPlus, CalendarPlus, Building2,
  Store, MessageSquare
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import styles from './SuperAdminDashboard.module.css'

interface Activity {
  id: string
  type: 'signup' | 'event_created' | 'org_created' | 'vendor_added' | 'feedback_submitted'
  typeLabel: string
  description: string
  detail: string
  actorName: string
  actorEmail: string
  timestamp: string
  createdAt: string
}

const ACTIVITY_CONFIG: Record<string, { icon: React.ComponentType<{ size?: number }>; label: string; color: string; bg: string }> = {
  signup: { icon: UserPlus, label: 'Signup', color: 'var(--color-accent)', bg: 'var(--color-accent-muted)' },
  event_created: { icon: CalendarPlus, label: 'Event', color: 'var(--color-info)', bg: 'var(--color-info-bg)' },
  org_created: { icon: Building2, label: 'Org', color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  vendor_added: { icon: Store, label: 'Vendor', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  feedback_submitted: { icon: MessageSquare, label: 'Feedback', color: 'var(--color-error)', bg: 'var(--color-error-bg)' },
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function SuperAdminDashboard() {
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.role)
  const user = useAuthStore((s) => s.user)

  const [stats, setStats] = useState({ planners: 0, coordinators: 0, vendors: 0, events: 0, orgs: 0, guests: 0 })
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [signupData, setSignupData] = useState<{ month: string; count: number }[]>([])
  const [eventData, setEventData] = useState<{ month: string; count: number }[]>([])
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
        signupsRes,
        eventsRes,
        orgsRes,
        vendorsRes,
        feedbackRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'planner'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'coordinator'),
        supabase.from('vendors').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('events').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('guests').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id, email, display_name, role, created_at').order('created_at', { ascending: false }).limit(30),
        supabase.from('events').select('id, name, status, created_at, created_by, profiles!inner(email, display_name)').order('created_at', { ascending: false }).limit(30),
        supabase.from('organizations').select('id, name, city, state, created_at').order('created_at', { ascending: false }).limit(30),
        supabase.from('vendors').select('id, name, category, created_at').order('created_at', { ascending: false }).limit(30),
        supabase.from('feedback').select('id, subject, type, status, user_email, created_at').order('created_at', { ascending: false }).limit(30),
      ])

      setStats({
        planners: plannerCount || 0,
        coordinators: coordCount || 0,
        vendors: vendorCount || 0,
        events: eventCount || 0,
        orgs: orgCount || 0,
        guests: guestCount || 0,
      })

      const allActivities: Activity[] = []

      if (signupsRes.data) {
        for (const p of signupsRes.data) {
          allActivities.push({
            id: `signup-${p.id}`,
            type: 'signup',
            typeLabel: ACTIVITY_CONFIG.signup.label,
            description: `${p.display_name || p.email} joined`,
            detail: `Role: ${p.role}`,
            actorName: p.display_name || 'Unknown',
            actorEmail: p.email,
            timestamp: formatDate(p.created_at),
            createdAt: p.created_at,
          })
        }
      }

      if (eventsRes.data) {
        for (const e of eventsRes.data) {
          const profile = e.profiles as unknown as { email: string; display_name: string | null }
          allActivities.push({
            id: `event-${e.id}`,
            type: 'event_created',
            typeLabel: ACTIVITY_CONFIG.event_created.label,
            description: e.name,
            detail: `Status: ${e.status}`,
            actorName: profile.display_name || profile.email,
            actorEmail: profile.email,
            timestamp: formatDate(e.created_at),
            createdAt: e.created_at,
          })
        }
      }

      if (orgsRes.data) {
        for (const o of orgsRes.data) {
          allActivities.push({
            id: `org-${o.id}`,
            type: 'org_created',
            typeLabel: ACTIVITY_CONFIG.org_created.label,
            description: o.name,
            detail: `${o.city}${o.city && o.state ? ', ' : ''}${o.state}`,
            actorName: 'System',
            actorEmail: '',
            timestamp: formatDate(o.created_at),
            createdAt: o.created_at,
          })
        }
      }

      if (vendorsRes.data) {
        for (const v of vendorsRes.data) {
          allActivities.push({
            id: `vendor-${v.id}`,
            type: 'vendor_added',
            typeLabel: ACTIVITY_CONFIG.vendor_added.label,
            description: v.name,
            detail: `Category: ${v.category}`,
            actorName: 'System',
            actorEmail: '',
            timestamp: formatDate(v.created_at),
            createdAt: v.created_at,
          })
        }
      }

      if (feedbackRes.data) {
        for (const f of feedbackRes.data) {
          allActivities.push({
            id: `feedback-${f.id}`,
            type: 'feedback_submitted',
            typeLabel: ACTIVITY_CONFIG.feedback_submitted.label,
            description: f.subject,
            detail: `Type: ${f.type}`,
            actorName: f.user_email,
            actorEmail: f.user_email,
            timestamp: formatDate(f.created_at),
            createdAt: f.created_at,
          })
        }
      }

      allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setActivities(allActivities.slice(0, 25))

      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
      sixMonthsAgo.setDate(1)

      const [{ data: allProfiles }, { data: allEvents }] = await Promise.all([
        supabase.from('profiles').select('created_at').gte('created_at', sixMonthsAgo.toISOString()).order('created_at'),
        supabase.from('events').select('created_at').gte('created_at', sixMonthsAgo.toISOString()).order('created_at'),
      ])

      setSignupData(aggregateMonthly(allProfiles || []))
      setEventData(aggregateMonthly(allEvents || []))
      setLoading(false)
    }

    load()
  }, [role, navigate])

  function aggregateMonthly(rows: { created_at: string }[]): { month: string; count: number }[] {
    const map = new Map<string, number>()
    for (const r of rows) {
      const key = r.created_at.substring(0, 7)
      map.set(key, (map.get(key) || 0) + 1)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-GB', { month: 'short' }),
        count
      }))
  }

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => prev.size === activities.length ? new Set() : new Set(activities.map(a => a.id)))
  }, [activities])

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
    { label: 'Vendors', value: stats.vendors, icon: Activity, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
    { label: 'Guests', value: stats.guests, icon: Users, color: 'var(--color-info)', bg: 'var(--color-info-bg)' },
  ]

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)' }}>
          <div style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>{label}</div>
          <div style={{ fontWeight: 600 }}>{payload[0].value}</div>
        </div>
      )
    }
    return null
  }

  return (
    <div>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', alignItems: 'stretch' }}>
        <div className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <h3 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-base)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <TrendingUp size={16} style={{ color: 'var(--color-accent)' }} />
            Monthly Signups
          </h3>
          {signupData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={signupData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ height: 200 }}><div className="empty-state__title">No data yet</div></div>
          )}
        </div>
        <div className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <h3 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-base)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Calendar size={16} style={{ color: 'var(--color-info)' }} />
            Monthly Events
          </h3>
          {eventData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={eventData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="var(--color-info)" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ height: 200 }}><div className="empty-state__title">No data yet</div></div>
          )}
        </div>
      </div>

      <div className={styles.tableCard}>
        {selectedIds.size > 0 && (
          <div className={styles.bulkBar}>
            <span className={styles.bulkInfo}>{selectedIds.size} selected</span>
          </div>
        )}
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={`${styles.th} ${styles.thCheck}`}>
                  <Checkbox
                    checked={selectedIds.size === activities.length && activities.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className={styles.th}>Activity</th>
                <th className={styles.th}>Description</th>
                <th className={styles.th}>Actor</th>
                <th className={styles.th}>When</th>
              </tr>
            </thead>
            <tbody>
              {activities.length === 0 ? (
                <tr>
                  <td className={styles.td} colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <div className="empty-state">
                      <div className="empty-state__title">No activity yet</div>
                    </div>
                  </td>
                </tr>
              ) : (
                activities.map((a) => {
                  const cfg = ACTIVITY_CONFIG[a.type]
                  const Icon = cfg.icon
                  const selected = selectedIds.has(a.id)
                  return (
                    <tr
                      key={a.id}
                      className={`${styles.tr} ${selected ? styles.trSelected : ''}`}
                    >
                      <td className={`${styles.td} ${styles.tdCheck}`}>
                        <Checkbox
                          checked={selected}
                          onChange={() => toggleSelect(a.id)}
                        />
                      </td>
                      <td className={styles.td}>
                        <div className={styles.activityType}>
                          <div className={styles.activityIcon} style={{ background: cfg.bg, color: cfg.color }}>
                            <Icon size={16} />
                          </div>
                          <span className={styles.activityLabel} style={{ color: cfg.color }}>
                            {a.typeLabel}
                          </span>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.description}>{a.description}</div>
                        <div className={styles.detail}>{a.detail}</div>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.actorName}>{a.actorName}</div>
                        {a.actorEmail && <div className={styles.actorEmail}>{a.actorEmail}</div>}
                      </td>
                      <td className={styles.td}>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>
                          {a.timestamp}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFooter}>
          <span>Showing {activities.length} recent activities</span>
        </div>
      </div>
    </div>
  )
}
