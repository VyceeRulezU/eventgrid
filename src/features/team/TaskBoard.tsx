import { useEffect, useState } from 'react'
import { useResolvedEventId } from '@/hooks/useResolvedEventId'
import { Columns, List, Plus, ListChecks } from 'lucide-react'
import { PageHero } from '@/components/shared/PageHero'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { TaskCard } from './TaskCard'
import { CreateTaskModal } from './CreateTaskModal'
import { TaskDetailModal } from './TaskDetailModal'
import type { TaskDetail } from './TaskDetailModal'
import type { Task, EventPhase } from '@/types'
import styles from './TaskBoard.module.css'

interface TaskWithAssignee extends Task {
  assignee: { display_name: string | null; avatar_url: string | null } | null
}

interface TeamMember {
  user_id: string
  display_name: string | null
  email: string
  role: string
}

const COLUMNS = [
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
  { key: 'blocked', label: 'Blocked' },
] as const

export function TaskBoard() {
  const { eventId, paramId } = useResolvedEventId()
  const user = useAuthStore((s) => s.user)
  const profileRole = useAuthStore((s) => s.role)
  const showNotification = useUIStore((s) => s.showNotification)
  const [eventName, setEventName] = useState('')
  const [tasks, setTasks] = useState<TaskWithAssignee[]>([])
  const [phases, setPhases] = useState<EventPhase[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'list' : 'kanban'
  )
  const [showCreate, setShowCreate] = useState(false)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [detailTask, setDetailTask] = useState<TaskDetail | null>(null)

  function openDetails(task: TaskWithAssignee) {
    const phase = phases.find((p) => p.id === task.phase_id)
    setDetailTask({
      ...task,
      event: { id: eventId!, name: eventName },
      phase: phase ? { phase_name: phase.phase_name } : null,
      assignee: task.assignee ? {
        display_name: task.assignee.display_name,
        email: members.find((m) => m.user_id === task.assignee_id)?.email || undefined,
        avatar_url: task.assignee.avatar_url,
      } : null,
    })
  }

  async function handleRefreshDetail(taskId: string) {
    const { data } = await supabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assignee_id_fkey(display_name, avatar_url)')
      .eq('id', taskId)
      .single()
    if (data) {
      const updatedTask = data as unknown as TaskWithAssignee
      const phase = phases.find((p) => p.id === updatedTask.phase_id)
      setDetailTask({
        ...updatedTask,
        event: { id: eventId!, name: eventName },
        phase: phase ? { phase_name: phase.phase_name } : null,
        assignee: updatedTask.assignee ? {
          display_name: updatedTask.assignee.display_name,
          email: members.find((m) => m.user_id === updatedTask.assignee_id)?.email || undefined,
          avatar_url: updatedTask.assignee.avatar_url,
        } : null,
      })
    } else {
      setDetailTask(null)
    }
  }

  useEffect(() => {
    if (!eventId) return
    supabase.from('events').select('name').eq('id', eventId).single().then(({ data }) => { if (data) setEventName(data.name) })
    loadData()
  }, [eventId])



  async function loadData() {
    setLoading(true)

    const [{ data: tasksData }, { data: eaData }, { data: phasesData }] = await Promise.all([
      supabase
        .from('tasks')
        .select('*, assignee:profiles!tasks_assignee_id_fkey(display_name, avatar_url)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true }),
      supabase
        .from('event_access')
        .select('user_id, role')
        .eq('event_id', eventId),
      supabase
        .from('event_phases')
        .select('*')
        .eq('event_id', eventId)
        .order('phase_number'),
    ])

    if (tasksData) setTasks(tasksData as unknown as TaskWithAssignee[])

    if (eaData) {
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
      setMembers(
        eaData.map((r: any) => ({
          user_id: r.user_id,
          display_name: profileMap[r.user_id]?.display_name || null,
          email: profileMap[r.user_id]?.email || '',
          role: r.role,
        }))
      )
    } else {
      setMembers([])
    }

    if (phasesData) setPhases(phasesData as EventPhase[])

    setLoading(false)
  }

  function handleDragOver(e: React.DragEvent, colKey: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(colKey)
  }

  function handleDragLeave(colKey: string) {
    setDragOverCol((prev) => prev === colKey ? null : prev)
  }

  async function handleDrop(e: React.DragEvent, colKey: string) {
    e.preventDefault()
    setDragOverCol(null)
    const taskId = e.dataTransfer.getData('text/plain')
    if (!taskId || !eventId) return

    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === colKey) return

    setTasks(tasks.map((t) => t.id === taskId ? { ...t, status: colKey as Task['status'] } : t))

    const update: Partial<Task> = { status: colKey as Task['status'] }
    if (colKey === 'done') {
      update.completed_at = new Date().toISOString()
    } else if (task.status === 'done') {
      update.completed_at = null
    }

    const { error } = await supabase
      .from('tasks')
      .update(update)
      .eq('id', taskId)

    if (error) {
      setTasks(tasks)
      showNotification({ variant: 'error', title: 'Move failed', message: error.message })
    }
  }

  const eventRole = members.find(m => m.user_id === user?.id)?.role
  const canCreate = profileRole === 'planner' || profileRole === 'coordinator' || profileRole === 'super_admin' || eventRole === 'coordinator'

  const grouped = COLUMNS.reduce<Record<string, TaskWithAssignee[]>>((acc, col) => {
    acc[col.key] = tasks.filter((t) => t.status === col.key)
    return acc
  }, {})

  if (loading) {
    return (
      <div className={styles.page}>
        <PageHero icon={ListChecks} title={`Task Board${eventName ? ` | ${eventName}` : ''}`} subtitle="Loading tasks..." backTo={`/events/${paramId}`} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 'var(--space-4)' }}>
          <img src="/ng-new-logo.png" alt="Loading" style={{ width: 48, height: 48, opacity: 0.5 }} />
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading tasks...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
        <PageHero
          icon={ListChecks}
          title={`Task Board${eventName ? ` | ${eventName}` : ''}`}
          subtitle={`${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}
          backTo={`/events/${paramId}`}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewBtn} ${viewMode === 'kanban' ? styles.viewBtnActive : styles.viewBtnInactive}`}
                onClick={() => setViewMode('kanban')}
                aria-label="Kanban view"
              >
                <Columns size={14} />
              </button>
              <button
                className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : styles.viewBtnInactive}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <List size={14} />
              </button>
            </div>
            {canCreate && (
              <button className="btn btn-primary btn-sm" style={{ borderRadius: 'var(--radius-sm)' }} onClick={() => setShowCreate(true)}>
                <Plus size={14} />
                Add Task
              </button>
            )}
          </div>
        }
      />

      {showCreate && (
        <CreateTaskModal
          eventId={eventId!}
          members={members}
          phases={phases}
          onCreated={() => {
            setShowCreate(false)
            loadData()
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {!showCreate && tasks.length === 0 ? (
        <div className={styles.emptyState}>
          <Columns size={24} style={{ marginBottom: 'var(--space-2)', opacity: 0.4 }} />
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>No tasks yet</div>
          <div style={{ fontSize: 'var(--text-xs)', marginTop: 4 }}>Create your first task to get started</div>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className={styles.kanbanGrid}>
          {COLUMNS.map((col) => (
            <div key={col.key}>
              <div className={styles.kanbanHeader}>
                <span>{col.label}</span>
                <span className={styles.kanbanCount}>{grouped[col.key]?.length || 0}</span>
              </div>
              <div
                className={styles.kanbanCol}
                style={{
                  backgroundColor: dragOverCol === col.key ? 'var(--color-surface-2)' : undefined,
                  borderRadius: 'var(--radius-lg)',
                  padding: dragOverCol === col.key ? 'var(--space-2)' : undefined,
                  transition: 'background-color var(--transition-fast)',
                  minHeight: 60,
                }}
                onDragOver={(e) => handleDragOver(e, col.key)}
                onDragLeave={() => handleDragLeave(col.key)}
                onDrop={(e) => handleDrop(e, col.key)}
              >
                {(grouped[col.key] || []).map((task) => (
                  <TaskCard key={task.id} task={task} onUpdate={loadData} onOpenDetails={openDetails} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.listView} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {COLUMNS.map((col) => {
            const items = grouped[col.key] || []
            if (items.length === 0) return null
            return (
              <div key={col.key}>
                <div className={styles.listHeader}>
                  {col.label} ({items.length})
                </div>
                <div className={styles.listSection}>
                  {items.map((task) => (
                    <TaskCard key={task.id} task={task} onUpdate={loadData} onOpenDetails={openDetails} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onUpdate={() => {
            loadData()
            handleRefreshDetail(detailTask.id)
          }}
        />
      )}
    </div>
  )
}
