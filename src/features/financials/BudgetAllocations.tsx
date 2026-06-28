import { useEffect, useState } from 'react'
import { Pencil, X, Plus, Check, Trash2, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { exportBudgetToExcel, exportBudgetToPDF } from './BudgetExport'
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
  eventName?: string
}

function getCategoryThumbnail(category: string): string {
  const c = category.toLowerCase()
  if (c.includes('venue') || c.includes('facility')) {
    return 'https://images.unsplash.com/photo-1519741497674-611481863552?w=80&q=80'
  }
  if (c.includes('catering') || c.includes('food')) {
    return 'https://images.unsplash.com/photo-1555244162-803834f70033?w=80&q=80'
  }
  if (c.includes('decor') || c.includes('design') || c.includes('florals')) {
    return 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=80&q=80'
  }
  if (c.includes('audio') || c.includes('visual') || c.includes('sound') || c.includes('av')) {
    return 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=80&q=80'
  }
  if (c.includes('photo')) {
    return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=80&q=80'
  }
  if (c.includes('video')) {
    return 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=80&q=80'
  }
  if (c.includes('transport') || c.includes('logistic') || c.includes('car')) {
    return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=80&q=80'
  }
  if (c.includes('fashion') || c.includes('beauty') || c.includes('makeup') || c.includes('attire')) {
    return 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=80&q=80'
  }
  if (c.includes('entertain') || c.includes('music') || c.includes('band') || c.includes('mc') || c.includes('dj')) {
    return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=80&q=80'
  }
  if (c.includes('stationery') || c.includes('print') || c.includes('invite')) {
    return 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=80&q=80'
  }
  if (c.includes('security') || c.includes('bouncer')) {
    return 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=80&q=80'
  }
  return 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=80&q=80'
}

function getCategorySublabel(category: string): string {
  const c = category.toLowerCase()
  if (c.includes('venue') || c.includes('facility')) return 'Rentals, halls & logistics'
  if (c.includes('catering') || c.includes('food')) return 'Food, drinks & server staffing'
  if (c.includes('decor') || c.includes('design')) return 'Florals, stage & lighting theme'
  if (c.includes('audio') || c.includes('visual')) return 'Speakers, screens & microphones'
  if (c.includes('photo')) return 'Event shoots & digital album'
  if (c.includes('video')) return 'Cinematic video & highlight reels'
  if (c.includes('transport')) return 'Guest shuttle & crew transfer'
  if (c.includes('fashion') || c.includes('beauty')) return 'Gown, suit, makeup & styling'
  if (c.includes('entertain')) return 'Live band, DJ, MC performance'
  if (c.includes('stationery')) return 'Prints, menu cards & invites'
  if (c.includes('security')) return 'Bouncers, gate control & patrol'
  return 'Allocated event budget'
}

