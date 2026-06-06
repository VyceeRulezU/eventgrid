import { useEffect, useState } from 'react'
import { Plus, Receipt, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

interface PettyCashEntry {
  id: string
  event_id: string
  description: string
  amount: number
  logged_by: string | null
  receipt_url: string | null
  logged_at: string
}

interface PettyCashLogProps {
  eventId: string
  onTotalChange: (total: number) => void
}

export function PettyCashLog({ eventId, onTotalChange }: PettyCashLogProps) {
  const user = useAuthStore((s) => s.user)
  const showNotification = useUIStore((s) => s.showNotification)

  const [entries, setEntries] = useState<PettyCashEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState(0)

  useEffect(() => {
    loadEntries()
  }, [eventId])

  useEffect(() => {
    onTotalChange(entries.reduce((s, e) => s + e.amount, 0))
  }, [entries])

  async function loadEntries() {
    const { data } = await supabase
      .from('petty_cash')
      .select('*')
      .eq('event_id', eventId)
      .order('logged_at', { ascending: false })
    if (data) setEntries(data as PettyCashEntry[])
    setLoading(false)
  }

  async function handleAdd() {
    if (!desc.trim() || amount <= 0) return
    setSaving(true)
    const { data, error } = await supabase
      .from('petty_cash')
      .insert({ event_id: eventId, description: desc.trim(), amount: Math.round(amount * 100), logged_by: user?.id })
      .select()
      .single()
    if (error) { showNotification({ variant: 'error', title: 'Failed', message: error.message }); setSaving(false); return }
    if (data) setEntries([data as PettyCashEntry, ...entries])
    setDesc('')
    setAmount(0)
    setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('petty_cash').delete().eq('id', id)
    if (!error) setEntries(entries.filter(e => e.id !== id))
  }

  if (loading) return null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Receipt size={16} style={{ color: 'var(--color-text-muted)' }} />
          Petty Cash
        </h3>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> Add Expense
        </button>
      </div>

      {showForm && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', alignItems: 'end' }}>
          <div className="input-wrapper" style={{ flex: 1 }}>
            <label className="input-label">Description</label>
            <input className="input" placeholder="What was this for?" value={desc} onChange={e => setDesc(e.target.value)} autoFocus />
          </div>
          <div className="input-wrapper" style={{ width: 120 }}>
            <label className="input-label">Amount (₦)</label>
            <input className="input" type="number" min={0} value={amount || ''} onChange={e => setAmount(Number(e.target.value))} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={saving || !desc.trim() || amount <= 0} style={{ marginBottom: 1 }}>Add</button>
        </div>
      )}

      {entries.length === 0 ? (
        <div style={{ padding: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          No petty cash entries yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {entries.map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-surface-1)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
              <div>
                <div style={{ fontWeight: 500 }}>{e.description}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {new Date(e.logged_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-error)' }}>{formatNaira(e.amount)}</span>
                <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(e.id)} style={{ width: 24, height: 24, color: 'var(--color-text-muted)' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
