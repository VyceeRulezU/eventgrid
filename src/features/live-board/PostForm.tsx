import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useLiveFeedStore } from '@/store/liveFeed.store'
import { useUIStore } from '@/store/ui.store'
import { compressImage } from '@/lib/compressImage'
import { uploadFile } from '@/lib/storage'
import { Send, Paperclip, FileText, X, MapPin, User, AtSign } from 'lucide-react'
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
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setMessage(val)

    const pos = e.target.selectionStart || 0
    setCursorPos(pos)

    // Look for @ before cursor
    const textBefore = val.slice(0, pos)
    const atIdx = textBefore.lastIndexOf('@')
    if (atIdx !== -1 && (atIdx === 0 || textBefore[atIdx - 1] === ' ')) {
      const query = textBefore.slice(atIdx + 1)
      // Only show if there's no space in the query (still typing the name)
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
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setMentionIndex((prev) => (prev + 1) % filteredMembers.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setMentionIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (filteredMembers.length > 0) {
        e.preventDefault()
        selectMember(filteredMembers[mentionIndex])
      }
    } else if (e.key === 'Escape') {
      setMentionOpen(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    setFiles((prev) => [...prev, ...selected])
    selected.forEach((f) => {
      const reader = new FileReader()
      reader.onload = () => {
        setPreviews((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(f)
    })
    e.target.value = ''
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
          mediaRows.push({
            event_id: eventId,
            uploader_id: user.id,
            url: publicUrl,
            storage_path: path,
          })
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
      if (parentId) {
        insertData.parent_id = parentId
      }

      const { data, error } = await supabase
        .from('live_feed_posts')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        showNotification({ variant: 'error', title: 'Failed to post', message: error.message })
        setSending(false)
        return
      }

      if (data) {
        addPost(data as unknown as LiveFeedPost)
      }

      if (mediaRows.length > 0) {
        await supabase.from('media').insert(mediaRows)
      }

      setMessage('')
      setFiles([])
      setPreviews([])
      setLocationTag('')
      onSuccess?.()
    } catch (err: any) {
      showNotification({ variant: 'error', title: 'Failed to post', message: err.message })
    }

    setSending(false)
  }

  const isReply = !!parentId

  return (
    <div className={`${styles.postForm} ${compact ? styles.postFormCompact : ''}`}>
      {isReply && (
        <div className={styles.postFormReplyIndicator}>
          <MessageCircle size={12} />
          Replying to {parentAuthorName || 'post'}
        </div>
      )}
      <div className={styles.postFormHeader}>
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className={styles.postFormAvatar} />
        ) : (
          <div className={styles.postFormAvatarPlaceholder}>
            <User size={16} />
          </div>
        )}
        <span className={styles.postFormName}>
          {profile?.display_name || 'Share an update...'}
        </span>
      </div>

      {previews.length > 0 && (
        <div className={styles.postFormPreviewsWrap}>
          <div className={styles.postFormPreviews}>
            {previews.map((p, i) => (
              <div key={i} className={styles.postFormPreviewItem}>
                {files[i]?.type === 'application/pdf' || files[i]?.name?.toLowerCase().endsWith('.pdf') ? (
                  <div className={styles.postFormPdfPreview}>
                    <FileText size={20} />
                  </div>
                ) : (
                  <img src={p} alt="" className={styles.postFormPreviewImg} />
                )}
                <button className={styles.postFormPreviewRemove} onClick={() => removeFile(i)}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.postFormFooter}>
        <div className={styles.postFormMentionWrap}>
          <textarea
            ref={textareaRef}
            className={styles.postFormInput}
            placeholder={isReply ? 'Write a reply...' : "What's happening?"}
            value={message}
            onChange={handleTextChange}
            onKeyDown={handleMentionKeyDown}
          />
          {mentionOpen && filteredMembers.length > 0 && (
            <div className={styles.mentionDropdown}>
              {filteredMembers.map((m, i) => (
                <button
                  key={m.id}
                  className={`${styles.mentionItem} ${i === mentionIndex ? styles.mentionItemActive : ''}`}
                  onMouseDown={() => selectMember(m)}
                >
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className={styles.mentionAvatar} />
                  ) : (
                    <div className={styles.mentionAvatarPlaceholder}>
                      <User size={12} />
                    </div>
                  )}
                  <span>{m.display_name || 'Unknown'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={styles.postFormActionsRow}>
          <div className={styles.postFormLeft}>
            <label className={styles.postFormAttachBtn}>
              <Paperclip size={16} />
              <input type="file" accept="image/*,.pdf" multiple ref={fileRef} style={{ display: 'none' }} onChange={handleFileSelect} />
            </label>
            <div className={styles.postFormLocation}>
              <MapPin size={14} />
              <input
                className={styles.postFormLocationInput}
                placeholder="Location (optional)"
                value={locationTag}
                onChange={(e) => setLocationTag(e.target.value)}
              />
            </div>
          </div>
          <button
            className={`btn btn-primary btn-sm ${styles.postFormSendBtn}`}
            onClick={handleSubmit}
            disabled={sending || !message.trim()}
          >
            <Send size={14} />
            {sending ? 'Posting...' : isReply ? 'Reply' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}
