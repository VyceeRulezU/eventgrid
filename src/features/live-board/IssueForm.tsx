import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useLiveBoardStore } from '@/store/liveBoard.store'
import { useUIStore } from '@/store/ui.store'
import type { LiveBoardItem, Issue, IssueSeverity } from '@/types'
import styles from './LiveBoardPage.module.css'

const severities: { value: IssueSeverity; label: string; badgeClass: string }[] = [
  { value: 'low', label: 'Low', badgeClass: 'badge-low' },
  { value: 'medium', label: 'Medium', badgeClass: 'badge-medium' },
  { value: 'high', label: 'High', badgeClass: 'badge-high' },
  { value: 'critical', label: 'Critical', badgeClass: 'badge-urgent' },
]

export function IssueForm({ item, onClose }: { item: LiveBoardItem; onClose: () => void }) {
  const user = useAuthStore((s) => s.user)
  const addIssue = useLiveBoardStore((s) => s.addIssue)
  const updateItem = useLiveBoardStore((s) => s.updateItem)
  const showModal = useUIStore((s) => s.showModal)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<IssueSeverity>('medium')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !user) return
    setSaving(true)

    const { data, error } = await supabase
      .from('issues')
      .insert({
        event_id: item.event_id,
        board_item_id: item.id,
        title: title.trim(),
        description: description.trim() || null,
        severity,
        raised_by: user.id,
        raised_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      showModal({ variant: 'error', title: 'Failed to raise issue', message: error.message })
      setSaving(false)
      return
    }

    if (data) {
      addIssue(data as unknown as Issue)
    }

    if (severity === 'high' || severity === 'critical') {
      await supabase
        .from('live_board_items')
        .update({ status: 'red', status_label: `Issue: ${title.trim()}`, updated_at: new Date().toISOString() })
        .eq('id', item.id)
      updateItem(item.id, 'red', `Issue: ${title.trim()}`)
    }

    setSaving(false)
    showModal({ variant: 'success', title: 'Issue raised', message: `"${title.trim()}" has been flagged for ${item.station_name}` })
    onClose()
  }

  return (
    <div className={styles.inlineCard}>
      <div className={styles.inlineTitle}>Flag Issue — {item.station_name}</div>

      <div className="input-wrapper" style={{ marginBottom: 'var(--space-3)' }}>
        <label className="input-label">Title</label>
        <input
          className="input"
          style={{ minHeight: 36, fontSize: 'var(--text-sm)' }}
          placeholder="What's wrong?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="input-wrapper" style={{ marginBottom: 'var(--space-3)' }}>
        <label className="input-label">Description</label>
        <textarea
          className="input"
          style={{ minHeight: 64, fontSize: 'var(--text-sm)', resize: 'vertical' }}
          placeholder="Optional details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 'var(--space-3)' }}>
        <label className="input-label" style={{ marginBottom: 'var(--space-1)', display: 'block' }}>Severity</label>
        <div className={styles.severityRow}>
          {severities.map((s) => (
            <button
              key={s.value}
              className={`btn btn-sm ${styles.severityBtn}`}
              style={{
                backgroundColor: severity === s.value ? 'var(--color-surface-3)' : 'transparent',
                borderColor: severity === s.value ? 'var(--color-border-focus)' : 'var(--color-border)',
              }}
              onClick={() => setSeverity(s.value)}
            >
              <span className={s.badgeClass} style={{ padding: '1px var(--space-1)' }}>
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.formActions}>
        <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={saving || !title.trim()}>
          {saving ? 'Saving...' : 'Raise Issue'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
