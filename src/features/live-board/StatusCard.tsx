import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { StatusUpdateSheet } from './StatusUpdateSheet'
import { IssueForm } from './IssueForm'
import type { LiveBoardItem } from '@/types'
import styles from './LiveBoardPage.module.css'

const statusConfig: Record<string, { dot: string; bg: string; label: string }> = {
  green: { dot: 'var(--color-status-green)', bg: 'var(--color-status-green-bg)', label: 'Good' },
  yellow: { dot: 'var(--color-status-yellow)', bg: 'var(--color-status-yellow-bg)', label: 'Caution' },
  red: { dot: 'var(--color-status-red)', bg: 'var(--color-status-red-bg)', label: 'Critical' },
  grey: { dot: 'var(--color-status-grey)', bg: 'var(--color-status-grey-bg)', label: 'Inactive' },
}

export function StatusCard({ item }: { item: LiveBoardItem }) {
  const [showUpdate, setShowUpdate] = useState(false)
  const [showIssue, setShowIssue] = useState(false)

  const cfg = statusConfig[item.status] || statusConfig.grey

  return (
    <div
      className={styles.statusCard}
      onClick={() => setShowUpdate(!showUpdate)}
    >
      <div className={styles.statusCardTop}>
        <div className={styles.statusCardInfo}>
          <div className={styles.stationName}>{item.station_name}</div>
          {item.category && (
            <span className={`badge badge-medium ${styles.categoryBadge}`}>
              {item.category}
            </span>
          )}
        </div>
        <div className={styles.statusDot} style={{ backgroundColor: cfg.dot }} />
      </div>

      {item.status_label && (
        <div className={styles.statusLabel}>{item.status_label}</div>
      )}

      <div
        className={styles.statusPill}
        style={{ backgroundColor: cfg.bg, color: cfg.dot }}
      >
        <span className={styles.pillDot} style={{ backgroundColor: cfg.dot }} />
        {cfg.label}
      </div>

      <button
        className={`btn btn-ghost btn-sm ${styles.flagBtn}`}
        onClick={(e) => { e.stopPropagation(); setShowIssue(!showIssue) }}
      >
        <AlertTriangle size={14} />
        Flag Issue
      </button>

      {showUpdate && (
        <div onClick={(e) => e.stopPropagation()}>
          <StatusUpdateSheet item={item} onClose={() => setShowUpdate(false)} />
        </div>
      )}

      {showIssue && (
        <div onClick={(e) => e.stopPropagation()}>
          <IssueForm item={item} onClose={() => setShowIssue(false)} />
        </div>
      )}
    </div>
  )
}
