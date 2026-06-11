import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { TrendingUp, Users, Calendar, ArrowUp, ArrowDown } from 'lucide-react'
import { AdminPageHero } from '@/components/shared/AdminPageHero'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const BAR_COLORS = {
  accent: '#D4A017',
  info: '#3B82F6',
} as const

interface MonthlySnapshot {
  month: string
  signups: number
  events: number
  orgs: number
  vendors: number
}

export function AnalyticsPage() {
  const role = useAuthStore((s) => s.role)

  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([])
  const [totals, setTotals] = useState({ users: 0, events: 0, orgs: 0, vendors: 0, guests: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [
        { count: userCount },
        { count: eventCount },
        { count: orgCount },
        { count: vendorCount },
        { count: guestCount },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('vendors').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('guests').select('id', { count: 'exact', head: true }),
      ])

      setTotals({
        users: userCount || 0,
        events: eventCount || 0,
        orgs: orgCount || 0,
        vendors: vendorCount || 0,
        guests: guestCount || 0,
      })

      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11)
      twelveMonthsAgo.setDate(1)
      const start = twelveMonthsAgo.toISOString()

      const [{ data: profiles }, { data: events }, { data: orgs }, { data: vendors }] = await Promise.all([
        supabase.from('profiles').select('created_at').gte('created_at', start).order('created_at'),
        supabase.from('events').select('created_at').gte('created_at', start).order('created_at'),
        supabase.from('organizations').select('created_at').gte('created_at', start).order('created_at'),
        supabase.from('vendors').select('created_at').gte('created_at', start).order('created_at'),
      ])

      const months = getMonthRange(12)
      const snap: MonthlySnapshot[] = months.map(m => ({
        month: m,
        signups: countInMonth(profiles || [], m),
        events: countInMonth(events || [], m),
        orgs: countInMonth(orgs || [], m),
        vendors: countInMonth(vendors || [], m),
      }))

      setSnapshots(snap)
      setLoading(false)
    }

    load()
  }, [role])

  function getMonthRange(n: number): string[] {
    const result: string[] = []
    const now = new Date()
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      result.push(d.toISOString().substring(0, 7))
    }
    return result
  }

  function countInMonth(rows: { created_at: string }[], month: string): number {
    return rows.filter(r => r.created_at.startsWith(month)).length
  }

  function growthRate(data: MonthlySnapshot[], key: keyof Omit<MonthlySnapshot, 'month'>): number {
    if (data.length < 2) return 0
    const prev = data[data.length - 2][key] as number
    const curr = data[data.length - 1][key] as number
    if (prev === 0) return curr > 0 ? 100 : 0
    return Math.round(((curr - prev) / prev) * 100)
  }

  if (role !== 'super_admin') return null
  if (loading) return (
    <div>
      <div className="skeleton skeleton-title" style={{ width: 200, marginBottom: 'var(--space-6)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 'var(--space-3)' }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 100 }} />)}
      </div>
    </div>
  )

  const metrics = [
    { label: 'Total Users', value: totals.users, icon: Users, color: 'var(--color-accent)', growth: growthRate(snapshots, 'signups'), sub: `${totals.orgs} orgs` },
    { label: 'Total Events', value: totals.events, icon: Calendar, color: 'var(--color-info)', growth: growthRate(snapshots, 'events'), sub: `${totals.vendors} vendors` },
  ]

  const chartData = snapshots.map(s => ({
    month: new Date(s.month + '-01').toLocaleDateString('en-GB', { month: 'short' }),
    signups: s.signups,
    events: s.events,
    orgs: s.orgs,
    vendors: s.vendors,
  }))

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)' }}>
          <div style={{ color: 'var(--color-text-muted)', marginBottom: 4, fontWeight: 600 }}>{label}</div>
          {payload.map((p) => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 2 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: p.fill }} />
              <span style={{ color: 'var(--color-text-secondary)' }}>{p.name}:</span>
              <span style={{ fontWeight: 600 }}>{p.value}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <AdminPageHero
        icon={TrendingUp}
        title="Analytics"
        subtitle="12-month platform performance overview"
        backTo="/admin"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        {metrics.map((m) => (
          <div key={m.label} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-5)', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0, flex: 1 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: `${m.color}15`, color: m.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <m.icon size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 2 }}>{m.label}</div>
                {'sub' in m && m.sub && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{m.sub}</div>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 'var(--text-title)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{m.value.toLocaleString()}</div>
              <div style={{ fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, color: m.growth >= 0 ? 'var(--color-success)' : 'var(--color-error)', marginTop: 4 }}>
                {m.growth >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                {Math.abs(m.growth)}% this month
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <h3 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-base)', fontWeight: 700 }}>
            <Users size={14} style={{ marginRight: 'var(--space-1)', verticalAlign: 'middle', color: 'var(--color-accent)' }} />
            User Signups
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="signups" fill={BAR_COLORS.accent} radius={[4, 4, 0, 0]} maxBarSize={32} name="Signups" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ height: 200 }}><div className="empty-state__title">No data yet</div></div>
          )}
        </div>

        <div className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <h3 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-base)', fontWeight: 700 }}>
            <Calendar size={14} style={{ marginRight: 'var(--space-1)', verticalAlign: 'middle', color: 'var(--color-info)' }} />
            Events Created
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="events" fill={BAR_COLORS.info} radius={[4, 4, 0, 0]} maxBarSize={32} name="Events" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ height: 200 }}><div className="empty-state__title">No data yet</div></div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-5)',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}>
          <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>
            Monthly Breakdown
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-5)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Month</th>
                <th style={{ textAlign: 'right', padding: 'var(--space-2) var(--space-5)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Signups</th>
                <th style={{ textAlign: 'right', padding: 'var(--space-2) var(--space-5)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Events</th>
                <th style={{ textAlign: 'right', padding: 'var(--space-2) var(--space-5)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Orgs</th>
                <th style={{ textAlign: 'right', padding: 'var(--space-2) var(--space-5)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Vendors</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s) => (
                <tr key={s.month} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: 'var(--space-2) var(--space-5)', fontWeight: 600 }}>
                    {new Date(s.month + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  </td>
                  <td style={{ padding: 'var(--space-2) var(--space-5)', textAlign: 'right', color: 'var(--color-accent)' }}>{s.signups}</td>
                  <td style={{ padding: 'var(--space-2) var(--space-5)', textAlign: 'right', color: 'var(--color-info)' }}>{s.events}</td>
                  <td style={{ padding: 'var(--space-2) var(--space-5)', textAlign: 'right', color: 'var(--color-success)' }}>{s.orgs}</td>
                  <td style={{ padding: 'var(--space-2) var(--space-5)', textAlign: 'right', color: 'var(--color-warning)' }}>{s.vendors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
