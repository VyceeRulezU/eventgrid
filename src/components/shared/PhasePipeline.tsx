import { useNavigate } from 'react-router-dom'
import type { EventPhase, PhaseStatus } from '@/types'
import styles from './PhasePipeline.module.css'

function segmentClass(status: PhaseStatus): string {
  switch (status) {
    case 'completed': return styles.segmentCompleted
    case 'in_progress': return styles.segmentInProgress
    case 'blocked': return styles.segmentBlocked
    default: return styles.segmentNotStarted
  }
}

function numberClass(status: PhaseStatus, isCurrent: boolean): string {
  if (status === 'blocked') return styles.phaseNumberBlocked
  if (status === 'completed') return styles.phaseNumberCompleted
  if (status === 'in_progress' || isCurrent) return styles.phaseNumberInProgress
  return styles.phaseNumberNotStarted
}

function chipClass(status: PhaseStatus, isCurrent: boolean): string {
  const base = styles.phaseChip
  if (status === 'blocked') return `${base} ${styles.phaseChipBlocked}`
  if (isCurrent) return `${base} ${styles.phaseChipCurrent}`
  if (status === 'completed') return `${base} ${styles.phaseChipCompleted}`
  if (status === 'in_progress') return `${base} ${styles.phaseChipInProgress}`
  return base
}

interface PhasePipelineProps {
  phases: EventPhase[]
  currentPhase: number
  eventId: string
  compact?: boolean
}

export function PhaseSegmentBar({ phases, showMeta = true }: { phases: EventPhase[]; showMeta?: boolean }) {
  if (phases.length === 0) return null

  const sorted = [...phases].sort((a, b) => a.phase_number - b.phase_number)
  const completed = sorted.filter((p) => p.status === 'completed').length
  const pct = Math.round((completed / sorted.length) * 100)

  return (
    <div>
      <div className={styles.segmentBar} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        {sorted.map((phase) => (
          <div
            key={phase.id}
            className={`${styles.segment} ${segmentClass(phase.status as PhaseStatus)}`}
            title={`${phase.phase_name}: ${phase.status.replace('_', ' ')}`}
          />
        ))}
      </div>
      {showMeta && (
        <div className={styles.progressMeta}>
          <span className={styles.progressPct}>{pct}%</span>
          <span className={styles.progressCount}>{completed} of {sorted.length} phases</span>
        </div>
      )}
    </div>
  )
}

export function PhaseProgressBar({ phases }: { phases: EventPhase[] }) {
  return <PhaseSegmentBar phases={phases} />
}

export function PhaseStepper({ phases, currentPhase }: { phases: EventPhase[]; currentPhase: number }) {
  const sorted = [...phases].sort((a, b) => a.phase_number - b.phase_number)

  return (
    <div className={styles.stepper}>
      {sorted.map((phase) => {
        const isCurrent = phase.phase_number === currentPhase
        const status = phase.status as PhaseStatus
        let dotClass = styles.stepperDot
        if (status === 'blocked') dotClass += ` ${styles.stepperDotBlocked}`
        else if (status === 'completed') dotClass += ` ${styles.stepperDotCompleted}`
        else if (isCurrent || status === 'in_progress') dotClass += ` ${styles.stepperDotActive}`

        return (
          <div key={phase.id} className={styles.stepperItem} title={phase.phase_name}>
            <div className={dotClass}>{phase.phase_number}</div>
            <span className={`${styles.stepperLabel} ${isCurrent ? styles.stepperLabelActive : ''}`}>
              {phase.phase_name.split(' ').slice(0, 2).join(' ')}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function PhasePipeline({ phases, currentPhase, eventId, compact }: PhasePipelineProps) {
  const navigate = useNavigate()

  if (phases.length === 0) {
    return (
      <div className={`card ${styles.emptyPipeline}`}>
        <div className="skeleton skeleton-text" style={{ width: '60%', margin: '0 auto' }} />
      </div>
    )
  }

  const sorted = [...phases].sort((a, b) => a.phase_number - b.phase_number)

  if (compact) {
    return (
      <div className={styles.pipelineCompact}>
        {sorted.map((phase) => {
          const isCurrent = phase.phase_number === currentPhase
          const status = phase.status as PhaseStatus
          return (
            <div
              key={phase.id}
              className={chipClass(status, isCurrent)}
            >
              <span className={numberClass(status, isCurrent)}>{phase.phase_number}</span>
              <span className={`${styles.phaseName} ${isCurrent ? styles.phaseNameCurrent : ''}`}>
                {phase.phase_name}
              </span>
              <span className={styles.phaseDate}>
                {phase.status === 'completed' && phase.completed_at
                  ? new Date(phase.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                  : phase.due_date
                    ? new Date(phase.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                    : ''}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={styles.pipelineList}>
      {sorted.map((phase) => {
        const isCurrent = phase.phase_number === currentPhase
        const status = phase.status as PhaseStatus
        let rowClass = styles.phaseRow
        if (isCurrent) rowClass += ` ${styles.phaseRowCurrent}`
        if (status === 'completed') rowClass += ` ${styles.phaseRowCompleted}`
        if (status === 'blocked') rowClass += ` ${styles.phaseRowBlocked}`

        return (
          <button
            key={phase.id}
            type="button"
            className={rowClass}
            onClick={() => navigate(`/events/${eventId}/phase/${phase.phase_number}`)}
          >
            <span className={numberClass(status, isCurrent)}>{phase.phase_number}</span>
            <div className={styles.phaseRowBody}>
              <div className={`${styles.phaseRowTitle} ${isCurrent ? styles.phaseRowTitleCurrent : ''}`}>
                {phase.phase_name}
              </div>
              {phase.due_date && (
                <div className={styles.phaseRowDue}>
                  Due: {new Date(phase.due_date).toLocaleDateString('en-GB')}
                </div>
              )}
            </div>
            <span className={`badge badge-${
              status === 'in_progress' ? 'yellow'
              : status === 'completed' ? 'green'
              : status === 'blocked' ? 'red' : 'grey'
            }`}>
              {status.replace('_', ' ')}
            </span>
          </button>
        )
      })}
    </div>
  )
}
