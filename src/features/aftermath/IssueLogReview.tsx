import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { Filter, AlertTriangle, CheckCircle, BookOpen } from 'lucide-react'
import type { Issue, IssueSeverity } from '@/types'
import styles from './Aftermath.module.css'

const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  low: 'var(--color-status-green)',
  medium: 'var(--color-status-yellow)',
  high: 'var(--color-status-red)',
  critical: 'var(--color-error)',
}

export function IssueLogReview({ eventId }: { eventId: string }) {
  const user = useAuthStore((s) => s.user)
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all')
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | 'all'>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [lessonText, setLessonText] = useState('')

  useEffect(() => {
    if (!user) return

    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('issues')
        .select('*')
        .eq('event_id', eventId)
        .order('raised_at', { ascending: false })

      if (data) setIssues(data as unknown as Issue[])
      setLoading(false)
    }

    load()
  }, [eventId, user])

  const filtered = issues.filter((issue) => {
    if (statusFilter === 'open' && issue.resolved_at) return false
    if (statusFilter === 'resolved' && !issue.resolved_at) return false
    if (severityFilter !== 'all' && issue.severity !== severityFilter) return false
    return true
  })

  const saveLesson = async (id: string) => {
    const { error } = await supabase
      .from('issues')
      .update({ lessons_learned: lessonText })
      .eq('id', id)

    if (!error) {
      setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, lessons_learned: lessonText } : i)))
      setEditingId(null)
      setLessonText('')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 'var(--space-4)' }}>
        <img src="/EventGrid-favicon.svg" alt="Loading" style={{ width: 48, height: 48, opacity: 0.5 }} />
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading issues...</div>
      </div>
    )
  }

  if (issues.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-xl)' }}>
        <CheckCircle size={24} style={{ marginBottom: 'var(--space-2)', opacity: 0.4 }} />
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>No issues logged</div>
        <div style={{ fontSize: 'var(--text-xs)', marginTop: 4 }}>All issues raised during the event will appear here for review.</div>
      </div>
    )
  }

  return (
    <div>
      <div className={styles.issueToolbar}>
        <div className={styles.issueFilterGroup}>
          <Filter size={16} style={{ color: 'var(--color-text-secondary)' }} />
          {(['all', 'open', 'resolved'] as const).map((opt) => (
            <button
              key={opt}
              className={`btn btn-sm ${statusFilter === opt ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-sm)' }}
              onClick={() => setStatusFilter(opt)}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
        <select
          className="input"
          style={{ width: 'auto', minWidth: 120 }}
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as IssueSeverity | 'all')}
        >
          <option value="all">All severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <span className={styles.issueCount}>{filtered.length} of {issues.length} issues</span>
      </div>

      <div className={styles.issueList}>
        {filtered.map((issue) => (
          <div key={issue.id} className={styles.issueCard}>
            <div className={styles.issueHeader}>
              <AlertTriangle size={18} style={{ color: SEVERITY_COLORS[issue.severity] }} className={styles.issueIcon} />
              <div className={styles.issueBody}>
                <div className={styles.issueTitleRow}>
                  <strong className={styles.issueTitle}>{issue.title}</strong>
                  <span className={`badge badge-${issue.resolved_at ? 'green' : 'yellow'}`}>
                    <span className="badge-dot" />
                    {issue.resolved_at ? 'Resolved' : 'Open'}
                  </span>
                  <span className={`badge badge-${issue.severity === 'critical' ? 'red' : issue.severity === 'high' ? 'yellow' : 'green'}`}>
                    {issue.severity}
                  </span>
                </div>
                {issue.description && (
                  <div className={styles.issueDescription}>{issue.description}</div>
                )}
                {issue.resolution && (
                  <div className={styles.issueResolution}>Resolution: {issue.resolution}</div>
                )}
                <div className={styles.issueTimestamp}>
                  Raised {new Date(issue.raised_at).toLocaleString('en-GB')}
                  {issue.resolved_at && ` · Resolved ${new Date(issue.resolved_at).toLocaleString('en-GB')}`}
                </div>
              </div>
            </div>

            <div className={styles.lessonSection}>
              <div className={styles.lessonHeader}>
                <BookOpen size={14} style={{ color: 'var(--color-text-secondary)' }} />
                <span className={styles.lessonLabel}>Lessons Learned</span>
              </div>
              {editingId === issue.id ? (
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <textarea
                    className={`input ${styles.lessonTextarea}`}
                    value={lessonText}
                    onChange={(e) => setLessonText(e.target.value)}
                    placeholder="What did we learn from this issue?"
                  />
                  <div className={styles.lessonActions}>
                    <button className="btn btn-primary btn-sm" style={{ borderRadius: 'var(--radius-sm)' }} onClick={() => saveLesson(issue.id)}>Save</button>
                    <button className="btn btn-ghost btn-sm" style={{ borderRadius: 'var(--radius-sm)' }} onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div
                  className={styles.lessonEdit}
                  onClick={() => { setEditingId(issue.id); setLessonText(issue.lessons_learned || '') }}
                >
                  {issue.lessons_learned || 'Click to add lessons learned...'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
