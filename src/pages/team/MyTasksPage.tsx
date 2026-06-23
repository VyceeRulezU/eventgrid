import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ListChecks, Plus, Eye, Calendar, User, ChevronLeft, ChevronRight, Trash2, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { PageHero } from '@/components/shared/PageHero'
import { Table } from '@/components/ui/Table'
import type { TableColumn } from '@/components/ui/Table'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { AdminCreateTaskModal } from '@/features/team/AdminCreateTaskModal'
import { TaskDetailModal } from '@/features/team/TaskDetailModal'
import type { TaskDetail } from '@/features/team/TaskDetailModal'

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

function isOverdue(task: TaskDetail) {
  return !!task.due_datetime && task.status !== 'done' && new Date(task.due_datetime) < new Date()
}

const columns: TableColumn[] = [
  { key: 'event', label: 'Event' },
  { key: 'title', label: 'Task' },
  { key: 'phase', label: 'Phase' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'priority', label: 'Priority' },
  { key: 'due', label: 'Due' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '' },
]

export function MyTasksPage() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const showNotification = useUIStore((s) => s.showNotification)

  const [tasks, setTasks] = useState<TaskDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [filterEventId, setFilterEventId] = useState<string | null>(null)
  const [detailTask, setDetailTask] = useState<TaskDetail | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [profiles, setProfiles] = useState<{ id: string; display_name: string | null; email: string }[]>([])
  const [confirmDelete, setConfirmDelete] = useState<TaskDetail | null>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const isPlanner = role === 'planner'

  useEffect(() => {
    if (!user) { setLoading(false); return }
    loadTasks()
  }, [user])

  async function loadTasks() {
    setLoading(true)
    try {
      let query = supabase
        .from('tasks')
        .select('*, event:events!inner(id, name), phase:event_phases(phase_name), assignee:profiles!tasks_assignee_id_fkey(display_name, email, avatar_url)')
        .order('created_at', { ascending: false })

      if (isPlanner) {
        const { data: teamMembers } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'team_member')

        const teamIds = (teamMembers || []).map((p) => p.id)
        if (teamIds.length > 0) {
          const csv = teamIds.join(',')
          query = query.or(`created_by.eq.${user!.id},assignee_id.in.(${csv})`)
        } else {
          query = query.eq('created_by', user!.id)
        }
      } else {
        query = query.eq('assignee_id', user!.id)
      }

      const { data, error } = await query
      if (error) console.error('MyTasks load error:', error)
      if (data) setTasks(data as unknown as TaskDetail[])
    } catch (err) {
      console.error('MyTasks load exception:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isPlanner) {
      supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('role', ['team_member', 'planner', 'coordinator'])
        .then(({ data }) => {
          if (data) setProfiles(data.map((p: any) => ({ id: p.id, display_name: p.display_name, email: p.email })))
        })
    }
  }, [])

  async function handleReassign(taskId: string, userId: string) {
    setUpdatingId(taskId)
    const { error } = await supabase.from('tasks').update({ assignee_id: userId || null }).eq('id', taskId)
    if (error) showNotification({ variant: 'error', title: 'Reassign failed', message: error.message })
    setUpdatingId(null)
    loadTasks()
  }

  async function handleDeleteTask(taskId: string) {
    const { data, error } = await supabase.from('tasks').delete().eq('id', taskId).select()
    if (error || !data || data.length === 0) {
      showNotification({ variant: 'error', title: 'Delete failed', message: error?.message || 'Task not found or permission denied' })
      return
    }
    showNotification({ variant: 'success', title: 'Task deleted' })
    setConfirmDelete(null)
    loadTasks()
  }

  async function handleStatusChange(task: TaskDetail, newStatus: string) {
    setUpdatingId(task.id)
    const update: Partial<{ status: string; completed_at: string | null }> = { status: newStatus }
    if (newStatus === 'done') update.completed_at = new Date().toISOString()
    else if (task.status === 'done') update.completed_at = null

    const { error } = await supabase.from('tasks').update(update).eq('id', task.id)
    if (error) showNotification({ variant: 'error', title: 'Status update failed', message: error.message })
    setUpdatingId(null)
    loadTasks()
  }

  const uniqueEvents = [...new Map(tasks.map((t) => [t.event.id, t.event])).values()]

  const filteredTasks = filterEventId
    ? tasks.filter((t) => t.event.id === filterEventId)
    : tasks

  const sorted = [...filteredTasks].sort((a, b) => {
    const nameA = a.event.name.toLowerCase()
    const nameB = b.event.name.toLowerCase()
    if (nameA < nameB) return -1
    if (nameA > nameB) return 1
    return 0
  })

  useEffect(() => { setPage(1) }, [filterEventId])
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const displayed = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', width: '100%' }}>
      <PageHero
        icon={ListChecks}
        title={isPlanner ? 'My Tasks' : 'My Tasks'}
        subtitle={`${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''}` + (isPlanner ? ' created' : ' assigned to you')}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {isPlanner && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowCreate(true)}
              >
                <Plus size={14} />
                Create Task
              </button>
            )}
            {uniqueEvents.length > 1 && (
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu
                  trigger={<span>{uniqueEvents.find((e) => e.id === filterEventId)?.name || 'All Events'}</span>}
                  items={[
                    { label: 'All Events', value: '' },
                    ...uniqueEvents.map((e) => ({ label: e.name, value: e.id })),
                  ]}
                  onSelect={(item) => setFilterEventId(item.value || null)}
                />
              </div>
            )}
          </div>
        }
      />

      <Table
        columns={columns}
        minWidth="900px"
        loading={loading}
        empty={!loading && tasks.length === 0}
        emptyIcon={ListChecks}
        emptyTitle={isPlanner ? 'No tasks created' : 'No tasks assigned to you'}
        emptyDescription="Tasks will appear here once created or assigned"
        footer={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span>Showing {displayed.length} of {sorted.length} task{sorted.length !== 1 ? 's' : ''}</span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginLeft: 'auto' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ minWidth: 32 }}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        }
      >
        {displayed.map((task) => {
          const overdue = isOverdue(task)
          return (
            <tr key={task.id}>
              <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', fontSize: 'var(--text-sm)' }}>
                <Link
                  to={`/events/${task.event.id}`}
                  style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600, fontSize: 'var(--text-xs)' }}
                >
                  {task.event.name}
                </Link>
              </td>
              <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', fontSize: 'var(--text-sm)', minWidth: 200 }}>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{task.title}</div>
                {task.description && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                    {task.description}
                  </div>
                )}
              </td>
              <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', fontSize: 'var(--text-sm)' }}>
                {task.phase?.phase_name ? (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{task.phase.phase_name}</span>
                ) : (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>—</span>
                )}
              </td>
              <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', fontSize: 'var(--text-sm)' }} onClick={(e) => e.stopPropagation()}>
                {isPlanner ? (
                  <DropdownMenu
                    trigger={
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        <User size={12} />
                        {task.assignee?.display_name || 'Unassigned'}
                      </span>
                    }
                    items={[
                      { label: 'Unassigned', value: '' },
                      ...profiles.map((p) => ({
                        label: p.display_name || p.email,
                        value: p.id,
                      })),
                    ]}
                    onSelect={(item) => handleReassign(task.id, item.value)}
                    disabled={updatingId === task.id}
                  />
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    <User size={12} />
                    {task.assignee?.display_name || 'Unassigned'}
                  </span>
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
                <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                  {isPlanner && (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(task)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 36, height: 36, border: '1px solid var(--color-border-subtle)',
                        borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-1)',
                        color: 'var(--color-error)', cursor: 'pointer',
                      }}
                      aria-label="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDetailTask(task)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 36, height: 36, border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-1)',
                      color: 'var(--color-text-secondary)', cursor: 'pointer',
                    }}
                    aria-label="View details"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </td>
            </tr>
          )
        })}
      </Table>

      {showCreate && (
        <AdminCreateTaskModal
          onCreated={() => { setShowCreate(false); loadTasks() }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onUpdate={() => loadTasks()}
        />
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-card__header">
              <h3 className="modal-card__title"><AlertTriangle size={16} /> Delete Task</h3>
              <button className="modal-card__close" onClick={() => setConfirmDelete(null)}><Trash2 size={18} /></button>
            </div>
            <div className="modal-card__body" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              <p style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                Delete "{confirmDelete.title}"?
              </p>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                This action cannot be undone. All task data will be permanently removed.
              </p>
            </div>
            <div className="modal-card__footer">
              <button className="btn btn-destructive btn-sm" onClick={() => handleDeleteTask(confirmDelete.id)}>
                <Trash2 size={14} /> Delete
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
