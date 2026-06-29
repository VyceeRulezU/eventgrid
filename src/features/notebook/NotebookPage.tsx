import { useEffect, useState } from 'react'
import { Plus, X, BookOpen, Pin, PinOff, Trash2, Edit3 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { PageHero } from '@/components/shared/PageHero'
import { useResolvedEventId } from '@/hooks/useResolvedEventId'
import { Tabs } from '@/components/ui/Tabs'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import styles from './NotebookPage.module.css'
import type { EventNote } from '@/types'

const CATEGORIES = ['general', 'ideas', 'todo', 'notes', 'important'] as const

export function NotebookPage() {
  const { eventId } = useResolvedEventId()
  const user = useAuthStore((s) => s.user)
  const showNotification = useUIStore((s) => s.showNotification)

  const [notes, setNotes] = useState<EventNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingNote, setEditingNote] = useState<EventNote | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const [form, setForm] = useState({ title: '', content: '', category: 'general' as string })

  useEffect(() => {
    if (!eventId) return
    loadNotes()
  }, [eventId])

  async function loadNotes() {
    setLoading(true)
    const { data } = await supabase.from('event_notes').select('*').eq('event_id', eventId).order('created_at', { ascending: false })
    if (data) setNotes(data as EventNote[])
    setLoading(false)
  }

  function resetForm() { setForm({ title: '', content: '', category: 'general' }) }

  async function handleSave() {
    if (!form.title.trim()) { showNotification({ variant: 'warning', title: 'Title is required' }); return }
    setSaving(true)
    const payload = { event_id: eventId, created_by: user!.id, title: form.title.trim(), content: form.content, category: form.category }
    if (editingNote) {
      await supabase.from('event_notes').update(payload).eq('id', editingNote.id)
      setNotes(notes.map(n => n.id === editingNote.id ? { ...n, ...payload, updated_at: new Date().toISOString() } as EventNote : n))
      showNotification({ variant: 'success', title: 'Note updated' })
    } else {
      const { data, error } = await supabase.from('event_notes').insert(payload).select().single()
      if (error) { showNotification({ variant: 'error', title: 'Failed', message: error.message }); setSaving(false); return }
      setNotes([data as unknown as EventNote, ...notes])
      showNotification({ variant: 'success', title: 'Note created' })
    }
    setSaving(false)
    setShowForm(false)
    setEditingNote(null)
    resetForm()
  }

  async function togglePin(note: EventNote) {
    await supabase.from('event_notes').update({ is_pinned: !note.is_pinned }).eq('id', note.id)
    setNotes(notes.map(n => n.id === note.id ? { ...n, is_pinned: !note.is_pinned } as EventNote : n))
  }

  async function deleteNote(id: string) {
    await supabase.from('event_notes').delete().eq('id', id)
    setNotes(notes.filter(n => n.id !== id))
  }

  function openEdit(note: EventNote) {
    setEditingNote(note)
    setForm({ title: note.title, content: note.content, category: note.category })
    setShowForm(true)
  }

  const sorted = [...notes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const filtered = selectedCategory === 'all' ? sorted : sorted.filter(n => n.category === selectedCategory)

  if (!eventId) return <div className="empty-state"><div className="empty-state__title">No event selected</div></div>
  if (loading) return <div><div className="skeleton skeleton-card" style={{ height: 300 }} /></div>

  return (
    <div>
      <PageHero icon={BookOpen} title="Notebook" subtitle="Capture notes, ideas, and important details"
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => { setEditingNote(null); resetForm(); setShowForm(true) }}>
            <Plus size={16} /> New Note
          </button>
        }
      />

      <Tabs
        tabs={[
          { key: 'all', label: `All (${notes.length})` },
          ...CATEGORIES.map(c => ({ key: c, label: c.charAt(0).toUpperCase() + c.slice(1) })),
        ]}
        activeTab={selectedCategory}
        onChange={setSelectedCategory}
      />

      {showForm && (
        <div className="overlay" onClick={() => { setShowForm(false); setEditingNote(null) }}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-card-header">
              <h3 className="modal-card-title">{editingNote ? 'Edit Note' : 'New Note'}</h3>
              <button className="modal-card-close" onClick={() => { setShowForm(false); setEditingNote(null) }}><X size={18} /></button>
            </div>
            <div className="modal-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="input-wrapper"><label className="input-label">Title *</label><input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div className="input-wrapper"><label className="input-label">Category</label>
                <DropdownMenu
                  trigger={<span>{form.category}</span>}
                  items={CATEGORIES.map(c => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c }))}
                  onSelect={(item) => setForm({...form, category: item.value})}
                />
              </div>
              <div className="input-wrapper"><label className="input-label">Content</label>
                <textarea className="input" rows={10} value={form.content} onChange={e => setForm({...form, content: e.target.value})}
                  placeholder="Write your notes here..." style={{ minHeight: 200, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditingNote(null) }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editingNote ? 'Update' : 'Save Note'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.grid}>
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state__title">No notes yet</div>
          </div>
        ) : filtered.map(note => (
          <div key={note.id} className={`card ${styles.noteCard} ${note.is_pinned ? styles.pinned : ''}`}>
            <div className={styles.noteHeader}>
              <span className={styles.categoryBadge}>{note.category}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-ghost btn-icon btn-xs" onClick={() => togglePin(note)} title={note.is_pinned ? 'Unpin' : 'Pin'}>
                  {note.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                </button>
                <button className="btn btn-ghost btn-icon btn-xs" onClick={() => openEdit(note)} title="Edit"><Edit3 size={14} /></button>
                <button className="btn btn-ghost btn-icon btn-xs" onClick={() => deleteNote(note.id)} title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
            <h4 className={styles.noteTitle}>{note.title}</h4>
            <div className={styles.noteContent}>{note.content}</div>
            <div className={styles.noteFooter}>
              {new Date(note.updated_at || note.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
