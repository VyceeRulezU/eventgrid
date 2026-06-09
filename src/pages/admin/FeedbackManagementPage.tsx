import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { createNotification } from '@/lib/notifications'
import { MessageSquare, AlertCircle, Lightbulb, Bug, Sparkles, Send, CheckCircle, RefreshCw, Clock } from 'lucide-react'
import { PageHero } from '@/components/shared/PageHero'

interface Feedback {
  id: string
  user_id: string
  user_email: string
  user_role: string
  type: string
  subject: string
  message: string
  status: string
  admin_reply: string | null
  replied_by: string | null
  replied_at: string | null
  created_at: string
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof MessageSquare; color: string }> = {
  complaint: { label: 'Complaint', icon: AlertCircle, color: 'var(--color-error)' },
  suggestion: { label: 'Suggestion', icon: Lightbulb, color: 'var(--color-accent)' },
  bug_report: { label: 'Bug Report', icon: Bug, color: 'var(--color-warning)' },
  feature_request: { label: 'Feature Request', icon: Sparkles, color: 'var(--color-info)' },
  other: { label: 'Other', icon: MessageSquare, color: 'var(--color-text-muted)' },
}

const STATUS_COLORS: Record<string, string> = {
  open: 'var(--color-success)',
  in_review: 'var(--color-warning)',
  resolved: 'var(--color-info)',
  closed: 'var(--color-text-muted)',
}

export function FeedbackManagementPage() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const showNotification = useUIStore((s) => s.showNotification)

  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  async function loadFeedback() {
    setLoading(true)
    let query = supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter === 'open') query = query.eq('status', 'open')
    else if (filter === 'in_review') query = query.eq('status', 'in_review')
    else if (filter === 'resolved') query = query.in('status', ['resolved', 'closed'])

    const { data } = await query
    if (data) setFeedback(data as Feedback[])
    setLoading(false)
  }

  useEffect(() => {
    if (role === 'super_admin') loadFeedback()
  }, [role, filter])

  const handleReply = async (fb: Feedback) => {
    if (!replyText.trim()) return
    setSendingReply(true)

    const { error } = await supabase
      .from('feedback')
      .update({
        admin_reply: replyText.trim(),
        replied_by: user?.id,
        replied_at: new Date().toISOString(),
        status: 'resolved',
      })
      .eq('id', fb.id)

    setSendingReply(false)

    if (error) {
      showNotification({ variant: 'error', title: 'Failed to reply', message: error.message })
      return
    }

    await createNotification(
      fb.user_id,
      'feedback_reply',
      `Reply to your "${fb.type}" — ${fb.subject}`,
      replyText.trim().substring(0, 200),
    )
    showNotification({ variant: 'success', title: 'Reply sent', message: 'Your response has been saved.' })
    setReplyingTo(null)
    setReplyText('')
    loadFeedback()
  }

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from('feedback').update({ status }).eq('id', id)
    if (!error) loadFeedback()
  }

  if (role !== 'super_admin') return null

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'in_review', label: 'In Review' },
    { key: 'resolved', label: 'Resolved' },
  ]

  return (
    <div>
      <PageHero
        icon={MessageSquare}
        title="Feedback"
        subtitle="User submissions and inquiries"
        backTo="/admin"
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`btn btn-sm ${filter === tab.key ? 'btn-primary' : 'btn-ghost'}`}
              >
                {tab.label}
              </button>
            ))}
            <button className="btn btn-ghost btn-sm btn-icon" onClick={loadFeedback} aria-label="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 100 }} />)}
        </div>
      ) : feedback.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon"><MessageSquare size={32} /></div>
          <div className="empty-state__title">No feedback yet</div>
          <div className="empty-state__description">Users haven't submitted any feedback.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {feedback.map((fb) => {
            const config = TYPE_CONFIG[fb.type] || TYPE_CONFIG.other
            const Icon = config.icon
            const isExpanded = expanded === fb.id

            return (
              <div key={fb.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div
                  style={{ padding: 'var(--space-4) var(--space-5)', cursor: 'pointer' }}
                  onClick={() => setExpanded(isExpanded ? null : fb.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 'var(--radius-md)',
                        background: `${config.color}15`, color: config.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Icon size={16} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 2 }}>
                          <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{fb.subject}</span>
                          <span style={{
                            fontSize: 10, padding: '1px 6px', borderRadius: 'var(--radius-full)',
                            background: `${STATUS_COLORS[fb.status]}20`, color: STATUS_COLORS[fb.status],
                            fontWeight: 600, textTransform: 'capitalize',
                          }}>
                            {fb.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          <span>{fb.user_email}</span>
                          <span>•</span>
                          <span style={{ textTransform: 'capitalize' }}>{fb.user_role}</span>
                          <span>•</span>
                          <Clock size={11} />
                          <span>{new Date(fb.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 var(--space-5) var(--space-4) var(--space-5)', borderTop: '1px solid var(--color-border-subtle)' }}>
                    <div style={{
                      padding: 'var(--space-3) var(--space-4)', marginTop: 'var(--space-3)',
                      background: 'var(--color-surface-1)', borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--color-text-secondary)',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {fb.message}
                    </div>

                    {fb.admin_reply && (
                      <div style={{
                        marginTop: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)',
                        background: 'var(--color-accent-muted)', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-accent-border)',
                      }}>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-accent)', marginBottom: 4 }}>
                          <CheckCircle size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                          Admin Response
                        </div>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          {fb.admin_reply}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                      {fb.status === 'open' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => { setReplyingTo(fb.id); setReplyText('') }}>
                          <Send size={12} /> Reply
                        </button>
                      )}
                      {fb.status === 'open' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleStatusChange(fb.id, 'in_review')}>
                          Mark In Review
                        </button>
                      )}
                      {fb.status === 'in_review' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => { setReplyingTo(fb.id); setReplyText('') }}>
                          <Send size={12} /> Reply
                        </button>
                      )}
                      {(fb.status === 'open' || fb.status === 'in_review') && (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleStatusChange(fb.id, 'closed')}>
                          Close
                        </button>
                      )}
                      {(fb.status === 'resolved' || fb.status === 'closed') && (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleStatusChange(fb.id, 'open')}>
                          Reopen
                        </button>
                      )}
                    </div>

                    {replyingTo === fb.id && (
                      <div style={{ marginTop: 'var(--space-3)' }}>
                        <textarea
                          className="input"
                          style={{ minHeight: 80, resize: 'vertical' }}
                          placeholder="Type your reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleReply(fb)} disabled={sendingReply || !replyText.trim()}>
                            {sendingReply ? 'Sending...' : 'Send Reply'}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setReplyingTo(null); setReplyText('') }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
