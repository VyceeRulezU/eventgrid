import { useState, useRef } from 'react'
import { Upload, Download, X, Check, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'

const CSV_TEMPLATE = `title,description,assignee_email,due_date,priority,phase
Welcome guests,Greet attendees at the entrance,john@example.com,2026-07-15,medium,Phase 1
Setup AV equipment,Test microphones and speakers,,2026-07-14,high,Phase 1`

interface BulkTaskUploadProps {
  eventId: string
  members: { user_id: string; display_name: string | null; email: string }[]
  phases: { id: string; phase_name: string }[]
  onDone: () => void
  onCancel: () => void
}

interface ImportResult {
  success: number
  errors: { row: number; message: string }[]
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const rows = lines.slice(1).map((l) => {
    const vals: string[] = []
    let current = ''
    let inQuotes = false
    for (const ch of l) {
      if (ch === '"') { inQuotes = !inQuotes; continue }
      if (ch === ',' && !inQuotes) { vals.push(current.trim()); current = ''; continue }
      current += ch
    }
    vals.push(current.trim())
    return vals
  })
  return { headers, rows }
}

export function BulkTaskUpload({ eventId, members, phases, onDone, onCancel }: BulkTaskUploadProps) {
  const user = useAuthStore((s) => s.user)
  const showNotification = useUIStore((s) => s.showNotification)
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const emailToId = new Map(members.map((m) => [m.email.toLowerCase(), m.user_id]))
  const phaseNameToId = new Map(phases.map((p) => [p.phase_name.toLowerCase(), p.id]))

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'task-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)

    const text = await file.text()
    const { headers, rows } = parseCsv(text)

    const requiredHeaders = ['title']
    const headerMap = new Map(headers.map((h, i) => [h, i]))
    const missing = requiredHeaders.filter((h) => !headerMap.has(h))
    if (missing.length > 0) {
      showNotification({ variant: 'error', title: 'Invalid CSV', message: `Missing columns: ${missing.join(', ')}` })
      return
    }

    setImporting(true)
    const errors: ImportResult['errors'] = []
    let success = 0
    const titleIdx = headerMap.get('title')!
    const descIdx = headerMap.get('description')
    const emailIdx = headerMap.get('assignee_email')
    const dateIdx = headerMap.get('due_date')
    const prioIdx = headerMap.get('priority')
    const phaseIdx = headerMap.get('phase')

    const validPriorities = new Set(['low', 'medium', 'high', 'urgent'])

    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('event_id', eventId)
    const titleToId = new Map<string, string>()
    if (existingTasks) {
      for (const t of existingTasks) titleToId.set(t.title.toLowerCase(), t.id)
    }

    const inserts: any[] = []
    const updates: { id: string; data: any }[] = []
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const title = row[titleIdx]?.trim()
      if (!title) { errors.push({ row: i + 2, message: 'Title is required' }); continue }

      const assigneeEmail = emailIdx !== undefined ? row[emailIdx]?.trim().toLowerCase() : ''
      const assigneeId = assigneeEmail ? emailToId.get(assigneeEmail) : null
      if (emailIdx !== undefined && assigneeEmail && !assigneeId) {
        errors.push({ row: i + 2, message: `Unknown email: ${assigneeEmail}` })
      }

      const priority = prioIdx !== undefined ? row[prioIdx]?.trim().toLowerCase() : 'medium'
      if (priority && !validPriorities.has(priority)) {
        errors.push({ row: i + 2, message: `Invalid priority "${priority}". Use: low, medium, high, urgent` })
        continue
      }

      const phaseName = phaseIdx !== undefined ? row[phaseIdx]?.trim().toLowerCase() : ''
      const phaseId = phaseName ? phaseNameToId.get(phaseName) : null

      const dueDate = dateIdx !== undefined ? row[dateIdx]?.trim() : ''
      const dueDatetime = dueDate ? `${dueDate}T23:59:00` : null

      const taskData = {
        title,
        description: descIdx !== undefined ? (row[descIdx]?.trim() || null) : null,
        assignee_id: assigneeId || null,
        phase_id: phaseId || null,
        due_datetime: dueDatetime,
        priority: priority || 'medium',
      }

      const existingId = titleToId.get(title.toLowerCase())
      if (existingId) {
        updates.push({ id: existingId, data: taskData })
      } else {
        inserts.push({ ...taskData, event_id: eventId, created_by: user!.id, status: 'pending' })
      }
    }

    for (const u of updates) {
      const { error } = await supabase.from('tasks').update(u.data).eq('id', u.id)
      if (error) errors.push({ row: -1, message: `Update failed for "${u.data.title}": ${error.message}` })
      else success++
    }

    if (inserts.length > 0) {
      const { error } = await supabase.from('tasks').insert(inserts)
      if (error) {
        showNotification({ variant: 'error', title: 'Import failed', message: error.message })
        setImporting(false)
        return
      }
      success += inserts.length
    }

    setResult({ success, errors })
    setImporting(false)
    if (success > 0) showNotification({ variant: 'success', title: 'Tasks imported', message: `${success} task${success !== 1 ? 's' : ''} created` })
  }

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-card-header">
          <h3 className="modal-card-title">Import Tasks from CSV</h3>
          <button className="modal-card-close" onClick={onCancel} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Upload a CSV file with your tasks. The first row must contain column headers.
          </div>

          <button className="btn btn-ghost btn-sm" onClick={downloadTemplate} style={{ alignSelf: 'flex-start', gap: 'var(--space-1)' }}>
            <Download size={14} />
            Download CSV template
          </button>

          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFile}
          />

          {!result && (
            <button
              className="btn btn-primary"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              style={{ gap: 'var(--space-2)' }}
            >
              <Upload size={16} />
              {importing ? 'Importing...' : 'Select CSV file'}
            </button>
          )}

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                <Check size={16} style={{ color: 'var(--color-success)' }} />
                {result.success} task{result.success !== 1 ? 's' : ''} imported
              </div>
              {result.errors.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}>
                  {result.errors.map((e, i) => (
                    <div key={i} style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <AlertCircle size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>Row {e.row}: {e.message}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <button className="btn btn-primary btn-sm" onClick={() => { setResult(null); if (fileRef.current) fileRef.current.value = '' }} style={{ gap: 'var(--space-1)' }}>
                  <Upload size={14} />
                  Import another
                </button>
                <button className="btn btn-ghost btn-sm" onClick={onDone}>Done</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
