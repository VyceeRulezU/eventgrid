import { useMemo, useState } from 'react'
import { Search, Check, Play, Pause, Circle, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Event, EventPhase, PhaseStatus } from '@/types'
import styles from './PhaseTimelineTracker.module.css'

type FilterTab = 'all' | 'active' | 'done' | 'blocked'
type ViewMode = 'week' | 'phase'

interface PhaseTimelineTrackerProps {
  phases: EventPhase[]
  event?: Event | null
  readOnly?: boolean
}

function progressPct(status: PhaseStatus): number {
  switch (status) {
    case 'completed': return 100
    case 'in_progress': return 55
    case 'blocked': return 30
    default: return 0
  }
}

function statusLabel(status: PhaseStatus): string {
  switch (status) {
    case 'completed': return 'Done'
    case 'in_progress': return 'Active'
    case 'blocked': return 'Paused'
    default: return 'Ready'
  }
}

function statusIcon(status: PhaseStatus) {
  switch (status) {
    case 'completed': return <Check size={10} />
    case 'in_progress': return <Play size={10} />
    case 'blocked': return <Pause size={10} />
    default: return <Circle size={10} />
  }
}

function barClass(status: PhaseStatus): string {
  switch (status) {
    case 'completed': return styles.barCompleted
    case 'in_progress': return styles.barActive
    case 'blocked': return styles.barBlocked
    default: return styles.barPending
  }
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDay(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'short' })
}

function formatDateNum(date: Date): string {
  return String(date.getDate())
}

