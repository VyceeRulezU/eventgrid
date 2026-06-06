import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useEventStore } from '@/store/event.store'
import { useUIStore } from '@/store/ui.store'
import {
  PhasePipeline, PhaseSegmentBar, PhaseStepper,
} from '@/components/shared/PhasePipeline'
import { PhaseTimelineTracker } from '@/components/shared/PhaseTimelineTracker'
import {
  ArrowLeft, Calendar, Users, Wallet, AlertTriangle,
  ExternalLink, FileText, CheckCircle2, Circle, ChevronDown, ChevronUp,
  CreditCard, ShieldCheck, Radio, ListChecks, MapPin, BarChart3,
  Clock, ArrowRight, Zap, X, Pencil,
} from 'lucide-react'
import { GeneratePortalModal } from '@/features/client-portal/GeneratePortalModal'
import { EditEventModal } from '@/features/events/EditEventModal'
import { NextStepCard } from '@/features/events/NextStepCard'
import { processPayment, getEventPrice } from '@/lib/payment'
import type { Event, EventPhase, EventActivity } from '@/types'
import styles from './EventDashboardPage.module.css'

/* ─── helpers ──────────────────────────────────────── */
interface DeadlineItem {
  id: string
  type: 'task' | 'phase' | 'vendor_payment'
  title: string
  date: string
  label: string
}

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

