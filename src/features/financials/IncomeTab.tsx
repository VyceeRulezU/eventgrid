import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Check, Clock, AlertTriangle, CalendarDays } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { CalendarModal } from '@/components/ui/CalendarModal'

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

interface ClientPayment {
  id: string
  event_id: string
  description: string
  amount: number
  payment_type: 'incoming' | 'refund'
  status: 'pending' | 'received' | 'overdue'
  due_date: string | null
  received_date: string | null
  payment_method: string | null
  reference: string | null
  notes: string | null
}

const statusConfig = {
  pending: { icon: Clock, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', label: 'Pending' },
  received: { icon: Check, color: 'var(--color-success)', bg: 'var(--color-success-bg)', label: 'Received' },
  overdue: { icon: AlertTriangle, color: 'var(--color-error)', bg: 'var(--color-error-bg)', label: 'Overdue' },
}

interface IncomeTabProps {
  eventId: string
  onUpdate: (payments: ClientPayment[]) => void
}

export function IncomeTab({ eventId, onUpdate }: IncomeTabProps) {
  const showNotification = useUIStore((s) => s.showNotification)

  const [payments, setPayments] = useState<ClientPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ description: '', amount: 0, dueDate: '', paymentMethod: '', reference: '', notes: '' })
  const [editing, setEditing] = useState<ClientPayment | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)

  useEffect(() => {
    loadPayments()
  }, [eventId])

  async function loadPayments() {
    const { data } = await supabase
      .from('client_payments')
      .select('*')
      .eq('event_id', eventId)
      .order('due_date', { ascending: true, nullsFirst: false })
    if (data) {
      setPayments(data as ClientPayment[])
      onUpdate(data as ClientPayment[])
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!form.description || form.amount <= 0) {
      showNotification({ variant: 'warning', title: 'Missing fields', message: 'Description and amount are required' })
      return
    }
    setSaving(true)
    const payload = {
      event_id: eventId,
      description: form.description,
      amount: Math.round(form.amount * 100),
      due_date: form.dueDate || null,
      payment_method: form.paymentMethod || null,
      reference: form.reference || null,
      notes: form.notes || null,
    }

    if (editing) {
      const { error } = await supabase.from('client_payments').update(payload).eq('id', editing.id)
      if (error) { showNotification({ variant: 'error', title: 'Update failed', message: error.message }); setSaving(false); return }
      setPayments(payments.map(p => p.id === editing.id ? { ...p, ...payload } as ClientPayment : p))
    } else {
      const { data, error } = await supabase.from('client_payments').insert(payload).select().single()
      if (error) { showNotification({ variant: 'error', title: 'Failed', message: error.message }); setSaving(false); return }
      if (data) setPayments([...(data as ClientPayment ? [data as ClientPayment] : []), ...payments])
    }

    setSaving(false)
    setShowForm(false)
    setEditing(null)
    setForm({ description: '', amount: 0, dueDate: '', paymentMethod: '', reference: '', notes: '' })
  }

  async function handleStatusToggle(payment: ClientPayment) {
    const nextStatus = payment.status === 'pending' ? 'received' : payment.status === 'received' ? 'overdue' : 'pending'
    const { error } = await supabase.from('client_payments').update({
      status: nextStatus,
      received_date: nextStatus === 'received' ? new Date().toISOString().split('T')[0] : null,
    }).eq('id', payment.id)
    if (!error) setPayments(payments.map(p => p.id === payment.id ? { ...p, status: nextStatus as ClientPayment['status'], received_date: nextStatus === 'received' ? new Date().toISOString().split('T')[0] : null } : p))
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('client_payments').delete().eq('id', id)
    if (!error) setPayments(payments.filter(p => p.id !== id))
  }

  function openEdit(p: ClientPayment) {
    setForm({ description: p.description, amount: p.amount / 100, dueDate: p.due_date || '', paymentMethod: p.payment_method || '', reference: p.reference || '', notes: p.notes || '' })
    setEditing(p)
    setShowForm(true)
  }

  const totalReceived = payments.filter(p => p.status === 'received').reduce((s, p) => s + p.amount, 0)
  const totalPending = payments.filter(p => p.status !== 'received').reduce((s, p) => s + p.amount, 0)
  const totalContract = payments.reduce((s, p) => s + p.amount, 0)

  if (loading) return <div className="skeleton skeleton-card" style={{ height: 200 }} />

  return (
    <div id="income-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>Client Payments</h3>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(true); setEditing(null); setForm({ description: '', amount: 0, dueDate: '', paymentMethod: '', reference: '', notes: '' }) }}>
          <Plus size={14} /> Add Payment
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div className="card" style={{ padding: 'var(--space-3)', containerType: 'inline-size' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 2 }}>Total Contract</div>
          <div style={{ fontSize: 'clamp(11px, 7cqi, var(--text-title))', fontWeight: 700, overflow: 'hidden', whiteSpace: 'nowrap' }}>{formatNaira(totalContract)}</div>
        </div>
        <div className="card" style={{ padding: 'var(--space-3)', containerType: 'inline-size' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 2 }}>Received</div>
          <div style={{ fontSize: 'clamp(11px, 7cqi, var(--text-title))', fontWeight: 700, color: 'var(--color-success)', overflow: 'hidden', whiteSpace: 'nowrap' }}>{formatNaira(totalReceived)}</div>
        </div>
        <div className="card" style={{ padding: 'var(--space-3)', containerType: 'inline-size' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 2 }}>Outstanding</div>
          <div style={{ fontSize: 'clamp(11px, 7cqi, var(--text-title))', fontWeight: 700, color: totalPending > 0 ? 'var(--color-error)' : 'var(--color-success)', overflow: 'hidden', whiteSpace: 'nowrap' }}>{formatNaira(totalPending)}</div>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="input-wrapper" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Description</label>
              <input className="input" placeholder="Deposit, Balance, Extra: AV upgrade" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="input-wrapper">
              <label className="input-label">Amount (₦)</label>
              <input className="input" type="number" min={0} value={form.amount || ''} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <div className="input-wrapper">
              <label className="input-label">Due Date</label>
              <button
                type="button"
                className="input"
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', textAlign: 'left', justifyContent: 'flex-start' }}
                onClick={() => setShowDatePicker(true)}
              >
                <CalendarDays size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                <span style={{ color: form.dueDate ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                  {form.dueDate
                    ? new Date(form.dueDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Select due date'}
                </span>
              </button>
              <CalendarModal
                open={showDatePicker}
                value={form.dueDate}
                onChange={(d) => { setForm({ ...form, dueDate: d }); setShowDatePicker(false) }}
                onClose={() => setShowDatePicker(false)}
              />
            </div>
            <div className="input-wrapper">
              <label className="input-label">Payment Method</label>
              <DropdownMenu
                trigger={<span>{form.paymentMethod || 'Select method'}</span>}
                items={['bank_transfer', 'cash', 'pos', 'cheque'].map(m => ({ label: m.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), value: m }))}
                onSelect={item => setForm({ ...form, paymentMethod: item.value })}
              />
            </div>
            <div className="input-wrapper">
              <label className="input-label">Reference</label>
              <input className="input" placeholder="Ref / receipt no." value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-2)' }}>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Save Payment'}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
          <div className="empty-state__title">No client payments yet</div>
          <div className="empty-state__description">Track incoming payments from your clients</div>
        </div>
      ) : (
        <div className="financial-table-wrapper">
          <table className="financial-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="col-amount">Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Method</th>
                <th style={{ width: 80 }} />
              </tr>
            </thead>
            <tbody>
              {payments.map(p => {
                const cfg = statusConfig[p.status]
                const Icon = cfg.icon
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>
                      {p.description}
                      {p.notes && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 400 }}>{p.notes}</div>}
                    </td>
                    <td className="col-amount">{formatNaira(p.amount)}</td>
                    <td>{p.due_date ? new Date(p.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleStatusToggle(p)}
                        style={{ background: cfg.bg, color: cfg.color, border: 'none', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer' }}
                      >
                        <Icon size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        {cfg.label}
                      </button>
                    </td>
                    <td style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                      {p.payment_method ? p.payment_method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon" onClick={() => openEdit(p)} data-tooltip="Edit"><Pencil size={14} /></button>
                        <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(p.id)} data-tooltip="Delete" style={{ color: 'var(--color-error)' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
