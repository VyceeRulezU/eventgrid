import { useEffect, useState, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ListChecks, ChevronDown, ChevronUp, Send, Paperclip, X, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { compressImage } from '@/lib/compressImage'
import { uploadFile } from '@/lib/storage'
import { AdminPageHero } from '@/components/shared/AdminPageHero'
import { Table } from '@/components/ui/Table'
import type { TableColumn } from '@/components/ui/Table'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import type { Task, TaskComment } from '@/types'
import styles from '@/pages/team/MyTasksPage.module.css'

interface MyTask extends Task {
  event: { id: string; name: string }
  phase: { phase_name: string } | null
  assignee: { display_name: string | null; avatar_url: string | null } | null
}

const PRIORITY_BADGE: Record<string, string> = {
  low: 'badge-low', medium: 'badge-medium', high: 'badge-high', urgent: 'badge-urgent',
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
] as const

function formatDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function isOverdue(task: MyTask) {
  return !!task.due_datetime && task.status !== 'done' && new Date(task.due_datetime) < new Date()
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const columns: TableColumn[] = [
  { key: 'event', label: 'Event' },
  { key: 'title', label: 'Task' },
  { key: 'phase', label: 'Phase' },
  { key: 'priority', label: 'Priority' },
  { key: 'due', label: 'Due' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '' },
]

export function AdminMyTasksPage() {
  const user = useAuthStore((s) => s.user)
  const showNotification = useUIStore((s) => s.showNotification)

  const [tasks, setTasks] = useState<MyTask[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, TaskComment[]>>({})
  const [newMessages, setNewMessages] = useState<Record<string, string>>({})
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [uploadingMap, setUploadingMap] = useState<Record<string, { file: File; preview: string }[]>>({})
  const [filterEventId, setFilterEventId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    loadTasks()
  }, [user])

  async function loadTasks() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, event:events!inner(id, name), phase:event_phases(phase_name), assignee:profiles!tasks_assignee_id_fkey(display_name, avatar_url)')
        .eq('assignee_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) {
        console.error('MyTasks load error:', error)
      }
      if (data) {
        setTasks(data as unknown as MyTask[])
      }
    } catch (err) {
      console.error('MyTasks load exception:', err)
    }
    setLoading(false)
  }

  async function loadComments(taskId: string) {
    const { data } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })
    if (data) {
      setComments((prev) => ({ ...prev, [taskId]: data as unknown as TaskComment[] }))
    }
  }

  async function handleStatusChange(task: MyTask, newStatus: string) {
    setUpdatingId(task.id)
    const update: Partial<Task> = { status: newStatus as Task['status'] }
    if (newStatus === 'done') {
      update.completed_at = new Date().toISOString()
    } else if (task.status === 'done') {
      update.completed_at = null
    }
    const { error } = await supabase.from('tasks').update(update).eq('id', task.id)
    if (error) {
      showNotification({ variant: 'error', title: 'Update failed', message: error.message })
      setUpdatingId(null)
      return
    }
    setUpdatingId(null)
    loadTasks()
  }

  function handlePhotoSelect(taskId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const entries = files.map((f) => ({ file: f, preview: URL.createObjectURL(f) }))
    setUploadingMap((prev) => ({ ...prev, [taskId]: [...(prev[taskId] || []), ...entries] }))
  }

  function removePhoto(taskId: string, index: number) {
    const current = uploadingMap[taskId] || []
    URL.revokeObjectURL(current[index].preview)
    setUploadingMap((prev) => ({
      ...prev,
      [taskId]: current.filter((_, i) => i !== index),
    }))
  }

  async function handleSendUpdate(taskId: string) {
    const message = newMessages[taskId] || ''
    const photos = uploadingMap[taskId] || []
    if ((!message.trim() && photos.length === 0) || !user) return
    setSendingId(taskId)

    const urls: string[] = []
    const task = tasks.find((t) => t.id === taskId)
    for (const p of photos) {
      const ext = p.file.name.split('.').pop()
      const path = `${task?.event_id}/comments/${taskId}/${crypto.randomUUID()}.${ext}`
      const blob = await compressImage(p.file)
      try {
        const { url: publicUrl } = await uploadFile('event-media', blob, path)
        urls.push(publicUrl)
      } catch {
        showNotification({ variant: 'error', title: 'Upload failed', message: 'Could not upload photo' })
        continue
      }
    }

    const { error } = await supabase.from('task_comments').insert({
      task_id: taskId,
      user_id: user.id,
      message: message.trim() || 'Sent a photo update',
      photo_urls: JSON.stringify(urls),
    })

    if (error) {
      showNotification({ variant: 'error', title: 'Failed to send', message: error.message })
      setSendingId(null)
      return
    }

    setNewMessages((prev) => ({ ...prev, [taskId]: '' }))
    ;(uploadingMap[taskId] || []).forEach((p) => URL.revokeObjectURL(p.preview))
    setUploadingMap((prev) => ({ ...prev, [taskId]: [] }))
    setSendingId(null)
    loadComments(taskId)
    loadTasks()
  }

  function toggleExpand(taskId: string) {
    if (expandedId === taskId) {
      setExpandedId(null)
    } else {
      setExpandedId(taskId)
      if (!comments[taskId]) loadComments(taskId)
    }
  }

  const uniqueEvents = [...new Map(tasks.map(t => [t.event.id, t.event])).values()]

  const filteredTasks = filterEventId
    ? tasks.filter(t => t.event.id === filterEventId)
    : tasks

  const sorted = [...filteredTasks].sort((a, b) => {
    const nameA = a.event.name.toLowerCase()
    const nameB = b.event.name.toLowerCase()
    if (nameA < nameB) return -1
    if (nameA > nameB) return 1
    return 0
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', width: '100%' }}>
      <AdminPageHero
        icon={ListChecks}
        title="My Tasks"
        subtitle={`${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''} assigned to you`}
        actions={
          uniqueEvents.length > 1 ? (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu
                trigger={<span>{uniqueEvents.find(e => e.id === filterEventId)?.name || 'All Events'}</span>}
                items={[
                  { label: 'All Events', value: '' },
                  ...uniqueEvents.map(e => ({ label: e.name, value: e.id })),
                ]}
                onSelect={(item) => setFilterEventId(item.value || null)}
              />
            </div>
          ) : undefined
        }
      />

      <Table
        columns={columns}
        minWidth="800px"
        loading={loading}
        empty={!loading && tasks.length === 0}
        emptyIcon={ListChecks}
        emptyTitle="No tasks assigned to you"
        emptyDescription="Tasks assigned to you across all events will appear here"
        footer={<span>{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</span>}
      >
        {sorted.map((task) => {
          const overdue = isOverdue(task)
          const isExpanded = expandedId === task.id
          const taskComments = comments[task.id] || []
          const taskPhotos = uploadingMap[task.id] || []

          return (
            <Fragment key={task.id}>
              <tr>
                <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', fontSize: 'var(--text-sm)' }}>
                  <Link to={`/events/${task.event.id}`} style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600, fontSize: 'var(--text-xs)' }}>
                    {task.event.name}
                  </Link>
                </td>
                <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', fontSize: 'var(--text-sm)', minWidth: 200 }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{task.title}</div>
                  {task.description && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{task.description}</div>
                  )}
                </td>
                <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', fontSize: 'var(--text-sm)' }}>
                  {task.phase?.phase_name ? (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{task.phase.phase_name}</span>
                  ) : (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>—</span>
                  )}
                </td>
                <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', fontSize: 'var(--text-sm)' }}>
                  <span className={`badge ${PRIORITY_BADGE[task.priority] || 'badge-medium'}`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                </td>
                <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', fontSize: 'var(--text-sm)' }}>
                  {task.due_datetime ? (
                    <span style={{ fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: 4, color: overdue ? 'var(--color-error)' : 'var(--color-text-secondary)', fontWeight: overdue ? 600 : 400 }}>
                      <Calendar size={11} />
                      {formatDate(task.due_datetime)}
                    </span>
                  ) : (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>—</span>
                  )}
                </td>
                <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', fontSize: 'var(--text-sm)' }}>
                  <div onClick={(e) => e.stopPropagation()} style={{ minWidth: 130 }}>
                    <DropdownMenu
                      trigger={
                        <span className={`badge badge-${task.status === 'done' ? 'green' : task.status === 'blocked' ? 'red' : task.status === 'in_progress' ? 'yellow' : 'grey'}`}>
                          <span className="badge-dot" />
                          {STATUS_OPTIONS.find((s) => s.value === task.status)?.label || task.status}
                        </span>
                      }
                      items={STATUS_OPTIONS.map((s) => ({ label: s.label, value: s.value }))}
                      onSelect={(item) => handleStatusChange(task, item.value)}
                      disabled={updatingId === task.id}
                    />
                  </div>
                </td>
                <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => toggleExpand(task.id)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 36, height: 36, border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-1)',
                      color: 'var(--color-text-secondary)', cursor: 'pointer',
                    }}
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </td>
              </tr>
              {isExpanded && (
                <tr>
                  <td colSpan={7} style={{ padding: 'var(--space-3) var(--space-5)', background: 'var(--color-surface-1)' }}>
                    <div className={styles.expandedSection}>
                      {task.description && (
                        <div className={styles.description}>{task.description}</div>
                      )}

                      <div className={styles.statusRow}>
                        <span className={styles.statusLabel}>Status:</span>
                        <div onClick={(e) => e.stopPropagation()} style={{ minWidth: 140 }}>
                          <DropdownMenu
                            trigger={<span>{STATUS_OPTIONS.find((s) => s.value === task.status)?.label || task.status}</span>}
                            items={STATUS_OPTIONS.map((s) => ({ label: s.label, value: s.value }))}
                            onSelect={(item) => handleStatusChange(task, item.value)}
                            disabled={updatingId === task.id}
                          />
                        </div>
                      </div>

                      <div className={styles.updatesSection}>
                        <div className={styles.updatesTitle}>Updates ({taskComments.length})</div>

                        {taskComments.length === 0 ? (
                          <div className={styles.updatesEmpty}>No updates yet</div>
                        ) : (
                          <div className={styles.updatesList}>
                            {taskComments.map((c) => (
                              <div key={c.id} className={styles.updateItem}>
                                <div className={styles.updateMessage}>{c.message}</div>
                                {c.photo_urls && (Array.isArray(c.photo_urls) ? c.photo_urls : JSON.parse(c.photo_urls as string)).length > 0 && (
                                  <div className={styles.updatePhotos}>
                                    {(Array.isArray(c.photo_urls) ? c.photo_urls : JSON.parse(c.photo_urls as string)).map((url: string, i: number) => (
                                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                        <img src={url} alt="" className={styles.updatePhoto} />
                                      </a>
                                    ))}
                                  </div>
                                )}
                                <div className={styles.updateTime}>{timeAgo(c.created_at)}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div onClick={(e) => e.stopPropagation()}>
                          <div className={styles.commentForm}>
                            <div className={styles.commentInputRow}>
                              <label className={styles.attachBtn}>
                                <Paperclip size={16} />
                                <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => handlePhotoSelect(task.id, e)} />
                              </label>
                              <textarea
                                className={`input ${styles.commentInput}`}
                                placeholder="Add an update, photo, or change status..."
                                value={newMessages[task.id] || ''}
                                onChange={(e) => setNewMessages((prev) => ({ ...prev, [task.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSendUpdate(task.id)
                                  }
                                }}
                              />
                            </div>
                            <button
                              className={`btn btn-primary btn-sm ${styles.sendBtn}`}
                              onClick={() => handleSendUpdate(task.id)}
                              disabled={sendingId === task.id || (!(newMessages[task.id] || '').trim() && taskPhotos.length === 0)}
                              data-tooltip="Send update"
                            >
                              <Send size={14} />
                            </button>
                          </div>

                          {taskPhotos.length > 0 && (
                            <div className={styles.photoPreviewRow}>
                              {taskPhotos.map((p, i) => (
                                <div key={i} className={styles.photoPreviewItem}>
                                  <img src={p.preview} alt="" className={styles.photoPreviewImg} />
                                  <button type="button" className={styles.photoRemoveBtn} onClick={() => removePhoto(task.id, i)}>
                                    <X size={10} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          )
        })}
      </Table>
    </div>
  )
}
