import { useState } from 'react'
import { X, Send, AlertCircle, Lightbulb, Bug, Sparkles, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'

interface FeedbackFormModalProps {
  open: boolean
  onClose: () => void
}

const TYPES = [
  { value: 'complaint', label: 'Complaint', icon: AlertCircle },
  { value: 'suggestion', label: 'Suggestion', icon: Lightbulb },
  { value: 'bug_report', label: 'Bug Report', icon: Bug },
  { value: 'feature_request', label: 'Feature Request', icon: Sparkles },
  { value: 'other', label: 'Other', icon: MessageSquare },
]

export function FeedbackFormModal({ open, onClose }: FeedbackFormModalProps) {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const showNotification = useUIStore((s) => s.showNotification)

  const [type, setType] = useState('suggestion')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim() || !user) return
    setSending(true)

    const { data: inserted, error } = await supabase.from('feedback').insert({
      user_id: user.id,
      user_email: user.email || user.user_metadata?.email || 'unknown@eventgrid.ng',
      user_role: role || 'unknown',
      type,
      subject: subject.trim(),
      message: message.trim(),
    }).select('id').single()

    setSending(false)

    if (error) {
      console.error('[Feedback] insert error:', error)
      showNotification({ variant: 'error', title: 'Failed to submit', message: error.message })
      return
    }

    showNotification({ variant: 'success', title: 'Submitted', message: 'Your feedback has been sent to the admin team.' })

    const feedbackId = inserted?.id
    const bodyPayload = feedbackId ? JSON.stringify({ feedback_id: feedbackId, text: message.trim().substring(0, 200) }) : message.trim().substring(0, 200)

    // Notify the user so they can continue the thread from notifications
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'feedback_reply',
      title: subject.trim(),
      body: bodyPayload,
    })

    // Notify all super admins about new feedback
    const { data: superAdmins } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_super_admin', true)

    if (superAdmins) {
      for (const sa of superAdmins) {
        await supabase.from('notifications').insert({
          user_id: sa.id,
          type: 'feedback_reply',
          title: `New feedback: ${subject.trim()}`,
          body: bodyPayload,
        })
      }
    }

    setSubject('')
    setMessage('')
    setType('suggestion')
    onClose()
  }

  return (
    <div className="overlay" onClick={() => { if (!sending) onClose() }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-card-header">
          <div className="modal-card-title">Send Feedback</div>
          <button className="modal-card-close" onClick={onClose} disabled={sending} data-tooltip="Close"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-card-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 0, lineHeight: 1.5 }}>
              Have a complaint, suggestion, or idea? Share it with the NaliGrid team directly.
            </p>

            <div className="input-wrapper" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="input-label">Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                {TYPES.map((t) => {
                  const Icon = t.icon
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      style={{
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${type === t.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        background: type === t.value ? 'var(--color-accent-muted)' : 'var(--color-surface-1)',
                        color: type === t.value ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: type === t.value ? 600 : 400,
                        fontFamily: 'inherit',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Icon size={14} />
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="input-wrapper" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="input-label" htmlFor="feedbackSubject">Subject</label>
              <input
                id="feedbackSubject"
                className="input"
                placeholder="Brief title for your feedback"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="input-wrapper">
              <label className="input-label" htmlFor="feedbackMessage">Message</label>
              <textarea
                id="feedbackMessage"
                className="input"
                style={{ minHeight: 140, resize: 'vertical' }}
                placeholder="Describe your feedback in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--color-border-subtle)' }}>
            <button className="btn btn-primary" type="submit" disabled={sending || !subject.trim() || !message.trim()} style={{ flex: 1 }}>
              {sending ? 'Sending...' : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)' }}><Send size={14} /> Send Feedback</span>}
            </button>
            <button className="btn btn-ghost" type="button" onClick={onClose} disabled={sending}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
