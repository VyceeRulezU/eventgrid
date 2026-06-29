import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Send, MessageSquare, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { PageHero } from '@/components/shared/PageHero'
import styles from './ChatPage.module.css'
import type { EventChatMessage } from '@/types'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export function ChatPage() {
  const { id: eventId } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const [messages, setMessages] = useState<(EventChatMessage & { profile?: { display_name: string | null; avatar_url: string | null } })[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!eventId) return
    loadMessages()

    const sub = supabase
      .channel(`chat-${eventId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_chat_messages', filter: `event_id=eq.${eventId}` },
        (payload: RealtimePostgresChangesPayload<EventChatMessage>) => {
          const newMsg = payload.new as EventChatMessage
          loadProfiles([newMsg]).then(profiled => {
            setMessages(prev => [...prev, profiled[0]])
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [eventId])

  async function loadMessages() {
    setLoading(true)
    const { data } = await supabase
      .from('event_chat_messages')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
      .limit(200)
    if (data) {
      const withProfiles = await loadProfiles(data as EventChatMessage[])
      setMessages(withProfiles)
    }
    setLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function loadProfiles(msgs: EventChatMessage[]) {
    const userIds = [...new Set(msgs.map(m => m.user_id))]
    if (userIds.length === 0) return msgs as any
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds)
    const profileMap = (profiles || []).reduce<Record<string, any>>((acc, p) => { acc[p.id] = p; return acc }, {})
    return (msgs as any).map((m: any) => ({ ...m, profile: profileMap[m.user_id] || null }))
  }

  async function handleSend() {
    if (!input.trim() || !eventId || sending) return
    setSending(true)
    const { error } = await supabase.from('event_chat_messages').insert({
      event_id: eventId, user_id: user!.id, message: input.trim(),
    })
    if (!error) {
      setInput('')
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  if (!eventId) return <div className="empty-state"><div className="empty-state__title">No event selected</div></div>

  return (
    <div className={styles.page}>
      <PageHero icon={MessageSquare} title="Team Chat" />
      <div className={styles.chatContainer}>
        <div className={styles.messageList}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-state__title">No messages yet</div>
              <div className="empty-state__description">Start the conversation with your team</div>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.user_id === user?.id
              return (
                <div key={msg.id} className={`${styles.message} ${isMe ? styles.myMessage : ''}`}>
                  {!isMe && (
                    <div className={styles.avatar}>
                      {msg.profile?.avatar_url
                        ? <img src={msg.profile.avatar_url} alt="" className={styles.avatarImg} />
                        : <User size={16} />
                      }
                    </div>
                  )}
                  <div className={styles.bubble}>
                    {!isMe && <div className={styles.sender}>{msg.profile?.display_name || 'Unknown'}</div>}
                    <div className={styles.text}>{msg.message}</div>
                    <div className={styles.time}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>
        <div className={styles.inputBar}>
          <textarea
            className={styles.textarea}
            placeholder="Type a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button className={`btn btn-primary btn-sm ${styles.sendBtn}`} onClick={handleSend} disabled={!input.trim() || sending}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
