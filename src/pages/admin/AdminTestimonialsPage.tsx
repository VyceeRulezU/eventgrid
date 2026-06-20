import { useEffect, useState, useCallback, useRef } from 'react'
import { MessageSquareText, Plus, X, Star, Upload, Trash2 } from 'lucide-react'
import { AdminPageHero } from '@/components/shared/AdminPageHero'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import styles from './AdminTestimonialsPage.module.css'

interface Testimonial {
  id: string
  name: string
  role: string
  location: string
  quote: string
  image_url: string
  display_order: number
  is_featured: boolean
  created_at: string
}

export function AdminTestimonialsPage() {
  const role = useAuthStore((s) => s.role)
  const showNotification = useUIStore((s) => s.showNotification)
  const showModal = useUIStore((s) => s.showModal)

  const [entries, setEntries] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formRole, setFormRole] = useState('')
  const [formLocation, setFormLocation] = useState('')
  const [formQuote, setFormQuote] = useState('')
  const [formFeatured, setFormFeatured] = useState(false)
  const [formOrder, setFormOrder] = useState(0)
  const [formImage, setFormImage] = useState<File | null>(null)
  const [formImagePreview, setFormImagePreview] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [useImageUrl, setUseImageUrl] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('display_order', { ascending: true })
    if (error) {
      showNotification({ variant: 'error', title: 'Failed to load', message: error.message })
    } else {
      setEntries(data || [])
    }
    setLoading(false)
  }, [showNotification])

  useEffect(() => { loadData() }, [loadData])

  const resetForm = () => {
    setEditingId(null)
    setFormName('')
    setFormRole('')
    setFormLocation('')
    setFormQuote('')
    setFormFeatured(false)
    setFormOrder(entries.length)
    setFormImage(null)
    setFormImagePreview('')
    setFormImageUrl('')
    setUseImageUrl(false)
    setUploading(false)
  }

  const openEdit = (t: Testimonial) => {
    setEditingId(t.id)
    setFormName(t.name)
    setFormRole(t.role)
    setFormLocation(t.location)
    setFormQuote(t.quote)
    setFormFeatured(t.is_featured)
    setFormOrder(t.display_order)
    setFormImagePreview(t.image_url)
    setFormImageUrl(t.image_url || '')
    // Default to Paste URL mode when editing existing record with a photo
    setUseImageUrl(!!t.image_url)
    setFormImage(null)
    setShowForm(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFormImage(file)
    const reader = new FileReader()
    reader.onload = () => setFormImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!formName.trim() || !formQuote.trim()) {
      showNotification({ variant: 'error', title: 'Validation', message: 'Name and quote are required.' })
      return
    }
    setSaving(true)

    // Resolve image: pasted URL takes priority if in URL mode, then uploaded file, then existing preview
    let imageUrl = useImageUrl ? formImageUrl.trim() : formImagePreview
    if (!useImageUrl && formImage) {
      setUploading(true)
      try {
        const ext = formImage.name.split('.').pop() || 'jpg'
        const path = `testimonials/${Date.now()}_${formName.replace(/\s+/g, '_').toLowerCase()}.${ext}`
        // Upload directly via Supabase Storage (avoids R2 CORS issues)
        const { error: uploadError } = await supabase.storage
          .from('testimonials')
          .upload(path, formImage, { upsert: true })
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('testimonials').getPublicUrl(path)
        imageUrl = publicUrl
      } catch (err: any) {
        showNotification({ variant: 'error', title: 'Upload failed', message: err.message || 'Could not upload image' })
        setSaving(false)
        setUploading(false)
        return
      }
      setUploading(false)
    }

    const record = {
      name: formName.trim(),
      role: formRole.trim(),
      location: formLocation.trim(),
      quote: formQuote.trim(),
      image_url: imageUrl,
      display_order: formOrder,
      is_featured: formFeatured,
    }

    if (editingId) {
      const { error } = await supabase.from('testimonials').update(record).eq('id', editingId)
      if (error) {
        showNotification({ variant: 'error', title: 'Update failed', message: error.message })
        setSaving(false)
        return
      }
      showNotification({ variant: 'success', title: 'Testimonial updated' })
    } else {
      const { error } = await supabase.from('testimonials').insert(record)
      if (error) {
        showNotification({ variant: 'error', title: 'Create failed', message: error.message })
        setSaving(false)
        return
      }
      showNotification({ variant: 'success', title: 'Testimonial added' })
    }

    setSaving(false)
    setShowForm(false)
    resetForm()
    loadData()
  }

  const handleDelete = (t: Testimonial) => {
    showModal({
      variant: 'confirm',
      title: 'Delete testimonial?',
      message: `Remove testimonial from ${t.name}? This cannot be undone.`,
      actions: [
        { label: 'Cancel', variant: 'secondary' as const, onClick: () => {} },
        {
          label: 'Delete',
          variant: 'danger' as const,
          onClick: async () => {
            const { error } = await supabase.from('testimonials').delete().eq('id', t.id)
            if (error) {
              showNotification({ variant: 'error', title: 'Delete failed', message: error.message })
              return
            }
            showNotification({ variant: 'success', title: 'Testimonial deleted' })
            loadData()
          },
        },
      ],
    })
  }

  if (role !== 'super_admin') return null

  if (loading) {
    return (
      <div className={styles.page}>
        <AdminPageHero icon={MessageSquareText} title="Testimonials" subtitle="Loading..." />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 'var(--space-4)' }}>
          <img src="/EventGrid-favicon.svg" alt="" style={{ width: 48, height: 48, opacity: 0.5 }} />
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading testimonials...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <AdminPageHero
        icon={MessageSquareText}
        title="Testimonials"
        subtitle="Manage social proof quotes displayed on the landing page"
        backTo="/admin"
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(true) }}>
            <Plus size={14} /> Add Testimonial
          </button>
        }
      />

      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}></th>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Role / Location</th>
                <th className={styles.th}>Quote</th>
                <th className={styles.th}>Order</th>
                <th className={styles.th}>Featured</th>
                <th className={styles.th} style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td className={styles.td} colSpan={7}>
                    <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)', color: 'var(--color-text-muted)' }}>
                      <MessageSquareText size={24} style={{ marginBottom: 'var(--space-2)', opacity: 0.4 }} />
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>No testimonials yet</div>
                      <div style={{ fontSize: 'var(--text-xs)', marginTop: 4 }}>Add your first testimonial to get started</div>
                    </div>
                  </td>
                </tr>
              ) : entries.map((t) => (
                <tr key={t.id} className={styles.tr}>
                  <td className={styles.td}>
                    {t.image_url ? (
                      <img src={t.image_url} alt={t.name} className={styles.avatar} />
                    ) : (
                      <div className={styles.avatarPlaceholder}>{t.name.charAt(0).toUpperCase()}</div>
                    )}
                  </td>
                  <td className={styles.td}>
                    <div className={styles.memberInfo}>
                      <div>
                        <div className={styles.memberName}>{t.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.cellMuted}>{t.role}{t.role && t.location ? ' · ' : ''}{t.location}</span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.quotePreview}>"{t.quote}"</div>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.cellMuted}>{t.display_order}</span>
                  </td>
                  <td className={styles.td}>
                    {t.is_featured ? <Star size={16} style={{ color: 'var(--color-accent)' }} /> : <span className={styles.cellMuted}>—</span>}
                  </td>
                  <td className={styles.td}>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)} aria-label="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(t)} aria-label="Delete" style={{ color: 'var(--color-error)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFooter}>
          <span>{entries.length} testimonial{entries.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {showForm && (
        <div className="overlay" onClick={() => { if (!saving) { setShowForm(false); resetForm() } }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-card-header">
              <h3 className="modal-card-title">{editingId ? 'Edit Testimonial' : 'Add Testimonial'}</h3>
              <button type="button" className="modal-card-close" onClick={() => { if (!saving) { setShowForm(false); resetForm() } }} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="modal-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                {/* Avatar preview */}
                {(useImageUrl ? formImageUrl : formImagePreview) ? (
                  <img
                    src={useImageUrl ? formImageUrl : formImagePreview}
                    alt=""
                    style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border-subtle)', flexShrink: 0 }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 20, flexShrink: 0 }}>?</div>
                )}

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {/* Toggle tabs */}
                  <div style={{ display: 'flex', gap: 'var(--space-1)', background: 'var(--color-surface-3)', borderRadius: 'var(--radius-md)', padding: 2, width: 'fit-content' }}>
                    <button
                      type="button"
                      onClick={() => setUseImageUrl(false)}
                      style={{
                        padding: '3px 12px', borderRadius: 'calc(var(--radius-md) - 2px)',
                        fontSize: 'var(--text-xs)', fontWeight: 600, border: 'none', cursor: 'pointer',
                        background: !useImageUrl ? 'var(--color-surface-2)' : 'transparent',
                        color: !useImageUrl ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                        transition: 'all 0.15s',
                      }}
                    >Upload</button>
                    <button
                      type="button"
                      onClick={() => setUseImageUrl(true)}
                      style={{
                        padding: '3px 12px', borderRadius: 'calc(var(--radius-md) - 2px)',
                        fontSize: 'var(--text-xs)', fontWeight: 600, border: 'none', cursor: 'pointer',
                        background: useImageUrl ? 'var(--color-surface-2)' : 'transparent',
                        color: useImageUrl ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                        transition: 'all 0.15s',
                      }}
                    >Paste URL</button>
                  </div>

                  {useImageUrl ? (
                    <input
                      className="input"
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      style={{ fontSize: 'var(--text-xs)' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                        <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload Photo'}
                      </button>
                      {formImagePreview && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setFormImage(null); setFormImagePreview('') }}>Remove</button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="input-wrapper">
                <label className="input-label">Name *</label>
                <input className="input" type="text" placeholder="Tunde Adeola" value={formName} onChange={(e) => setFormName(e.target.value)} autoFocus />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="input-wrapper">
                  <label className="input-label">Role</label>
                  <input className="input" type="text" placeholder="Wedding Planner" value={formRole} onChange={(e) => setFormRole(e.target.value)} />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Location</label>
                  <input className="input" type="text" placeholder="Lagos" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} />
                </div>
              </div>

              <div className="input-wrapper">
                <label className="input-label">Quote *</label>
                <textarea className="input" style={{ minHeight: 80, resize: 'vertical' }} placeholder="NaliGrid transformed how I manage events..." value={formQuote} onChange={(e) => setFormQuote(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                <div className="input-wrapper" style={{ width: 100 }}>
                  <label className="input-label">Order</label>
                  <input className="input" type="number" min={0} value={formOrder} onChange={(e) => setFormOrder(parseInt(e.target.value) || 0)} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', marginTop: 20 }}>
                  <input type="checkbox" checked={formFeatured} onChange={(e) => setFormFeatured(e.target.checked)} />
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Featured card (gold highlight)</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || uploading}>
                  {saving ? 'Saving...' : (editingId ? 'Update' : 'Add Testimonial')}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); resetForm() }} disabled={saving}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
