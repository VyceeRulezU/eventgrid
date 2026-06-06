import { useEffect, useState, useCallback, useRef, Fragment } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useEventStore } from '@/store/event.store'
import { useUIStore } from '@/store/ui.store'
import { PhaseTimelineTracker } from '@/components/shared/PhaseTimelineTracker'
import {
  ArrowLeft, Calendar, Users, Wallet, AlertTriangle,
  ExternalLink, FileText, CheckCircle2, Circle, ChevronDown, ChevronUp,
  CreditCard, ShieldCheck, Radio, ListChecks, MapPin, BarChart3,
  Clock, ArrowRight, Zap, X, Pencil,
} from 'lucide-react'
import { GeneratePortalModal } from '@/features/client-portal/GeneratePortalModal'
import { EditEventModal } from '@/features/events/EditEventModal'
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

function phaseNodeClass(status: string): string {
  if (status === 'completed') return styles.phaseNodeDone
  if (status === 'in_progress') return styles.phaseNodeCurrent
  if (status === 'blocked') return styles.phaseNodeBlocked
  return styles.phaseNodePending
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

const MODULES = [
  { key: 'vendors',    label: 'Vendors',    Icon: Users,      path: (id: string) => `/events/${id}/vendors` },
  { key: 'financials', label: 'Financials', Icon: Wallet,     path: (id: string) => `/financials?event=${id}` },
  { key: 'team',       label: 'Team',       Icon: Users,      path: (id: string) => `/events/${id}/team` },
  { key: 'guests',     label: 'Guests',     Icon: Calendar,   path: (id: string) => `/events/${id}/guests` },
  { key: 'tasks',      label: 'Tasks',      Icon: ListChecks, path: (id: string) => `/events/${id}/tasks` },
  { key: 'live-board', label: 'Live Board', Icon: Radio,      path: (id: string) => `/events/${id}/live-board` },
  { key: 'aftermath',  label: 'Aftermath',  Icon: FileText,   path: (id: string) => `/events/${id}/aftermath` },
  { key: 'analytics',  label: 'Analytics',  Icon: BarChart3,  path: (id: string) => `/events/${id}/analytics` },
]

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
  const [showPhaseManager, setShowPhaseManager] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const [togglingPhase, setTogglingPhase] = useState<string | null>(null)
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([])
  const [activity, setActivity] = useState<EventActivity[]>([])
  const [financialSummary, setFinancialSummary] = useState({ paid: 0, outstanding: 0 })

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
        .eq('event_id', id)
        .order('phase_number', { ascending: true })

      if (!cancelled && phaseData) setPhases(phaseData as unknown as EventPhase[])

      const { count: vendorCount } = await supabase
        .from('event_vendors').select('id', { count: 'exact' }).eq('event_id', id)

      const { count: tasksDueCount } = await supabase
        .from('tasks').select('id', { count: 'exact' })
        .eq('event_id', id).not('status', 'eq', 'done')
        .lte('due_datetime', new Date().toISOString())

      const { count: issueCount } = await supabase
        .from('issues').select('id', { count: 'exact' })
        .eq('event_id', id).is('resolved_at', null)

      /* upcoming deadlines */
      const d: DeadlineItem[] = []

      const { data: upcomingTasks } = await supabase
        .from('tasks').select('id, title, due_datetime, status')
        .eq('event_id', id).neq('status', 'done')
        .gte('due_datetime', new Date().toISOString())
        .order('due_datetime', { ascending: true }).limit(3)
      if (upcomingTasks) {
        for (const t of upcomingTasks) {
          if (t.due_datetime) d.push({ id: t.id, type: 'task', title: t.title, date: t.due_datetime, label: t.status.replace('_', ' ') })
        }
      }

      const { data: phaseDeadlines } = await supabase
        .from('event_phases').select('id, phase_name, due_date, status')
        .eq('event_id', id).neq('status', 'completed')
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true }).limit(3)
      if (phaseDeadlines) {
        for (const p of phaseDeadlines) {
          if (p.due_date) d.push({ id: p.id, type: 'phase', title: p.phase_name, date: p.due_date, label: p.status.replace('_', ' ') })
        }
      }

      const { data: vendorPayments } = await supabase
        .from('event_vendors').select('id, vendor_name, payment_date, payment_status')
        .eq('event_id', id).in('payment_status', ['unpaid', 'advance'])
        .not('payment_date', 'is', null)
        .order('payment_date', { ascending: true }).limit(3)
      if (vendorPayments) {
        for (const v of vendorPayments) {
          if (v.payment_date) d.push({ id: v.id, type: 'vendor_payment', title: v.vendor_name, date: v.payment_date, label: v.payment_status.replace('_', ' ') })
        }
      }

      d.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      const { data: activityData } = await supabase
        .from('event_activity').select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: false }).limit(5)

      const { data: finData } = await supabase
        .from('financial_entries')
        .select('advance_paid, balance')
        .eq('event_id', id)

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
    const newStatus = phase.status === 'completed' ? 'in_progress' : 'completed'
    setTogglingPhase(phase.id)

    const { error: updateErr } = await supabase
      .from('event_phases')
      .update({ status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null })
      .eq('id', phase.id)

    if (updateErr) {
      showNotification({ variant: 'error', title: 'Failed to update phase', message: updateErr.message })
      setTogglingPhase(null)
      return
    }

    setPhases(phases.map((p) =>
      p.id === phase.id
        ? { ...p, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null }
        : p
    ))
    showNotification({
      variant: 'success',
      title: newStatus === 'completed' ? `"${phase.phase_name}" marked complete` : `"${phase.phase_name}" reopened`,
    })
    setTogglingPhase(null)
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
        metadata: { event_id: id },

        onSuccess: async () => {
          paySucceededRef.current = true

          const { error: updateErr } = await supabase
            .from('events')
            .update({ status: 'active', payment_status: 'paid' })
            .eq('id', id)

          if (updateErr) {
            showNotification({ variant: 'error', title: 'Payment received but activation failed', message: updateErr.message })
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

  const visibleActions = nextActions.slice(0, 4)

  /* ── event date formatted ── */
  const eventDateLabel = activeEvent.event_date
    ? new Date(activeEvent.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div className={styles.page}>

      {/* ── 1. Command Header ── */}
      <div className={styles.commandHeader}>
        {/* Row 1: back · title · countdown */}
        <div className={styles.headerRow1}>
          <button type="button" className={styles.headerBack} onClick={() => navigate('/events')} aria-label="Back to events">
            <ArrowLeft size={18} />
          </button>

          <div className={styles.headerTitle}>
            <h1 className={styles.headerName}>{activeEvent.name}</h1>
            {activeEvent.event_type && (
              <span className={styles.headerType}>· {activeEvent.event_type}</span>
            )}
            <button type="button" className={styles.headerEditBtn} onClick={() => setShowEditModal(true)} aria-label="Edit event">
              <Pencil size={14} />
            </button>
          </div>

          {countdown && !countdown.past && (
            <div className={styles.countdown}>
              <div className={styles.countdownItem}>
                <span className={styles.countdownNum}>{countdown.days}</span>
                <span className={styles.countdownLabel}>days</span>
              </div>
              <span className={styles.countdownSep}>:</span>
              <div className={styles.countdownItem}>
                <span className={styles.countdownNum}>{String(countdown.hours).padStart(2, '0')}</span>
                <span className={styles.countdownLabel}>hrs</span>
              </div>
              <span className={styles.countdownSep}>:</span>
              <div className={styles.countdownItem}>
                <span className={styles.countdownNum}>{String(countdown.minutes).padStart(2, '0')}</span>
                <span className={styles.countdownLabel}>min</span>
              </div>
            </div>
          )}
          {countdown?.past && (
            <div className={styles.countdown}>
              <span className={styles.countdownPast}>Event has passed</span>
            </div>
          )}
        </div>

        {/* Row 2: meta · badges · actions */}
        <div className={styles.headerRow2}>
          <div className={styles.headerMeta}>
            {eventDateLabel && (
              <span className={styles.headerMetaItem}>
                <Calendar size={11} /> {eventDateLabel}
              </span>
            )}
            {activeEvent.venue_name && (
              <span className={styles.headerMetaItem}>
                <MapPin size={11} /> {activeEvent.venue_name}
              </span>
            )}
            {activeEvent.guest_count ? (
              <span className={styles.headerMetaItem}>
                <Users size={11} /> {activeEvent.guest_count.toLocaleString()} guests
              </span>
            ) : null}
          </div>

          <div className={styles.headerBadges}>
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
          </div>

          <div className={styles.headerActions}>
            {!isPaid && (
              <button type="button" className={styles.btnPayGreen} onClick={openPayment}>
                <CreditCard size={14} /> Pay ₦20,000
              </button>
            )}
            <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate(`/events/${id}/tasks`)}>
              <ListChecks size={14} /> Tasks
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPortalOpen(true)}>
              <ExternalLink size={14} /> Client Portal
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Critical Alert — unpaid only ── */}
      {!isPaid && (
        <div className={`${styles.alertBanner} ${styles.alertBannerCritical}`}>
          <div className={styles.alertBannerIcon}><AlertTriangle size={16} /></div>
          <div className={styles.alertBannerBody}>
            <div className={styles.alertBannerTitle}>This event is not yet active</div>
            <div className={styles.alertBannerSub}>Complete payment to unlock all planning features and start coordinating your event.</div>
          </div>
        </div>
      )}

      {/* ── 3. Next Actions Panel ── */}
      {visibleActions.length > 0 && (
        <div className={styles.actionsSection}>
          <div className={styles.sectionLabel}>What needs attention</div>
          <div className={styles.actionsGrid}>
            {visibleActions.map((action) => {
              const cardClass = `${styles.actionCard} ${
                action.priority === 'critical' ? styles.actionCardCritical
                : action.priority === 'warning' ? styles.actionCardWarning
                : styles.actionCardInfo
              }`
              const inner = (
                <>
                  <div className={styles.actionCardIcon}><action.Icon size={18} /></div>
                  <div className={styles.actionCardContent}>
                    <div className={styles.actionCardTitle}>{action.title}</div>
                    <div className={styles.actionCardSubtitle}>{action.subtitle}</div>
                    <div className={styles.actionCardCta}>{action.cta} <ArrowRight size={12} /></div>
                  </div>
                </>
              )

              if (action.route) {
                return (
                  <Link key={action.id} to={action.route} className={cardClass}>
                    {inner}
                  </Link>
                )
              }
              return (
                <button key={action.id} type="button" className={cardClass} onClick={action.onClick}>
                  {inner}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 4. Phase Journey ── */}
      {phases.length > 0 && (
        <div className={styles.phaseSection}>
          <div className={styles.phaseSectionHeader}>
            <div className={styles.phaseSectionMeta}>
              <div className={styles.sectionLabel} style={{ marginBottom: 0 }}>Event Phase Journey</div>
              <div className={styles.phaseCount}>{completedCount} of {phases.length} phases complete</div>
            </div>
            <div className={styles.phaseProgressWrap}>
              <div className={styles.phaseProgressBar}>
                <div className={styles.phaseProgressFill} style={{ width: `${progressPct}%` }} />
              </div>
              <span className={styles.phaseProgressPct}>{progressPct}%</span>
            </div>
            <button
              type="button"
              className={styles.phaseManagerToggleBtn}
              onClick={() => setShowPhaseManager(!showPhaseManager)}
            >
              {showPhaseManager ? 'Hide' : 'Manage'}
              {showPhaseManager ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {/* Scrollable phase strip */}
          <div className={styles.phaseStrip}>
            {phases.map((phase, i) => (
              <Fragment key={phase.id}>
                <button
                  type="button"
                  className={`${styles.phaseNode} ${phaseNodeClass(phase.status)}`}
                  onClick={() => navigate(getPhaseRoute(phase.phase_number, id!))}
                  title={`Go to ${phase.phase_name}`}
                >
                  <div className={styles.phaseNodeBullet}>
                    {phase.status === 'completed' ? <CheckCircle2 size={12} /> : phase.phase_number}
                  </div>
                  <span className={styles.phaseNodeName}>{phase.phase_name}</span>
                  {phase.due_date && (
                    <span className={styles.phaseNodeDate}>
                      {new Date(phase.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </button>
                {i < phases.length - 1 && (
                  <div className={`${styles.phaseConnector} ${phase.status === 'completed' ? styles.phaseConnectorDone : ''}`} />
                )}
              </Fragment>
            ))}
          </div>

          {showPhaseManager && (
            <PhaseManagerPanel
              phases={phases}
              togglingPhase={togglingPhase}
              onToggle={togglePhaseStatus}
              styles={styles}
            />
          )}
        </div>
      )}

      {/* ── 5. Metrics Row ── */}
      <div className={styles.metricsRow}>
        <button
          type="button"
          className={styles.metricChip}
          onClick={() => navigate(`/events/${id}/vendors`)}
        >
          <div className={styles.metricChipIcon}><Users size={14} /></div>
          <div>
            <div className={styles.metricChipValue}>{stats.vendors}</div>
            <div className={styles.metricChipLabel}>Vendors</div>
          </div>
        </button>

        {stats.tasksDue > 0 && (
          <button
            type="button"
            className={`${styles.metricChip} ${styles.metricChipWarn}`}
            onClick={() => navigate(`/events/${id}/tasks`)}
          >
            <div className={styles.metricChipIcon}><AlertTriangle size={14} /></div>
            <div>
              <div className={styles.metricChipValue}>{stats.tasksDue}</div>
              <div className={styles.metricChipLabel}>Overdue</div>
            </div>
          </button>
        )}

        {stats.openIssues > 0 && (
          <button
            type="button"
            className={`${styles.metricChip} ${styles.metricChipWarn}`}
            onClick={() => navigate(`/events/${id}/live-board`)}
          >
            <div className={styles.metricChipIcon}><AlertTriangle size={14} /></div>
            <div>
              <div className={styles.metricChipValue}>{stats.openIssues}</div>
              <div className={styles.metricChipLabel}>Open Issues</div>
            </div>
          </button>
        )}

        {role === 'planner' && activeEvent.budget_total ? (
          <Link to={`/financials?event=${id}`} className={styles.metricChip}>
            <div className={styles.metricChipIcon}><Wallet size={14} /></div>
            <div>
              <div className={styles.metricChipValue}>{fmtNaira(activeEvent.budget_total)}</div>
              <div className={styles.metricChipLabel}>Budget</div>
            </div>
          </Link>
        ) : null}
      </div>

      {/* ── 6. Deadlines + Activity ── */}
      <div className={styles.contentGrid}>
        {/* Upcoming Deadlines */}
        <div className={styles.feedCard}>
          <div className={styles.feedCardTitle}>
            <Clock size={14} style={{ color: 'var(--color-info)' }} />
            Upcoming Deadlines
          </div>
          {deadlines.length === 0 ? (
            <div className={styles.feedEmpty}>No upcoming deadlines</div>
          ) : (
            <div className={styles.feedBody}>
              {deadlines.map((dl) => {
                const isOverdue = new Date(dl.date) < new Date()
                const DlIcon = dl.type === 'task' ? ListChecks : dl.type === 'phase' ? CheckCircle2 : Wallet
                return (
                  <div key={dl.id} className={styles.feedItem}>
                    <div className={`${styles.feedItemIcon} ${isOverdue ? styles.feedItemIconWarn : ''}`}>
                      <DlIcon size={14} />
                    </div>
                    <div className={styles.feedItemBody}>
                      <div className={`${styles.feedItemTitle} ${isOverdue ? styles.feedItemTitleWarn : ''}`}>{dl.title}</div>
                      <div className={styles.feedItemMeta}>
                        {new Date(dl.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {isOverdue ? ' · overdue' : ''}
                      </div>
                    </div>
                    <span className={styles.feedItemBadge}>{dl.label}</span>
                  </div>
                )
              })}
            </div>
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
            <div className={styles.feedBody}>
              {activity.map((a) => {
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
          )}
        </div>
      </div>

      {/* ── 7. Financial Strip — planner only ── */}
      {role === 'planner' && (
        <div className={styles.financialStrip}>
          <div className={styles.financialStripLabel}>
            <Wallet size={12} /> Financials
          </div>
          <div className={styles.financialItems}>
            <div className={styles.financialItem}>
              <div className={styles.financialItemLabel}>Budget</div>
              <div className={styles.financialItemValue}>
                {activeEvent.budget_total ? fmtNaira(activeEvent.budget_total) : '—'}
              </div>
            </div>
            <div className={styles.financialItem}>
              <div className={styles.financialItemLabel}>Total Paid</div>
              <div className={`${styles.financialItemValue} ${styles.financialItemValueSuccess}`}>
                {fmtNaira(financialSummary.paid)}
              </div>
            </div>
            <div className={styles.financialItem}>
              <div className={styles.financialItemLabel}>Outstanding</div>
              <div className={`${styles.financialItemValue} ${financialSummary.outstanding > 0 ? styles.financialItemValueError : styles.financialItemValueSuccess}`}>
                {fmtNaira(financialSummary.outstanding)}
              </div>
            </div>
          </div>
          <Link to={`/financials?event=${id}`} className={styles.financialStripLink}>
            View Financials <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* ── 8. Quick Tools ── */}
      <div className={styles.quickToolsSection}>
        <div className={styles.sectionLabel}>Quick Access</div>
        <div className={styles.quickToolsGrid}>
          {MODULES.map((mod) => {
            const badge =
              mod.key === 'vendors' && stats.vendors > 0 ? String(stats.vendors)
              : mod.key === 'tasks' && stats.tasksDue > 0 ? `${stats.tasksDue} due`
              : null
            const badgeWarn = mod.key === 'tasks' && stats.tasksDue > 0

            return (
              <Link key={mod.key} to={id ? mod.path(id) : '#'} className={styles.quickToolCard}>
                <div className={styles.quickToolCardIcon}><mod.Icon size={14} /></div>
                <span className={styles.quickToolCardName}>{mod.label}</span>
                {badge && (
                  <span className={`${styles.quickToolCardBadge} ${badgeWarn ? styles.quickToolCardBadgeWarn : ''}`}>
                    {badge}
                  </span>
                )}
              </Link>
            )
          })}

          {/* Client portal */}
          <button type="button" className={styles.quickToolCard} onClick={() => setPortalOpen(true)}>
            <div className={styles.quickToolCardIcon} style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>
              <ExternalLink size={14} />
            </div>
            <span className={styles.quickToolCardName}>Client Portal</span>
          </button>
        </div>
      </div>

      {/* ── 9. Phase Timeline (expandable) ── */}
      <div className={styles.timelineSection}>
        <button type="button" className={styles.timelineToggle} onClick={() => setShowTimeline(!showTimeline)}>
          <Clock size={14} />
          Phase Timeline
          {showTimeline ? <ChevronUp size={14} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={14} style={{ marginLeft: 'auto' }} />}
        </button>
        {showTimeline && (
          <PhaseTimelineTracker phases={phases} event={activeEvent} />
        )}
      </div>

      {/* ── Modals ── */}
      {portalOpen && id && (
        <GeneratePortalModal eventId={id} onClose={() => setPortalOpen(false)} />
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

/* ─── Phase Manager sub-component ─────────────────── */
function PhaseManagerPanel({
  phases,
  togglingPhase,
  onToggle,
  styles,
}: {
  phases: EventPhase[]
  togglingPhase: string | null
  onToggle: (phase: EventPhase) => void
  styles: Record<string, string>
}) {
  return (
    <div className={styles.phaseManager}>
      <h3 className={styles.phaseManagerTitle}>Mark Phases Complete / In Progress</h3>
      <div className={styles.phaseManagerGrid}>
        {phases.map((phase) => {
          const isCompleted = phase.status === 'completed'
          const isToggling = togglingPhase === phase.id
          return (
            <div
              key={phase.id}
              className={`${styles.phaseManagerItem} ${isCompleted ? styles.phaseManagerItemCompleted : ''}`}
            >
              <div className={styles.phaseManagerLeft}>
                <span className={`${styles.phaseManagerNum} ${isCompleted ? styles.phaseManagerNumDone : ''}`}>
                  {phase.phase_number}
                </span>
                <div>
                  <div className={styles.phaseManagerName}>{phase.phase_name}</div>
                  <div className={styles.phaseManagerStatus}>
                    {phase.status.replace('_', ' ')}
                    {phase.completed_at && ` · ${new Date(phase.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-icon"
                onClick={() => onToggle(phase)}
                disabled={isToggling}
                style={{ color: isCompleted ? 'var(--color-accent)' : undefined }}
                aria-label={isCompleted ? `Reopen ${phase.phase_name}` : `Complete ${phase.phase_name}`}
              >
                {isToggling ? <span className="spinner-loader" /> : isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
