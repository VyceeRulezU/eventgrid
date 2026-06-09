import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, AlertCircle, Lightbulb, Bug, Sparkles, Clock, CheckCircle, ChevronRight } from 'lucide-react'
import type { Feedback } from '@/types'

const TYPE_CONFIG: Record<string, { label: string; icon: typeof MessageSquare; color: string }> = {
  complaint: { label: 'Complaint', icon: AlertCircle, color: 'var(--color-error)' },
  suggestion: { label: 'Suggestion', icon: Lightbulb, color: 'var(--color-accent)' },
  bug_report: { label: 'Bug Report', icon: Bug, color: 'var(--color-warning)' },
  feature_request: { label: 'Feature Request', icon: Sparkles, color: 'var(--color-info)' },
  other: { label: 'Other', icon: MessageSquare, color: 'var(--color-text-muted)' },
}

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  open: { color: '#4ade80', bg: 'rgba(34,197,94,0.12)' },
  in_review: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  resolved: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  closed: { color: '#9ca3af', bg: 'rgba(156,163,175,0.12)' },
}

export function MyFeedback({ limit = 5 }: { limit?: number }) {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        if (data) setItems(data as Feedback[])
        setLoading(false)
      })
  }, [user, limit])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 72 }} />)}
      </div>
    )
  }

  if (items.length === 0) return null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <MessageSquare size={16} style={{ color: 'var(--color-accent)' }} />
          My Feedback
        </h3>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/notifications')}>
          View All <ChevronRight size={14} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {items.map((fb) => {
          const config = TYPE_CONFIG[fb.type] || TYPE_CONFIG.other
          const Icon = config.icon
          const st = STATUS_STYLES[fb.status] || STATUS_STYLES.closed
          const isExpanded = expanded === fb.id
          return (
            <div key={fb.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}
                onClick={() => setExpanded(isExpanded ? null : fb.id)}
                onKeyDown={(e) => e.key === 'Enter' && setExpanded(isExpanded ? null : fb.id)}
                role="button"
                tabIndex={0}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-md)',
                  background: `${config.color}15`, color: config.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {fb.subject}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    <span className="badge" style={{
                      fontSize: 9, padding: '1px 6px', borderRadius: 'var(--radius-full)',
                      background: st.bg, color: st.color, fontWeight: 600, textTransform: 'capitalize',
                    }}>
                      {fb.status}
                    </span>
                    {fb.admin_reply && <CheckCircle size={11} style={{ color: 'var(--color-info)' }} />}
                    <Clock size={11} />
                    <span>{new Date(fb.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
              </div>
              {isExpanded && (
                <div style={{ padding: '0 var(--space-4) var(--space-3) var(--space-4)', borderTop: '1px solid var(--color-border-subtle)' }}>
                  <div style={{
                    padding: 'var(--space-2) var(--space-3)', marginTop: 'var(--space-2)',
                    background: 'var(--color-surface-1)', borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-xs)', lineHeight: 1.6, color: 'var(--color-text-secondary)',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {fb.message}
                  </div>
                  {fb.admin_reply && (
                    <div style={{
                      marginTop: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)',
                      background: 'var(--color-accent-muted)', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-accent-border)',
                    }}>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-accent)', marginBottom: 2 }}>
                        <CheckCircle size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        Admin Response
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {fb.admin_reply}
                      </div>
                      {fb.replied_at && (
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                          {new Date(fb.replied_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
