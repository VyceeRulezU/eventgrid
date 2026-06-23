import { useEffect, useState } from 'react'
import { X, Send, Paperclip, Calendar, User, Flag, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { compressImage } from '@/lib/compressImage'
import { uploadFile } from '@/lib/storage'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { CalendarModal } from '@/components/ui/CalendarModal'
import type { Task, TaskComment } from '@/types'
import styles from './TaskDetailModal.module.css'

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
  const [members, setMembers] = useState<{ user_id: string; display_name: string | null; email: string; role: string }[]>([])

  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description || '')
  const [editPriority, setEditPriority] = useState(task.priority)
  const [editDueDate, setEditDueDate] = useState(task.due_datetime ? task.due_datetime.split('T')[0] : '')
  const [editPhaseId, setEditPhaseId] = useState(task.phase_id || '')
  const [editAssigneeId, setEditAssigneeId] = useState(task.assignee_id || '')
  const [phases, setPhases] = useState<{ id: string; phase_name: string }[]>([])
  const [savingEdit, setSavingEdit] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    loadComments()
    loadMembers()
    loadPhases()
  }, [])

  async function loadMembers() {
    const { data: eaData } = await supabase
      .from('event_access')
      .select('user_id, role')
      .eq('event_id', task.event_id)
    if (!eaData) return
    const userIds = [...new Set(eaData.map((r: any) => r.user_id))]
    let profileMap: Record<string, { display_name: string | null; email: string }> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', userIds)
      if (profiles) {
        for (const p of profiles) {
          profileMap[p.id] = { display_name: p.display_name, email: p.email }
        }
      }
    }
    setMembers(eaData.map((r: any) => ({
      user_id: r.user_id,
      display_name: profileMap[r.user_id]?.display_name || null,
      email: profileMap[r.user_id]?.email || '',
      role: r.role,
    })))
  }



  async function loadComments() {
    const { data } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true })
    if (data) setComments(data as unknown as TaskComment[])
  }

  async function loadPhases() {
    const { data } = await supabase
      .from('event_phases')
      .select('id, phase_name')
      .eq('event_id', task.event_id)
      .order('phase_number')
    if (data) setPhases(data)
  }

  async function handleDelete() {
    const { error } = await supabase.from('tasks').delete().eq('id', task.id)
    if (error) {
      showNotification({ variant: 'error', title: 'Delete failed', message: error.message })
    } else {
      showNotification({ variant: 'success', title: 'Task deleted' })
      onClose()
      onUpdate()
    }
  }

  async function handleSaveEdit() {
    if (!editTitle.trim()) {
      showNotification({ variant: 'error', title: 'Validation error', message: 'Title cannot be empty.' })
      return
    }
    setSavingEdit(true)
    const { error } = await supabase
      .from('tasks')
      .update({
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        priority: editPriority,
        due_datetime: editDueDate ? new Date(editDueDate).toISOString() : null,
        phase_id: editPhaseId || null,
        assignee_id: editAssigneeId || null
      })
      .eq('id', task.id)

    if (error) {
      showNotification({ variant: 'error', title: 'Failed to update task', message: error.message })
    } else {
      showNotification({ variant: 'success', title: 'Task updated successfully' })
      onUpdate()
      onClose()
    }
    setSavingEdit(false)
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
  const eventRole = members.find(m => m.user_id === user?.id)?.role
  const isManager = role === 'planner' || role === 'coordinator' || role === 'super_admin' || eventRole === 'coordinator'

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className={styles.accentLine} />
        <div className="modal-card__header">
          {isManager ? (
            <input
              type="text"
              className="input"
              style={{ fontSize: 'var(--text-md)', fontWeight: 600, width: '100%', marginRight: '16px' }}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Task Title"
            />
          ) : (
            <h3 className="modal-card__title">{task.title}</h3>
          )}
          <button className="modal-card__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className={`modal-card__body ${styles.body}`}>
          {/* Task info grid */}
          <div className={styles.infoGrid}>
            <div>
              <div className={styles.fieldLabel}>Event</div>
              <div style={{ fontWeight: 600, color: 'var(--color-accent)', padding: '8px 0' }}>{task.event.name}</div>
            </div>
            <div>
              <div className={styles.fieldLabel}>Phase</div>
              {isManager ? (
                <DropdownMenu
                  trigger={
                    <span>{phases.find((p) => p.id === editPhaseId)?.phase_name || 'No Phase'}</span>
                  }
                  items={[
                    { label: 'No Phase', value: '' },
                    ...phases.map((p) => ({ label: p.phase_name, value: p.id }))
                  ]}
                  onSelect={(item) => setEditPhaseId(item.value)}
                />
              ) : (
                <div className={styles.fieldValue}>{task.phase?.phase_name || '—'}</div>
              )}
            </div>
            <div>
              <div className={styles.fieldLabel}>Assignee</div>
              {isManager ? (
                <DropdownMenu
                  trigger={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={14} />
                      {members.find((m) => m.user_id === editAssigneeId)?.display_name || members.find((m) => m.user_id === editAssigneeId)?.email || 'Unassigned'}
                    </span>
                  }
                  items={[
                    { label: 'Unassigned', value: '' },
                    ...members.map((m) => ({
                      label: m.display_name || m.email,
                      value: m.user_id,
                    })),
                  ]}
                  onSelect={(item) => setEditAssigneeId(item.value)}
                />
              ) : (
                <div className={styles.fieldValue} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={12} />
                  {task.assignee?.display_name || 'Unassigned'}
                </div>
              )}
            </div>
            <div>
              <div className={styles.fieldLabel}>Priority</div>
              {isManager ? (
                <DropdownMenu
                  trigger={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Flag size={14} />
                      {editPriority.charAt(0).toUpperCase() + editPriority.slice(1)}
                    </span>
                  }
                  items={[
                    { label: 'Low', value: 'low' },
                    { label: 'Medium', value: 'medium' },
                    { label: 'High', value: 'high' },
                    { label: 'Urgent', value: 'urgent' }
                  ]}
                  onSelect={(item) => setEditPriority(item.value)}
                />
              ) : (
                <div style={{ padding: '8px 0' }}>
                  <span className={`badge ${PRIORITY_BADGE[task.priority] || 'badge-medium'}`}>
                    <Flag size={10} style={{ marginRight: 4 }} />
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                </div>
              )}
            </div>
            <div>
              <div className={styles.fieldLabel}>Due Date</div>
              {isManager ? (
                <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '4px' }}>
                  <button
                    type="button"
                    className={styles.dateFieldBtn}
                    onClick={() => setShowCalendar(true)}
                  >
                    <span className={styles.dateFieldBtnInner}>
                      <Calendar size={14} />
                      <span className={styles.dateFieldBtnText}>
                        {editDueDate ? new Date(editDueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Set Due Date'}
                      </span>
                    </span>
                    {editDueDate && (
                      <span className={styles.dateFieldClearBtn}
                        onClick={(e) => { e.stopPropagation(); setEditDueDate('') }}
                        title="Clear due date"
                      >
                        <X size={12} />
                      </span>
                    )}
                    <ChevronDown size={14} className={styles.dateFieldChevron} />
                  </button>
                  <CalendarModal
                    open={showCalendar}
                    value={editDueDate}
                    onChange={(date) => {
                      setEditDueDate(date)
                      setShowCalendar(false)
                    }}
                    onClose={() => setShowCalendar(false)}
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: overdue ? 'var(--color-error)' : 'var(--color-text-primary)', fontWeight: overdue ? 600 : 400, padding: '8px 0' }}>
                  <Calendar size={12} />
                  {task.due_datetime ? new Date(task.due_datetime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </div>
              )}
            </div>
            <div>
              <div className={styles.fieldLabel}>Status</div>
              <DropdownMenu
                trigger={
                  <span>{STATUS_OPTIONS.find((s) => s.value === task.status)?.label || task.status}</span>
                }
                items={STATUS_OPTIONS.map((s) => ({ label: s.label, value: s.value }))}
                onSelect={(item) => handleStatusChange(item.value)}
                disabled={updating}
              />
            </div>
          </div>

          {/* Description */}
          {isManager ? (
            <div className={styles.infoRow}>
              <div className={styles.sectionLabel}>Description</div>
              <textarea
                className={`input ${styles.descriptionArea}`}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add task description..."
              />
            </div>
          ) : task.description ? (
            <div className={styles.infoRow}>
              <div className={styles.sectionLabel}>Description</div>
              <p className={styles.descriptionText}>{task.description}</p>
            </div>
          ) : null}

          {/* Comments */}
          <div className={styles.commentsSection}>
            <div className={styles.commentsHeader}>Updates ({comments.length})</div>

            {comments.length === 0 ? (
              <div className={styles.commentsEmpty}>No updates yet</div>
            ) : (
              <div className={styles.commentsList}>
                {comments.map((c) => (
                  <div key={c.id} className={styles.comment}>
                    <div className={styles.commentMessage}>{c.message}</div>
                    {c.photo_urls && (Array.isArray(c.photo_urls) ? c.photo_urls : JSON.parse(c.photo_urls as string)).length > 0 && (
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

            <div onClick={(e) => e.stopPropagation()}>
              <div className={styles.commentForm}>
                <div className={styles.commentInputWrapper}>
                  <label className={styles.attachBtn}>
                    <Paperclip size={16} />
                    <input type="file" accept="image/*,.pdf" multiple className={styles.attachInput} onChange={handlePhotoSelect} />
                  </label>
                  <textarea
                    className={`input ${styles.commentTextarea}`}
                    placeholder="Add an update, photo, or change status..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendUpdate() }
                    }}
                  />
                </div>
                <button
                  className={`btn btn-primary btn-sm ${styles.sendBtn}`}
                  onClick={handleSendUpdate}
                  disabled={sending || (!newMessage.trim() && photoFiles.length === 0)}
                >
                  <Send size={14} />
                </button>
              </div>

              {photoFiles.length > 0 && (
                <div className={styles.photoPreviews}>
                  {photoFiles.map((p, i) => (
                    <div key={i} className={styles.photoPreview}>
                      <img src={p.preview} alt="" className={styles.photoPreviewImg} />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className={styles.removePhotoBtn}
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

        {/* Footer actions */}
        <div className={`modal-card__footer ${styles.footer}`}>
          {isManager ? (
            <>
              <button className="btn btn-destructive btn-sm" onClick={() => setConfirmDelete(true)} type="button">
                Delete Task
              </button>
              <div className={styles.footerActions}>
                <button className="btn btn-ghost btn-sm" onClick={onClose} type="button">
                  Cancel
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleSaveEdit} disabled={savingEdit} type="button">
                  {savingEdit ? 'Saving...' : 'Save'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div />
              <button className="btn btn-primary btn-sm" onClick={onClose} type="button">
                Close
              </button>
            </>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="overlay" style={{ zIndex: 1100 }} onClick={() => setConfirmDelete(false)}>
          <div className={`modal-card ${styles.deleteModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.accentLine} />
            <div className="modal-card__header">
              <h3 className="modal-card__title">Delete Task</h3>
              <button className="modal-card__close" onClick={() => setConfirmDelete(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className={`modal-card__body ${styles.deleteBody}`}>
              <p className={styles.deleteTitle}>Are you sure you want to delete this task?</p>
              <p className={styles.deleteDesc}>This will permanently delete the task and all associated comments.</p>
            </div>
            <div className={`modal-card__footer ${styles.footer}`}>
              <div />
              <div className={styles.footerActions}>
                <button className="btn btn-destructive btn-sm" onClick={handleDelete}>
                  Delete
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
