import { useEffect, useState } from 'react'
import { Pencil, X, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { DropdownMenu } from '@/components/ui/DropdownMenu'

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

const categories = [
  'Venue & Facility', 'Catering', 'Decor & Design', 'Audio/Visual',
  'Photography', 'Videography', 'Transportation', 'Fashion & Beauty',
  'Entertainment', 'Stationery', 'Security', 'Other',
]

interface BudgetRow {
  id: string
  category: string
  allocated: number
  actual: number
}

interface BudgetAllocationsProps {
  eventId: string
}

export function BudgetAllocations({ eventId }: BudgetAllocationsProps) {
  const showNotification = useUIStore((s) => s.showNotification)
  const [allocations, setAllocations] = useState<BudgetRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [editValue, setEditValue] = useState(0)

  useEffect(() => {
    loadData()
  }, [eventId])

  async function loadData() {
    const [allocRes, spendRes] = await Promise.all([
      supabase.from('budget_allocations').select('*').eq('event_id', eventId),
      supabase.from('financial_entries').select('category, total_amount').eq('event_id', eventId),
    ])

    const allocMap = new Map<string, number>()
    if (allocRes.data) {
      for (const a of allocRes.data) allocMap.set(a.category, a.allocated)
    }

    const spendMap = new Map<string, number>()
    if (spendRes.data) {
      for (const s of spendRes.data) spendMap.set(s.category, (spendMap.get(s.category) || 0) + s.total_amount)
    }

    const rows: BudgetRow[] = categories.map(cat => ({
      id: allocRes.data?.find(a => a.category === cat)?.id || '',
      category: cat,
      allocated: allocMap.get(cat) || 0,
      actual: spendMap.get(cat) || 0,
    }))

    setAllocations(rows)
    setLoading(false)
  }

  async function saveAllocation(category: string) {
    const existing = allocations.find(a => a.category === category)
    if (existing?.id) {
      const { error } = await supabase.from('budget_allocations').update({ allocated: Math.round(editValue * 100) }).eq('id', existing.id)
      if (error) { showNotification({ variant: 'error', title: 'Failed', message: error.message }); return }
    } else {
      const { error } = await supabase.from('budget_allocations').insert({ event_id: eventId, category, allocated: Math.round(editValue * 100) })
      if (error) { showNotification({ variant: 'error', title: 'Failed', message: error.message }); return }
    }
    setAllocations(allocations.map(a => a.category === category ? { ...a, allocated: Math.round(editValue * 100) } : a))
    setEditingCat(null)
  }

  const totalAllocated = allocations.reduce((s, a) => s + a.allocated, 0)
  const totalActual = allocations.reduce((s, a) => s + a.actual, 0)

  if (loading) return <div className="skeleton skeleton-card" style={{ height: 200 }} />

  return (
    <div>
      <h3 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-base)', fontWeight: 700 }}>Budget by Category</h3>

      <div className="card" style={{ padding: 'var(--space-4)' }}>
        {allocations.map((row) => {
          const pct = row.allocated > 0 ? (row.actual / row.allocated) * 100 : 0
          const barColor = pct > 100 ? 'var(--color-error)' : pct > 80 ? 'var(--color-warning)' : 'var(--color-accent)'
          const variance = row.allocated - row.actual
          return (
            <div key={row.category} style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)' }}>
                <div style={{ fontWeight: 600 }}>{row.category}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  {editingCat === row.category ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input className="input" type="number" min={0} value={editValue || ''} onChange={e => setEditValue(Number(e.target.value))} style={{ width: 100, minHeight: 28, fontSize: 'var(--text-xs)' }} autoFocus />
                      <button className="btn btn-primary btn-sm" onClick={() => saveAllocation(row.category)} style={{ minHeight: 28, padding: '0 8px', fontSize: 'var(--text-xs)' }}>Set</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingCat(null)} style={{ minHeight: 28, padding: '0 8px' }}><X size={14} /></button>
                    </div>
                  ) : (
                    <>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                        {formatNaira(row.actual)} / {formatNaira(row.allocated)}
                      </span>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: variance >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                        {variance >= 0 ? '+' : ''}{formatNaira(variance)}
                      </span>
                      <button className="btn btn-ghost btn-icon" onClick={() => { setEditingCat(row.category); setEditValue(row.allocated / 100) }} style={{ width: 24, height: 24 }}>
                        <Pencil size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div style={{ height: 6, background: 'var(--color-surface-3)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: barColor, borderRadius: 'var(--radius-full)', transition: 'width 200ms ease' }} />
              </div>
            </div>
          )
        })}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border-subtle)', fontSize: 'var(--text-sm)', fontWeight: 700 }}>
          <span>Total</span>
          <span>{formatNaira(totalActual)} / {formatNaira(totalAllocated)}</span>
        </div>
      </div>
    </div>
  )
}
