import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { uploadFile, getFileUrl } from '@/lib/storage'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import {
  MessageSquare, AlertCircle, Lightbulb, Bug, Sparkles,
  Send, Paperclip, ArrowLeft, FileText, X, Loader2,
} from 'lucide-react'
import type { Feedback as FeedbackType } from '@/types'
import styles from './FeedbackChat.module.css'

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

function storageUrl(path: string) {
  return getFileUrl('media', path)
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
  const [showMobileList, setShowMobileList] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (!user) return
    async function load() {
      let query = supabase
        .from('feedback')
        .select('*')
        .order('last_message_at', { ascending: false })

      if (mode === 'user') query = query.eq('user_id', user!.id)

      const { data } = await query
      if (data) {
        setConversations(data as FeedbackWithProfile[])
        if (initialFeedbackId && !selectedId) setSelectedId(initialFeedbackId)
        else if (!selectedId && data.length > 0) setSelectedId(data[0].id)
      }
      setLoading(false)
    }
    load()
  }, [user, mode])

  useEffect(() => {
    if (!selectedId) return
    supabase
      .from('feedback_messages')
      .select('*')
      .eq('feedback_id', selectedId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setMessages(data as FeedbackMessage[])
        }
      })
  }, [selectedId])

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      try {
        const { storagePath } = await uploadFile('media', attachment.file, path)
        attachmentUrl = storagePath
        attachmentName = attachment.file.name
      } catch {
        showNotification({ variant: 'error', title: 'Upload failed', message: 'Could not upload attachment' })
        setSending(false)
        setUploading(false)
        return
      }
      setUploading(false)
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

    const fb = conversations.find((c) => c.id === selectedId)
    if (fb) {
      const bodyPayload = JSON.stringify({
        feedback_id: fb.id,
        text: newMessage.trim().substring(0, 200),
      })

      if (mode === 'admin') {
        try {
          await supabase.from('notifications').insert({
            user_id: fb.user_id,
            type: 'feedback_reply',
            title: `Reply: ${fb.subject}`,
            body: bodyPayload,
          })
        } catch { /* notification is non-critical */ }
      } else {
        try {
          await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'feedback_reply',
            title: fb.subject,
            body: bodyPayload,
          })
          const { data: superAdmins } = await supabase.from('profiles').select('id').eq('is_super_admin', true)
          if (superAdmins) {
            for (const sa of superAdmins) {
              await supabase.from('notifications').insert({
                user_id: sa.id,
                type: 'feedback_reply',
                title: `Reply: ${fb.subject}`,
                body: bodyPayload,
              })
            }
          }
        } catch { /* notification is non-critical */ }
      }
    }

    setNewMessage('')
    setAttachment(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [newMessage, attachment, selectedId, user, mode, showNotification, conversations])

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
    <div className={styles.chatInner}>
      {selectedConv && (
        <div className={styles.chatHeader}>
          {isMobile && (
            <button className="btn btn-ghost btn-icon" onClick={() => setShowMobileList(true)} aria-label="Back">
              <ArrowLeft size={18} />
            </button>
          )}
          <div
            className={styles.chatHeaderIcon}
            style={{
              background: `${(TYPE_CONFIG[selectedConv.type] || TYPE_CONFIG.other).color}15`,
              color: (TYPE_CONFIG[selectedConv.type] || TYPE_CONFIG.other).color,
            }}
          >
            {(() => { const Icon = (TYPE_CONFIG[selectedConv.type] || TYPE_CONFIG.other).icon; return <Icon size={16} /> })()}
          </div>
          <div className={styles.chatHeaderInfo}>
            <div className={styles.chatHeaderSubject}>{selectedConv.subject}</div>
            <div className={styles.chatHeaderMeta}>
              {selectedConv.display_name || selectedConv.user_email} &middot; {(TYPE_CONFIG[selectedConv.type] || TYPE_CONFIG.other).label}
            </div>
          </div>
          <span
            className={styles.chatStatus}
            style={{
              background: `${STATUS_STYLES[selectedConv.status]?.bg || 'rgba(156,163,175,0.12)'}`,
              color: STATUS_STYLES[selectedConv.status]?.color || '#9ca3af',
            }}
          >
            {selectedConv.status === 'in_review' ? 'In Review' : selectedConv.status}
          </span>
        </div>
      )}

      <div className={styles.messagesArea}>
        {(() => {
          if (!selectedConv) return <div className={styles.emptyChat}>Select a conversation</div>

          const originalMsg = {
            id: `${selectedConv.id}-original`,
            feedback_id: selectedConv.id,
            sender_id: selectedConv.user_id,
            sender_role: selectedConv.user_role,
            message: selectedConv.message,
            attachment_url: null,
            attachment_name: null,
            created_at: selectedConv.created_at,
            sender_name: selectedConv.display_name || selectedConv.user_email,
          }

          const restMessages = messages.length > 0 ? messages
            : selectedConv.admin_reply && selectedConv.replied_by
              ? [{
                  id: `${selectedConv.id}-legacy`,
                  feedback_id: selectedConv.id,
                  sender_id: selectedConv.replied_by,
                  sender_role: 'super_admin' as const,
                  message: selectedConv.admin_reply,
                  attachment_url: null,
                  attachment_name: null,
                  created_at: selectedConv.replied_at || selectedConv.created_at,
                  sender_name: 'Admin',
                }]
              : []

          const displayMessages = [originalMsg, ...restMessages]

          return displayMessages.map((msg) => {
            const isMe = msg.sender_id === user?.id
            const isAdmin = msg.sender_role === 'super_admin'
            return (
              <div key={msg.id} className={`${styles.msgRow} ${isMe ? styles.msgRowEnd : styles.msgRowStart}`}>
                {!isMe && <div className={styles.msgSender}>{isAdmin ? 'Admin' : (msg.sender_name || 'User')}</div>}
                <div className={`${styles.msgBubble} ${isMe ? styles.msgBubbleMe : styles.msgBubbleOther}`}>
                  {msg.message}
                  {msg.attachment_url && (
                    <div className={styles.msgAttachment}>
                      {msg.attachment_url.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? (
                        <img
                          src={storageUrl(msg.attachment_url)}
                          alt="attachment"
                          className={styles.msgImage}
                          loading="lazy"
                        />
                      ) : (
                        <a
                          href={storageUrl(msg.attachment_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${styles.msgFileLink} ${isMe ? styles.msgFileLinkMe : ''}`}
                        >
                          <FileText size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                          {msg.attachment_name || 'Attachment'}
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className={styles.msgTime}>{timeAgo(msg.created_at)}</div>
              </div>
            )
          })
        })()}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        {attachment && (
          <div className={styles.attachPreview}>
            {attachment.preview ? (
              <img src={attachment.preview} alt="preview" className={styles.attachPreviewImg} />
            ) : (
              <FileText size={16} style={{ color: 'var(--color-text-muted)' }} />
            )}
            <span className={styles.attachPreviewName}>{attachment.file.name}</span>
            <button
              className={`btn btn-ghost btn-icon ${styles.attachPreviewRemove}`}
              onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div className={styles.inputRow}>
          <button
            className={`btn btn-ghost btn-icon ${styles.attachBtn}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || uploading}
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            className={styles.fileInput}
            onChange={handleAttach}
          />
          <textarea
            className={styles.chatInput}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className={`btn btn-primary ${styles.sendBtn}`}
            onClick={handleSend}
            disabled={sending || uploading || (!newMessage.trim() && !attachment)}
          >
            {sending || uploading ? <Loader2 size={28} className="spin" /> : <Send size={28} />}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={styles.splitPanel}>
      {(!isMobile || showMobileList) && (
        <div className={`${styles.conversationPanel} ${isMobile ? styles.conversationPanelFull : ''}`}>
          <div className={styles.conversationHeader}>
            Conversations ({conversations.length})
          </div>
          <div className={styles.conversationList}>
            {loading ? (
              <div className={styles.loadingArea}>
                {[1,2,3].map(i => <div key={i} className={`skeleton skeleton-card ${styles.skeletonItem}`} />)}
              </div>
            ) : conversations.length === 0 ? (
              <div className={styles.emptyConv}>No conversations yet</div>
            ) : (
              conversations.map((conv) => {
                const config = TYPE_CONFIG[conv.type] || TYPE_CONFIG.other
                const Icon = config.icon
                const isSelected = conv.id === selectedId
                return (
                  <div
                    key={conv.id}
                    className={`${styles.convItem} ${isSelected ? styles.convItemSelected : ''}`}
                    onClick={() => { setSelectedId(conv.id); if (isMobile) setShowMobileList(false) }}
                  >
                    <div className={styles.convIcon} style={{ background: `${config.color}15`, color: config.color }}>
                      <Icon size={14} />
                    </div>
                    <div className={styles.convBody}>
                      <div className={styles.convRow}>
                        <span className={styles.convSubject}>{conv.subject}</span>
                        <span className={styles.convTime}>{timeAgo(conv.last_message_at || conv.created_at)}</span>
                      </div>
                      <div className={styles.convEmail}>{conv.display_name || conv.user_email}</div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {(!isMobile || !showMobileList) && (
        <div className={styles.chatPanel}>
          {selectedId ? chatView : (
            <div className={styles.emptyChat}>
              <MessageSquare size={32} className={styles.emptyChatIcon} />
              <div style={{ fontSize: 'var(--text-sm)' }}>Select a conversation</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
