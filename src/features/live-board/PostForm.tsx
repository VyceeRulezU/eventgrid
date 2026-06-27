import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useLiveFeedStore } from '@/store/liveFeed.store'
import { useUIStore } from '@/store/ui.store'
import { compressImage } from '@/lib/compressImage'
import { uploadFile } from '@/lib/storage'
import { createNotification, sendPushNotification } from '@/lib/notifications'
import { Send, Paperclip, FileText, X, MapPin, User, MessageCircle, Plus } from 'lucide-react'
import type { LiveFeedPost } from '@/types'
import styles from './LiveBoardPage.module.css'

interface TeamMember {
  id: string
  display_name: string | null
  avatar_url: string | null
}

interface PostFormProps {
  eventId: string
  parentId?: string
  parentAuthorName?: string
  teamMembers?: TeamMember[]
  onSuccess?: () => void
  compact?: boolean
}

export function PostForm({ eventId, parentId, parentAuthorName, teamMembers = [], onSuccess, compact }: PostFormProps) {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const addPost = useLiveFeedStore((s) => s.addPost)
  const showNotification = useUIStore((s) => s.showNotification)

  const [message, setMessage] = useState('')
  const [locationTag, setLocationTag] = useState('')
  const [showLocation, setShowLocation] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Mention autocomplete state
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionIndex, setMentionIndex] = useState(0)
  const [cursorPos, setCursorPos] = useState(0)

  const filteredMembers = mentionQuery
    ? teamMembers.filter((m) =>
        (m.display_name || '').toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : teamMembers

  useEffect(() => {
    setMentionIndex(0)
  }, [filteredMembers.length])

  // Auto-grow textarea (1 line idle → 4 lines max)
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    const lineH = 24 // px, matches line-height:1.5 * font-size:16px
    const maxH = lineH * 4 + 8 // 4 lines + padding
    ta.style.height = Math.min(ta.scrollHeight, maxH) + 'px'
  }, [message])

  // Close + menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setMessage(val)
    const pos = e.target.selectionStart || 0
    setCursorPos(pos)
    const textBefore = val.slice(0, pos)
    const atIdx = textBefore.lastIndexOf('@')
    if (atIdx !== -1 && (atIdx === 0 || textBefore[atIdx - 1] === ' ')) {
      const query = textBefore.slice(atIdx + 1)
      if (!query.includes(' ') && query.length < 30) {
        setMentionQuery(query)
        setMentionOpen(true)
        return
      }
    }
    setMentionOpen(false)
  }

  function selectMember(member: TeamMember) {
    const textBefore = message.slice(0, cursorPos)
    const atIdx = textBefore.lastIndexOf('@')
    const textAfter = message.slice(cursorPos)
    const newMessage = textBefore.slice(0, atIdx) + `@${member.display_name || member.id.slice(0, 8)} ` + textAfter
    setMessage(newMessage)
    setMentionOpen(false)
    textareaRef.current?.focus()
  }

  function handleMentionKeyDown(e: React.KeyboardEvent) {
    if (!mentionOpen) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex((p) => (p + 1) % filteredMembers.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex((p) => (p - 1 + filteredMembers.length) % filteredMembers.length) }
    else if (e.key === 'Enter' || e.key === 'Tab') { if (filteredMembers.length > 0) { e.preventDefault(); selectMember(filteredMembers[mentionIndex]) } }
    else if (e.key === 'Escape') setMentionOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    handleMentionKeyDown(e)
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    setFiles((prev) => [...prev, ...selected])
    selected.forEach((f) => {
      const reader = new FileReader()
      reader.onload = () => setPreviews((prev) => [...prev, reader.result as string])
      reader.readAsDataURL(f)
    })
    e.target.value = ''
    setMenuOpen(false)
  }

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
    setPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (!message.trim() || !user || sending) return
    setSending(true)
    try {
      const urls: string[] = []
      const mediaRows: { event_id: string; uploader_id: string; url: string; storage_path: string }[] = []
      for (const f of files) {
        const ext = f.name.split('.').pop()
        const path = `live-feed/${eventId}/${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const isPdf = f.type === 'application/pdf' || ext?.toLowerCase() === 'pdf'
        const blob = isPdf ? f : await compressImage(f)
        try {
          const { url: publicUrl } = await uploadFile('event-media', blob, path)
          urls.push(publicUrl)
          mediaRows.push({ event_id: eventId, uploader_id: user.id, url: publicUrl, storage_path: path })
        } catch {
          showNotification({ variant: 'error', title: 'Upload failed', message: 'Could not upload file' })
          continue
        }
      }
      const insertData: Record<string, any> = {
        event_id: eventId,
        user_id: user.id,
        message: message.trim(),
        photo_urls: JSON.stringify(urls),
        location_tag: locationTag.trim() || null,
      }
      if (parentId) insertData.parent_id = parentId
      const { data, error } = await supabase.from('live_feed_posts').insert(insertData).select().single()
      if (error) { showNotification({ variant: 'error', title: 'Failed to post', message: error.message }); setSending(false); return }
      if (data) addPost(data as unknown as LiveFeedPost)
      if (teamMembers.length > 0) {
        const mentionedNames = [...new Set(message.match(/@(\w[\w\s]*\w|\w)/g)?.map(t => t.slice(1).trim()) || [])]
        for (const name of mentionedNames) {
          const member = teamMembers.find(m => m.display_name === name)
          if (member && member.id !== user.id) {
            createNotification(member.id, 'mention', `${profile?.display_name || user.email} mentioned you`, message.trim().slice(0, 200), eventId)
            sendPushNotification({ type: 'mention', recipientId: member.id, eventId, payload: { title: `${profile?.display_name || user.email} mentioned you`, body: message.trim().slice(0, 200), url: `/events/${eventId}/live-board`, tag: 'mention' } })
          }
        }
      }
      if (mediaRows.length > 0) await supabase.from('media').insert(mediaRows)
      setMessage('')
      setFiles([])
      setPreviews([])
      setLocationTag('')
      setShowLocation(false)
      onSuccess?.()
    } catch (err: any) {
      showNotification({ variant: 'error', title: 'Failed to post', message: err.message })
    }
    setSending(false)
  }

  const isReply = !!parentId

  return (
    <div className={`${styles.composer} ${compact ? styles.composerCompact : ''}`}>

      {/* Reply badge */}
      {isReply && (
        <div className={styles.composerReplyBadge}>
          <MessageCircle size={11} />
          Replying to {parentAuthorName || 'post'}
        </div>
      )}

      {/* Attachment previews */}
      {previews.length > 0 && (
        <div className={styles.composerPreviews}>
          {previews.map((p, i) => (
            <div key={i} className={styles.composerPreviewItem}>
              {files[i]?.type === 'application/pdf' || files[i]?.name?.toLowerCase().endsWith('.pdf')
                ? <div className={styles.composerPdfThumb}><FileText size={18} /></div>
                : <img src={p} alt="" className={styles.composerPreviewImg} />}
              <button className={styles.composerPreviewRemove} onClick={() => removeFile(i)}><X size={10} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Location chip */}
      {showLocation && (
        <div className={styles.composerLocationRow}>
          <MapPin size={12} />
          <input
            className={styles.composerLocationInput}
            placeholder="Add location…"
            value={locationTag}
            onChange={(e) => setLocationTag(e.target.value)}
            autoFocus
          />
          <button className={styles.composerLocationClear} onClick={() => { setLocationTag(''); setShowLocation(false) }}>
            <X size={10} />
          </button>
        </div>
      )}

      {/* ── Pill input row ── */}
      <div className={styles.composerRow}>

        {/* + menu */}
        <div className={styles.composerMenuWrap} ref={menuRef}>
          <button
            className={styles.composerPlusBtn}
            onClick={() => setMenuOpen((v) => !v)}
            title="Add attachment or location"
            type="button"
          >
            <Plus size={15} />
          </button>

          {menuOpen && (
            <div className={styles.composerMenu}>
              <label className={styles.composerMenuItem}>
                <Paperclip size={15} />
                Attach file
                <input type="file" accept="image/*,.pdf" multiple ref={fileRef} style={{ display: 'none' }} onChange={handleFileSelect} />
              </label>
              <button
                className={styles.composerMenuItem}
                type="button"
                onClick={() => { setShowLocation((v) => !v); setMenuOpen(false) }}
              >
                <MapPin size={15} />
                {showLocation ? 'Remove location' : 'Add location'}
              </button>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className={styles.composerAvatar}>
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" className={styles.composerAvatarImg} />
            : <div className={styles.composerAvatarPlaceholder}><User size={13} /></div>}
        </div>

        {/* Textarea + mention dropdown */}
        <div className={styles.composerInputWrap}>
          <textarea
            ref={textareaRef}
            className={styles.composerInput}
            placeholder={isReply ? 'Write a reply… (⌘↵)' : "What's happening? (⌘↵ to post)"}
            value={message}
            rows={1}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
          />
          {mentionOpen && filteredMembers.length > 0 && (
            <div className={styles.mentionDropdown}>
              {filteredMembers.map((m, i) => (
                <button
                  key={m.id}
                  className={`${styles.mentionItem} ${i === mentionIndex ? styles.mentionItemActive : ''}`}
                  onMouseDown={() => selectMember(m)}
                >
                  {m.avatar_url
                    ? <img src={m.avatar_url} alt="" className={styles.mentionAvatar} />
                    : <div className={styles.mentionAvatarPlaceholder}><User size={12} /></div>}
                  <span>{m.display_name || 'Unknown'}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          className={styles.composerSendBtn}
          onClick={handleSubmit}
          disabled={sending || !message.trim()}
          type="button"
          title="Send (⌘↵)"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}
