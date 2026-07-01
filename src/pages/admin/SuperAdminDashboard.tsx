import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { useNavigate, Link } from 'react-router-dom'
import {
  Users, Calendar, TrendingUp, BarChart3,
  Activity, Database, HardDrive,
  CreditCard, Zap, Shield, Plus,
} from 'lucide-react'
import { AdminPageHero } from '@/components/shared/AdminPageHero'
import { AdminCreateEventModal } from '@/pages/admin/AdminCreateEventModal'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import Papa from 'papaparse'
import styles from './SuperAdminDashboard.module.css'

function formatCurrency(kobo: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(kobo / 100)
}

function toNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount / 100)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getMonthLabel(monthStr: string): string {
  return new Date(monthStr + '-01').toLocaleDateString('en-GB', { month: 'short' })
}

function getMonthRange(): string[] {
  const result: string[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), i, 1)
    result.push(d.toISOString().substring(0, 7))
  }
  return result
}

const PIE_COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#14B8A6', '#EF4444', '#EC4899', '#F97316']
const TYPE_COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#06B6D4']

function KpiCard({ icon: Icon, label, value, color, subtitle }: {
  icon: React.ComponentType<{ size?: number }>
  label: string
  value: string | number
  color: string
  subtitle?: string
}) {
  return (
    <div style={{
      background: 'linear-gradient(180deg, var(--color-surface-2) 0%, rgba(31, 41, 55, 0.6) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: 24,
      padding: 'var(--space-4) var(--space-5)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      boxShadow: '0 10px 25px -10px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: 4,
        background: color,
        opacity: 0.6,
      }} />
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius-md)',
        background: `${color}18`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>{label}</div>
        <div style={{
          fontSize: 'var(--text-2xl)', fontWeight: 900,
          lineHeight: 1, letterSpacing: '-0.04em',
          fontVariantNumeric: 'tabular-nums',
          background: 'linear-gradient(135deg, #fff 50%, #d1d5db 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>{value}</div>
        {subtitle && (
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{subtitle}</div>
        )}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)' }}>
        <div style={{ color: 'var(--color-text-muted)', marginBottom: 4, fontWeight: 600 }}>{label}</div>
        {payload.map((p) => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 2 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: p.fill }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>{p.name}:</span>
            <span style={{ fontWeight: 600 }}>{typeof p.value === 'number' ? formatCurrency(p.value) : p.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const SimpleTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
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

const FormatTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)' }}>
        <div style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontWeight: 600 }}>{formatCurrency(payload[0].value)}</div>
      </div>
    )
  }
  return null
}