export function BudgetAllocations({ eventId, eventName }: BudgetAllocationsProps) {
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
    const kobo = Math.round(editValue * 100)
    const { data, error } = await supabase
      .from('budget_allocations')
      .upsert({ event_id: eventId, category, allocated: kobo }, { onConflict: 'event_id,category' })
      .select('id')
      .single()
    if (error) { showNotification({ variant: 'error', title: 'Failed', message: error.message }); return }
    setAllocations(allocations.map(a => a.category === category ? { ...a, id: data.id, allocated: kobo } : a))
    setEditingCat(null)
  }

  async function deleteAllocation(category: string) {
    const existing = allocations.find(a => a.category === category)
    if (existing?.id) {
      const { error } = await supabase.from('budget_allocations').delete().eq('id', existing.id)
      if (error) { showNotification({ variant: 'error', title: 'Failed', message: error.message }); return }
    }
    setAllocations(allocations.map(a => a.category === category ? { ...a, id: '', allocated: 0 } : a))
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
    const { data, error } = await supabase
      .from('budget_allocations')
      .upsert({ event_id: eventId, category: trimmed, allocated: 0 }, { onConflict: 'event_id,category' })
      .select('id')
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>Budget by Category</h3>
        <DropdownMenu
          trigger={<><Download size={14} /> Export</>}
          className={styles.exportDropdown}
          items={[
            { label: 'Export as Excel', value: 'excel' },
            { label: 'Export as PDF', value: 'pdf' },
          ]}
          onSelect={(item) => {
            const rows = allocations.filter(a => a.allocated > 0 || a.actual > 0)
            if (item.value === 'excel') exportBudgetToExcel(rows, eventName || '')
            else exportBudgetToPDF(rows, eventName || '')
          }}
        />
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Category</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Progress</th>
                <th className={styles.th}>Budget</th>
                <th className={`${styles.th} ${styles.thActions}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((row) => {
                const pct = row.allocated > 0 ? (row.actual / row.allocated) * 100 : 0
                const barColor = pct > 100 ? 'var(--color-error)' : pct > 80 ? 'var(--color-warning)' : 'var(--color-accent)'
                const isEditing = editingCat === row.category

                // Determine Status Badge
                let statusText = 'Unallocated'
                let statusClass = styles.statusUnallocated
                if (row.allocated > 0) {
                  if (pct > 100) {
                    statusText = 'Over Budget'
                    statusClass = styles.statusOver
                  } else {
                    statusText = 'On Track'
                    statusClass = styles.statusOnTrack
                  }
                }

                return (
                  <tr key={row.category} className={styles.tr}>
                    {/* Category column */}
                    <td className={styles.td}>
                      <div className={styles.categoryCell}>
                        <img 
                          src={getCategoryThumbnail(row.category)} 
                          alt="" 
                          className={styles.thumbnail} 
                        />
                        <div className={styles.categoryText}>
                          <div className={styles.categoryName}>{row.category}</div>
                          <div className={styles.categorySub}>{getCategorySublabel(row.category)}</div>
                        </div>
                      </div>
                    </td>

                    {/* Status column */}
                    <td className={styles.td}>
                      <span className={`${styles.statusBadge} ${statusClass}`}>
                        {statusText}
                      </span>
                    </td>

                    {/* Progress column */}
                    <td className={styles.td}>
                      <div className={styles.progressContainer}>
                        <div className={styles.progressBarBg}>
                          <div 
                            className={styles.progressBarFill} 
                            style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }} 
                          />
                        </div>
                        <span className={styles.progressPct}>
                          {Math.round(pct)}%
                        </span>
                      </div>
                    </td>

                    {/* Budget column */}
                    <td className={styles.td}>
                      {isEditing ? (
                        <div className={styles.editInputWrap}>
                          <span className={styles.nairaPrefix}>₦</span>
                          <input 
                            className="input" 
                            type="text" 
                            inputMode="numeric" 
                            value={editValue || ''} 
                            onChange={e => setEditValue(Number(e.target.value.replace(/,/g, '')))} 
                            style={{ width: 110, minHeight: 32, fontSize: 'var(--text-xs)', paddingLeft: '1.2rem' }} 
                            autoFocus 
                            onKeyDown={e => { 
                              if (e.key === 'Enter') saveAllocation(row.category); 
                              if (e.key === 'Escape') setEditingCat(null) 
                            }} 
                          />
                        </div>
                      ) : (
                        <div className={styles.budgetWrap}>
                          <div className={styles.allocatedText}>{formatNaira(row.allocated)}</div>
                          <div className={styles.actualText}>{formatNaira(row.actual)} spent</div>
                        </div>
                      )}
                    </td>

                    {/* Actions column */}
                    <td className={`${styles.td} ${styles.tdActions}`}>
                      {isEditing ? (
                        <div className={styles.editActions}>
                          <button 
                            className="btn btn-primary btn-sm" 
                            onClick={() => saveAllocation(row.category)}
                            style={{ minHeight: 28, padding: '0 10px', fontSize: 'var(--text-xs)' }}
                          >
                            Save
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => setEditingCat(null)}
                            style={{ minHeight: 28, padding: '0 8px', fontSize: 'var(--text-xs)' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className={styles.actionButtons}>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => { setEditingCat(row.category); setEditValue(row.allocated / 100) }}
                            style={{ gap: 4, padding: '0 8px', minHeight: 28, fontSize: 'var(--text-xs)' }}
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          {(row.id || row.allocated > 0) && (
                            <button 
                              className="btn btn-ghost btn-sm" 
                              onClick={() => deleteAllocation(row.category)}
                              style={{ gap: 4, padding: '0 8px', minHeight: 28, fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

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
            marginTop: showAddRow ? 0 : '0', 
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
