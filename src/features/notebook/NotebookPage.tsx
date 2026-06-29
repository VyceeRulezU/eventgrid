import { useEffect, useState } from 'react'
import { Plus, BookOpen, Pin, PinOff, Trash2 } from 'lucide-react'
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
  const { eventId, isReadOnly } = useResolvedEventId()
  const user = useAuthStore((s) => s.user)
  const showNotification = useUIStore((s) => s.showNotification)

  const [notes, setNotes] = useState<EventNote[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const [form, setForm] = useState({ title: '', content: '', category: 'general' })

  const activeNote = notes.find(n => n.id === activeNoteId) || null

  useEffect(() => {
    if (!eventId) return
    loadNotes()
  }, [eventId])

  useEffect(() => {
    if (activeNoteId === 'new') {
      setForm({ title: '', content: '', category: 'general' })
    } else if (activeNote) {
      setForm({ title: activeNote.title, content: activeNote.content || '', category: activeNote.category })
    } else {
      setForm({ title: '', content: '', category: 'general' })
    }
  }, [activeNoteId, activeNote])

  async function loadNotes() {
    setLoading(true)
    const { data } = await supabase.from('event_notes').select('*').eq('event_id', eventId).order('created_at', { ascending: false })
    if (data) {
      setNotes(data as EventNote[])
      if (data.length > 0) {
        setActiveNoteId(data[0].id)
      }
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!form.title.trim()) { showNotification({ variant: 'warning', title: 'Title is required' }); return }
    setSaving(true)
    const payload = { event_id: eventId, created_by: user!.id, title: form.title.trim(), content: form.content, category: form.category }
    
    if (activeNoteId && activeNoteId !== 'new') {
      const { error } = await supabase.from('event_notes').update(payload).eq('id', activeNoteId)
      if (error) { showNotification({ variant: 'error', title: 'Failed to update', message: error.message }); setSaving(false); return }
      setNotes(notes.map(n => n.id === activeNoteId ? { ...n, ...payload, updated_at: new Date().toISOString() } as EventNote : n))
      showNotification({ variant: 'success', title: 'Note updated' })
    } else {
      const { data, error } = await supabase.from('event_notes').insert(payload).select().single()
      if (error) { showNotification({ variant: 'error', title: 'Failed to save', message: error.message }); setSaving(false); return }
      setNotes([data as unknown as EventNote, ...notes])
      setActiveNoteId(data.id)
      showNotification({ variant: 'success', title: 'Note saved' })
    }
    setSaving(false)
  }

  async function togglePin(note: EventNote) {
    const nextPin = !note.is_pinned
    await supabase.from('event_notes').update({ is_pinned: nextPin }).eq('id', note.id)
    setNotes(notes.map(n => n.id === note.id ? { ...n, is_pinned: nextPin } as EventNote : n))
  }

  async function deleteNote(id: string) {
    const confirmDelete = window.confirm("Are you sure you want to delete this note?")
    if (!confirmDelete) return
    await supabase.from('event_notes').delete().eq('id', id)
    const remaining = notes.filter(n => n.id !== id)
    setNotes(remaining)
    if (remaining.length > 0) {
      setActiveNoteId(remaining[0].id)
    } else {
      setActiveNoteId(null)
    }
  }

  const sorted = [...notes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const filtered = selectedCategory === 'all' ? sorted : sorted.filter(n => n.category === selectedCategory)

  if (!eventId) return <div className="empty-state"><div className="empty-state__title">No event selected</div></div>
  if (loading) return <div><div className="skeleton skeleton-card" style={{ height: 300 }} /></div>

  if (notes.length === 0 && activeNoteId !== 'new') {
    return (
      <div>
        <PageHero icon={BookOpen} title="Notebook" subtitle="Capture notes, ideas, and important details"
          actions={
            !isReadOnly && (
              <button className="btn btn-primary btn-sm" onClick={() => setActiveNoteId('new')}>
                <Plus size={16} /> New Note
              </button>
            )
          }
        />
        <div className="empty-state">
          <div className="empty-state__title">No notes yet</div>
          <div className="empty-state__description">
            {isReadOnly ? 'This event is archived and has no notes.' : 'Capture notes, ideas, and details for this event.'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHero icon={BookOpen} title="Notebook" subtitle="Capture notes, ideas, and important details"
        actions={
          !isReadOnly && (
            <button className="btn btn-primary btn-sm" onClick={() => setActiveNoteId('new')}>
              <Plus size={16} /> New Note
            </button>
          )
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

      <div className={styles.workspace}>
        {/* Left Column: Note cards list */}
        <div className={styles.sidebar}>
          {filtered.length === 0 ? (
            <div className={styles.emptySidebar}>
              No notes in this category
            </div>
          ) : (
            <div className={styles.noteList}>
              {filtered.map(note => {
                const isSelected = note.id === activeNoteId
                return (
                  <div
                    key={note.id}
                    className={`${styles.noteCard} ${isSelected ? styles.selectedCard : ''} ${note.is_pinned ? styles.pinnedCard : ''}`}
                    onClick={() => setActiveNoteId(note.id)}
                  >
                    <div className={styles.noteCardHeader}>
                      <span className={styles.categoryTag}>{note.category}</span>
                      {note.is_pinned && <Pin size={12} className={styles.pinIcon} />}
                    </div>
                    <h4 className={styles.noteCardTitle}>{note.title || 'Untitled Note'}</h4>
                    <p className={styles.noteCardSnippet}>
                      {note.content ? note.content.slice(0, 90) + (note.content.length > 90 ? '...' : '') : 'Empty content'}
                    </p>
                    <span className={styles.noteCardDate}>
                      {new Date(note.updated_at || note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Note details editor */}
        <div className={styles.editorPane}>
          {activeNoteId ? (
            <div className={styles.editorContent}>
              <div className={styles.editorHeader}>
                <div className={styles.editorMeta}>
                  <label className={styles.editorLabel}>Category</label>
                  <DropdownMenu
                    trigger={<span className={styles.categorySelectorTrigger}>{form.category}</span>}
                    items={CATEGORIES.map(c => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c }))}
                    onSelect={(item) => !isReadOnly && setForm({ ...form, category: item.value })}
                  />
                </div>
                {!isReadOnly && activeNoteId !== 'new' && (
                  <div className={styles.editorActions}>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => activeNote && togglePin(activeNote)}
                      title={activeNote?.is_pinned ? 'Unpin Note' : 'Pin Note'}
                    >
                      {activeNote?.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
                    </button>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      style={{ color: 'var(--color-error)' }}
                      onClick={() => deleteNote(activeNoteId)}
                      title="Delete Note"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.editorInputs}>
                <input
                  type="text"
                  className={styles.titleInput}
                  placeholder="Note Title"
                  value={form.title}
                  onChange={e => !isReadOnly && setForm({ ...form, title: e.target.value })}
                  disabled={isReadOnly}
                />
                <textarea
                  className={styles.contentTextarea}
                  placeholder="Start writing..."
                  value={form.content}
                  onChange={e => !isReadOnly && setForm({ ...form, content: e.target.value })}
                  disabled={isReadOnly}
                />
              </div>

              {!isReadOnly && (
                <div className={styles.editorFooter}>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : activeNoteId === 'new' ? 'Create Note' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.emptyEditor}>
              <BookOpen size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }} />
              <h3>No note selected</h3>
              <p>Select a note from the list, or create a new one to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
