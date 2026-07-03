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
  const [renamingCat, setRenamingCat] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

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
    setAllocations(allocations.filter(a => a.category !== category))
    setEditingCat(null)
  }

  async function renameAllocation(oldName: string, newName: string) {
    const existing = allocations.find(a => a.category === oldName)
    if (!existing?.id) return
    const trimmed = newName.trim()
    if (!trimmed || trimmed === oldName) { setRenamingCat(null); return }
    if (allocations.some(a => a.category.toLowerCase() === trimmed.toLowerCase() && a.category !== oldName)) {
      showNotification({ variant: 'warning', title: 'Already exists', message: `"${trimmed}" is already in your budget list.` })
      return
    }
    const { error } = await supabase.from('budget_allocations').update({ category: trimmed }).eq('id', existing.id)
    if (error) { showNotification({ variant: 'error', title: 'Failed', message: error.message }); return }
    setAllocations(allocations.map(a => a.category === oldName ? { ...a, category: trimmed } : a))
    setRenamingCat(null)
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
            const rows = allocations.filter(a => a.allocated > 0 || a.actual > 0 || a.category === 'Other')
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
                <th className={styles.th}>% of Total</th>
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
                        <div className={styles.categoryText}>
                          {renamingCat === row.category ? (
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              <input
                                className="input"
                                type="text"
                                value={renameValue}
                                onChange={e => setRenameValue(e.target.value)}
                                style={{ width: 150, minHeight: 28, fontSize: 'var(--text-xs)' }}
                                autoFocus
                                onKeyDown={e => {
                                  if (e.key === 'Enter') renameAllocation(row.category, renameValue)
                                  if (e.key === 'Escape') setRenamingCat(null)
                                }}
                                onBlur={() => { if (renameValue !== row.category) renameAllocation(row.category, renameValue); else setRenamingCat(null) }}
                              />
                              <button className="btn btn-primary btn-sm" onClick={() => renameAllocation(row.category, renameValue)} style={{ minHeight: 28, padding: '0 8px', fontSize: 'var(--text-xs)' }}><Check size={12} /></button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setRenamingCat(null)} style={{ minHeight: 28, padding: '0 8px', fontSize: 'var(--text-xs)' }}><X size={12} /></button>
                            </div>
                          ) : (
                            <>
                              <div className={styles.categoryName}>{row.category}</div>
                              <div className={styles.categorySub}>{getCategorySublabel(row.category)}</div>
                            </>
                          )}
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

                    {/* % of Total column */}
                    <td className={styles.td}>
                      <span className={styles.pctText}>
                        {totalAllocated > 0 ? `${((row.allocated / totalAllocated) * 100).toFixed(1)}%` : '—'}
                      </span>
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
                            <Pencil size={12} /> Budget
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => { setRenamingCat(row.category); setRenameValue(row.category) }}
                            style={{ gap: 4, padding: '0 8px', minHeight: 28, fontSize: 'var(--text-xs)' }}
                          >
                            <Pencil size={12} /> Rename
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => deleteAllocation(row.category)}
                            style={{ gap: 4, padding: '0 8px', minHeight: 28, fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className={styles.totalRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span>Total</span>
            <button
              className={`btn btn-ghost btn-sm ${styles.addCatBtn}`}
              onClick={() => setShowAddRow(true)}
              id="add-budget-category-btn"
            >
              <Plus size={12} /> Add Category
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <span>{formatNaira(totalActual)} / {formatNaira(totalAllocated)}</span>
            <span className={styles.pctText}>100%</span>
          </div>
        </div>
      </div>

      {showAddRow && (
        <div className="modal-overlay" onClick={() => { setShowAddRow(false); setNewCatName('') }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-card__header">
              <h3 className="modal-card__title"><Plus size={16} /> Add Category</h3>
              <button className="modal-card__close" onClick={() => { setShowAddRow(false); setNewCatName('') }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-card__body">
              <label className="input-label">Category name</label>
              <input
                className="input"
                placeholder="e.g. Florals, MC, Branding"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); if (e.key === 'Escape') { setShowAddRow(false); setNewCatName('') } }}
                autoFocus
                style={{ width: '100%' }}
              />
            </div>
            <div className="modal-card__footer" style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setShowAddRow(false); setNewCatName('') }}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddCategory}
                disabled={addingSaving || !newCatName.trim()}
              >
                <Check size={14} /> {addingSaving ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
