import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Calendar, MapPin, Users, Image, LayoutGrid,
  CheckCircle2, Circle, Clock, AlertTriangle, Lock,
  Zap,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PhaseTimelineTracker } from '@/components/shared/PhaseTimelineTracker'
import { PhaseSegmentBar } from '@/components/shared/PhasePipeline'
import type { Event, EventPhase, Media, ClientPortal } from '@/types'
import styles from './ClientPortalPage.module.css'

interface PortalData {
  portal: ClientPortal
  event: Event
  phases: EventPhase[]
  media: Media[]
}

type ClientTab = 'timeline' | 'all' | 'active' | 'done' | 'gallery'

/* ── SVG Progress ring ─────────────────────────── */
function ProgressRing({ pct }: { pct: number }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <div className={styles.progressRingWrap}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle className={styles.progressRingBg} cx="50" cy="50" r={r} />
        <circle
          className={styles.progressRingFg}
          cx="50" cy="50" r={r}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles.progressRingLabel}>
        <span className={styles.progressRingPct}>{pct}%</span>
        <span className={styles.progressRingDesc}>done</span>
      </div>
    </div>
  )
}

/* ── Header ────────────────────────────────────── */
function PortalHeader({ eventName }: { eventName?: string }) {
  return (
    <header className={styles.portalHeader}>
      <div className={styles.headerLeft}>
        <img src="/EventGrid-logo-white.svg" alt="EventGrid" className={styles.headerLogo} />
        <div className={styles.headerDivider} />
        <span className={styles.headerPortalBadge}>Client Portal</span>
        <span className={styles.headerReadOnly}><Lock size={10} /> Read Only</span>
      </div>
      {eventName && (
        <div className={styles.headerRight}>
          <span className={styles.headerEventName}>{eventName}</span>
        </div>
      )}
    </header>
  )
}

