import { useEffect, useState } from 'react'
import { Plus, X, CheckSquare, Square, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { PageHero } from '@/components/shared/PageHero'
import { Table } from '@/components/ui/Table'
import { useResolvedEventId } from '@/hooks/useResolvedEventId'
import styles from './ChecklistsPage.module.css'
import type { Checklist, ChecklistItem } from '@/types'

export function ChecklistsPage() {
  const { eventId } = useResolvedEventId()
  const user = useAuthStore((s) => s.user)
  const showNotification = useUIStore((s) => s.showNotification)

  const [checklists, setChecklists] = useState<(Checklist & { items: ChecklistItem[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [newItemText, setNewItemText] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!eventId) return
    loadChecklists()
  }, [eventId])

  async function loadChecklists() {
    setLoading(true)
    const { data: clData } = await supabase.from('checklists').select('*').eq('event_id', eventId).order('created_at', { ascending: false })
    if (!clData) { setLoading(false); return }
    const all = await Promise.all((clData as Checklist[]).map(async (cl) => {
      const { data: items } = await supabase.from('checklist_items').select('*').eq('checklist_id', cl.id).order('sort_order', { ascending: true })
      return { ...cl, items: (items || []) as ChecklistItem[] }
    }))
    setChecklists(all)
    setLoading(false)
  }

  async function handleCreate() {
    if (!newTitle.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('checklists').insert({
      event_id: eventId, created_by: user!.id, title: newTitle.trim(),
    }).select().single()
    if (error) { showNotification({ variant: 'error', title: 'Failed', message: error.message }); setSaving(false); return }
    setChecklists([{ ...(data as unknown as Checklist), items: [] }, ...checklists])
    setExpandedIds(new Set([...expandedIds, data!.id]))
    setNewTitle('')
    setShowForm(false)
    setSaving(false)
  }

  async function addItem(checklistId: string) {
    const text = newItemText[checklistId]?.trim()
    if (!text) return
    const sortOrder = (checklists.find(c => c.id === checklistId)?.items.length || 0) + 1
    const { data, error } = await supabase.from('checklist_items').insert({
      checklist_id: checklistId, text, sort_order: sortOrder,
    }).select().single()
    if (error) { showNotification({ variant: 'error', title: 'Failed', message: error.message }); return }
    setChecklists(checklists.map(c => c.id === checklistId ? { ...c, items: [...c.items, data as unknown as ChecklistItem] } : c))
    setNewItemText({ ...newItemText, [checklistId]: '' })
  }

  async function toggleItem(item: ChecklistItem) {
    const updated = { is_checked: !item.is_checked, checked_by: !item.is_checked ? user!.id : null, checked_at: !item.is_checked ? new Date().toISOString() : null }
    await supabase.from('checklist_items').update(updated).eq('id', item.id)
    setChecklists(checklists.map(c => ({
      ...c, items: c.items.map(i => i.id === item.id ? { ...i, ...updated } as ChecklistItem : i)
    })))
  }

  async function deleteChecklist(id: string) {
    await supabase.from('checklists').delete().eq('id', id)
    setChecklists(checklists.filter(c => c.id !== id))
  }

  async function deleteItem(checklistId: string, itemId: string) {
    await supabase.from('checklist_items').delete().eq('id', itemId)
    setChecklists(checklists.map(c => c.id === checklistId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c))
  }

  function progress(items: ChecklistItem[]) {
    if (items.length === 0) return 0
    return Math.round((items.filter(i => i.is_checked).length / items.length) * 100)
  }

  if (!eventId) return <div className="empty-state"><div className="empty-state__title">No event selected</div></div>

  return (
    <div>
      <PageHero icon={CheckSquare} title="Checklists"
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            <Plus size={16} /> New Checklist
          </button>
        }
      />

      {showForm && (
        <div className="overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-card-header">
              <h3 className="modal-card-title">New Checklist</h3>
              <button className="modal-card-close" onClick={() => { setShowForm(false); setNewTitle('') }}><X size={18} /></button>
            </div>
            <div className="modal-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="input-wrapper">
                <label className="input-label">Title</label>
                <input className="input" placeholder="e.g. Venue Setup Checklist" value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowForm(false) }} autoFocus />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={saving || !newTitle.trim()}>Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="skeleton skeleton-card" style={{ height: 300 }} />
      ) : checklists.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__title">No checklists yet</div>
          <div className="empty-state__description">Create a checklist to track tasks for your event</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {checklists.map(cl => {
            const pct = progress(cl.items)
            const done = cl.items.filter(i => i.is_checked).length
            const isExpanded = expandedIds.has(cl.id)
            return (
              <div key={cl.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className={styles.clHeader} onClick={() => {
                  const next = new Set(expandedIds)
                  if (next.has(cl.id)) next.delete(cl.id); else next.add(cl.id)
                  setExpandedIds(next)
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span style={{ fontWeight: 600 }}>{cl.title}</span>
                    <span className={styles.pct}>{done}/{cl.items.length}</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                  </div>
                  <button className="btn btn-ghost btn-icon btn-xs" onClick={(e) => { e.stopPropagation(); deleteChecklist(cl.id) }} title="Delete"><Trash2 size={14} /></button>
                </div>
                {isExpanded && (
                  <div className={styles.clBody}>
                    <Table
                      columns={[
                        { key: 'status', label: '' },
                        { key: 'item', label: 'Item' },
                        { key: 'actions', label: '' },
                      ]}
                      empty={cl.items.length === 0}
                      emptyTitle="No items"
                      emptyDescription="Add items to this checklist"
                    >
                      {cl.items.map(item => (
                        <tr key={item.id}>
                          <td style={{ width: 40 }}>
                            <button className="btn btn-ghost btn-icon btn-xs" onClick={() => toggleItem(item)}
                              style={{ color: item.is_checked ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                              {item.is_checked ? <CheckSquare size={16} /> : <Square size={16} />}
                            </button>
                          </td>
                          <td><span className={`${styles.itemText} ${item.is_checked ? styles.done : ''}`}>{item.text}</span></td>
                          <td style={{ width: 40 }}>
                            <button className="btn btn-ghost btn-icon btn-xs" onClick={() => deleteItem(cl.id, item.id)}><X size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </Table>
                    <div className={styles.addItemRow}>
                      <input className="input" placeholder="Add item..." value={newItemText[cl.id] || ''}
                        onChange={e => setNewItemText({ ...newItemText, [cl.id]: e.target.value })}
                        onKeyDown={e => { if (e.key === 'Enter') addItem(cl.id) }} />
                      <button className="btn btn-secondary btn-xs" onClick={() => addItem(cl.id)}>Add</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