const MODULES = [
  {
    key: 'vendors',
    label: 'Vendors',
    desc: 'Manage service providers and contracts',
    icon: Users,
    path: (id: string) => `/events/${id}/vendors`,
  },
  {
    key: 'financials',
    label: 'Financials',
    desc: 'Budget tracking and expense management',
    icon: Wallet,
    path: (id: string) => `/financials?event=${id}`,
  },
  {
    key: 'team',
    label: 'Team',
    desc: 'Coordinators and staff assignments',
    icon: Users,
    path: (id: string) => `/events/${id}/team`,
  },
  {
    key: 'guests',
    label: 'Guests',
    desc: 'Guest list, RSVPs and seating',
    icon: Calendar,
    path: (id: string) => `/events/${id}/guests`,
  },
  {
    key: 'tasks',
    label: 'Tasks',
    desc: 'To-dos, deadlines and assignments',
    icon: ListChecks,
    path: (id: string) => `/events/${id}/tasks`,
  },
  {
    key: 'live-board',
    label: 'Live Board',
    desc: 'Real-time event day operations',
    icon: Radio,
    path: (id: string) => `/events/${id}/live-board`,
  },
  {
    key: 'aftermath',
    label: 'Aftermath',
    desc: 'Post-event reports and lessons learned',
    icon: FileText,
    path: (id: string) => `/events/${id}/aftermath`,
  },
  {
    key: 'analytics',
    label: 'Analytics',
    desc: 'Event performance and KPIs',
    icon: BarChart3,
    path: (id: string) => `/events/${id}/analytics`,
  },
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
  const [pageTab, setPageTab] = useState<'overview' | 'timeline' | 'phases' | 'modules'>('overview')
  const [showPhaseManager, setShowPhaseManager] = useState(false)
  const [togglingPhase, setTogglingPhase] = useState<string | null>(null)
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([])
  const [activity, setActivity] = useState<EventActivity[]>([])

  /* ── Refs for race-condition-free payment tracking ── */
  // paySucceededRef: set to true the MOMENT onSuccess fires (synchronously),
  // so that Paystack's onCancel/onClose (which fires concurrently) can never
  // reset the state to 'cancelled' after a successful payment.
  const paySucceededRef = useRef(false)
  // closeTimerRef: holds the auto-close timeout so we can clear it on unmount
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup close timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  // Auto-close countdown after successful payment
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

      const { data: event, error: eventErr } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single()

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

      /* ── Upcoming deadlines ── */
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

      /* ── Recent activity ── */
      const { data: activityData } = await supabase
        .from('event_activity').select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: false }).limit(5)

      if (!cancelled) {
        setStats({ vendors: vendorCount || 0, tasksDue: tasksDueCount || 0, openIssues: issueCount || 0 })
        setDeadlines(d)
        if (activityData) setActivity(activityData as unknown as EventActivity[])
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
    if (activeEvent) {
      setActiveEvent({ ...activeEvent, ...updated })
    }
  }

  /* ── Payment handler — ref-based success tracking ── */
  const handlePayNow = useCallback(async (provider: 'paystack' | 'flutterwave') => {
    if (!user || !id || !activeEvent) return

    const currentEvent = activeEvent
    // Reset the success sentinel BEFORE opening the popup
    paySucceededRef.current = false
    setPayStatus('processing')

    try {
      await processPayment({
        provider,
        email: user.email || '',
        amount: getEventPrice('standard'),
        metadata: { event_id: id },

        onSuccess: async () => {
          // ✅ Mark success synchronously FIRST — before any async work.
          // onClose/onCancel may fire at any point after this; the ref
          // ensures it cannot revert us to 'cancelled'.
          paySucceededRef.current = true

          const { error: updateErr } = await supabase
            .from('events')
            .update({ status: 'active', payment_status: 'paid' })
            .eq('id', id)

          if (updateErr) {
            showNotification({
              variant: 'error',
              title: 'Payment received but activation failed',
              message: updateErr.message,
            })
            setPayStatus('failed')
            return
          }

          setActiveEvent({ ...currentEvent, status: 'active', payment_status: 'paid' } as Event)

          showNotification({
            variant: 'success',
            title: '🎉 Payment successful!',
            message: `${currentEvent.name} is now active.`,
          })

          // Show success state, then auto-close after 3 s
          setPayStatus('success')
        },

        onClose: () => {
          // Only treat as cancellation when the payment did NOT succeed.
          // The ref is synchronously set inside onSuccess, so even if
          // Paystack fires onClose concurrently with the async DB update,
          // we will never reset a successful payment to 'cancelled'.
          if (!paySucceededRef.current) {
            setPayStatus('cancelled')
          }
        },
      })
    } catch {
      if (!paySucceededRef.current) {
        setPayStatus('failed')
      }
    }
  }, [user, id, activeEvent, setActiveEvent, showNotification])

  const openPayment = () => { setPayStatus('idle'); setShowPaymentModal(true) }
  const closePayment = () => {
    if (payStatus === 'processing') return
    setShowPaymentModal(false)
    setPayStatus('idle')
    setAutoCloseIn(null)
  }

  /* ── Derived values ── */
  const completedCount = phases.filter((p) => p.status === 'completed').length
  const progressPct = phases.length ? Math.round((completedCount / phases.length) * 100) : 0
  const countdown = activeEvent ? getCountdown(activeEvent.event_date) : null
  const isDraftUnpaid = activeEvent?.status === 'draft' && activeEvent?.payment_status !== 'paid'

  /* ── Loading / Error ── */
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

  const statusBadge =
    activeEvent.status === 'active' ? 'green'
    : activeEvent.status === 'draft' ? 'grey'
    : activeEvent.status === 'in_progress' ? 'yellow'
    : activeEvent.status === 'completed' ? 'green' : 'red'

  return (
    <div className={styles.page}>

      {/* ── Unpaid banner ── */}
      {isDraftUnpaid && (
        <div className={styles.unpaidBanner}>
          <div className={styles.unpaidBannerIcon}>
            <AlertTriangle size={18} />
          </div>
          <div className={styles.unpaidBannerText}>
            <div className={styles.unpaidBannerTitle}>This event is not yet active</div>
            <div className={styles.unpaidBannerSub}>Complete payment to unlock all planning features and start coordinating your event.</div>
          </div>
          <button type="button" className={styles.btnPayGreen} onClick={openPayment}>
            <CreditCard size={14} /> Pay ₦20,000
          </button>
        </div>
      )}

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroGlow2} aria-hidden="true" />

        <div className={styles.heroTop}>
          <button
            type="button"
            className={styles.heroBack}
            onClick={() => navigate('/events')}
            aria-label="Back to events"
          >
            <ArrowLeft size={18} />
          </button>

          <div className={styles.heroTitleBlock} style={{ flex: 1, minWidth: 0 }}>
            <h1 className={styles.heroTitle} style={{ fontSize: 'var(--text-title-lg)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {activeEvent.name}
              {activeEvent.event_type && (
                <>
                  <span className={styles.heroTitleSep}> | </span>
                  <span className={styles.heroTitleType}>{activeEvent.event_type}</span>
                </>
              )}
              <button
                type="button"
                className={styles.editTitleBtn}
                onClick={() => setShowEditModal(true)}
                aria-label="Edit event"
              >
                <Pencil size={14} />
              </button>
            </h1>
          </div>

          {/* Countdown — right side of row 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
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
        </div>

        {/* Row 2: badges + actions */}
        <div className={styles.heroBadges} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
          <span className={`badge badge-${statusBadge}`}>
            <span className="badge-dot" />
            {activeEvent.status.replace('_', ' ')}
          </span>
          {activeEvent.payment_status === 'unpaid' && (
            <span className="badge badge-unpaid" style={{ border: '1px solid var(--color-warning)', background: 'var(--color-warning-bg)', color: 'var(--color-warning)', fontWeight: 600 }}>
              ⚡ Unpaid
            </span>
          )}
          {activeEvent.payment_status === 'paid' && (
            <span className="badge badge-paid" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', fontWeight: 600 }}>
              ✓ Paid
            </span>
          )}
          {activeEvent.size_tier && (
            <span className="badge badge-medium">{activeEvent.size_tier}</span>
          )}
          <span className="badge badge-medium">Phase {activeEvent.current_phase} of 9</span>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => navigate(`/events/${id}/tasks`)}
            >
              <ListChecks size={14} /> Tasks
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setPortalOpen(true)}
            >
              <ExternalLink size={14} /> Client Portal
            </button>
          </div>
        </div>
      </div>

        {/* Meta row */}
        <div className={styles.metaRow}>
          <div className={`${styles.metaItem} ${!activeEvent.event_date ? styles.metaEmpty : ''}`}>
            <div className={styles.metaLabel}>
              <Calendar size={10} style={{ display: 'inline', marginRight: 4 }} />
              Event Date
            </div>
            <div className={styles.metaValue}>
              {activeEvent.event_date
                ? new Date(activeEvent.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                : <span style={{ color: 'var(--color-text-muted)' }}>Not set</span>}
            </div>
          </div>
          {activeEvent.end_date && (
            <div className={styles.metaItem}>
              <div className={styles.metaLabel}>
                <Clock size={10} style={{ display: 'inline', marginRight: 4 }} />
                End Date
              </div>
              <div className={styles.metaValue}>
                {new Date(activeEvent.end_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
              </div>
            </div>
          )}
          <div className={`${styles.metaItem} ${!activeEvent.venue_name ? styles.metaEmpty : ''}`}>
            <div className={styles.metaLabel}>
              <MapPin size={10} style={{ display: 'inline', marginRight: 4 }} />
              Venue
            </div>
            <div className={styles.metaValue}>{activeEvent.venue_name || <span style={{ color: 'var(--color-text-muted)' }}>Not set</span>}</div>
          </div>
          <div className={`${styles.metaItem} ${!activeEvent.guest_count ? styles.metaEmpty : ''}`}>
            <div className={styles.metaLabel}>
              <Users size={10} style={{ display: 'inline', marginRight: 4 }} />
              Guests
            </div>
            <div className={styles.metaValue}>
              {activeEvent.guest_count ? activeEvent.guest_count.toLocaleString() : <span style={{ color: 'var(--color-text-muted)' }}>Not set</span>}
            </div>
          </div>
          <div className={`${styles.metaItem} ${!activeEvent.budget_total ? styles.metaEmptyAccent : ''}`}>
            <div className={styles.metaLabel}>
              <Wallet size={10} style={{ display: 'inline', marginRight: 4 }} />
              Budget
            </div>
            <div className={styles.metaValue}>
              {activeEvent.budget_total
                ? `₦${(activeEvent.budget_total / 100).toLocaleString('en-NG')}`
                : <span style={{ color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 600 }} onClick={() => setShowEditModal(true)}>Set →</span>}
            </div>
          </div>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>
              <BarChart3 size={10} style={{ display: 'inline', marginRight: 4 }} />
              Progress
            </div>
            <div className={styles.metaValue}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div style={{ flex: 1, height: 4, background: 'var(--color-surface-3)', borderRadius: 'var(--radius-full)', maxWidth: 80 }}>
                  <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--color-accent)', borderRadius: 'var(--radius-full)' }} />
                </div>
                <span className={styles.metaValueAccent}>{progressPct}%</span>
              </div>
            </div>
          </div>
        </div>

      {/* ── Stats cards ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard + ' ' + styles.statCardAccent + ' ' + styles.statCardClickable} onClick={() => navigate('/events/' + id + '/vendors')} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate('/events/' + id + '/vendors')}>
          <div className={styles.statIcon}><Users size={20} /></div>
          <div>
            <div className={styles.statLabel}>Vendors</div>
            <div className={styles.statValue}>{stats.vendors}</div>
          </div>
          <ArrowRight size={14} className={styles.statCardArrow} />
        </div>

        <div className={styles.statCard + ' ' + (stats.tasksDue > 0 ? styles.statCardWarn : styles.statCardAccent) + ' ' + styles.statCardClickable} onClick={() => navigate('/events/' + id + '/tasks')} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate('/events/' + id + '/tasks')}>
          <div className={styles.statIcon + ' ' + (stats.tasksDue > 0 ? styles.statIconWarn : styles.statIconOk)}>
            <ListChecks size={20} />
          </div>
          <div>
            <div className={styles.statLabel}>Tasks Overdue</div>
            <div className={styles.statValue + ' ' + (stats.tasksDue > 0 ? styles.statValueWarn : '')}>
              {stats.tasksDue}
            </div>
          </div>
          <ArrowRight size={14} className={styles.statCardArrow} />
        </div>

        <div className={styles.statCard + ' ' + (stats.openIssues > 0 ? styles.statCardWarn : styles.statCardAccent) + ' ' + styles.statCardClickable} onClick={() => navigate('/events/' + id + '/live-board')} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate('/events/' + id + '/live-board')}>
          <div className={styles.statIcon + ' ' + (stats.openIssues > 0 ? styles.statIconWarn : styles.statIconOk)}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className={styles.statLabel}>Open Issues</div>
            <div className={styles.statValue + ' ' + (stats.openIssues > 0 ? styles.statValueWarn : '')}>
              {stats.openIssues}
            </div>
          </div>
          <ArrowRight size={14} className={styles.statCardArrow} />
        </div>

        <div className={styles.statCard + ' ' + styles.statCardSuccess + ' ' + styles.statCardClickable} onClick={() => setPageTab('phases')} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setPageTab('phases')}>
          <div className={styles.statIcon + ' ' + styles.statIconSuccess}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className={styles.statLabel}>Phases Done</div>
            <div className={styles.statValue}>{completedCount} / {phases.length}</div>
          </div>
          <ArrowRight size={14} className={styles.statCardArrow} />
        </div>

        <div className={styles.statCard + ' ' + styles.statCardAccent + ' ' + styles.statCardClickable} onClick={() => navigate('/events/' + id + '/live-board')} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate('/events/' + id + '/live-board')}>
          <div className={styles.statIcon}><Radio size={20} /></div>
          <div>
            <div className={styles.statLabel}>Live Board</div>
            <div className={styles.statValue} style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)' }}>Open →</div>
          </div>
          <ArrowRight size={14} className={styles.statCardArrow} />
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className={styles.pageTabs}>
        {([
          ['overview', 'Overview', <BarChart3 key="o" size={14} />],
          ['timeline', 'Timeline', <Clock key="t" size={14} />],
          ['phases', 'Phases', <CheckCircle2 key="p" size={14} />],
          ['modules', 'Modules', <Zap key="m" size={14} />],
        ] as const).map(([key, label, icon]) => (
          <button
            key={key}
            type="button"
            className={`${styles.pageTab} ${pageTab === key ? styles.pageTabActive : ''}`}
            onClick={() => setPageTab(key as typeof pageTab)}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {pageTab === 'overview' && (
        <>
          <NextStepCard
            eventId={id || ''}
            paymentStatus={activeEvent.payment_status}
            daysUntilEvent={countdown ? (countdown.past ? -1 : countdown.days) : -1}
            preEventChecklistIncomplete={stats.tasksDue > 0}
            overdueTaskCount={stats.tasksDue}
            currentPhaseStatus={phases.find(p => p.phase_number === activeEvent.current_phase)?.status || null}
            currentPhaseNumber={activeEvent.current_phase}
          />

          {/* Financial snapshot — planner only */}
          {role === 'planner' && (
            <div className="card" style={{ padding: 'var(--space-4) var(--space-5)', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Wallet size={14} style={{ color: 'var(--color-accent)' }} />
                Financial Snapshot
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>Total Budget</div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>
                    {activeEvent.budget_total ? `₦${(activeEvent.budget_total / 100).toLocaleString('en-NG')}` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>Total Paid</div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-success)' }}>—</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>Outstanding</div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-error)' }}>—</div>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming deadlines */}
          <div className="card" style={{ padding: 'var(--space-4) var(--space-5)', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Clock size={14} style={{ color: 'var(--color-info)' }} />
              Upcoming Deadlines
            </h3>
            {deadlines.length === 0 ? (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', padding: 'var(--space-4) 0', textAlign: 'center' }}>
                No upcoming deadlines
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {deadlines.map((dl) => {
                  const dlIcon = dl.type === 'task' ? ListChecks : dl.type === 'phase' ? CheckCircle2 : Wallet
                  const isOverdue = new Date(dl.date) < new Date()
                  return (
                    <div key={dl.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', background: isOverdue ? 'rgba(239,68,68,0.12)' : 'var(--color-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: isOverdue ? 'var(--color-error)' : 'var(--color-text-secondary)' }}>
                        {dlIcon === ListChecks ? <ListChecks size={14} /> : dlIcon === CheckCircle2 ? <CheckCircle2 size={14} /> : <Wallet size={14} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: isOverdue ? 'var(--color-error)' : undefined }}>{dl.title}</div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                          {new Date(dl.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                          {isOverdue ? ' (overdue)' : ''}
                        </div>
                      </div>
                      <span className="badge badge-grey" style={{ fontSize: 'var(--text-2xs)', textTransform: 'capitalize' }}>{dl.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
            <h3 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Zap size={14} style={{ color: 'var(--color-accent)' }} />
              Recent Activity
            </h3>
            {activity.length === 0 ? (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', padding: 'var(--space-4) 0', textAlign: 'center' }}>
                No activity yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {activity.map((a) => {
                  const actIcon = a.action_type.startsWith('vendor') ? Users
                    : a.action_type.startsWith('task') ? ListChecks
                    : a.action_type.startsWith('phase') ? CheckCircle2
                    : a.action_type.startsWith('payment') ? Wallet
                    : a.action_type.startsWith('issue') ? AlertTriangle
                    : Zap
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', background: 'var(--color-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-accent)' }}>
                        {actIcon === Users ? <Users size={14} /> : actIcon === ListChecks ? <ListChecks size={14} /> : actIcon === CheckCircle2 ? <CheckCircle2 size={14} /> : actIcon === Wallet ? <Wallet size={14} /> : actIcon === AlertTriangle ? <AlertTriangle size={14} /> : <Zap size={14} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500 }}>{a.description}</div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', marginTop: 2 }}>
                          {a.actor_name && <span>{a.actor_name} · </span>}
                          {timeAgo(a.created_at)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Timeline tab ── */}
      {pageTab === 'timeline' && (
        <PhaseTimelineTracker phases={phases} event={activeEvent} />
      )}

      {/* ── Phases tab ── */}
      {pageTab === 'phases' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Phase Manager</h2>
              <div className={styles.sectionSubtitle}>{completedCount} of {phases.length} phases completed · {progressPct}% overall progress</div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowPhaseManager(!showPhaseManager)}
            >
              {showPhaseManager ? 'Hide' : 'Toggle Status'}
              {showPhaseManager ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
          <div className={styles.sectionBody}>
            <PhasePipeline phases={phases} currentPhase={activeEvent.current_phase} eventId={activeEvent.id} />
          </div>
          <PhaseManagerPanel phases={phases} togglingPhase={togglingPhase} onToggle={togglePhaseStatus} styles={styles} />
        </div>
      )}

      {/* ── Modules tab ── */}
      {pageTab === 'modules' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Event Modules</h2>
              <div className={styles.sectionSubtitle}>All tools and features for this event</div>
            </div>
          </div>
          <div className={styles.moduleGrid}>
            {MODULES.map((mod) => {
              const Icon = mod.icon
              const badge =
                mod.key === 'vendors' && stats.vendors > 0 ? String(stats.vendors)
                : mod.key === 'tasks' && stats.tasksDue > 0 ? `${stats.tasksDue} due`
                : null
              const badgeWarn = mod.key === 'tasks' && stats.tasksDue > 0

              return (
                <Link
                  key={mod.key}
                  to={id ? mod.path(id) : '#'}
                  className={styles.moduleCard}
                >
                  <div className={styles.moduleCardIcon}>
                    <Icon size={20} />
                  </div>
                  <div className={styles.moduleCardBody}>
                    <div className={styles.moduleCardName}>{mod.label}</div>
                    <div className={styles.moduleCardDesc}>{mod.desc}</div>
                  </div>
                  <div className={styles.moduleCardFooter}>
                    {badge ? (
                      <span className={`${styles.moduleBadge} ${badgeWarn ? styles.moduleBadgeWarn : ''}`}>
                        {badge}
                      </span>
                    ) : <span />}
                    <ArrowRight size={14} className={styles.moduleArrow} />
                  </div>
                </Link>
              )
            })}

            {/* Client portal (button, not a link) */}
            <button
              type="button"
              className={styles.moduleCard}
              onClick={() => setPortalOpen(true)}
            >
              <div className={styles.moduleCardIcon} style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>
                <ExternalLink size={20} />
              </div>
              <div className={styles.moduleCardBody}>
                <div className={styles.moduleCardName}>Client Portal</div>
                <div className={styles.moduleCardDesc}>Generate a shareable link for your client</div>
              </div>
              <div className={styles.moduleCardFooter}>
                <span />
                <ArrowRight size={14} className={styles.moduleArrow} />
              </div>
            </button>
          </div>
        </div>
      )}

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
              <button
                className="modal-card-close"
                onClick={closePayment}
                disabled={payStatus === 'processing'}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.payModal}>
              {/* ── Success state ── */}
              {payStatus === 'success' && (
                <>
                  <div className={styles.paySuccessIcon}>
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-title)' }}>Payment Confirmed!</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
                    <strong>{activeEvent.name}</strong> is now active. You can start planning your event.
                  </p>
                  <div className={styles.payAutoClose}>
                    Closing automatically in {autoCloseIn}s...
                  </div>
                  <div className={styles.payButtons} style={{ marginTop: 'var(--space-4)' }}>
                    <button className="btn btn-primary btn-lg" onClick={closePayment}>
                      Start Planning →
                    </button>
                  </div>
                </>
              )}

              {/* ── Processing state ── */}
              {payStatus === 'processing' && (
                <div className={styles.payProcessing}>
                  <span className="spinner-loader" style={{ width: 36, height: 36 }} />
                  <div className={styles.payStatusMsg}>Opening payment provider...</div>
                  <div className={styles.payAutoClose}>Complete your payment in the Paystack/Flutterwave window</div>
                </div>
              )}

              {/* ── Idle / Cancelled / Failed state ── */}
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
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={() => handlePayNow('paystack')}
                    >
                      <CreditCard size={18} /> Pay with Paystack
                    </button>
                    <button
                      className="btn btn-secondary btn-lg"
                      onClick={() => handlePayNow('flutterwave')}
                    >
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
