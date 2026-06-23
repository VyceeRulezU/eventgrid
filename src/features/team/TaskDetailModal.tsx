import { useEffect, useState } from 'react'
import { X, Send, Paperclip, Calendar, User, Flag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { compressImage } from '@/lib/compressImage'
import { uploadFile } from '@/lib/storage'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import type { Task, TaskComment } from '@/types'

const PRIORITY_BADGE: Record<string, string> = {
  low: 'badge-low', medium: 'badge-medium', high: 'badge-high', urgent: 'badge-urgent',
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
] as const

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export interface TaskDetail {
  id: string
  event_id: string
  title: string
  description: string | null
  phase_id: string | null
  assignee_id: string | null
  created_by: string
  due_datetime: string | null
  priority: string
  status: string
  notes: string | null
  created_at: string
  event: { id: string; name: string }
  phase: { phase_name: string } | null
  assignee: { display_name: string | null; email?: string; avatar_url: string | null } | null
}

interface TaskDetailModalProps {
  task: TaskDetail
  onClose: () => void
  onUpdate: () => void
}

export function TaskDetailModal({ task, onClose, onUpdate }: TaskDetailModalProps) {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const showNotification = useUIStore((s) => s.showNotification)

  const [comments, setComments] = useState<TaskComment[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [photoFiles, setPhotoFiles] = useState<{ file: File; preview: string }[]>([])
  const [notes, setNotes] = useState(task.notes || '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [members, setMembers] = useState<{ user_id: string; display_name: string | null; email: string; role: string }[]>([])
  const [reassigning, setReassigning] = useState(false)

  useEffect(() => {
    loadComments()
    loadMembers()
  }, [])

  async function loadMembers() {
    const { data } = await supabase
      .from('event_access')
      .select('user_id, role, profile:profiles!event_access_user_id_fkey(display_name, email)')
      .eq('event_id', task.event_id)
    if (data) {
      setMembers(data.map((m: any) => ({
        user_id: m.user_id,
        display_name: m.profile?.display_name || null,
        email: m.profile?.email || '',
        role: m.role,
      })))
    }
  }

  async function handleReassign(userId: string) {
    setReassigning(true)
    const { error } = await supabase.from('tasks').update({ assignee_id: userId || null }).eq('id', task.id)
    if (error) {
      showNotification({ variant: 'error', title: 'Reassign failed', message: error.message })
    } else {
      showNotification({ variant: 'success', title: 'Task reassigned' })
      onUpdate()
    }
    setReassigning(false)
  }

  async function loadComments() {
    const { data } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true })
    if (data) setComments(data as unknown as TaskComment[])
  }

  async function handleStatusChange(newStatus: string) {
    setUpdating(true)
    const update: Partial<Task> = { status: newStatus as Task['status'] }
    if (newStatus === 'done') update.completed_at = new Date().toISOString()
    else if (task.status === 'done') update.completed_at = null

    const { error } = await supabase.from('tasks').update(update).eq('id', task.id)
    if (error) {
      showNotification({ variant: 'error', title: 'Status update failed', message: error.message })
    }
    setUpdating(false)
    onUpdate()
  }

  async function handleSaveNotes() {
    setSavingNotes(true)
    const { error } = await supabase.from('tasks').update({ notes: notes || null }).eq('id', task.id)
    if (error) {
      showNotification({ variant: 'error', title: 'Failed to save notes', message: error.message })
    } else {
      showNotification({ variant: 'success', title: 'Notes saved' })
    }
    setSavingNotes(false)
    onUpdate()
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const entries = files.map((f) => ({ file: f, preview: URL.createObjectURL(f) }))
    setPhotoFiles((prev) => [...prev, ...entries])
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photoFiles[index].preview)
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSendUpdate() {
    const hasMessage = newMessage.trim().length > 0
    if (!hasMessage && photoFiles.length === 0) return
    if (!user) return
    setSending(true)

    const urls: string[] = []
    for (const p of photoFiles) {
      const ext = p.file.name.split('.').pop()
      const path = `${task.event_id}/comments/${task.id}/${crypto.randomUUID()}.${ext}`
      const blob = await compressImage(p.file)
      try {
        const { url: publicUrl } = await uploadFile('event-media', blob, path)
        urls.push(publicUrl)
      } catch {
        showNotification({ variant: 'error', title: 'Upload failed', message: 'Could not upload photo' })
      }
    }

    const { error } = await supabase.from('task_comments').insert({
      task_id: task.id,
      user_id: user.id,
      message: hasMessage ? newMessage.trim() : 'Sent a photo update',
      photo_urls: JSON.stringify(urls),
    })

    if (error) {
      showNotification({ variant: 'error', title: 'Failed to send', message: error.message })
      setSending(false)
      return
    }

    setNewMessage('')
    photoFiles.forEach((p) => URL.revokeObjectURL(p.preview))
    setPhotoFiles([])
    setSending(false)
    loadComments()
  }

  const overdue = !!task.due_datetime && task.status !== 'done' && new Date(task.due_datetime) < new Date()

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-card__header">
          <h3 className="modal-card__title">{task.title}</h3>
          <button className="modal-card__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-card__body" style={{ overflowY: 'auto', maxHeight: '70vh' }}>
          {/* Task info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2) var(--space-4)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>Event</span>
              <div style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{task.event.name}</div>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>Phase</span>
              <div style={{ color: 'var(--color-text-primary)' }}>{task.phase?.phase_name || '—'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>Assignee</span>
              {(role === 'planner' || role === 'coordinator' || members.find(m => m.user_id === user?.id)?.role === 'coordinator') && !reassigning ? (
                <DropdownMenu
                  trigger={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--color-text-primary)' }}>
                      <User size={12} />
                      {task.assignee?.display_name || 'Unassigned'}
                    </span>
                  }
                  items={[
                    { label: 'Unassigned', value: '' },
                    ...members.map((m) => ({
                      label: m.display_name || m.email,
                      value: m.user_id,
                    })),
                  ]}
                  onSelect={(item) => handleReassign(item.value)}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-primary)' }}>
                  <User size={12} />
                  {reassigning ? 'Reassigning...' : (task.assignee?.display_name || 'Unassigned')}
                </div>
              )}
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>Priority</span>
              <div>
                <span className={`badge ${PRIORITY_BADGE[task.priority] || 'badge-medium'}`}>
                  <Flag size={10} style={{ marginRight: 4 }} />
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>Due Date</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: overdue ? 'var(--color-error)' : 'var(--color-text-primary)', fontWeight: overdue ? 600 : 400 }}>
                <Calendar size={12} />
                {task.due_datetime ? new Date(task.due_datetime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>Status</span>
              <div onClick={(e) => e.stopPropagation()} style={{ minWidth: 140 }}>
                <DropdownMenu
                  trigger={
                    <span className={`badge badge-${task.status === 'done' ? 'green' : task.status === 'blocked' ? 'red' : task.status === 'in_progress' ? 'yellow' : 'grey'}`}>
                      <span className="badge-dot" />
                      {STATUS_OPTIONS.find((s) => s.value === task.status)?.label || task.status}
                    </span>
                  }
                  items={STATUS_OPTIONS.map((s) => ({ label: s.label, value: s.value }))}
                  onSelect={(item) => handleStatusChange(item.value)}
                  disabled={updating}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Description</div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{task.description}</p>
            </div>
          )}

          {/* Notes */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Notes</span>
              <button
                className="btn btn-ghost btn-xs"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                style={{ fontSize: 'var(--text-xs)' }}
              >
                {savingNotes ? 'Saving...' : 'Save'}
              </button>
            </div>
            <textarea
              className="input"
              style={{ minHeight: 72, resize: 'vertical', fontSize: 'var(--text-sm)' }}
              placeholder="Add notes about this task..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Comments */}
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
              Updates ({comments.length})
            </div>

            {comments.length === 0 ? (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', padding: 'var(--space-2)' }}>No updates yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', maxHeight: 240, overflowY: 'auto' }}>
                {comments.map((c) => (
                  <div key={c.id} style={{ padding: 'var(--space-2)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)' }}>
                    <div style={{ color: 'var(--color-text-primary)', marginBottom: 4, wordBreak: 'break-word' }}>{c.message}</div>
                    {c.photo_urls && (Array.isArray(c.photo_urls) ? c.photo_urls : JSON.parse(c.photo_urls as string)).length > 0 && (
                      <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap', marginTop: 4 }}>
                        {(Array.isArray(c.photo_urls) ? c.photo_urls : JSON.parse(c.photo_urls as string)).map((url: string, i: number) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                          </a>
                        ))}
                      </div>
                    )}
                    <div style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: 10 }}>{timeAgo(c.created_at)}</div>
                  </div>
                ))}
              </div>
            )}

            <div onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', cursor: 'pointer', flexShrink: 0 }}>
                    <Paperclip size={16} />
                    <input type="file" accept="image/*,.pdf" multiple style={{ display: 'none' }} onChange={handlePhotoSelect} />
                  </label>
                  <textarea
                    className="input"
                    style={{ minHeight: 52, resize: 'none', fontSize: 'var(--text-xs)', flex: 1 }}
                    placeholder="Add an update, photo, or change status..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendUpdate() }
                    }}
                  />
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSendUpdate}
                  disabled={sending || (!newMessage.trim() && photoFiles.length === 0)}
                  style={{ borderRadius: 'var(--radius-sm)', minHeight: 36 }}
                >
                  <Send size={14} />
                </button>
              </div>

              {photoFiles.length > 0 && (
                <div style={{ display: 'flex', gap: 'var(--space-1)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {photoFiles.map((p, i) => (
                    <div key={i} style={{ position: 'relative', width: 48, height: 48 }}>
                      <img src={p.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: 'var(--color-error)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, fontSize: 10 }}
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
      </div>
    </div>
  )
}
