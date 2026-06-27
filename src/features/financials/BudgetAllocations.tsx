import { useEffect, useState } from 'react'
import { Pencil, X, Plus, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import styles from './BudgetAllocations.module.css'

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

const DEFAULT_CATEGORIES = [
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

  // New category state
  const [showAddRow, setShowAddRow] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [addingSaving, setAddingSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [eventId])

  async function loadData() {
    const [allocRes, spendRes] = await Promise.all([
      supabase.from('budget_allocations').select('*').eq('event_id', eventId),
      supabase.from('financial_entries').select('category, total_amount').eq('event_id', eventId),
    ])

    const allocMap = new Map<string, number>()
    const allocIdMap = new Map<string, string>()
    if (allocRes.data) {
      for (const a of allocRes.data) {
        allocMap.set(a.category, a.allocated)
        allocIdMap.set(a.category, a.id)
      }
    }

    const spendMap = new Map<string, number>()
    if (spendRes.data) {
      for (const s of spendRes.data) spendMap.set(s.category, (spendMap.get(s.category) || 0) + s.total_amount)
    }

    // Build rows: default categories + any custom categories from allocations or spend
    const allCats = new Set<string>(DEFAULT_CATEGORIES)
    allocMap.forEach((_, cat) => allCats.add(cat))
    spendMap.forEach((_, cat) => allCats.add(cat))

    const rows: BudgetRow[] = [...allCats].map(cat => ({
      id: allocIdMap.get(cat) || '',
      category: cat,
      allocated: allocMap.get(cat) || 0,
      actual: spendMap.get(cat) || 0,
    }))

    // Sort: defaults first, then custom
    rows.sort((a, b) => {
      const ai = DEFAULT_CATEGORIES.indexOf(a.category)
      const bi = DEFAULT_CATEGORIES.indexOf(b.category)
      if (ai >= 0 && bi >= 0) return ai - bi
      if (ai >= 0) return -1
      if (bi >= 0) return 1
      return a.category.localeCompare(b.category)
    })

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

  async function handleAddCategory() {
    const trimmed = newCatName.trim()
    if (!trimmed) return
    if (allocations.some(a => a.category.toLowerCase() === trimmed.toLowerCase())) {
      showNotification({ variant: 'warning', title: 'Already exists', message: `"${trimmed}" is already in your budget list.` })
      return
    }
    setAddingSaving(true)
    // Insert a zero-allocation row so it persists
    const { data, error } = await supabase
      .from('budget_allocations')
      .insert({ event_id: eventId, category: trimmed, allocated: 0 })
      .select()
      .single()
    setAddingSaving(false)
    if (error) { showNotification({ variant: 'error', title: 'Failed', message: error.message }); return }
    setAllocations([...allocations, { id: (data as any).id, category: trimmed, allocated: 0, actual: 0 }])
    setNewCatName('')
    setShowAddRow(false)
    showNotification({ variant: 'success', title: `"${trimmed}" added to budget` })
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
                      <input className="input" type="number" min={0} value={editValue || ''} onChange={e => setEditValue(Number(e.target.value))} style={{ width: 100, minHeight: 28, fontSize: 'var(--text-xs)' }} autoFocus onKeyDown={e => { if (e.key === 'Enter') saveAllocation(row.category); if (e.key === 'Escape') setEditingCat(null) }} />
                      <button className="btn btn-primary btn-sm" onClick={() => saveAllocation(row.category)} style={{ minHeight: 28, padding: '0 8px', fontSize: 'var(--text-xs)' }}>Set</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingCat(null)} style={{ minHeight: 28, padding: '0 8px' }} data-tooltip="Cancel"><X size={14} /></button>
                    </div>
                  ) : (
                    <>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                        {formatNaira(row.actual)} / {formatNaira(row.allocated)}
                      </span>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: variance >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                        {variance >= 0 ? '+' : ''}{formatNaira(variance)}
                      </span>
                      <button className="btn btn-ghost btn-icon" onClick={() => { setEditingCat(row.category); setEditValue(row.allocated / 100) }} style={{ width: 24, height: 24 }} data-tooltip="Edit allocation">
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

        {/* Add custom category row */}
        {showAddRow && (
          <div className={styles.addRowWrap}>
            <input
              className={`input ${styles.addRowInput}`}
              placeholder="Category name (e.g. Florals, MC, Branding)"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); if (e.key === 'Escape') { setShowAddRow(false); setNewCatName('') } }}
            />
            <button
              className={`btn btn-primary btn-sm ${styles.addRowBtn}`}
              onClick={handleAddCategory}
              disabled={addingSaving || !newCatName.trim()}
            >
              <Check size={14} /> {addingSaving ? 'Adding...' : 'Add'}
            </button>
            <button
              className={`btn btn-ghost btn-sm btn-icon ${styles.addRowBtn}`}
              onClick={() => { setShowAddRow(false); setNewCatName('') }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div 
          className={styles.totalRow} 
          style={{ 
            marginTop: showAddRow ? 0 : 'var(--space-2)', 
            borderTop: showAddRow ? 'none' : '1px solid var(--color-border-subtle)' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span>Total</span>
            {!showAddRow && (
              <button
                className={`btn btn-ghost btn-sm ${styles.addCatBtn}`}
                onClick={() => setShowAddRow(true)}
                id="add-budget-category-btn"
              >
                <Plus size={12} /> Add Category
              </button>
            )}
          </div>
          <span>{formatNaira(totalActual)} / {formatNaira(totalAllocated)}</span>
        </div>
      </div>
    </div>
  )
}
