import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Calendar, User, Send, Image as ImageIcon, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { compressImage } from '@/lib/compressImage'
import { uploadFile } from '@/lib/storage'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import type { Task, TaskComment } from '@/types'

interface TaskWithAssignee extends Task {
  assignee: { display_name: string | null; avatar_url: string | null } | null
}

interface TaskCardProps {
  task: TaskWithAssignee
  onUpdate: () => void
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

export function TaskCard({ task, onUpdate }: TaskCardProps) {
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
      className="card"
      draggable
      onDragStart={handleDragStart}
      style={{
        padding: 'var(--space-3)',
        cursor: 'grab',
        borderColor: overdue ? 'var(--color-error)' : undefined,
        borderWidth: overdue ? '1px' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }} onClick={() => setExpanded(!expanded)}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
            {task.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <span className={`badge ${priorityBadge[task.priority] || 'badge-medium'}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
            {task.assignee?.display_name && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <User size={12} />
                {task.assignee.display_name}
              </span>
            )}
            {task.due_datetime && (
              <span style={{
                fontSize: 'var(--text-xs)',
                color: overdue ? 'var(--color-error)' : 'var(--color-text-secondary)',
                display: 'flex', alignItems: 'center', gap: 4,
                fontWeight: overdue ? 600 : 400,
              }}>
                <Calendar size={12} />
                {formatDate(task.due_datetime)}
              </span>
            )}
          </div>
        </div>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <span className={`badge badge-${task.status === 'done' ? 'green' : task.status === 'blocked' ? 'red' : task.status === 'in_progress' ? 'yellow' : 'grey'}`}>
            <span className="badge-dot" />
            {STATUS_OPTIONS.find((s) => s.value === task.status)?.label || task.status}
          </span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
          {task.description && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-3)' }}>
              {task.description}
            </div>
          )}

          {/* Status change */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Status:</span>
            <div onClick={(e) => e.stopPropagation()} style={{ minWidth: 140 }}>
              <DropdownMenu
                trigger={<span>{STATUS_OPTIONS.find((s) => s.value === task.status)?.label || task.status}</span>}
                items={STATUS_OPTIONS.map((s) => ({ label: s.label, value: s.value }))}
                onSelect={(item) => handleStatusChange(item.value)}
                disabled={updating}
              />
            </div>
          </div>

          {/* Comments / Updates */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
              Updates ({comments.length})
            </div>

            {commentsLoading ? (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', padding: 'var(--space-2)' }}>Loading updates...</div>
            ) : comments.length === 0 ? (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', padding: 'var(--space-2)' }}>No updates yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', maxHeight: 240, overflowY: 'auto' }}>
                {comments.map((c) => (
                  <div key={c.id} style={{
                    padding: 'var(--space-2)',
                    background: 'var(--color-surface-2)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-xs)',
                  }}>
                    <div style={{ color: 'var(--color-text-primary)', marginBottom: 4 }}>{c.message}</div>
                    {c.photo_urls && c.photo_urls.length > 0 && (
                      <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap', marginTop: 4 }}>
                        {(Array.isArray(c.photo_urls) ? c.photo_urls : JSON.parse(c.photo_urls as string)).map((url: string, i: number) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                          </a>
                        ))}
                      </div>
                    )}
                    <div style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: '10px' }}>{timeAgo(c.created_at)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* New update form */}
            <div onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <textarea
                    className="input"
                    style={{ minHeight: 52, resize: 'none', fontSize: 'var(--text-xs)' }}
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
                <label style={{
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)', flexShrink: 0, transition: 'all var(--transition-fast)',
                }}>
                  <ImageIcon size={14} />
                  <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoSelect} />
                </label>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ borderRadius: 'var(--radius-sm)', minHeight: 36, padding: '0 var(--space-3)' }}
                  onClick={handleSendUpdate}
                  disabled={sending || (!newMessage.trim() && uploadingPhotos.length === 0)}
                >
                  <Send size={14} />
                </button>
              </div>

              {uploadingPreview.length > 0 && (
                <div style={{ display: 'flex', gap: 'var(--space-1)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {uploadingPreview.map((p, i) => (
                    <div key={i} style={{ position: 'relative', width: 48, height: 48 }}>
                      <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                      <button
                        type="button"
                        style={{
                          position: 'absolute', top: -4, right: -4, width: 16, height: 16,
                          borderRadius: '50%', background: 'var(--color-error)', border: 'none',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', padding: 0, fontSize: 10, lineHeight: 1,
                        }}
                        onClick={() => removePhoto(i)}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
