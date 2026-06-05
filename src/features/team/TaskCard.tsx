import { useState } from 'react'
import { ChevronDown, ChevronUp, Calendar, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import type { Task } from '@/types'

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

export function TaskCard({ task, onUpdate }: TaskCardProps) {
  const showNotification = useUIStore((s) => s.showModal)
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)
  const overdue = isOverdue(task)

  async function handleStatusChange(newStatus: string) {
    setUpdating(true)

    const update: Partial<Task> = { status: newStatus as Task['status'] }
    if (newStatus === 'done') {
      update.completed_at = new Date().toISOString()
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
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Status:</span>
            <select
              className="input"
              style={{ minHeight: 32, fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-2)', width: 'auto' }}
              value={task.status}
              disabled={updating}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
