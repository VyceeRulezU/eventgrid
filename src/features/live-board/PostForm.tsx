import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useLiveFeedStore } from '@/store/liveFeed.store'
import { useUIStore } from '@/store/ui.store'
import { Send, Paperclip, X, MapPin } from 'lucide-react'
import type { LiveFeedPost } from '@/types'
import styles from './LiveBoardPage.module.css'

interface PostFormProps {
  eventId: string
}

export function PostForm({ eventId }: PostFormProps) {
  const user = useAuthStore((s) => s.user)
  const addPost = useLiveFeedStore((s) => s.addPost)
  const showNotification = useUIStore((s) => s.showNotification)

  const [message, setMessage] = useState('')
  const [locationTag, setLocationTag] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

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
        const { error: uploadErr } = await supabase.storage.from('event-media').upload(path, f)
        if (uploadErr) {
          showNotification({ variant: 'error', title: 'Upload failed', message: uploadErr.message })
          continue
        }
        const { data: { publicUrl } } = supabase.storage.from('event-media').getPublicUrl(path)
        urls.push(publicUrl)
        mediaRows.push({
          event_id: eventId,
          uploader_id: user.id,
          url: publicUrl,
          storage_path: path,
        })
      }

      const { data, error } = await supabase
        .from('live_feed_posts')
        .insert({
          event_id: eventId,
          user_id: user.id,
          message: message.trim(),
          photo_urls: JSON.stringify(urls),
          location_tag: locationTag.trim() || null,
        })
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
    } catch (err: any) {
      showNotification({ variant: 'error', title: 'Failed to post', message: err.message })
    }

    setSending(false)
  }

  return (
    <div className={styles.postForm}>
      <div className={styles.postFormInputRow}>
        <textarea
          className={`input ${styles.postFormInput}`}
          placeholder="Share an update..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
        />
      </div>

      {previews.length > 0 && (
        <div className={styles.postFormPreviews}>
          {previews.map((p, i) => (
            <div key={i} className={styles.postFormPreviewItem}>
              <img src={p} alt="" className={styles.postFormPreviewImg} />
              <button className={styles.postFormPreviewRemove} onClick={() => removeFile(i)}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.postFormActions}>
        <div className={styles.postFormLeft}>
          <label className={styles.postFormAttachBtn}>
            <Paperclip size={16} />
            <input type="file" accept="image/*" multiple ref={fileRef} style={{ display: 'none' }} onChange={handleFileSelect} />
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
          {sending ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  )
}
