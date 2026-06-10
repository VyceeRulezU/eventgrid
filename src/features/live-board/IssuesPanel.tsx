import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useLiveFeedStore } from '@/store/liveFeed.store'
import { useUIStore } from '@/store/ui.store'
import { Checkbox } from '@/components/ui/Checkbox'
import { Tabs } from '@/components/ui/Tabs'
import { CheckCircle, Clock, Trash2, CircleX, User, Plus } from 'lucide-react'
import { IssueForm } from './IssueForm'
import type { Issue, IssueSeverity } from '@/types'
import styles from './LiveBoardPage.module.css'

type FilterTab = 'open' | 'received'

const severityConfig: Record<IssueSeverity, { badgeClass: string }> = {
  low: { badgeClass: 'badge-low' },
  medium: { badgeClass: 'badge-medium' },
  high: { badgeClass: 'badge-high' },
  critical: { badgeClass: 'badge-urgent' },
}

interface IssuesPanelProps {
  eventId: string
}

export function IssuesPanel({ eventId }: IssuesPanelProps) {
  const user = useAuthStore((s) => s.user)
  const issues = useLiveFeedStore((s) => s.issues)
  const setIssues = useLiveFeedStore((s) => s.setIssues)
  const resolveIssue = useLiveFeedStore((s) => s.resolveIssue)
  const showNotification = useUIStore((s) => s.showNotification)
  const showModal = useUIStore((s) => s.showModal)
  const [showIssueForm, setShowIssueForm] = useState(false)

  const [filter, setFilter] = useState<FilterTab>('open')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolutionText, setResolutionText] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const filtered = issues.filter((i) => {
    if (filter === 'open') return !i.resolved_at
    if (filter === 'received') return i.resolved_at
    return true
  })

  const someSelected = selected.size > 0

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const handleResolve = async (issue: Issue) => {
    if (!resolutionText.trim() || !user) return
    setSaving(true)

    const { error } = await supabase
      .from('issues')
      .update({
        resolved_at: new Date().toISOString(),
        resolution: resolutionText.trim(),
        resolved_by: user.id,
      })
      .eq('id', issue.id)

    if (error) {
      showNotification({ variant: 'error', title: 'Failed to resolve issue', message: error.message })
      setSaving(false)
      return
    }

    resolveIssue(issue.id, resolutionText.trim(), user.id)
    setResolvingId(null)
    setResolutionText('')
    setSaving(false)
    showNotification({ variant: 'success', title: 'Issue resolved' })
  }

  const handleBulkResolve = async () => {
    if (!user) return
    setSaving(true)

    const ids = [...selected]
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('issues')
      .update({ resolved_at: now, resolved_by: user.id })
      .in('id', ids)

    if (error) {
      showNotification({ variant: 'error', title: 'Failed to resolve issues', message: error.message })
      setSaving(false)
      return
    }

    const updated = issues.map((issue) =>
      ids.includes(issue.id) && !issue.resolved_at
        ? { ...issue, resolved_at: now, resolution: '(bulk resolved)', resolved_by: user.id }
        : issue
    )
    setIssues(updated as unknown as Issue[])
    setSelected(new Set())
    setSaving(false)
    showNotification({ variant: 'success', title: `${ids.length} issue(s) resolved` })
  }

  const handleDeleteIssue = async (id: string) => {
    const { error } = await supabase.from('issues').delete().eq('id', id)
    if (error) {
      showNotification({ variant: 'error', title: 'Failed to delete issue', message: error.message })
      return
    }
    setIssues(issues.filter((i) => i.id !== id) as unknown as Issue[])
    selected.delete(id)
    showNotification({ variant: 'success', title: 'Issue deleted' })
  }

  const handleBulkDelete = async () => {
    showModal({
      variant: 'confirm',
      title: 'Delete issues?',
      message: `Delete ${selected.size} issue(s)?`,
      actions: [
        { label: 'Cancel', variant: 'secondary' as const, onClick: () => {} },
        {
          label: 'Delete',
          variant: 'danger' as const,
          onClick: async () => {
            setDeleting(true)

            const ids = [...selected]
            const { error } = await supabase.from('issues').delete().in('id', ids)

            if (error) {
              showNotification({ variant: 'error', title: 'Failed to delete issues', message: error.message })
              setDeleting(false)
              return
            }

            setIssues(issues.filter((i) => !ids.includes(i.id)) as unknown as Issue[])
            setSelected(new Set())
            setDeleting(false)
            showNotification({ variant: 'success', title: `${ids.length} issue(s) deleted` })
          },
        },
      ],
    })
  }

  const tabItems = [
    { key: 'open' as FilterTab, label: 'Open', badge: issues.filter((i) => !i.resolved_at).length },
    { key: 'received' as FilterTab, label: 'Received', badge: issues.filter((i) => i.resolved_at).length },
  ]

  return (
    <div className={styles.issuesCard}>
      <div className={styles.issuesCardHeader}>
        <Tabs tabs={tabItems} activeTab={filter} onChange={(key) => { setFilter(key); setResolvingId(null); setSelected(new Set()) }} />
        <button className="btn btn-ghost btn-sm" style={{ borderRadius: 'var(--radius-sm)', flexShrink: 0 }} onClick={() => setShowIssueForm(true)}>
          <Plus size={14} />
          Raise Issue
        </button>
      </div>

      {showIssueForm && (
        <div className={styles.modalOverlay} onClick={() => setShowIssueForm(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <IssueForm eventId={eventId} onClose={() => setShowIssueForm(false)} />
          </div>
        </div>
      )}

      {someSelected && (
        <div className={styles.issuesBulkBar}>
          <span className={styles.issuesBulkInfo}>{selected.size} selected</span>
          <div className={styles.issuesBulkActions}>
            <button className="btn btn-primary btn-sm" style={{ borderRadius: 'var(--radius-sm)' }} onClick={handleBulkResolve} disabled={saving}>
              <CheckCircle size={14} /> Resolve
            </button>
            <button className="btn btn-destructive btn-sm" style={{ borderRadius: 'var(--radius-sm)' }} onClick={handleBulkDelete} disabled={deleting}>
              <Trash2 size={14} /> Delete
            </button>
            <button className="btn btn-ghost btn-sm" style={{ borderRadius: 'var(--radius-sm)' }} onClick={() => setSelected(new Set())}>
              Clear
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-8) var(--space-4)' }}>
          <div className="empty-state__icon">
            <CheckCircle size={20} />
          </div>
          <div className="empty-state__title" style={{ fontSize: 'var(--text-xs)' }}>
            {filter === 'received' ? 'No received issues' : 'No open issues'}
          </div>
        </div>
      ) : (
        <div className={styles.issuesList}>
          {filtered.map((issue) => {
            const cfg = severityConfig[issue.severity] || severityConfig.low
            const isResolving = resolvingId === issue.id
            return (
              <div key={issue.id} className={styles.issueCard}>
                <div className={styles.issueCardTop}>
                  <div className={styles.issueCardCheck}>
                    <Checkbox
                      checked={selected.has(issue.id)}
                      onChange={() => toggleOne(issue.id)}
                      aria-label={`Select ${issue.title}`}
                    />
                  </div>
                  <div className={styles.issueCardContent}>
                    <div className={styles.issueCardTitleRow}>
                      <span className={styles.issueCardTitle}>{issue.title}</span>
                      <span className={`${cfg.badgeClass} ${styles.severityBadge}`}>
                        {issue.severity}
                      </span>
                    </div>
                    {issue.description && (
                      <div className={styles.issueCardDesc}>{issue.description}</div>
                    )}
                    <div className={styles.issueCardMeta}>
                      <span className={styles.issueCardMetaItem}>
                        <User size={11} />
                        {issue.raised_by ? issue.raised_by.slice(0, 6) : '?'}
                      </span>
                      <span className={styles.issueCardMetaItem}>
                        <Clock size={11} />
                        {new Date(issue.raised_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {issue.resolved_at && (
                        <span className={styles.resolvedTag}>
                          <CheckCircle size={10} />
                          Done
                        </span>
                      )}
                    </div>
                    <div className={styles.issueCardActions}>
                      {isResolving ? (
                        <div className={styles.resolveRow}>
                          <input
                            className={`input ${styles.resolveInput}`}
                            placeholder="Resolution..."
                            value={resolutionText}
                            onChange={(e) => setResolutionText(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleResolve(issue)}
                          />
                          <button className="btn btn-primary btn-sm" style={{ minHeight: 28, fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)' }} onClick={() => handleResolve(issue)} disabled={saving || !resolutionText.trim()}>
                            Done
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ minHeight: 28, padding: '0 var(--space-1)', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)' }} onClick={() => { setResolvingId(null); setResolutionText('') }} data-tooltip="Cancel">
                            <CircleX size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className={styles.resolveRow}>
                          {!issue.resolved_at && (
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ minHeight: 28, padding: '0 var(--space-2)', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)' }}
                              onClick={() => setResolvingId(issue.id)}
                            >
                              <CheckCircle size={12} />
                              Resolve
                            </button>
                          )}
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ minHeight: 28, padding: '0 var(--space-2)', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)', color: 'var(--color-error)' }}
                            onClick={() => handleDeleteIssue(issue.id)}
                            data-tooltip="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
