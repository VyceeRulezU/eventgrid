import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import {
  MessageSquare, AlertCircle, Lightbulb, Bug, Sparkles,
  Send, Paperclip, ArrowLeft, FileText, X, Loader2,
} from 'lucide-react'
import type { Feedback as FeedbackType } from '@/types'

interface FeedbackMessage {
  id: string
  feedback_id: string
  sender_id: string
  sender_role: string
  message: string
  attachment_url: string | null
  attachment_name: string | null
  created_at: string
  sender_name?: string | null
}

interface FeedbackWithProfile extends FeedbackType {
  display_name?: string | null
  avatar_url?: string | null
  last_message?: string | null
  last_message_at?: string
}

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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function FeedbackChat({ mode = 'user', initialFeedbackId }: { mode: 'admin' | 'user'; initialFeedbackId?: string }) {
  const user = useAuthStore((s) => s.user)
  const showNotification = useUIStore((s) => s.showNotification)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [conversations, setConversations] = useState<FeedbackWithProfile[]>([])
  const [messages, setMessages] = useState<FeedbackMessage[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(initialFeedbackId || null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [attachment, setAttachment] = useState<{ file: File; preview: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const [showMobileList, setShowMobileList] = useState(true)

  // Fetch conversations
  useEffect(() => {
    if (!user) return
    async function load() {
      let query = supabase
        .from('feedback')
        .select('*, profiles!inner(display_name, avatar_url)')
        .order('last_message_at', { ascending: false })

      if (mode === 'user') query = query.eq('user_id', user!.id)

      const { data } = await query
      if (data) {
        setConversations(data.map((d: Record<string, unknown>) => ({
          ...d,
          display_name: (d.profiles as Record<string, unknown> | null)?.['display_name' as keyof object] as string | null,
          avatar_url: (d.profiles as Record<string, unknown> | null)?.['avatar_url' as keyof object] as string | null,
        })) as FeedbackWithProfile[])
        if (initialFeedbackId && !selectedId) setSelectedId(initialFeedbackId)
        else if (!selectedId && data.length > 0) setSelectedId(data[0].id)
      }
      setLoading(false)
    }
    load()
  }, [user, mode])

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedId) return
    supabase
      .from('feedback_messages')
      .select('*, profiles!inner(display_name)')
      .eq('feedback_id', selectedId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setMessages(data.map((d: Record<string, unknown>) => ({
            ...d,
            sender_name: (d.profiles as Record<string, unknown> | null)?.['display_name' as keyof object] as string | null,
          })) as FeedbackMessage[])
        }
      })
  }, [selectedId])

  // Realtime for new messages
  useEffect(() => {
    if (!selectedId) return
    const channel = supabase
      .channel(`feedback-messages-${selectedId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'feedback_messages',
        filter: `feedback_id=eq.${selectedId}`,
      }, (payload) => {
        const newMsg = payload.new as Record<string, unknown>
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev
          return [...prev, { ...newMsg, sender_name: null } as FeedbackMessage]
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selectedId])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Update last_message_at of conversation when new msg arrives
  useEffect(() => {
    if (messages.length === 0) return
    const last = messages[messages.length - 1]
    setConversations((prev) => prev.map((c) =>
      c.id === last.feedback_id ? { ...c, last_message_at: last.created_at, last_message: last.message } : c
    ))
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!newMessage.trim() && !attachment) return
    if (!selectedId || !user) return
    setSending(true)

    let attachmentUrl: string | null = null
    let attachmentName: string | null = null

    if (attachment) {
      setUploading(true)
      const ext = attachment.file.name.split('.').pop()
      const path = `feedback/${selectedId}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, attachment.file, { upsert: false })

      setUploading(false)
      if (uploadError) {
        showNotification({ variant: 'error', title: 'Upload failed', message: uploadError.message })
        setSending(false)
        return
      }
      attachmentUrl = uploadData?.path || null
      attachmentName = attachment.file.name
    }

    const { error } = await supabase.from('feedback_messages').insert({
      feedback_id: selectedId,
      sender_id: user.id,
      sender_role: mode === 'admin' ? 'super_admin' : (user.user_metadata?.role as string) || 'user',
      message: newMessage.trim() || (attachmentName || 'Sent an attachment'),
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
    } as Record<string, unknown>)

    setSending(false)
    if (error) {
      showNotification({ variant: 'error', title: 'Failed to send', message: error.message })
      return
    }
    setNewMessage('')
    setAttachment(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [newMessage, attachment, selectedId, user, mode, showNotification])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      showNotification({ variant: 'error', title: 'File too large', message: 'Maximum 10 MB' })
      return
    }
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
    setAttachment({ file, preview })
  }

  const selectedConv = conversations.find((c) => c.id === selectedId)

  const chatView = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      {selectedConv && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          flexShrink: 0,
        }}>
          {isMobile && (
            <button className="btn btn-ghost btn-icon" onClick={() => setShowMobileList(true)} aria-label="Back">
              <ArrowLeft size={18} />
            </button>
          )}
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${(TYPE_CONFIG[selectedConv.type] || TYPE_CONFIG.other).color}15`,
            color: (TYPE_CONFIG[selectedConv.type] || TYPE_CONFIG.other).color,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {(() => { const Icon = (TYPE_CONFIG[selectedConv.type] || TYPE_CONFIG.other).icon; return <Icon size={16} /> })()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selectedConv.subject}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
              {selectedConv.display_name || selectedConv.user_email} &middot; {(TYPE_CONFIG[selectedConv.type] || TYPE_CONFIG.other).label}
            </div>
          </div>
          <span style={{
            fontSize: 9, padding: '2px 8px', borderRadius: 'var(--radius-full)',
            background: `${STATUS_STYLES[selectedConv.status]?.bg || 'rgba(156,163,175,0.12)'}`,
            color: STATUS_STYLES[selectedConv.status]?.color || '#9ca3af',
            fontWeight: 700, textTransform: 'uppercase',
          }}>
            {selectedConv.status === 'in_review' ? 'In Review' : selectedConv.status}
          </span>
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: 'var(--space-3) var(--space-4)',
        display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
      }}>
        {messages.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)',
          }}>
            No messages yet. Start the conversation.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id
            const isAdmin = msg.sender_role === 'super_admin'
            return (
              <div key={msg.id} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '80%', alignSelf: isMe ? 'flex-end' : 'flex-start',
              }}>
                {!isMe && (
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 2, marginLeft: 2 }}>
                    {isAdmin ? 'Admin' : (msg.sender_name || 'User')}
                  </div>
                )}
                <div style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 16,
                  borderBottomRightRadius: isMe ? 4 : 16,
                  borderBottomLeftRadius: isMe ? 16 : 4,
                  background: isMe
                    ? 'linear-gradient(135deg, var(--color-accent) 0%, #b8860b 100%)'
                    : 'var(--color-surface-1)',
                  color: isMe ? '#000' : 'var(--color-text-primary)',
                  fontSize: 'var(--text-sm)',
                  lineHeight: 1.6,
                  wordBreak: 'break-word',
                  border: isMe ? 'none' : '1px solid var(--color-border-subtle)',
                }}>
                  {msg.message}
                  {msg.attachment_url && (
                    <div style={{ marginTop: 'var(--space-1)' }}>
                      {msg.attachment_url.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? (
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/media/${msg.attachment_url}`}
                          alt="attachment"
                          style={{ maxWidth: 200, maxHeight: 150, borderRadius: 8, objectFit: 'cover' }}
                          loading="lazy"
                        />
                      ) : (
                        <a
                          href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/media/${msg.attachment_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: isMe ? '#000' : 'var(--color-accent)', textDecoration: 'underline', fontSize: 'var(--text-xs)' }}
                        >
                          <FileText size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                          {msg.attachment_name || 'Attachment'}
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 1, marginLeft: 2 }}>
                  {timeAgo(msg.created_at)}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: 'var(--space-3) var(--space-4)',
        borderTop: '1px solid var(--color-border-subtle)',
        flexShrink: 0,
      }}>
        {attachment && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-3)', marginBottom: 'var(--space-2)',
            background: 'var(--color-surface-1)', borderRadius: 'var(--radius-md)',
          }}>
            {attachment.preview ? (
              <img src={attachment.preview} alt="preview" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
            ) : (
              <FileText size={16} style={{ color: 'var(--color-text-muted)' }} />
            )}
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {attachment.file.name}
            </span>
            <button className="btn btn-ghost btn-icon" onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = '' }} style={{ width: 24, height: 24 }}>
              <X size={14} />
            </button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => fileInputRef.current?.click()} disabled={sending || uploading} style={{ flexShrink: 0 }} title="Attach file">
            <Paperclip size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            style={{ display: 'none' }}
            onChange={handleAttach}
          />
          <textarea
            className="input"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{
              flex: 1, minHeight: 40, maxHeight: 120, resize: 'none',
              borderRadius: 12, padding: 'var(--space-2) var(--space-3)',
              fontFamily: 'inherit', fontSize: 'var(--text-sm)',
              lineHeight: 1.5,
            }}
          />
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={sending || uploading || (!newMessage.trim() && !attachment)}
            style={{ flexShrink: 0, height: 40, width: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {sending || uploading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{
      display: 'flex', height: 'calc(100vh - 200px)', minHeight: 500,
      background: 'var(--color-surface-2)', borderRadius: 20,
      border: '1px solid rgba(255,255,255,0.05)',
      overflow: 'hidden',
      boxShadow: '0 10px 25px -10px rgba(0,0,0,0.2)',
    }}>
      {/* Conversation list */}
      {(!isMobile || showMobileList) && (
        <div style={{
          width: isMobile ? '100%' : 320,
          flexShrink: 0,
          borderRight: isMobile ? 'none' : '1px solid var(--color-border-subtle)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: '1px solid var(--color-border-subtle)',
            fontSize: 'var(--text-sm)', fontWeight: 700,
            color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            Conversations ({conversations.length})
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 'var(--space-4)' }}>
                {[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 64, marginBottom: 8 }} />)}
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                No conversations yet
              </div>
            ) : (
              conversations.map((conv) => {
                const config = TYPE_CONFIG[conv.type] || TYPE_CONFIG.other
                const Icon = config.icon
                const isSelected = conv.id === selectedId
                return (
                  <div
                    key={conv.id}
                    onClick={() => { setSelectedId(conv.id); if (isMobile) setShowMobileList(false) }}
                    style={{
                      padding: 'var(--space-2) var(--space-4)',
                      cursor: 'pointer',
                      display: 'flex', gap: 'var(--space-2)',
                      background: isSelected ? 'var(--color-accent-muted)' : 'transparent',
                      borderLeft: `3px solid ${isSelected ? 'var(--color-accent)' : 'transparent'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `${config.color}15`, color: config.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon size={14} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 1 }}>
                        <span style={{
                          fontSize: 'var(--text-xs)', fontWeight: 600,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          color: 'var(--color-text-primary)',
                        }}>
                          {conv.subject}
                        </span>
                        <span style={{ fontSize: 9, color: 'var(--color-text-muted)', flexShrink: 0, marginLeft: 4 }}>
                          {timeAgo(conv.last_message_at || conv.created_at)}
                        </span>
                      </div>
                      <div style={{
                        fontSize: 10, color: 'var(--color-text-muted)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {conv.display_name || conv.user_email}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Chat area */}
      {(!isMobile || !showMobileList) && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {selectedId ? chatView : (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 'var(--space-2)',
              color: 'var(--color-text-muted)',
            }}>
              <MessageSquare size={32} style={{ opacity: 0.3 }} />
              <div style={{ fontSize: 'var(--text-sm)' }}>Select a conversation</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
