import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLiveBoardStore } from '@/store/liveBoard.store'
import { useUIStore } from '@/store/ui.store'
import type { LiveBoardItem, LiveBoardStatus } from '@/types'
import styles from './LiveBoardPage.module.css'

const statuses: { value: LiveBoardStatus; label: string; color: string; bg: string }[] = [
  { value: 'green', label: 'Green', color: 'var(--color-status-green)', bg: 'var(--color-status-green-bg)' },
  { value: 'yellow', label: 'Yellow', color: 'var(--color-status-yellow)', bg: 'var(--color-status-yellow-bg)' },
  { value: 'red', label: 'Red', color: 'var(--color-status-red)', bg: 'var(--color-status-red-bg)' },
  { value: 'grey', label: 'Grey', color: 'var(--color-status-grey)', bg: 'var(--color-status-grey-bg)' },
]

const SUGGESTIONS = ['On track', 'Slightly behind', 'Needs attention', 'All clear', 'Checking now', 'Ready']

export function StatusUpdateSheet({ item, onClose }: { item: LiveBoardItem; onClose: () => void }) {
  const updateItem = useLiveBoardStore((s) => s.updateItem)
  const showNotification = useUIStore((s) => s.showNotification)

  const [status, setStatus] = useState<LiveBoardStatus>(item.status)
  const [label, setLabel] = useState(item.status_label || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('live_board_items')
      .update({ status, status_label: label || null, updated_at: new Date().toISOString() })
      .eq('id', item.id)

    if (error) {
      showNotification({ variant: 'error', title: 'Update failed', message: error.message })
      setSaving(false)
      return
    }

    updateItem(item.id, status, label || undefined)
    setSaving(false)
    onClose()
    showNotification({ variant: 'success', title: `${item.station_name} updated` })
  }

  return (
    <div className={styles.inlineCard}>
      <div className={styles.inlineTitle}>Update Status</div>

      <div className={styles.statusBtnRow}>
        {statuses.map((s) => (
          <button
            key={s.value}
            className={`btn btn-sm ${styles.statusBtn}`}
            style={{
              backgroundColor: status === s.value ? s.color : 'transparent',
              color: status === s.value ? '#fff' : s.color,
              borderColor: s.color,
            }}
            onClick={() => setStatus(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="input-wrapper" style={{ marginBottom: 'var(--space-3)' }}>
        <label className="input-label">Status Label</label>
        <input
          className="input"
          style={{ minHeight: 36, fontSize: 'var(--text-sm)' }}
          placeholder="e.g. On track, Needs attention..."
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>

      <div className={styles.suggestionRow}>
        {SUGGESTIONS.filter((s) => s !== label).map((s) => (
          <button
            key={s}
            className={`btn btn-ghost btn-sm ${styles.suggestionChip}`}
            onClick={() => setLabel(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className={styles.formActions}>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