export function PhaseTimelineTracker({ phases, event, readOnly: _readOnly }: PhaseTimelineTrackerProps) {
  const [filter, setFilter] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [weekOffset, setWeekOffset] = useState(0)

  const sorted = useMemo(
    () => [...phases].sort((a, b) => a.phase_number - b.phase_number),
    [phases]
  )

  const { columns, todayPct } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (viewMode === 'phase' || sorted.length === 0) {
      const cols = sorted.map((p) => ({
        key: `p-${p.phase_number}`,
        label: `P${p.phase_number}`,
        sub: p.phase_name.split(' ').slice(0, 1).join(''),
        isToday: false,
      }))
      return { columns: cols, todayPct: null as number | null }
    }

    const eventDate = event?.event_date ? new Date(event.event_date) : addDays(today, 30)
    const start = addDays(today, weekOffset * 7 - 3)
    const cols = Array.from({ length: 10 }, (_, i) => {
      const d = addDays(start, i)
      const isToday = d.toDateString() === today.toDateString()
      return {
        key: d.toISOString(),
        label: formatDay(d),
        sub: formatDateNum(d),
        isToday,
        date: d,
      }
    })

    const rangeStart = cols[0].date!.getTime()
    const rangeEnd = cols[cols.length - 1].date!.getTime()
    const total = rangeEnd - rangeStart || 1
    const todayMs = today.getTime()
    const pct = todayMs >= rangeStart && todayMs <= rangeEnd
      ? ((todayMs - rangeStart) / total) * 100
      : null

    return { columns: cols, todayPct: pct, eventDate }
  }, [sorted, viewMode, weekOffset, event?.event_date])

  const filtered = useMemo(() => {
    let list = sorted
    if (filter === 'active') list = list.filter((p) => p.status === 'in_progress')
    else if (filter === 'done') list = list.filter((p) => p.status === 'completed')
    else if (filter === 'blocked') list = list.filter((p) => p.status === 'blocked')

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p) => p.phase_name.toLowerCase().includes(q))
    }
    return list
  }, [sorted, filter, search])

  const getBarPosition = (phase: EventPhase) => {
    const total = sorted.length || 9

    if (viewMode === 'phase') {
      const slot = 100 / total
      const left = (phase.phase_number - 1) * slot + slot * 0.05
      const width = slot * 0.9
      return { left: `${left}%`, width: `${width}%` }
    }

    const cols = columns as { date?: Date }[]
    if (!cols[0]?.date) return { left: '5%', width: '30%' }

    const rangeStart = cols[0].date!.getTime()
    const rangeEnd = cols[cols.length - 1].date!.getTime()
    const totalMs = rangeEnd - rangeStart || 1

    let anchor = phase.due_date ? new Date(phase.due_date).getTime() : rangeStart + (phase.phase_number / total) * totalMs

    if (event?.event_date && !phase.due_date) {
      const evEnd = new Date(event.event_date).getTime()
      const evStart = event.created_at ? new Date(event.created_at).getTime() : rangeStart
      anchor = evStart + ((phase.phase_number - 1) / (total - 1 || 1)) * (evEnd - evStart)
    }

    const leftPct = Math.max(0, Math.min(92, ((anchor - rangeStart) / totalMs) * 100))
    const widthPct = Math.max(14, Math.min(36, 100 / total * 1.2))
    return { left: `${leftPct}%`, width: `${widthPct}%` }
  }

  const monthLabel = useMemo(() => {
    const d = viewMode === 'week' && columns[0] && 'date' in columns[0] && columns[0].date
      ? columns[0].date
      : new Date()
    return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  }, [columns, viewMode])

  return (
    <div className={styles.tracker}>
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {(['all', 'active', 'done', 'blocked'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`${styles.tab} ${filter === tab ? styles.tabActive : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab === 'all' ? 'All' : tab === 'active' ? 'Active' : tab === 'done' ? 'Done' : 'Blocked'}
            </button>
          ))}
        </div>
        <div className={styles.toolbarRight}>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search phases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className={styles.viewSelect}
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            aria-label="Timeline view"
          >
            <option value="week">Week</option>
            <option value="phase">By Phase</option>
          </select>
          {viewMode === 'week' && (
            <>
              <button type="button" className={styles.navBtn} onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week">
                <ChevronLeft size={14} />
              </button>
              <button type="button" className={styles.navBtn} onClick={() => setWeekOffset(0)}>Today</button>
              <button type="button" className={styles.navBtn} onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week">
                <ChevronRight size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className={styles.timelineHeader}>
        <div className={styles.timelineLabel}>{monthLabel}</div>
        <div className={styles.timelineDates}>
          {todayPct !== null && (
            <div className={styles.todayLine} style={{ left: `${todayPct}%` }} aria-hidden="true" />
          )}
          {columns.map((col) => (
            <div key={col.key} className={`${styles.dateCell} ${col.isToday ? styles.dateCellToday : ''}`}>
              <div className={styles.dateCellDay}>{col.label}</div>
              <div>{col.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.body}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>No phases match this filter.</div>
        ) : (
          filtered.map((phase) => {
            const status = phase.status as PhaseStatus
            const pct = progressPct(status)
            const pos = getBarPosition(phase)
            return (
              <div key={phase.id} className={styles.row}>
                <div className={styles.rowLabel}>
                  <span className={styles.rowIcon}>{phase.phase_number}</span>
                  <span className={styles.rowName} title={phase.phase_name}>{phase.phase_name}</span>
                </div>
                <div className={styles.rowTrack}>
                  <div className={styles.gridBg} aria-hidden="true">
                    {columns.map((col) => (
                      <div key={col.key} className={styles.gridCell} />
                    ))}
                  </div>
                  <div
                    className={`${styles.bar} ${barClass(status)}`}
                    style={{ left: pos.left, width: pos.width }}
                    title={`${phase.phase_name} — ${statusLabel(status)}`}
                  >
                    <span className={styles.barLabel}>#{phase.phase_number} {phase.phase_name.split(' ')[0]}</span>
                    <span className={styles.barProgress}>{pct === 100 ? '1/1' : pct > 0 ? `${pct}%` : '0/1'} ({pct}%)</span>
                    <span className={styles.statusPill}>
                      {statusIcon(status)}
                      {statusLabel(status)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}><span className={`${styles.legendSwatch} ${styles.swatchCompleted}`} /> Done</span>
        <span className={styles.legendItem}><span className={`${styles.legendSwatch} ${styles.swatchActive}`} /> Active</span>
        <span className={styles.legendItem}><span className={`${styles.legendSwatch} ${styles.swatchPending}`} /> Ready</span>
        <span className={styles.legendItem}><span className={`${styles.legendSwatch} ${styles.swatchBlocked}`} /> Paused</span>
      </div>
    </div>
  )
}
