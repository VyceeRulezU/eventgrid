import { useState } from 'react'
import { Plus, X, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { CalendarModal } from '@/components/ui/CalendarModal'

interface TeamMember {
  user_id: string
  display_name: string | null
  email: string
}

interface PhaseOption {
  id: string
  phase_number: number
  phase_name: string
}

interface CreateTaskModalProps {
  eventId: string
  members: TeamMember[]
  phases: PhaseOption[]
  onCreated: () => void
  onCancel: () => void
}

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent',
}

export function CreateTaskModal({ eventId, members, phases, onCreated, onCancel }: CreateTaskModalProps) {
  const user = useAuthStore((s) => s.user)
  const showNotification = useUIStore((s) => s.showModal)
  const [saving, setSaving] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const sorted = [...phases].sort((a, b) => a.phase_number - b.phase_number)
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignee_id: '',
    phase_id: '',
    due_datetime: '',
    priority: 'medium',
  })

  async function handleSave() {
    if (!form.title.trim() || !user) {
      showNotification({ variant: 'warning', title: 'Missing fields', message: 'Title is required' })
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from('tasks')
      .insert({
        event_id: eventId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        assignee_id: form.assignee_id || null,
        phase_id: form.phase_id || null,
        created_by: user.id,
        due_datetime: form.due_datetime || null,
        priority: form.priority,
        status: 'pending',
      })

    if (error) {
      showNotification({ variant: 'error', title: 'Failed to create task', message: error.message })
      setSaving(false)
      return
    }

    showNotification({ variant: 'success', title: 'Task created' })
    setSaving(false)
    onCreated()
  }

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ overflow: 'visible' }}>
        <div className="modal-card-header">
          <h3 className="modal-card-title">New Task</h3>
          <button className="modal-card-close" onClick={onCancel} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-card-body">
          <div style={{ overflowY: 'auto', maxHeight: '40vh', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="input-wrapper">
              <label className="input-label">Title <span className="required">*</span></label>
              <input
                className="input"
                placeholder="What needs to be done?"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
              />
            </div>

            <div className="input-wrapper">
              <label className="input-label">Description</label>
              <textarea
                className="input"
                style={{ minHeight: 80, resize: 'vertical' }}
                placeholder="Task details..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <div className="input-wrapper">
            <label className="input-label">Phase</label>
            <DropdownMenu
              trigger={
                <span style={{ color: form.phase_id ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                  {form.phase_id
                    ? sorted.find((p) => p.id === form.phase_id)?.phase_name || 'Select phase'
                    : 'No phase'}
                </span>
              }
              items={[
                { label: 'No phase', value: '' },
                ...sorted.map((p) => ({
                  label: `Phase ${p.phase_number}: ${p.phase_name}`,
                  value: p.id,
                })),
              ]}
              onSelect={(item) => setForm({ ...form, phase_id: item.value })}
            />
          </div>

          <div className="input-wrapper">
            <label className="input-label">Assignee</label>
            <DropdownMenu
              trigger={
                <span style={{ color: form.assignee_id ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                  {form.assignee_id
                    ? members.find((m) => m.user_id === form.assignee_id)?.display_name
                      || members.find((m) => m.user_id === form.assignee_id)?.email
                      || 'Select member'
                    : 'Unassigned'}
                </span>
              }
              items={[
                { label: 'Unassigned', value: '' },
                ...members.map((m) => ({
                  label: m.display_name || m.email,
                  value: m.user_id,
                })),
              ]}
              onSelect={(item) => setForm({ ...form, assignee_id: item.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="input-wrapper">
              <label className="input-label">Due Date</label>
              <button
                className="input"
                type="button"
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', textAlign: 'left', cursor: 'pointer' }}
                onClick={() => setCalendarOpen(true)}
              >
                <Calendar size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                <span style={{ color: form.due_datetime ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                  {form.due_datetime
                    ? new Date(form.due_datetime.split('T')[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Select date'}
                </span>
              </button>
            </div>

            <div className="input-wrapper">
              <label className="input-label">Priority</label>
              <DropdownMenu
                trigger={
                  <span style={{ color: 'var(--color-text-primary)' }}>
                    {PRIORITY_LABELS[form.priority] || 'Medium'}
                  </span>
                }
                items={PRIORITIES.map((p) => ({ label: PRIORITY_LABELS[p], value: p }))}
                onSelect={(item) => setForm({ ...form, priority: item.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              <Plus size={14} />
              {saving ? 'Creating...' : 'Create Task'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>

      <CalendarModal
        open={calendarOpen}
        value={form.due_datetime ? form.due_datetime.split('T')[0] : ''}
        onChange={(d) => setForm({ ...form, due_datetime: `${d}T23:59:00` })}
        onClose={() => setCalendarOpen(false)}
      />
    </div>
  )
}
