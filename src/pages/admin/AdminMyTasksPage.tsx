import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ListChecks, Plus, Eye, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { AdminPageHero } from '@/components/shared/AdminPageHero'
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

export function AdminMyTasksPage() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)

  const [tasks, setTasks] = useState<TaskDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [filterEventId, setFilterEventId] = useState<string | null>(null)
  const [detailTask, setDetailTask] = useState<TaskDetail | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

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
      let query = supabase
        .from('tasks')
        .select('*, event:events!inner(id, name), phase:event_phases(phase_name), assignee:profiles!tasks_assignee_id_fkey(display_name, email, avatar_url)')
        .order('created_at', { ascending: false })

      if (role === 'super_admin') {
        const [{ data: superAdmins }, { data: teamMembers }] = await Promise.all([
          supabase.from('profiles').select('id').eq('is_super_admin', true),
          supabase.from('profiles').select('id').eq('role', 'team_member'),
        ])
        const ids = [
          ...new Set([
            ...(superAdmins || []).map((p) => p.id),
            ...(teamMembers || []).map((p) => p.id),
          ]),
        ]
        if (ids.length > 0) {
          const csv = ids.join(',')
          query = query.or(`created_by.in.(${csv}),assignee_id.in.(${csv})`)
        } else {
          query = query.eq('created_by', user!.id)
        }
      } else {
        query = query.eq('assignee_id', user!.id)
      }

      const { data, error } = await query
      if (error) console.error('Admin tasks load error:', error)
      if (data) setTasks(data as unknown as TaskDetail[])
    } catch (err) {
      console.error('Admin tasks load exception:', err)
    }
    setLoading(false)
  }

  async function handleStatusChange(task: TaskDetail, newStatus: string) {
    setUpdatingId(task.id)
    const update: Partial<{ status: string; completed_at: string | null }> = { status: newStatus }
    if (newStatus === 'done') update.completed_at = new Date().toISOString()
    else if (task.status === 'done') update.completed_at = null

    const { error } = await supabase.from('tasks').update(update).eq('id', task.id)
    if (error) {
      console.error('Status update failed:', error)
    }
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
      <AdminPageHero
        icon={ListChecks}
        title="Team Tasks"
        subtitle={`${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''} across all events`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowCreate(true)}
            >
              <Plus size={14} />
              Create Task
            </button>
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
        emptyTitle="No tasks"
        emptyDescription="Tasks created across events will appear here"
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
              <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', fontSize: 'var(--text-sm)', maxWidth: 180, overflow: 'hidden' }}>
                <Link
                  to={`/events/${task.event.id}`}
                  style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600, fontSize: 'var(--text-xs)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {task.event.name}
                </Link>
              </td>
              <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', fontSize: 'var(--text-sm)', minWidth: 240, maxWidth: 320 }}>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                {task.description && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
              <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', fontSize: 'var(--text-sm)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  <User size={12} />
                  {task.assignee?.display_name || 'Unassigned'}
                </span>
              </td>
              <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', fontSize: 'var(--text-sm)' }}>
                <span className={`badge ${PRIORITY_BADGE[task.priority] || 'badge-medium'}`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              </td>
              <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>
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
    </div>
  )
}