export function SuperAdminDashboard() {
  const role = useAuthStore((s) => s.role)
  const showToast = useUIStore((s) => s.showToast)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [totalPlanners, setTotalPlanners] = useState(0)
  const [totalCoordinators, setTotalCoordinators] = useState(0)
  const [totalEvents, setTotalEvents] = useState(0)
  const [activeEvents, setActiveEvents] = useState(0)
  const [revenueMtd, setRevenueMtd] = useState(0)
  const [revenueYtd, setRevenueYtd] = useState(0)
  const [weeklyData, setWeeklyData] = useState<{ week: string; revenue: number; events: number }[]>([])
  const [eventsByType, setEventsByType] = useState<{ name: string; count: number }[]>([])
  const [revenueByMethod, setRevenueByMethod] = useState<{ name: string; value: number }[]>([])
  const [signupsData, setSignupsData] = useState<{ month: string; count: number }[]>([])
  const [topPlanners, setTopPlanners] = useState<{ rank: number; name: string; email: string; events: number; revenue: number }[]>([])
  const [liveEvents, setLiveEvents] = useState<{ id: string; name: string; type: string; status: string; coordinator: string; guestCount: number; phase: number }[]>([])
  const [recentPayments, setRecentPayments] = useState<{ id: string; date: string; event: string; amount: number; method: string; status: string }[]>([])
  const [recentEvents, setRecentEvents] = useState<{ id: string; date: string; name: string; type: string; status: string; planner: string }[]>([])
  const [infra, setInfra] = useState({ totalDbRows: 0, storageUsed: 0, totalUsers: 0, totalEvents: 0 })
  const [showCreateModal, setShowCreateModal] = useState(false)

  const isSuperAdmin = role === 'super_admin'

  useEffect(() => {
    async function load() {
      try {
      const now = new Date()
      const currentYear = now.getFullYear()
      const startOfMonth = new Date(currentYear, now.getMonth(), 1).toISOString()
      const startOfYear = new Date(currentYear, 0, 1).toISOString()
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59).toISOString()

      const [
        { count: plannerCount },
        { count: coordinatorCount },
        { count: tEventCount },
        { count: aEventCount },
        { count: userCount },
        { data: plannersData },
        { data: allEventsData },
        { data: allPaymentsData },
        { data: liveEventsRaw },
        { data: recentPaymentsRaw },
        { data: recentEventsRaw },
        { data: profilesForSignups },
        { count: orgCount },
        { count: vendorCount },
        { count: guestCount },
        { data: storageBytesRpc },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'planner'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'coordinator'),
        supabase.from('events').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('events').select('id', { count: 'exact', head: true }).is('deleted_at', null).not('status', 'eq', 'completed').not('status', 'eq', 'cancelled'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('id, email, display_name').eq('role', 'planner'),
        supabase.from('events').select('id, name, event_type, status, created_at, created_by, current_phase, coordinator_id').is('deleted_at', null),
        supabase.from('events').select('id, amount_paid, payment_provider, paid_at, name, created_by').eq('payment_status', 'paid'),
        supabase.from('events').select('id, name, event_type, status, current_phase, coordinator_id').is('deleted_at', null).not('status', 'eq', 'completed').not('status', 'eq', 'cancelled'),
        supabase.from('events').select('id, amount_paid, payment_provider, paid_at, created_at, name, created_by').eq('payment_status', 'paid').order('paid_at', { ascending: false }).limit(10),
        supabase.from('events').select('id, name, event_type, status, created_at, created_by').is('deleted_at', null).order('created_at', { ascending: false }).limit(10),
        supabase.from('profiles').select('created_at').gte('created_at', startOfYear).order('created_at'),
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('vendors').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('guests').select('id', { count: 'exact', head: true }),
        supabase.rpc('get_total_storage_bytes'),
      ])

      setTotalPlanners(plannerCount || 0)
      setTotalCoordinators(coordinatorCount || 0)
      setTotalEvents(tEventCount || 0)
      setActiveEvents(aEventCount || 0)

      const paidEvents = allPaymentsData || []
      const revenueMtdVal = paidEvents.filter(p => p.paid_at && p.paid_at >= startOfMonth).reduce((s, p) => s + (p.amount_paid || 0), 0)
      const revenueYtdVal = paidEvents.filter(p => p.paid_at && p.paid_at >= startOfYear).reduce((s, p) => s + (p.amount_paid || 0), 0)
      setRevenueMtd(revenueMtdVal)
      setRevenueYtd(revenueYtdVal)

      const yearEvents = (allEventsData || []).filter(e => e.created_at >= startOfYear && e.created_at <= endOfYear)
      const yearPayments = paidEvents.filter(p => p.paid_at && p.paid_at >= startOfYear && p.paid_at <= endOfYear)

      const yearMonths = getMonthRange()
      const eventsByMonthMap: Record<string, number> = {}
      const revenueByMonthMap: Record<string, number> = {}
      yearMonths.forEach(m => { eventsByMonthMap[m] = 0; revenueByMonthMap[m] = 0 })

      yearEvents.forEach(e => {
        const d = typeof e.created_at === 'string' ? new Date(e.created_at) : e.created_at
        const m = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
        if (eventsByMonthMap[m] !== undefined) eventsByMonthMap[m]++
      })
      yearPayments.forEach(p => {
        if (p.paid_at) {
          const d = typeof p.paid_at === 'string' ? new Date(p.paid_at) : p.paid_at
          const m = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
          if (revenueByMonthMap[m] !== undefined) revenueByMonthMap[m] += p.amount_paid
        }
      })

      setWeeklyData(yearMonths.map(m => ({
        week: getMonthLabel(m),
        revenue: revenueByMonthMap[m],
        events: eventsByMonthMap[m],
      })))

      const typeMap: Record<string, number> = {}
      ;(allEventsData || []).forEach(e => {
        const t = e.event_type || 'Unknown'
        typeMap[t] = (typeMap[t] || 0) + 1
      })
      setEventsByType(Object.entries(typeMap).map(([name, count]) => ({ name, count })))

      const methodMap: Record<string, number> = {}
      paidEvents.forEach(p => {
        const m = p.payment_provider || 'Unknown'
        methodMap[m] = (methodMap[m] || 0) + (p.amount_paid || 0)
      })
      setRevenueByMethod(Object.entries(methodMap).map(([name, value]) => ({ name, value })))

      const months = getMonthRange()
      const signupCounts: Record<string, number> = {}
      months.forEach(m => signupCounts[m] = 0)
      ;(profilesForSignups || []).forEach(p => {
        const d = typeof p.created_at === 'string' ? new Date(p.created_at) : p.created_at
        const m = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
        if (signupCounts[m] !== undefined) signupCounts[m]++
      })
      setSignupsData(months.map(m => ({ month: getMonthLabel(m), count: signupCounts[m] })))

      const plannerEvents: Record<string, string[]> = {}
      const plannerEventRevenue: Record<string, number> = {}

      ;(allEventsData || []).forEach(e => {
        if (!plannerEvents[e.created_by]) plannerEvents[e.created_by] = []
        plannerEvents[e.created_by].push(e.id)
      })

      paidEvents.forEach(p => {
        if (p.created_by) {
          plannerEventRevenue[p.created_by] = (plannerEventRevenue[p.created_by] || 0) + (p.amount_paid || 0)
        }
      })

      setTopPlanners(
        (plannersData || [])
          .map(p => ({
            rank: 0,
            name: p.display_name || p.email || 'Unknown',
            email: p.email || '',
            events: (plannerEvents[p.id] || []).length,
            revenue: plannerEventRevenue[p.id] || 0,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10)
          .map((p, i) => ({ ...p, rank: i + 1 }))
      )

      const liveCoordIds = [...new Set((liveEventsRaw || []).map(e => e.coordinator_id).filter(Boolean))]
      const coordMap: Record<string, string> = {}
      if (liveCoordIds.length > 0) {
        const { data: coordProfiles } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', liveCoordIds)
        ;(coordProfiles || []).forEach(cp => {
          coordMap[cp.id] = cp.display_name || cp.email || 'Unknown'
        })
      }

      let liveGuestCounts: Record<string, number> = {}
      const liveIds = (liveEventsRaw || []).map(e => e.id)
      if (liveIds.length > 0) {
        const { data: liveGuests } = await supabase
          .from('guests')
          .select('event_id')
          .in('event_id', liveIds)
        liveGuestCounts = {}
        ;(liveGuests || []).forEach(g => {
          liveGuestCounts[g.event_id] = (liveGuestCounts[g.event_id] || 0) + 1
        })
      }

      setLiveEvents(
        (liveEventsRaw || []).slice(0, 10).map(e => ({
          id: e.id,
          name: e.name,
          type: e.event_type || 'N/A',
          status: e.status,
          coordinator: e.coordinator_id ? (coordMap[e.coordinator_id] || 'Unassigned') : 'Unassigned',
          guestCount: liveGuestCounts[e.id] || 0,
          phase: e.current_phase || 0,
        }))
      )

      setRecentPayments(
        (recentPaymentsRaw || []).map(p => ({
          id: p.id,
          date: formatDate(p.paid_at || p.created_at),
          event: p.name || 'Unknown',
          amount: p.amount_paid || 0,
          method: p.payment_provider || 'N/A',
          status: 'paid',
        }))
      )

      const eventCreatorIds = [...new Set((recentEventsRaw || []).map(e => e.created_by).filter(Boolean))]
      const creatorMap: Record<string, string> = {}
      if (eventCreatorIds.length > 0) {
        const { data: creatorProfiles } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', eventCreatorIds)
        ;(creatorProfiles || []).forEach(cp => {
          creatorMap[cp.id] = cp.display_name || cp.email || 'Unknown'
        })
      }

      setRecentEvents(
        (recentEventsRaw || []).map(e => ({
          id: e.id,
          date: formatDate(e.created_at),
          name: e.name,
          type: e.event_type || 'N/A',
          status: e.status,
          planner: creatorMap[e.created_by] || 'Unknown',
        }))
      )

      const totalRows = [
        plannerCount || 0,
        tEventCount || 0,
        paidEvents.length,
        orgCount || 0,
        vendorCount || 0,
        guestCount || 0,
      ].reduce((s, c) => s + c, 0)

      const storageBytes = storageBytesRpc ?? 0

      setInfra({
        totalDbRows: totalRows,
        storageUsed: storageBytes,
        totalUsers: userCount || 0,
        totalEvents: tEventCount || 0,
      })

      setLoading(false)
      } catch (err) {
        console.error('[SuperAdminDashboard] load error:', err)
        setLoading(false)
      }
    }

    load()
  }, [role])

  const exportCSV = useCallback(() => {
    if (topPlanners.length === 0) return
    const data = topPlanners.map(p => ({
      Rank: p.rank,
      Name: p.name,
      Email: p.email,
      'Events Created': p.events,
      'Revenue (₦)': formatCurrency(p.revenue),
    }))
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'top_planners.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [topPlanners])

  const exportPDF = useCallback(() => {
    showToast({ type: 'info', title: 'Coming soon', body: 'PDF export is on the way!' })
  }, [showToast])

  if (loading && isSuperAdmin) {
    return (
      <div>
        <div className="skeleton skeleton-title" style={{ width: 240, marginBottom: 'var(--space-6)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          {[1,2,3,4,5,6,7].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 80 }} />)}
      </div>

    </div>
  )
}

  return (
    <div>
      <AdminPageHero
        icon={Shield}
        title={isSuperAdmin ? 'Super Admin' : 'Admin Dashboard'}
        subtitle={isSuperAdmin ? 'Platform-wide overview' : 'All events and platform activity'}
        backTo="/"
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {isSuperAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                <Plus size={16} /> Create Event
              </button>
            )}
            {isSuperAdmin && <button className="btn btn-secondary btn-sm" onClick={exportCSV}>Export CSV</button>}
            {isSuperAdmin && <button className="btn btn-secondary btn-sm" onClick={exportPDF}>Export PDF</button>}
          </div>
        }
      />

      <div className={styles.kpiGrid}>
        <KpiCard icon={Users} label="Total Planners" value={totalPlanners} color="var(--color-accent)" />
        <KpiCard icon={Users} label="Total Coordinators" value={totalCoordinators} color="var(--color-info)" />
        <KpiCard icon={Calendar} label="Total Events" value={totalEvents} color="var(--color-info)" />
        <KpiCard icon={Zap} label="Active Events" value={activeEvents} color="var(--color-warning)" subtitle="In progress / active" />
        <KpiCard icon={CreditCard} label="Revenue (MTD)" value={toNaira(revenueMtd)} color="var(--color-success)" />
        <KpiCard icon={TrendingUp} label="Revenue (YTD)" value={toNaira(revenueYtd)} color="var(--color-accent)" />
      </div>

      <div className={styles.chartGrid}>
        <div className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <h3 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-base)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <TrendingUp size={16} style={{ color: 'var(--color-accent)' }} />
            Revenue &amp; Events ({new Date().getFullYear()})
          </h3>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weeklyData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v / 100).toFixed(0)}`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="var(--color-accent)" strokeWidth={2} dot={false} name="Revenue" />
                <Line yAxisId="right" type="monotone" dataKey="events" stroke="var(--color-info)" strokeWidth={2} dot={false} name="Events" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ height: 220 }}><div className="empty-state__title">No data yet</div></div>
          )}
        </div>

        <div className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <h3 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-base)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <BarChart3 size={16} style={{ color: 'var(--color-warning)' }} />
            Events by Type
          </h3>
          {eventsByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={eventsByType} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<SimpleTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {eventsByType.map((_, i) => (
                    <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ height: 220 }}><div className="empty-state__title">No data yet</div></div>
          )}
        </div>

        <div className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <h3 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-base)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Activity size={16} style={{ color: 'var(--color-success)' }} />
            Revenue by Method
          </h3>
          {revenueByMethod.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={revenueByMethod}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {revenueByMethod.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<FormatTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ height: 220 }}><div className="empty-state__title">No data yet</div></div>
          )}
        </div>

        <div className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <h3 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-base)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Users size={16} style={{ color: 'var(--color-accent)' }} />
            Monthly Signups
          </h3>
          {signupsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={signupsData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<SimpleTooltip />} />
                <Line type="monotone" dataKey="count" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-accent)' }} name="Signups" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ height: 220 }}><div className="empty-state__title">No data yet</div></div>
          )}
        </div>
      </div>

      <div className={styles.tableGrid}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-5)', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 700 }}>Top 10 Planners</h3>
            <Link to="/admin/manage?tab=users" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>View More →</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>#</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Email</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Events</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topPlanners.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                      <div className="empty-state"><div className="empty-state__title">No data yet</div></div>
                    </td>
                  </tr>
                ) : topPlanners.map((p) => (
                  <tr key={p.rank} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600 }}>{p.rank}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>{p.email}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', color: 'var(--color-info)' }}>{p.events}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', color: 'var(--color-accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatCurrency(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-5)', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 700 }}>Active Live Events</h3>
            <Link to="/events" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>View More →</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Coordinator</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Guests</th>
                  <th style={{ textAlign: 'center', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Phase</th>
                </tr>
              </thead>
              <tbody>
                {liveEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                      <div className="empty-state"><div className="empty-state__title">No live events</div></div>
                    </td>
                  </tr>
                ) : liveEvents.map((e) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', cursor: 'pointer' }} onClick={() => navigate(`/events/${e.id}`)}>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>{e.name}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>{e.type}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 6px #10B981' }} />
                        {e.status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>{e.coordinator}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right' }}>{e.guestCount}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'center' }}>
                      <span style={{ background: 'var(--color-surface-2)', padding: '1px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>Phase {e.phase}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-5)', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 700 }}>Recent Payments</h3>
            <Link to="/admin/manage?tab=payments" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>View More →</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Event</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Method</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                      <div className="empty-state"><div className="empty-state__title">No data yet</div></div>
                    </td>
                  </tr>
                ) : recentPayments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>{p.date}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>{p.event}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', fontWeight: 600, color: 'var(--color-accent)', whiteSpace: 'nowrap' }}>{formatCurrency(p.amount)}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>{p.method}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                      <span style={{
                        padding: '1px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)',
                        fontWeight: 600, textTransform: 'capitalize',
                        color: p.status === 'received' ? 'var(--color-success)' : p.status === 'overdue' ? 'var(--color-error)' : 'var(--color-warning)',
                        background: p.status === 'received' ? 'var(--color-success-bg)' : p.status === 'overdue' ? 'var(--color-error-bg)' : 'var(--color-warning-bg)',
                      }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-5)', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 700 }}>Recent Events</h3>
            <Link to="/admin/manage?tab=events" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>View More →</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Planner</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                      <div className="empty-state"><div className="empty-state__title">No data yet</div></div>
                    </td>
                  </tr>
                ) : recentEvents.map((e) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>{e.date}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>{e.name}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>{e.type}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                      <span style={{
                        padding: '1px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)',
                        fontWeight: 600, textTransform: 'capitalize',
                        color: e.status === 'completed' ? 'var(--color-success)' : e.status === 'cancelled' ? 'var(--color-error)' : e.status === 'in_progress' ? 'var(--color-info)' : 'var(--color-warning)',
                        background: e.status === 'completed' ? 'var(--color-success-bg)' : e.status === 'cancelled' ? 'var(--color-error-bg)' : e.status === 'in_progress' ? 'var(--color-info-bg)' : 'var(--color-warning-bg)',
                      }}>
                        {e.status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>{e.planner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={styles.infraGrid}>
        {[
          { label: 'Total DB Rows', value: infra.totalDbRows.toLocaleString(), icon: Database, color: 'var(--color-accent)', max: 50000 },
          { label: 'Storage Used', value: infra.storageUsed > 1073741824 ? `${(infra.storageUsed / 1073741824).toFixed(2)} GB` : `${(infra.storageUsed / 1048576).toFixed(1)} MB`, icon: HardDrive, color: 'var(--color-info)', max: 1073741824 },
          { label: 'Total Users', value: infra.totalUsers.toLocaleString(), icon: Users, color: 'var(--color-success)', max: 10000 },
          { label: 'Total Events', value: infra.totalEvents.toLocaleString(), icon: Calendar, color: 'var(--color-warning)', max: 5000 },
        ].map((item) => {
          const pct = Math.min((infra.totalDbRows / item.max) * 100, 100)
          const barColor = pct > 75 ? 'var(--color-success)' : pct > 40 ? 'var(--color-warning)' : 'var(--color-error)'
          return (
            <div key={item.label} className="card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: `${item.color}18`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <item.icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{item.label}</div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>{item.value}</div>
                </div>
              </div>
              <div style={{ height: 4, background: 'var(--color-border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 2, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          )
        })}
      </div>

      {showCreateModal && (
        <AdminCreateEventModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}
