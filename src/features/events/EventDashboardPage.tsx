import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useEventStore } from '@/store/event.store'
import { useUIStore } from '@/store/ui.store'
import { PhaseTimelineTracker } from '@/components/shared/PhaseTimelineTracker'
import {
  Calendar, Users, Wallet, AlertTriangle,
  ExternalLink, FileText, CheckCircle2, Circle,
  CreditCard, ShieldCheck, Radio, ListChecks, BarChart3,
  Clock, ArrowRight, Zap, X, Pencil,
} from 'lucide-react'
import { PageHero } from '@/components/shared/PageHero'
import { EventVendorsPage } from '@/features/vendors/EventVendorsPage'
import { GeneratePortalModal } from '@/features/client-portal/GeneratePortalModal'
import { EditEventModal } from '@/features/events/EditEventModal'
import { Tabs } from '@/components/ui/Tabs'
import { processPayment, getEventPrice } from '@/lib/payment'
import { UUID_RE } from '@/lib/slug'
import type { Event, EventPhase, EventActivity } from '@/types'
import styles from './EventDashboardPage.module.css'

/* ─── types ─────────────────────────────────────────── */
interface DeadlineItem {
  id: string
  type: 'task' | 'phase' | 'vendor_payment'
  title: string
  date: string
  label: string
  dateAssigned?: string
  assignee?: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface ActionItem {
  id: string
  priority: 'critical' | 'warning' | 'info'
  Icon: React.ComponentType<{ size?: number }>
  title: string
  subtitle: string
  cta: string
  route?: string
  onClick?: () => void
}

/* ─── helpers ────────────────────────────────────────── */
function getCountdown(dateStr: string | null | undefined) {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  if (diff < 0) return { past: true, days: 0, hours: 0, minutes: 0 }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return { past: false, days, hours, minutes }
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return mins + 'm ago'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours + 'h ago'
  const days = Math.floor(hours / 24)
  if (days < 30) return days + 'd ago'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function fmtNaira(kobo: number): string {
  return '₦' + (kobo / 100).toLocaleString('en-NG')
}



function getPhaseRoute(phaseNum: number, eventId: string): string {
  const map: Record<number, string> = {
    1: `/events/${eventId}/vendors`,
    2: `/events/${eventId}/tasks`,
    3: `/events/${eventId}/vendors`,
    4: `/events/${eventId}/team`,
    5: `/events/${eventId}/guests`,
    6: `/events/${eventId}/tasks`,
    7: `/events/${eventId}/live-board`,
    8: `/events/${eventId}/aftermath`,
    9: `/events/${eventId}/aftermath`,
  }
  return map[phaseNum] ?? `/events/${eventId}/tasks`
}

function activityIcon(actionType: string) {
  if (actionType.startsWith('vendor')) return Users
  if (actionType.startsWith('task')) return ListChecks
  if (actionType.startsWith('phase')) return CheckCircle2
  if (actionType.startsWith('payment')) return Wallet
  if (actionType.startsWith('issue')) return AlertTriangle
  return Zap
}


/* ─── component ─────────────────────────────────────── */
export function EventDashboardPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const { activeEvent, setActiveEvent, phases, setPhases } = useEventStore()
  const showNotification = useUIStore((s) => s.showNotification)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ vendors: 0, tasksDue: 0, openIssues: 0 })
  const [portalOpen, setPortalOpen] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [payStatus, setPayStatus] = useState<'idle' | 'processing' | 'success' | 'cancelled' | 'failed'>('idle')
  const [showEditModal, setShowEditModal] = useState(false)
  const [autoCloseIn, setAutoCloseIn] = useState<number | null>(null)
  const [togglingPhase, setTogglingPhase] = useState<string | null>(null)
  const [taskCounts, setTaskCounts] = useState<Record<string, { total: number; done: number }>>({})
  const [deadlinePage, setDeadlinePage] = useState(1)
  const [activityPage, setActivityPage] = useState(1)
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([])
  const [activity, setActivity] = useState<EventActivity[]>([])
  const [financialSummary, setFinancialSummary] = useState({ paid: 0, outstanding: 0 })
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'phases' | 'vendors' | 'modules'>(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab === 'timeline' || tab === 'phases' || tab === 'modules') return tab
    return 'overview'
  })

  const handleTabChange = (tab: 'overview' | 'timeline' | 'phases' | 'vendors' | 'modules') => {
    setActiveTab(tab)
    const params = new URLSearchParams(window.location.search)
    params.set('tab', tab)
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.pushState(null, '', newUrl)
  }

  const paySucceededRef = useRef(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (payStatus !== 'success') return
    setAutoCloseIn(3)
    const interval = setInterval(() => {
      setAutoCloseIn((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          setShowPaymentModal(false)
          setPayStatus('idle')
          return null
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [payStatus])

  useEffect(() => {
    if (!id || !user) return
    let cancelled = false

    async function loadEvent() {
      setLoading(true)
      setError(null)

      const isUUID = UUID_RE.test(id!)
      const evtQuery = supabase.from('events').select('*').is('deleted_at', null)
      const { data: event, error: eventErr } = await (
        isUUID ? evtQuery.eq('id', id!) : evtQuery.eq('slug', id!)
      ).single()

      if (cancelled) return
      if (eventErr || !event) {
        setError(eventErr?.message || 'Event not found')
        setLoading(false)
        return
      }

      setActiveEvent(event as unknown as Event)

      const { data: phaseData } = await supabase
        .from('event_phases')
        .select('*')
        .eq('event_id', event.id)
        .order('phase_number', { ascending: true })

      if (!cancelled && phaseData) setPhases(phaseData as unknown as EventPhase[])

      /* task counts per phase */
      const { data: taskPhaseCounts } = await supabase
        .from('tasks')
        .select('phase_id, status')
        .eq('event_id', event.id)
        .not('phase_id', 'is', null)
      if (taskPhaseCounts) {
        const counts: Record<string, { total: number; done: number }> = {}
        for (const t of taskPhaseCounts) {
          if (!t.phase_id) continue
          if (!counts[t.phase_id]) counts[t.phase_id] = { total: 0, done: 0 }
          counts[t.phase_id].total++
          if (t.status === 'done') counts[t.phase_id].done++
        }
        if (!cancelled) setTaskCounts(counts)
      }

      const { count: vendorCount } = await supabase
        .from('event_vendors').select('id', { count: 'exact' }).eq('event_id', event.id)

      const { count: tasksDueCount } = await supabase
        .from('tasks').select('id', { count: 'exact' })
        .eq('event_id', event.id).not('status', 'eq', 'done')
        .lte('due_datetime', new Date().toISOString())

      const { count: issueCount } = await supabase
        .from('issues').select('id', { count: 'exact' })
        .eq('event_id', event.id).is('resolved_at', null)

      /* upcoming deadlines */
      const d: DeadlineItem[] = []

      const { data: upcomingTasks } = await supabase
        .from('tasks').select('id, title, due_datetime, status, created_at, assignee:profiles(display_name, avatar_url)')
        .eq('event_id', event.id).neq('status', 'done')
        .gte('due_datetime', new Date().toISOString())
        .order('due_datetime', { ascending: true }).limit(15)
      if (upcomingTasks) {
        for (const t of upcomingTasks) {
          if (t.due_datetime) {
            d.push({
              id: t.id,
              type: 'task',
              title: t.title,
              date: t.due_datetime,
              label: t.status.replace('_', ' '),
              dateAssigned: t.created_at,
              assignee: t.assignee as unknown as DeadlineItem['assignee'],
            })
          }
        }
      }

      const { data: phaseDeadlines } = await supabase
        .from('event_phases').select('id, phase_name, due_date, status')
        .eq('event_id', event.id).neq('status', 'completed')
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true }).limit(15)
      if (phaseDeadlines) {
        for (const p of phaseDeadlines) {
          if (p.due_date) d.push({ id: p.id, type: 'phase', title: p.phase_name, date: p.due_date, label: p.status.replace('_', ' ') })
        }
      }

      const { data: vendorPayments } = await supabase
        .from('event_vendors').select('id, vendor_name, payment_date, payment_status')
        .eq('event_id', event.id).in('payment_status', ['unpaid', 'advance'])
        .not('payment_date', 'is', null)
        .order('payment_date', { ascending: true }).limit(15)
      if (vendorPayments) {
        for (const v of vendorPayments) {
          if (v.payment_date) d.push({ id: v.id, type: 'vendor_payment', title: v.vendor_name, date: v.payment_date, label: v.payment_status.replace('_', ' ') })
        }
      }

      d.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      const { data: activityData } = await supabase
        .from('event_activity').select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false }).limit(20)

      const { data: finData } = await supabase
        .from('financial_entries')
        .select('advance_paid, balance')
        .eq('event_id', event.id)

      if (!cancelled) {
        setStats({ vendors: vendorCount || 0, tasksDue: tasksDueCount || 0, openIssues: issueCount || 0 })
        setDeadlines(d)
        if (activityData) setActivity(activityData as unknown as EventActivity[])
        if (finData) {
          setFinancialSummary({
            paid: finData.reduce((s, e) => s + (e.advance_paid || 0), 0),
            outstanding: finData.reduce((s, e) => s + (e.balance || 0), 0),
          })
        }
        setLoading(false)
      }
    }

    loadEvent()
    return () => { cancelled = true }
  }, [id, user, setActiveEvent, setPhases])

  const togglePhaseStatus = async (phase: EventPhase) => {
    const completing = phase.status !== 'completed'
    setTogglingPhase(phase.id)

    if (completing) {
      const { error } = await supabase.rpc('manually_complete_phase', { p_phase_id: phase.id })
      if (error) {
        showNotification({ variant: 'error', title: 'Failed to complete phase', message: error.message })
        setTogglingPhase(null)
        return
      }
    } else {
      const { error } = await supabase.rpc('reopen_phase', { p_phase_id: phase.id })
      if (error) {
        showNotification({ variant: 'error', title: 'Failed to reopen phase', message: error.message })
        setTogglingPhase(null)
        return
      }
    }

    showNotification({
      variant: 'success',
      title: completing ? `"${phase.phase_name}" marked complete` : `"${phase.phase_name}" reopened`,
    })
    setTogglingPhase(null)
    window.location.reload()
  }

  const handleEventSaved = (updated: Partial<Event>) => {
    if (activeEvent) setActiveEvent({ ...activeEvent, ...updated })
  }

  const handlePayNow = useCallback(async (provider: 'paystack' | 'flutterwave') => {
    if (!user || !id || !activeEvent) return
    const currentEvent = activeEvent
    paySucceededRef.current = false
    setPayStatus('processing')

    try {
      await processPayment({
        provider,
        email: user.email || '',
        amount: getEventPrice('standard'),
        metadata: { event_id: activeEvent.id },

        onSuccess: async (reference: string) => {
          paySucceededRef.current = true

          const { data, error: verifyErr } = await supabase.functions.invoke('verify-payment', {
            body: {
              provider,
              reference,
              event_id: activeEvent.id
            }
          })

          if (verifyErr || (data && data.error)) {
            let errMsg = verifyErr?.message || data?.error || 'Payment verification failed'
            if (verifyErr && 'context' in verifyErr && verifyErr.context) {
              try {
                const res = verifyErr.context as Response
                const body = await res.clone().json()
                if (body && body.error) {
                  errMsg = body.error
                }
              } catch (e) {
                console.error('Failed to parse verification error:', e)
              }
            }
            showNotification({ variant: 'error', title: 'Verification failed', message: errMsg })
            setPayStatus('failed')
            return
          }

          setActiveEvent({ ...currentEvent, status: 'active', payment_status: 'paid' } as Event)
          showNotification({ variant: 'success', title: '🎉 Payment successful!', message: `${currentEvent.name} is now active.` })
          setPayStatus('success')
        },

        onClose: () => {
          if (!paySucceededRef.current) setPayStatus('cancelled')
        },
      })
    } catch {
      if (!paySucceededRef.current) setPayStatus('failed')
    }
  }, [user, id, activeEvent, setActiveEvent, showNotification])

  const openPayment = () => {
    setPayStatus('idle')
    setShowPaymentModal(true)
    import('@/lib/paystack').then(({ loadPaystackScript }) => loadPaystackScript().catch(() => {}))
    import('@/lib/flutterwave').then(({ loadFlutterwaveScript }) => loadFlutterwaveScript().catch(() => {}))
  }

  const closePayment = () => {
    if (payStatus === 'processing') return
    setShowPaymentModal(false)
    setPayStatus('idle')
    setAutoCloseIn(null)
  }

  /* ── derived ── */
  const completedCount = phases.filter((p) => p.status === 'completed').length
  const progressPct = phases.length ? Math.round((completedCount / phases.length) * 100) : 0
  const countdown = activeEvent ? getCountdown(activeEvent.event_date) : null
  const isPaid = activeEvent?.payment_status === 'paid'

  // Pagination for Deadlines (3 items per page)
  const itemsPerPageDeadlines = 3
  const totalDeadlinePages = Math.max(1, Math.ceil(deadlines.length / itemsPerPageDeadlines))
  const paginatedDeadlines = deadlines.slice(
    (deadlinePage - 1) * itemsPerPageDeadlines,
    deadlinePage * itemsPerPageDeadlines
  )

  // Pagination for Recent Activity (4 items per page)
  const itemsPerPageActivity = 4
  const totalActivityPages = Math.max(1, Math.ceil(activity.length / itemsPerPageActivity))
  const paginatedActivity = activity.slice(
    (activityPage - 1) * itemsPerPageActivity,
    activityPage * itemsPerPageActivity
  )

  /* ── loading / error ── */
  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 'var(--space-4)' }}>
          <img src="/EventGrid-favicon.svg" alt="" style={{ width: 48, height: 48, opacity: 0.4 }} />
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading event...</div>
        </div>
      </div>
    )
  }

  if (error || !activeEvent) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon"><AlertTriangle size={24} /></div>
        <div className="empty-state__title">Event not found</div>
        <div className="empty-state__description">{error || 'This event could not be loaded.'}</div>
        <Link to="/events" className="btn btn-primary">Back to Events</Link>
      </div>
    )
  }

  /* ── status badge colour ── */
  const statusBadge =
    activeEvent.status === 'active' ? 'green'
    : activeEvent.status === 'draft' ? 'grey'
    : activeEvent.status === 'in_progress' ? 'yellow'
    : activeEvent.status === 'completed' ? 'green' : 'red'

  /* ── next actions computation ── */
  const nextActions: ActionItem[] = []

  if (!isPaid) {
    nextActions.push({
      id: 'activate',
      priority: 'critical',
      Icon: CreditCard,
      title: 'Activate this event',
      subtitle: 'Complete payment to unlock all planning features and start coordinating.',
      cta: 'Pay ₦20,000',
      onClick: openPayment,
    })
  } else {
    if (countdown && !countdown.past && countdown.days <= 7) {
      const daysLabel = countdown.days === 0 ? 'Today' : `${countdown.days} day${countdown.days !== 1 ? 's' : ''}`
      nextActions.push({
        id: 'pre-event',
        priority: 'warning',
        Icon: Calendar,
        title: `${daysLabel} until event`,
        subtitle: 'Confirm all vendors, brief your team, and run through the final checklist.',
        cta: 'Review Tasks',
        route: `/events/${id}/tasks`,
      })
    }

    if (stats.tasksDue > 0) {
      nextActions.push({
        id: 'tasks',
        priority: 'warning',
        Icon: AlertTriangle,
        title: `${stats.tasksDue} overdue task${stats.tasksDue !== 1 ? 's' : ''}`,
        subtitle: 'Tasks past their due date need attention to keep the event on track.',
        cta: 'Review Tasks',
        route: `/events/${id}/tasks`,
      })
    }

    if (stats.openIssues > 0) {
      nextActions.push({
        id: 'issues',
        priority: 'warning',
        Icon: AlertTriangle,
        title: `${stats.openIssues} open issue${stats.openIssues !== 1 ? 's' : ''}`,
        subtitle: 'Unresolved issues flagged on the live board require follow-up.',
        cta: 'Open Live Board',
        route: `/events/${id}/live-board`,
      })
    }

    if (stats.vendors === 0) {
      nextActions.push({
        id: 'vendors',
        priority: 'info',
        Icon: Users,
        title: 'No vendors added yet',
        subtitle: 'Add your service providers and track contracts in one place.',
        cta: 'Add Vendors',
        route: `/events/${id}/vendors`,
      })
    }

    if (!activeEvent.budget_total && role === 'planner') {
      nextActions.push({
        id: 'budget',
        priority: 'info',
        Icon: Wallet,
        title: 'Budget not configured',
        subtitle: 'Set a total budget to enable financial tracking and P&L reporting.',
        cta: 'Set Budget',
        onClick: () => setShowEditModal(true),
      })
    }

    const currentPhase = phases.find(p => p.phase_number === activeEvent.current_phase)
    if (currentPhase?.status === 'in_progress') {
      nextActions.push({
        id: 'phase',
        priority: 'info',
        Icon: ArrowRight,
        title: `Phase ${currentPhase.phase_number}: ${currentPhase.phase_name}`,
        subtitle: 'Currently in progress — pick up where you left off.',
        cta: 'Continue',
        route: getPhaseRoute(currentPhase.phase_number, id!),
      })
    }
  }

  /* ── event date formatted ── */
  const eventDateLabel = activeEvent.event_date
    ? new Date(activeEvent.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : null

  const daysUntilEvent = countdown && !countdown.past ? countdown.days : -1
  const overdueTaskCount = stats.tasksDue
  const currentPhaseNumber = activeEvent.current_phase
  const currentPhase = phases.find(p => p.phase_number === currentPhaseNumber)

  const renderNextStepCard = () => {
    if (!activeEvent) return null

    let title = ''
    let subtitle = ''
    let cta = ''
    let onClick: (() => void) | undefined
    let route: string | undefined

    if (activeEvent.payment_status === 'unpaid') {
      title = 'Activate this event'
      subtitle = 'Complete payment to unlock all planning features and start coordinating.'
      cta = 'Pay ₦20,000'
      onClick = openPayment
    } else if (daysUntilEvent >= 0 && daysUntilEvent <= 7 && currentPhaseNumber === 6 && currentPhase?.status !== 'completed') {
      title = `Event in ${daysUntilEvent} day${daysUntilEvent !== 1 ? 's' : ''}`
      subtitle = 'Your pre-event checklist is still incomplete. Review tasks to ensure a smooth event.'
      cta = 'Review Checklist'
      route = `/events/${id}/tasks`
    } else if (overdueTaskCount > 0) {
      title = `${overdueTaskCount} task${overdueTaskCount !== 1 ? 's' : ''} overdue`
      subtitle = 'Some tasks are past their due dates. Review and reassign them to stay on schedule.'
      cta = 'Review Tasks'
      route = `/events/${id}/tasks`
    } else if (currentPhase && currentPhase.status === 'in_progress') {
      title = `Phase ${currentPhase.phase_number}: ${currentPhase.phase_name}`
      subtitle = 'Currently in progress. Continue completing deliverables for this phase.'
      cta = 'Go to Phase Tasks'
      route = getPhaseRoute(currentPhase.phase_number, id!)
    } else {
      return null
    }

    return (
      <div className={styles.nextStepCard}>
        <div className={styles.nextStepCardLeft}>
          <div className={styles.nextStepBadge}>Next Step</div>
          <h4 className={styles.nextStepTitle}>{title}</h4>
          <p className={styles.nextStepSubtitle}>{subtitle}</p>
        </div>
        {onClick ? (
          <button className="btn btn-primary" onClick={onClick}>
            {cta}
          </button>
        ) : (
          <Link to={route!} className="btn btn-primary">
            {cta}
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className={styles.page}>

      {/* ── 1. Command Header ── */}
      <PageHero
        icon={Calendar}
        title={activeEvent.name}
        subtitle={[
          activeEvent.event_type,
          eventDateLabel,
          activeEvent.venue_name,
          activeEvent.guest_count ? `${activeEvent.guest_count.toLocaleString()} guests` : null,
        ].filter(Boolean).join(' · ')}
        backTo="/events"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <button type="button" className={styles.headerEditBtn} onClick={() => setShowEditModal(true)} aria-label="Edit event">
              <Pencil size={14} />
            </button>
            <span className={`badge badge-${statusBadge}`}>
              <span className="badge-dot" />
              {activeEvent.status.replace('_', ' ')}
            </span>
            {activeEvent.payment_status === 'unpaid' && (
              <span className="badge" style={{ border: '1px solid var(--color-warning)', background: 'var(--color-warning-bg)', color: 'var(--color-warning)', fontWeight: 600 }}>
                ⚡ Unpaid
              </span>
            )}
            {activeEvent.payment_status === 'paid' && (
              <span className="badge" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', fontWeight: 600 }}>
                ✓ Paid
              </span>
            )}
            <span className="badge badge-medium">Phase {activeEvent.current_phase} / 9</span>
            {countdown && !countdown.past && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Clock size={12} />
                {countdown.days}d {String(countdown.hours).padStart(2, '0')}h {String(countdown.minutes).padStart(2, '0')}m
              </span>
            )}
            {countdown?.past && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Event has passed</span>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPortalOpen(true)}>
              <ExternalLink size={14} /> Portal
            </button>
          </div>
        }
      />

      {/* ── 2. Next Step Context Alert Card ── */}
      {renderNextStepCard()}

      {/* ── 3. Tab Navigation ── */}
      <Tabs
        tabs={[
          { key: 'overview', label: 'Overview', icon: <BarChart3 size={15} /> },
          { key: 'timeline', label: 'Timeline', icon: <Clock size={15} /> },
          { key: 'phases', label: 'Phases', icon: <ListChecks size={15} /> },
          { key: 'vendors', label: 'Vendors', icon: <Users size={15} /> },
          { key: 'modules', label: 'Modules', icon: <Radio size={15} /> },
        ]}
        activeTab={activeTab}
        onChange={handleTabChange}
      />

      {/* ── 4. Tab Views ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: `${styles.slideFadeIn} 0.3s ease` }}>
          {/* Metrics Row */}
          <div className={styles.overviewStatsGrid}>
            <button className={styles.statCard} onClick={() => navigate(`/events/${id}/vendors`)}>
              <div className={styles.statCardHeader}>
                <Users size={16} />
                <span className={styles.statCardChevron}>→</span>
              </div>
              <div className={styles.statCardValue}>{stats.vendors}</div>
              <div className={styles.statCardLabel}>Vendors Assigned</div>
            </button>

            <button className={`${styles.statCard} ${stats.tasksDue > 0 ? styles.statCardWarn : ''}`} onClick={() => navigate(`/events/${id}/tasks`)}>
              <div className={styles.statCardHeader}>
                <ListChecks size={16} />
                <span className={styles.statCardChevron}>→</span>
              </div>
              <div className={styles.statCardValue}>{stats.tasksDue}</div>
              <div className={styles.statCardLabel}>Overdue Tasks</div>
            </button>

            <button className={`${styles.statCard} ${stats.openIssues > 0 ? styles.statCardError : ''}`} onClick={() => navigate(`/events/${id}/live-board`)}>
              <div className={styles.statCardHeader}>
                <AlertTriangle size={16} />
                <span className={styles.statCardChevron}>→</span>
              </div>
              <div className={styles.statCardValue}>{stats.openIssues}</div>
              <div className={styles.statCardLabel}>Open Issues</div>
            </button>

            <button className={styles.statCard} onClick={() => handleTabChange('phases')}>
              <div className={styles.statCardHeader}>
                <CheckCircle2 size={16} />
                <span className={styles.statCardChevron}>→</span>
              </div>
              <div className={styles.statCardValue}>{completedCount}/{phases.length}</div>
              <div className={styles.statCardLabel}>Phases Completed</div>
            </button>
          </div>

          {/* Financial Snapshot Grid */}
          {role === 'planner' && (
            <div className={styles.financialSnapshot}>
              <div className={styles.finSnapHeader}>
                <div className={styles.finSnapTitle}>Financial Snapshot</div>
                <Link to={`/events/${activeEvent.id}/financials`} className={styles.finSnapLink}>
                  Manage Financials <ArrowRight size={12} />
                </Link>
              </div>
              <div className={styles.finSnapGrid}>
                <div className={styles.finSnapCard}>
                  <span className={styles.finSnapLabel}>Total Budget</span>
                  <span className={styles.finSnapValue}>
                    {activeEvent.budget_total ? fmtNaira(activeEvent.budget_total) : 'Not set'}
                  </span>
                </div>
                <div className={styles.finSnapCard}>
                  <span className={styles.finSnapLabel}>Paid to Vendors</span>
                  <span className={`${styles.finSnapValue} ${styles.finSnapValueSuccess}`}>
                    {fmtNaira(financialSummary.paid)}
                  </span>
                </div>
                <div className={styles.finSnapCard}>
                  <span className={styles.finSnapLabel}>Outstanding Balance</span>
                  <span className={`${styles.finSnapValue} ${financialSummary.outstanding > 0 ? styles.finSnapValueError : ''}`}>
                    {fmtNaira(financialSummary.outstanding)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Feed Card Grid */}
          <div className={styles.contentGrid}>
            {/* Upcoming Deadlines */}
            {/* Upcoming Deadlines */}
            <div className={styles.feedCard}>
              <div className={styles.feedCardTitle}>
                <Clock size={14} style={{ color: 'var(--color-info)' }} />
                Upcoming Deadlines
              </div>
              {deadlines.length === 0 ? (
                <div className={styles.feedEmpty}>No upcoming deadlines</div>
              ) : (
                <>
                  <div className={styles.tableResponsive}>
                    <table className={styles.deadlinesTable}>
                      <thead>
                        <tr>
                          <th>Task / Action</th>
                          <th>Assigned To</th>
                          <th>Assigned</th>
                          <th>Deadline</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedDeadlines.map((dl) => {
                          const isOverdue = new Date(dl.date) < new Date()
                          
                          // Format date assigned
                          const dateAssignedStr = dl.dateAssigned 
                            ? new Date(dl.dateAssigned).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                            : '—'
                          
                          // Format deadline
                          const deadlineStr = new Date(dl.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

                          // Status dot / badge color
                          let statusClass = styles.statusBadgeReady
                          const normalizedLabel = dl.label.toLowerCase().trim()
                          if (normalizedLabel === 'done' || normalizedLabel === 'completed' || normalizedLabel === 'paid') {
                            statusClass = styles.statusBadgeDone
                          } else if (normalizedLabel === 'in progress' || normalizedLabel === 'active' || normalizedLabel === 'advance' || normalizedLabel === 'in_progress') {
                            statusClass = styles.statusBadgeActive
                          } else if (isOverdue) {
                            statusClass = styles.statusBadgeOverdue
                          }

                          return (
                            <tr key={dl.id} className={isOverdue ? styles.rowOverdue : ''}>
                              <td className={styles.taskCell} title={dl.title}>
                                <div className={styles.taskTitleContainer}>
                                  <span className={`${styles.taskTypeBadge} ${
                                    dl.type === 'task' ? styles.typeTask
                                    : dl.type === 'phase' ? styles.typePhase
                                    : styles.typePayment
                                  }`}>
                                    {dl.type === 'task' ? 'Task' : dl.type === 'phase' ? 'Phase' : 'Pay'}
                                  </span>
                                  <span className={styles.taskTitleText}>{dl.title}</span>
                                </div>
                              </td>
                              <td className={styles.assigneeCell}>
                                {dl.assignee ? (
                                  <div className={styles.assigneeWrap} title={dl.assignee.display_name || ''}>
                                    {dl.assignee.avatar_url ? (
                                      <img src={dl.assignee.avatar_url} alt="" className={styles.assigneeAvatar} />
                                    ) : (
                                      <div className={styles.assigneeInitial}>
                                        {(dl.assignee.display_name || 'U').charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <span className={styles.assigneeName}>{dl.assignee.display_name || 'Unnamed'}</span>
                                  </div>
                                ) : (
                                  <span className={styles.mutedText}>—</span>
                                )}
                              </td>
                              <td>
                                <span className={styles.dateText}>{dateAssignedStr}</span>
                              </td>
                              <td className={isOverdue ? styles.dateCellOverdue : ''}>
                                <div className={styles.dateCellWrap}>
                                  <span className={styles.dateText}>{deadlineStr}</span>
                                  {isOverdue && <span className={styles.overdueLabel}>overdue</span>}
                                </div>
                              </td>
                              <td>
                                <span className={`${styles.statusBadge} ${statusClass}`}>
                                  {dl.label}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {totalDeadlinePages > 1 && (
                    <div className={styles.feedPagination}>
                      <button
                        type="button"
                        className={styles.feedPageBtn}
                        onClick={() => setDeadlinePage((p) => Math.max(1, p - 1))}
                        disabled={deadlinePage === 1}
                      >
                        ←
                      </button>
                      <span className={styles.feedPageInfo}>
                        {deadlinePage} / {totalDeadlinePages}
                      </span>
                      <button
                        type="button"
                        className={styles.feedPageBtn}
                        onClick={() => setDeadlinePage((p) => Math.min(totalDeadlinePages, p + 1))}
                        disabled={deadlinePage === totalDeadlinePages}
                      >
                        →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Recent Activity */}
            <div className={styles.feedCard}>
              <div className={styles.feedCardTitle}>
                <Zap size={14} style={{ color: 'var(--color-accent)' }} />
                Recent Activity
              </div>
              {activity.length === 0 ? (
                <div className={styles.feedEmpty}>No activity yet</div>
              ) : (
                <>
                  <div className={styles.feedBody}>
                    {paginatedActivity.map((a) => {
                      const ActIcon = activityIcon(a.action_type)
                      return (
                        <div key={a.id} className={styles.feedItem}>
                          <div className={`${styles.feedItemIcon} ${styles.feedItemIconAccent}`}>
                            <ActIcon size={14} />
                          </div>
                          <div className={styles.feedItemBody}>
                            <div className={styles.feedItemTitle}>{a.description}</div>
                            <div className={styles.feedItemMeta}>
                              {a.actor_name && <>{a.actor_name} · </>}
                              {timeAgo(a.created_at)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {totalActivityPages > 1 && (
                    <div className={styles.feedPagination}>
                      <button
                        type="button"
                        className={styles.feedPageBtn}
                        onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                        disabled={activityPage === 1}
                      >
                        ←
                      </button>
                      <span className={styles.feedPageInfo}>
                        {activityPage} / {totalActivityPages}
                      </span>
                      <button
                        type="button"
                        className={styles.feedPageBtn}
                        onClick={() => setActivityPage((p) => Math.min(totalActivityPages, p + 1))}
                        disabled={activityPage === totalActivityPages}
                      >
                        →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: `${styles.slideFadeIn} 0.3s ease` }}>
          {/* Gantt Timeline */}
          <div className={styles.ganttSection}>
            <div className={styles.ganttHeader}>
              <div className={styles.ganttTitle}>Phase Schedule & Timeline</div>
              <span className={styles.ganttSub}>Track target deadlines for all 9 event phases</span>
            </div>
            <div className={styles.ganttList}>
              {phases.map((phase) => {
                const isCompleted = phase.status === 'completed'
                const isInProgress = phase.status === 'in_progress'
                const isBlocked = phase.status === 'blocked'
                
                let barColor = 'var(--color-surface-3)'
                if (isCompleted) barColor = 'var(--color-success)'
                else if (isInProgress) barColor = 'var(--color-accent)'
                else if (isBlocked) barColor = 'var(--color-error)'

                return (
                  <div key={phase.id} className={styles.ganttRow}>
                    <div className={styles.ganttLabelCol}>
                      <span className={styles.ganttNum}>{phase.phase_number}</span>
                      <span className={styles.ganttName}>{phase.phase_name}</span>
                    </div>
                    <div className={styles.ganttBarCol}>
                      <div className={styles.ganttBarTrack}>
                        <div 
                          className={styles.ganttBarFill} 
                          style={{ 
                            width: isCompleted ? '100%' : isInProgress ? '50%' : isBlocked ? '25%' : '8%',
                            backgroundColor: barColor 
                          }} 
                        />
                      </div>
                    </div>
                    <div className={styles.ganttDateCol}>
                      {phase.due_date ? (
                        <span className={styles.ganttDate}>
                          {new Date(phase.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      ) : (
                        <span className={styles.ganttDateEmpty}>No deadline set</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Interactive Phase Timeline Tracker */}
          <div className={styles.timelineSection} style={{ marginTop: 'var(--space-2)' }}>
            <div className={styles.timelineToggle} style={{ pointerEvents: 'none', cursor: 'default' }}>
              <Clock size={14} />
              Phase Milestones & Deliverables
            </div>
            <div style={{ padding: '0 var(--space-5) var(--space-5)' }}>
              <PhaseTimelineTracker phases={phases} event={activeEvent} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'phases' && phases.length > 0 && (
        <div className={styles.phaseTabContent} style={{ animation: `${styles.slideFadeIn} 0.3s ease` }}>
          {/* Progress Header */}
          <div className={styles.phaseHeaderCard}>
            <div className={styles.phaseHeaderMeta}>
              <h3 className={styles.phaseHeaderTitle}>Phase Progress</h3>
              <p className={styles.phaseHeaderSub}>{completedCount} of {phases.length} operational phases complete</p>
            </div>
            <div className={styles.phaseProgressContainer}>
              <div className={styles.phaseProgressBar}>
                <div className={styles.phaseProgressFill} style={{ width: `${progressPct}%` }} />
              </div>
              <span className={styles.phaseProgressPct}>{progressPct}%</span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className={styles.phaseCardsGrid}>
            {phases.map((phase) => {
              const isCompleted = phase.status === 'completed'
              const isToggling = togglingPhase === phase.id
              
              let cardClass = styles.phaseCard
              if (isCompleted) cardClass += ` ${styles.phaseCardCompleted}`
              else if (phase.status === 'in_progress') cardClass += ` ${styles.phaseCardCurrent}`
              else if (phase.status === 'blocked') cardClass += ` ${styles.phaseCardBlocked}`

              return (
                <div key={phase.id} className={cardClass}>
                  <div className={styles.phaseCardTop}>
                    <div className={styles.phaseCardNumberBadge}>Phase {phase.phase_number}</div>
                    <button
                      type="button"
                      className={`${styles.phaseCardToggle} ${isCompleted ? styles.phaseCardToggleChecked : ''}`}
                      onClick={() => togglePhaseStatus(phase)}
                      disabled={isToggling}
                      aria-label={isCompleted ? `Reopen ${phase.phase_name}` : `Complete ${phase.phase_name}`}
                    >
                      {isToggling ? (
                        <span className="spinner-loader" style={{ width: 14, height: 14 }} />
                      ) : isCompleted ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Circle size={16} />
                      )}
                    </button>
                  </div>
                  
                  <h4 className={styles.phaseCardName}>{phase.phase_name}</h4>
                  
                  <div className={styles.phaseCardMeta}>
                    <span className={`badge badge-${phase.status === 'completed' ? 'green' : phase.status === 'in_progress' ? 'yellow' : phase.status === 'blocked' ? 'red' : 'grey'}`}>
                      <span className="badge-dot" />
                      {phase.status.replace('_', ' ')}
                    </span>
                    {phase.due_date && (
                      <span className={styles.phaseCardDate}>
                        Due: {new Date(phase.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>

                  {taskCounts[phase.id] && (
                    <div style={{ marginTop: 'var(--space-2)' }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 4,
                      }}>
                        <span>Tasks</span>
                        <span>{taskCounts[phase.id].done}/{taskCounts[phase.id].total} done</span>
                      </div>
                      {taskCounts[phase.id].total > 0 && (
                        <div style={{
                          height: 4, background: 'var(--color-surface-3)', borderRadius: 2, overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${Math.round((taskCounts[phase.id].done / taskCounts[phase.id].total) * 100)}%`,
                            height: '100%',
                            background: taskCounts[phase.id].done === taskCounts[phase.id].total
                              ? 'var(--color-success)' : 'var(--color-accent)',
                            borderRadius: 2, transition: 'width 0.3s ease',
                          }} />
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className={styles.phaseCardFooter}>
                    <Link to={`/events/${id}/tasks?phase=${phase.phase_number}`} className={styles.phaseCardLink}>
                      Manage Deliverables <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'vendors' && (
        <div style={{ animation: `${styles.slideFadeIn} 0.3s ease` }}>
          <EventVendorsPage standalone={false} />
        </div>
      )}

      {activeTab === 'modules' && (
        <div className={styles.modulesTabContent} style={{ animation: `${styles.slideFadeIn} 0.3s ease` }}>
          {/* Operations Section */}
          <div className={styles.moduleCategorySection}>
            <h3 className={styles.moduleCategoryTitle}>Planning & Operations</h3>
            <div className={styles.modulesGrid}>
              <Link to={`/events/${id}/tasks`} className={styles.moduleCard}>
                <div className={styles.moduleIcon}><ListChecks size={18} /></div>
                <div className={styles.moduleInfo}>
                  <span className={styles.moduleTitle}>Tasks & Checklists</span>
                  <span className={styles.moduleDesc}>Kanban, task assignments, and progress tracking</span>
                </div>
                {stats.tasksDue > 0 && (
                  <span className={`${styles.moduleBadge} ${styles.moduleBadgeWarn}`}>
                    {stats.tasksDue} due
                  </span>
                )}
              </Link>
              <Link to={`/events/${id}/team`} className={styles.moduleCard}>
                <div className={styles.moduleIcon}><Users size={18} /></div>
                <div className={styles.moduleInfo}>
                  <span className={styles.moduleTitle}>Team Coordination</span>
                  <span className={styles.moduleDesc}>Rosters, coordinator access, and updates</span>
                </div>
              </Link>
              <Link to={`/events/${id}/vendors`} className={styles.moduleCard}>
                <div className={styles.moduleIcon}><Users size={18} /></div>
                <div className={styles.moduleInfo}>
                  <span className={styles.moduleTitle}>Vendor Management</span>
                  <span className={styles.moduleDesc}>Contracts, catering, design, and audio bookings</span>
                </div>
                {stats.vendors > 0 && (
                  <span className={styles.moduleBadge}>{stats.vendors}</span>
                )}
              </Link>
            </div>
          </div>

          {/* Finance Section */}
          {role === 'planner' && (
            <div className={styles.moduleCategorySection}>
              <h3 className={styles.moduleCategoryTitle}>Financial Oversight</h3>
              <div className={styles.modulesGrid}>
                <Link to={`/events/${activeEvent.id}/financials`} className={styles.moduleCard}>
                  <div className={styles.moduleIcon}><Wallet size={18} /></div>
                  <div className={styles.moduleInfo}>
                    <span className={styles.moduleTitle}>Budget & Cashflow</span>
                    <span className={styles.moduleDesc}>Cost tracking, Naira-based P&L, and vendor payments</span>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* Guest Experience Section */}
          <div className={styles.moduleCategorySection}>
            <h3 className={styles.moduleCategoryTitle}>Guest & Live Operations</h3>
            <div className={styles.modulesGrid}>
              <Link to={`/events/${id}/guests`} className={styles.moduleCard}>
                <div className={styles.moduleIcon}><Calendar size={18} /></div>
                <div className={styles.moduleInfo}>
                  <span className={styles.moduleTitle}>Guests & RSVPs</span>
                  <span className={styles.moduleDesc}>Guest lists, VIP tracking, and seating arrangements</span>
                </div>
              </Link>
              <Link to={`/events/${id}/live-board`} className={styles.moduleCard}>
                <div className={styles.moduleIcon} style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--color-success)' }}>
                  <Radio size={18} />
                </div>
                <div className={styles.moduleInfo}>
                  <span className={styles.moduleTitle}>Live Feed</span>
                  <span className={styles.moduleDesc}>Real-time team updates with photos</span>
                </div>
                {stats.openIssues > 0 && (
                  <span className={`${styles.moduleBadge} ${styles.moduleBadgeError}`}>
                    {stats.openIssues} active
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Review Section */}
          <div className={styles.moduleCategorySection}>
            <h3 className={styles.moduleCategoryTitle}>Analysis & Closeout</h3>
            <div className={styles.modulesGrid}>
              <Link to={`/events/${id}/aftermath`} className={styles.moduleCard}>
                <div className={styles.moduleIcon}><FileText size={18} /></div>
                <div className={styles.moduleInfo}>
                  <span className={styles.moduleTitle}>Post-Event Aftermath</span>
                  <span className={styles.moduleDesc}>Debrief reports, issue review, and photo gallery</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {portalOpen && activeEvent && (
        <GeneratePortalModal eventId={activeEvent.id} onClose={() => setPortalOpen(false)} />
      )}

      {showEditModal && (
        <EditEventModal
          event={activeEvent}
          onClose={() => setShowEditModal(false)}
          onSaved={handleEventSaved}
        />
      )}

      {showPaymentModal && (
        <div className="overlay" onClick={closePayment}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-card-header">
              <div className="modal-card-title">
                {payStatus === 'success' ? '🎉 Payment Successful' : 'Activate Event'}
              </div>
              <button className="modal-card-close" onClick={closePayment} disabled={payStatus === 'processing'} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className={styles.payModal}>
              {payStatus === 'success' && (
                <>
                  <div className={styles.paySuccessIcon}><CheckCircle2 size={36} /></div>
                  <h3 style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-title)' }}>Payment Confirmed!</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
                    <strong>{activeEvent.name}</strong> is now active. You can start planning your event.
                  </p>
                  <div className={styles.payAutoClose}>Closing automatically in {autoCloseIn}s...</div>
                  <div className={styles.payButtons} style={{ marginTop: 'var(--space-4)' }}>
                    <button className="btn btn-primary btn-lg" onClick={closePayment}>Start Planning →</button>
                  </div>
                </>
              )}

              {payStatus === 'processing' && (
                <div className={styles.payProcessing}>
                  <span className="spinner-loader" style={{ width: 36, height: 36 }} />
                  <div className={styles.payStatusMsg}>Opening secure payment window…</div>
                  <div className={styles.payAutoClose}>A Paystack / Flutterwave popup will appear. Complete payment there.</div>
                </div>
              )}

              {(payStatus === 'idle' || payStatus === 'cancelled' || payStatus === 'failed') && (
                <>
                  <div className={styles.payEventName}>Activate · {activeEvent.name}</div>
                  <div className={styles.payAmount}>
                    <span className={styles.payCurrency}>₦</span>
                    20,000
                  </div>

                  {payStatus === 'cancelled' && (
                    <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-warning-bg)', border: '1px solid rgba(234,179,8,0.3)', fontSize: 'var(--text-sm)', color: 'var(--color-warning)', borderRadius: 'var(--radius-lg)' }}>
                      Payment was cancelled. Try again or save as draft.
                    </div>
                  )}
                  {payStatus === 'failed' && (
                    <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-error-bg)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 'var(--text-sm)', color: 'var(--color-error)', borderRadius: 'var(--radius-lg)' }}>
                      Payment provider unavailable. Check your internet connection and try again.
                    </div>
                  )}

                  <div className={styles.payButtons}>
                    <button className="btn btn-primary btn-lg" onClick={() => handlePayNow('paystack')}>
                      <CreditCard size={18} /> Pay with Paystack
                    </button>
                    <button className="btn btn-secondary btn-lg" onClick={() => handlePayNow('flutterwave')}>
                      Pay with Flutterwave
                    </button>
                  </div>

                  <div className={styles.payTestInfo}>
                    <div className={styles.payTestTitle}>
                      <ShieldCheck size={14} /> Test / Demo Mode
                    </div>
                    <div>
                      <strong>Paystack:</strong> Card <span className={styles.payCardNum}>4084 0828 0408 4081</span><br />
                      Expiry: any future · CVV: any 3 digits · OTP: <strong>123456</strong>
                    </div>
                    <div style={{ marginTop: 'var(--space-2)' }}>
                      <strong>Flutterwave:</strong> Card <span className={styles.payCardNum}>4181 0000 0000 0007</span><br />
                      Expiry: any future · CVV: any 3 digits · PIN: <strong>0000</strong> · OTP: <strong>123456</strong>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


