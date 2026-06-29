import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Calendar, User, Send, Image as ImageIcon, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { compressImage } from '@/lib/compressImage'
import { uploadFile } from '@/lib/storage'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import type { Task, TaskComment } from '@/types'
import styles from './TaskCard.module.css'

interface TaskWithAssignee extends Task {
  assignee: { display_name: string | null; avatar_url: string | null } | null
}

interface TaskCardProps {
  task: TaskWithAssignee
  onUpdate: () => void
  onOpenDetails?: (task: TaskWithAssignee) => void
  readOnly?: boolean
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
] as const

const priorityBadge: Record<string, string> = {
  low: 'badge-low',
  medium: 'badge-medium',
  high: 'badge-high',
  urgent: 'badge-urgent',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isOverdue(task: TaskWithAssignee): boolean {
  if (!task.due_datetime || task.status === 'done') return false
  return new Date(task.due_datetime) < new Date()
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function TaskCard({ task, onUpdate, onOpenDetails, readOnly }: TaskCardProps) {
  const user = useAuthStore((s) => s.user)
  const showNotification = useUIStore((s) => s.showModal)
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [comments, setComments] = useState<TaskComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState<File[]>([])
  const [uploadingPreview, setUploadingPreview] = useState<string[]>([])
  const overdue = isOverdue(task)

  useEffect(() => {
    if (expanded) {
      loadComments()
    }
  }, [expanded])

  async function loadComments() {
    setCommentsLoading(true)
    const { data } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true })
    if (data) {
      setComments(data as unknown as TaskComment[])
    }
    setCommentsLoading(false)
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const previews = files.map((f) => URL.createObjectURL(f))
    setUploadingPhotos((prev) => [...prev, ...files])
    setUploadingPreview((prev) => [...prev, ...previews])
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(uploadingPreview[index])
    setUploadingPhotos((prev) => prev.filter((_, i) => i !== index))
    setUploadingPreview((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSendUpdate() {
    if ((!newMessage.trim() && uploadingPhotos.length === 0) || !user) return
    setSending(true)

    const urls: string[] = []
    for (const file of uploadingPhotos) {
      const ext = file.name.split('.').pop()
      const path = `${task.event_id}/comments/${task.id}/${crypto.randomUUID()}.${ext}`
      const blob = await compressImage(file)
      try {
        const { url: publicUrl } = await uploadFile('event-media', blob, path)
        urls.push(publicUrl)
      } catch {
        showNotification({ variant: 'error', title: 'Upload failed', message: 'Could not upload photo' })
        continue
      }
    }

    const { error } = await supabase
      .from('task_comments')
      .insert({
        task_id: task.id,
        user_id: user.id,
        message: newMessage.trim() || 'Sent a photo update',
        photo_urls: JSON.stringify(urls),
      })

    if (error) {
      showNotification({ variant: 'error', title: 'Failed to send', message: error.message })
      setSending(false)
      return
    }

    setNewMessage('')
    setUploadingPhotos([])
    uploadingPreview.forEach((p) => URL.revokeObjectURL(p))
    setUploadingPreview([])
    setSending(false)
    loadComments()
    onUpdate()
  }

  async function handleStatusChange(newStatus: string) {
    setUpdating(true)
    const update: Partial<Task> = { status: newStatus as Task['status'] }
    if (newStatus === 'done') {
      update.completed_at = new Date().toISOString()
    } else if (task.status === 'done') {
      update.completed_at = null
    }
    const { error } = await supabase
      .from('tasks')
      .update(update)
      .eq('id', task.id)
    if (error) {
      showNotification({ variant: 'error', title: 'Update failed', message: error.message })
      setUpdating(false)
      return
    }
    setUpdating(false)
    onUpdate()
  }

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('text/plain', task.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const isAssignee = user?.id === task.assignee_id

  return (
    <div
      className={`card ${overdue ? styles.cardOverdue : ''} ${styles.card} ${expanded ? styles.cardExpanded : ''}`}
      draggable={!readOnly}
      onDragStart={handleDragStart}
    >
      <div className={styles.header} onClick={() => onOpenDetails ? onOpenDetails(task) : setExpanded(!expanded)}>
        <div className={styles.headerLeft}>
          <div className={styles.title}>{task.title}</div>
          <div className={styles.metaRow}>
            <span className={`badge ${priorityBadge[task.priority] || 'badge-medium'}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
            {task.assignee?.display_name ? (
              <span className={styles.metaItem}>
                <User size={12} />
                {task.assignee.display_name}
              </span>
            ) : (
              <span className={styles.metaItem}>
                <User size={12} />
                Unassigned
              </span>
            )}
            {task.due_datetime && (
              <span className={overdue ? styles.metaItemOverdue : styles.metaItem}>
                <Calendar size={12} />
                {formatDate(task.due_datetime)}
              </span>
            )}
          </div>
        </div>
        <div className={styles.headerRight}>
          <span className={`badge badge-${task.status === 'done' ? 'green' : task.status === 'blocked' ? 'red' : task.status === 'in_progress' ? 'yellow' : 'grey'}`}>
            <span className="badge-dot" />
            {STATUS_OPTIONS.find((s) => s.value === task.status)?.label || task.status}
          </span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {expanded && (
        <div className={styles.expandedBody}>
          {task.description && (
            <div className={styles.description}>{task.description}</div>
          )}

          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>Status:</span>
            <div className={styles.statusDropdown} onClick={(e) => e.stopPropagation()}>
              <DropdownMenu
                trigger={<span>{STATUS_OPTIONS.find((s) => s.value === task.status)?.label || task.status}</span>}
                items={STATUS_OPTIONS.map((s) => ({ label: s.label, value: s.value }))}
                onSelect={(item) => handleStatusChange(item.value)}
                disabled={updating || readOnly}
              />
            </div>
          </div>

          <div className={styles.commentsSection}>
            <div className={styles.commentsHeader}>Updates ({comments.length})</div>

            {commentsLoading ? (
              <div className={styles.commentsLoading}>Loading updates...</div>
            ) : comments.length === 0 ? (
              <div className={styles.commentsEmpty}>No updates yet</div>
            ) : (
              <div className={styles.commentsList}>
                {comments.map((c) => (
                  <div key={c.id} className={styles.comment}>
                    <div className={styles.commentMessage}>{c.message}</div>
                    {c.photo_urls && c.photo_urls.length > 0 && (
                      <div className={styles.commentPhotos}>
                        {(Array.isArray(c.photo_urls) ? c.photo_urls : JSON.parse(c.photo_urls as string)).map((url: string, i: number) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt="" className={styles.commentPhoto} />
                          </a>
                        ))}
                      </div>
                    )}
                    <div className={styles.commentTime}>{timeAgo(c.created_at)}</div>
                  </div>
                ))}
              </div>
            )}

            {!readOnly && (
              <div onClick={(e) => e.stopPropagation()}>
                <div className={styles.newUpdateForm}>
                  <div className={styles.textareaWrapper}>
                    <textarea
                      className={`input ${styles.textarea}`}
                      placeholder={isAssignee ? "Add an update, photo, or change status..." : "Add a comment..."}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendUpdate()
                        }
                      }}
                    />
                  </div>
                  <label className={styles.photoBtn}>
                    <ImageIcon size={14} />
                    <input type="file" accept="image/*" multiple className={styles.photoBtnInput} onChange={handlePhotoSelect} />
                  </label>
                  <button
                    className={`btn btn-primary btn-sm ${styles.sendBtn}`}
                    onClick={handleSendUpdate}
                    disabled={sending || (!newMessage.trim() && uploadingPhotos.length === 0)}
                  >
                    <Send size={14} />
                  </button>
                </div>

                {uploadingPreview.length > 0 && (
                  <div className={styles.photoPreviews}>
                    {uploadingPreview.map((p, i) => (
                      <div key={i} className={styles.photoPreview}>
                        <img src={p} alt="" className={styles.photoPreviewImg} />
                        <button type="button" className={styles.removePhotoBtn} onClick={() => removePhoto(i)}>
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