/* ── Main component ────────────────────────────── */
export function ClientPortalPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ClientTab>('timeline')

  useEffect(() => {
    if (!token) { setError('Invalid access link'); setLoading(false); return }

    supabase
      .from('client_portals')
      .select('*')
      .eq('access_token', token)
      .eq('is_active', true)
      .single()
      .then(({ data: portal, error: portalErr }) => {
        if (portalErr || !portal) { setError('Invalid or expired portal link'); setLoading(false); return }

        const isExpired = portal.expires_at && new Date(portal.expires_at) < new Date()
        if (isExpired) { setError('This portal link has expired'); setLoading(false); return }

        supabase
          .from('events')
          .select('*')
          .eq('id', portal.event_id)
          .single()
          .then(({ data: event }) => {
            if (!event) { setError('Event not found'); setLoading(false); return }

            Promise.all([
              supabase.from('event_phases').select('*').eq('event_id', event.id).order('phase_number'),
              supabase.from('media').select('*').eq('event_id', event.id).eq('tag', 'client_share').order('created_at'),
            ]).then(([phasesRes, mediaRes]) => {
              supabase.from('client_portals').update({ last_accessed: new Date().toISOString() }).eq('id', portal.id).then()
              setData({
                portal,
                event: event as unknown as Event,
                phases: (phasesRes.data || []) as unknown as EventPhase[],
                media: (mediaRes.data || []) as unknown as Media[],
              })
              setLoading(false)
            })
          })
      })
  }, [token])

  const listPhases = useMemo(() => {
    if (!data) return []
    const { phases } = data
    if (activeTab === 'active') return phases.filter((p) => p.status === 'in_progress')
    if (activeTab === 'done') return phases.filter((p) => p.status === 'completed')
    return phases
  }, [data, activeTab])

  /* ── Loading ── */
  if (loading) return (
    <div className={styles.portalPage}>
      <PortalHeader />
      <div className={styles.skeletonWrap}>
        <div className={`${styles.skeleton} ${styles.skeletonHero}`} />
        {[1,2,3].map(i => <div key={i} className={`${styles.skeleton} ${styles.skeletonCard}`} />)}
      </div>
    </div>
  )

  /* ── Error ── */
  if (error) return (
    <div className={styles.portalPage}>
      <PortalHeader />
      <div className={styles.errorWrap}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}><AlertTriangle size={28} /></div>
          <div className={styles.errorTitle}>{error}</div>
          <div className={styles.errorSub}>
            Please contact your event planner for a new access link.
          </div>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
            Go Home
          </button>
        </div>
      </div>
    </div>
  )

  if (!data) return null

  const { event, phases, media } = data
  const completed = phases.filter((p) => p.status === 'completed').length
  const activeCount = phases.filter((p) => p.status === 'in_progress').length
  const progressPct = phases.length ? Math.round((completed / phases.length) * 100) : 0
  const eventDate = event.event_date ? new Date(event.event_date) : null

  return (
    <div className={styles.portalPage}>
      <PortalHeader eventName={event.name} />

      {/* ── Hero band ── */}
      <section className={styles.portalHero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            {event.event_type && (
              <div className={styles.heroEventType}>
                <Zap size={11} />
                {event.event_type}
              </div>
            )}
            <h1 className={styles.heroEventName}>{event.name}</h1>
            <div className={styles.heroMeta}>
              {eventDate && (
                <span className={styles.heroMetaChip}>
                  <Calendar size={14} />
                  {eventDate.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              )}
              {event.venue_name && (
                <span className={styles.heroMetaChip}>
                  <MapPin size={14} />
                  {event.venue_name}{event.venue_address ? `, ${event.venue_address}` : ''}
                </span>
              )}
              {event.guest_count && (
                <span className={styles.heroMetaChip}>
                  <Users size={14} />
                  {event.guest_count.toLocaleString()} guests
                </span>
              )}
            </div>
          </div>

          <div className={styles.heroRight}>
            <ProgressRing pct={progressPct} />
            <div className={styles.heroProgressText}>
              {completed} of {phases.length} phases complete
            </div>
          </div>
        </div>

        <div className={styles.heroProgressBar}>
          <PhaseSegmentBar phases={phases} />
        </div>
      </section>

      {/* ── Content area ── */}
      <div className={styles.mainContent}>

        {/* Stats strip */}
        <div className={styles.statsStrip}>
          <div className={styles.statChip}>
            <div className={styles.statChipValue}>{phases.length}</div>
            <div className={styles.statChipLabel}>Total Phases</div>
          </div>
          <div className={styles.statChip}>
            <div className={styles.statChipValue}>{completed}</div>
            <div className={styles.statChipLabel}>Completed</div>
          </div>
          <div className={styles.statChip}>
            <div className={styles.statChipValue}>{activeCount}</div>
            <div className={styles.statChipLabel}>In Progress</div>
          </div>
          <div className={styles.statChip}>
            <div className={styles.statChipValue}>{media.length}</div>
            <div className={styles.statChipLabel}>Shared Media</div>
          </div>
          {eventDate && (
            <div className={styles.statChip}>
              <div className={styles.statChipValue}>
                {Math.max(0, Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}
              </div>
              <div className={styles.statChipLabel}>Days Away</div>
            </div>
          )}
        </div>

        {/* Pill tab bar */}
        <div className={styles.tabBar}>
          {([
            ['timeline', 'Timeline', <Clock key="t" size={13} />],
            ['all', 'All Phases', phases.length],
            ['active', 'Active', activeCount > 0 ? activeCount : null],
            ['done', 'Done', completed > 0 ? completed : null],
            ['gallery', 'Gallery', media.length > 0 ? media.length : null],
          ] as const).map(([key, label, badge]) => (
            <button
              key={key}
              type="button"
              className={`${styles.tabBtn} ${activeTab === key ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(key as ClientTab)}
            >
              {typeof badge === 'object' ? badge : null}
              {label}
              {typeof badge === 'number' && badge !== null ? (
                <span className={styles.tabCount}>{badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Timeline */}
        {activeTab === 'timeline' && (
          <PhaseTimelineTracker phases={phases} event={event} readOnly />
        )}

        {/* Phase list */}
        {(activeTab === 'all' || activeTab === 'active' || activeTab === 'done') && (
          <div className={styles.phaseList}>
            {listPhases.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}><Circle size={24} /></div>
                <div className={styles.emptyStateTitle}>No phases here yet</div>
                <div className={styles.emptyStateSub}>
                  {activeTab === 'active' ? 'No phases are currently in progress.' : 'No completed phases yet.'}
                </div>
              </div>
            ) : (
              listPhases.map((phase) => {
                const isComplete = phase.status === 'completed'
                const isCurrent = phase.status === 'in_progress'
                const isBlocked = phase.status === 'blocked'
                return (
                  <div
                    key={phase.id}
                    className={`${styles.phaseCard} ${isComplete ? styles.phaseCardComplete : ''} ${isCurrent ? styles.phaseCardActive : ''} ${isBlocked ? styles.phaseCardBlocked : ''}`}
                  >
                    <div className={`${styles.phaseNum} ${isComplete ? styles.phaseNumDone : ''}`}>
                      {phase.phase_number}
                    </div>
                    <div className={styles.phaseInfo}>
                      <div className={styles.phaseName}>{phase.phase_name}</div>
                      <div className={`${styles.phaseStatus} ${isComplete ? styles.phaseStatusDone : ''} ${isCurrent ? styles.phaseStatusActive : ''} ${isBlocked ? styles.phaseStatusBlocked : ''}`}>
                        {isComplete ? '✓ Completed' : isCurrent ? '⟳ In Progress' : isBlocked ? '⚠ On Hold' : '○ Not Started'}
                        {phase.completed_at && isComplete && (
                          <> · {new Date(phase.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</>
                        )}
                      </div>
                    </div>
                    {phase.due_date && (
                      <span className={styles.phaseDueDate}>
                        <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />
                        Due {new Date(phase.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    <div className={`${styles.phaseCheckIcon} ${isComplete ? styles.phaseCheckIconDone : ''}`}>
                      {isComplete ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Gallery */}
        {activeTab === 'gallery' && (
          media.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}><Image size={24} /></div>
              <div className={styles.emptyStateTitle}>No shared media yet</div>
              <div className={styles.emptyStateSub}>Your planner will share photos and documents here after the event.</div>
            </div>
          ) : (
            <div className={styles.galleryGrid}>
              {media.map((m) => (
                <div key={m.id} className={styles.mediaCard}>
                  <img src={m.url} alt={m.caption || ''} className={styles.mediaImg} loading="lazy" />
                  {m.caption && <div className={styles.mediaCaption}>{m.caption}</div>}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* ── Footer ── */}
      <footer className={styles.portalFooter}>
        <LayoutGrid size={12} />
        Powered by EventGrid · Your planner manages all operational details
      </footer>
    </div>
  )
}
