import { useEffect, useState } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import styles from './GuestMessages.module.css'
import type { GuestMessage } from '@/types'

const FILTERS = ['all', 'vip', 'pending_rsvp', 'confirmed', 'declined', 'maybe', 'checked_in'] as const

interface Props {
  eventId: string
}

export function GuestMessages({ eventId }: Props) {
  const user = useAuthStore((s) => s.user)
  const showNotification = useUIStore((s) => s.showNotification)

  const [messages, setMessages] = useState<GuestMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [showComposer, setShowComposer] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ subject: '', body: '', filter: 'all' as string })

  useEffect(() => {
    loadMessages()
  }, [eventId])

  async function loadMessages() {
    setLoading(true)
    const { data } = await supabase.from('guest_messages').select('*').eq('event_id', eventId).order('created_at', { ascending: false })
    if (data) setMessages(data as GuestMessage[])
    setLoading(false)
  }

  async function handleSend() {
    if (!form.subject.trim() || !form.body.trim()) {
      showNotification({ variant: 'warning', title: 'Subject and body are required' })
      return
    }
    setSending(true)

    // Count recipients
    let countQuery = supabase.from('guests').select('id', { count: 'exact' }).eq('event_id', eventId)
    if (form.filter !== 'all') {
      if (form.filter === 'vip') countQuery = countQuery.eq('is_vip', true)
      else countQuery = countQuery.eq('rsvp_status', form.filter)
    }
    const { count } = await countQuery

    const { error } = await supabase.from('guest_messages').insert({
      event_id: eventId, sent_by: user!.id,
      subject: form.subject.trim(), body: form.body.trim(),
      recipient_filter: form.filter, sent_count: count || 0,
    })
    if (error) { showNotification({ variant: 'error', title: 'Failed', message: error.message }); setSending(false); return }

    showNotification({ variant: 'success', title: 'Message sent!', message: `Sent to ${count || 0} recipients` })
    setForm({ subject: '', body: '', filter: 'all' })
    setShowComposer(false)
    setSending(false)
    loadMessages()
  }

  const filterLabels: Record<string, string> = { all: 'All Guests', vip: 'VIPs', pending_rsvp: 'Pending RSVP', confirmed: 'Confirmed', declined: 'Declined', maybe: 'Maybe', checked_in: 'Checked In' }

  if (loading) return <div className="skeleton skeleton-block" style={{ height: 200 }} />

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <h3 className={styles.title}><MessageSquare size={16} /> Guest Messages</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowComposer(!showComposer)}>
          <Send size={14} /> {showComposer ? 'Close' : 'New Message'}
        </button>
      </div>

      {showComposer && (
        <div className={styles.composer}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 8 }}>
            <div className="input-wrapper">
              <label className="input-label">Subject</label>
              <input className="input" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="e.g. Event Reminder" />
            </div>
            <div className="input-wrapper">
              <label className="input-label">Send to</label>
              <select className="input" value={form.filter} onChange={e => setForm({...form, filter: e.target.value})}>
                {FILTERS.map(f => <option key={f} value={f}>{filterLabels[f]}</option>)}
              </select>
            </div>
          </div>
          <div className="input-wrapper">
            <label className="input-label">Message</label>
            <textarea className="input" rows={4} value={form.body} onChange={e => setForm({...form, body: e.target.value})} placeholder="Type your message..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSend} disabled={sending}>
              <Send size={14} /> {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {messages.length === 0 ? (
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', padding: 12 }}>No messages sent yet</div>
        ) : messages.map(msg => (
          <div key={msg.id} className={styles.msgCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{msg.subject}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                {new Date(msg.created_at).toLocaleDateString()}
              </div>
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>{msg.body}</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 6 }}>
              <span>To: {filterLabels[msg.recipient_filter]}</span>
              <span>Sent: {msg.sent_count}</span>
              <span>Opened: {msg.opened_count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
