import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, AlertCircle, Lightbulb, Bug, Sparkles, Clock, CheckCircle, ChevronRight, Inbox, X } from 'lucide-react'
import { Table } from '@/components/ui/Table'
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

const COLUMNS = [
  { key: 'type', label: 'Type' },
  { key: 'subject', label: 'Subject' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Date' },
]

const MODAL_STYLES: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    zIndex: 'var(--z-overlay)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: 'var(--space-4)',
  },
  modal: {
    background: 'var(--color-surface-1)', border: '1px solid var(--color-border)',
    borderRadius: 20, width: '100%', maxWidth: 520,
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
    maxHeight: '80vh',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border-subtle)',
  },
  headerTitle: { fontSize: 'var(--text-base)', fontWeight: 700 },
  closeBtn: {
    background: 'none', border: 'none', color: 'var(--color-text-muted)',
    cursor: 'pointer', padding: 4, borderRadius: 'var(--radius-sm)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: 'var(--space-4) var(--space-5)', overflowY: 'auto' as const, flex: 1 },
  section: { marginBottom: 'var(--space-4)' },
  sectionLabel: {
    fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-1)',
  },
  messageBox: {
    background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)',
    padding: 'var(--space-3) var(--space-4)',
    fontSize: '1rem', lineHeight: 1.7, color: 'var(--color-text-primary)',
    whiteSpace: 'pre-wrap',
  },
  replyBox: {
    marginTop: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)',
    background: 'var(--color-accent-muted)', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-accent-border)',
  },
  replyHeader: {
    fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-accent)',
    marginBottom: 'var(--space-1)',
  },
  replyText: {
    fontSize: '1rem', lineHeight: 1.7, color: 'var(--color-text-secondary)',
    whiteSpace: 'pre-wrap',
  },
  repliedAt: { fontSize: 10, color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' },
}

export function MyFeedback({ limit = 5 }: { limit?: number }) {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Feedback | null>(null)

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
      <Table
        columns={COLUMNS}
        minWidth="500px"
        loading={loading}
        empty={!loading && items.length === 0}
        emptyIcon={Inbox}
        emptyTitle="No feedback yet"
        emptyDescription="Your submitted feedback will appear here."
      >
        {items.map((fb) => {
          const config = TYPE_CONFIG[fb.type] || TYPE_CONFIG.other
          const Icon = config.icon
          const st = STATUS_STYLES[fb.status] || STATUS_STYLES.closed
          return (
            <tr
              key={fb.id}
              onClick={() => setSelected(fb)}
              style={{ cursor: 'pointer', verticalAlign: 'middle' }}
            >
              <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                    background: `${config.color}15`, color: config.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={14} />
                  </div>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500 }}>{config.label}</span>
                </div>
              </td>
              <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  {fb.subject}
                  {fb.admin_reply && <CheckCircle size={12} style={{ color: 'var(--color-info)', flexShrink: 0 }} />}
                </div>
              </td>
              <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                <span style={{
                  display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 'var(--radius-full)',
                  background: st.bg, color: st.color, fontWeight: 600, textTransform: 'capitalize',
                }}>
                  {fb.status.replace('_', ' ')}
                </span>
              </td>
              <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <Clock size={12} />
                  {new Date(fb.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </div>
              </td>
            </tr>
          )
        })}
      </Table>

      {selected && (
        <div style={MODAL_STYLES.overlay} onClick={() => setSelected(null)}>
          <div style={MODAL_STYLES.modal} onClick={(e) => e.stopPropagation()}>
            <div style={MODAL_STYLES.header}>
              <span style={MODAL_STYLES.headerTitle}>Feedback Detail</span>
              <button style={MODAL_STYLES.closeBtn} onClick={() => setSelected(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={MODAL_STYLES.body}>
              <div style={MODAL_STYLES.section}>
                <div style={MODAL_STYLES.sectionLabel}>Subject</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selected.subject}</div>
              </div>
              <div style={MODAL_STYLES.section}>
                <div style={MODAL_STYLES.sectionLabel}>Message</div>
                <div style={MODAL_STYLES.messageBox}>{selected.message}</div>
              </div>
              {selected.admin_reply && (
                <div style={MODAL_STYLES.section}>
                  <div style={MODAL_STYLES.replyBox}>
                    <div style={MODAL_STYLES.replyHeader}>
                      <CheckCircle size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      Admin Response
                    </div>
                    <div style={MODAL_STYLES.replyText}>{selected.admin_reply}</div>
                    {selected.replied_at && (
                      <div style={MODAL_STYLES.repliedAt}>
                        {new Date(selected.replied_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div style={MODAL_STYLES.section}>
                <div style={MODAL_STYLES.sectionLabel}>Status</div>
                <span style={{
                  display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 'var(--radius-full)',
                  background: (STATUS_STYLES[selected.status] || STATUS_STYLES.closed).bg,
                  color: (STATUS_STYLES[selected.status] || STATUS_STYLES.closed).color,
                  fontWeight: 600, textTransform: 'capitalize',
                }}>
                  {selected.status.replace('_', ' ')}
                </span>
              </div>
              <div style={MODAL_STYLES.section}>
                <div style={MODAL_STYLES.sectionLabel}>Submitted</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {new Date(selected.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
