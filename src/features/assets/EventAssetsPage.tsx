import { useEffect, useState, useMemo, useRef } from 'react'
import { useResolvedEventId } from '@/hooks/useResolvedEventId'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { compressImage } from '@/lib/compressImage'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { Document, Page, pdfjs } from 'react-pdf'
import {
  Image, FileText, Upload, Trash2, X, Grid3X3, FolderOpen, Download, ExternalLink,
} from 'lucide-react'
import styles from './EventAssetsPage.module.css'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

interface EventAsset {
  id: string
  event_id: string
  uploaded_by: string
  name: string
  asset_type: 'moodboard' | 'image' | 'document' | 'other'
  category: string
  file_size: number | null
  mime_type: string | null
  storage_path: string | null
  file_url: string | null
  created_at: string
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  return (bytes / 1024).toFixed(0) + ' KB'
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return mins + 'm ago'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours + 'h ago'
  const days = Math.floor(hours / 24)
  if (days < 30) return days + 'd ago'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function isImageType(mime: string | null): boolean {
  if (!mime) return false
  return mime.startsWith('image/')
}

const ASSET_TYPE_OPTIONS = [
  { label: 'All Types', value: 'all' },
  { label: 'Moodboard', value: 'moodboard' },
  { label: 'Image', value: 'image' },
  { label: 'Document', value: 'document' },
  { label: 'Other', value: 'other' },
] as const

function PdfThumbnail({ file }: { file: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  return (
    <div className={styles.pdfThumbnailWrapper}>
      {loading && (
        <div className={styles.pdfThumbLoading}>
          <span className="spinner-loader" style={{ width: 20, height: 20 }} />
        </div>
      )}
      {error && (
        <div className={styles.pdfThumbError}>
          <FileText size={24} />
          <span>Preview Error</span>
        </div>
      )}
      <div style={{ display: loading || error ? 'none' : 'block', width: '100%', height: '100%' }}>
        <Document
          file={file}
          onLoadSuccess={() => setLoading(false)}
          onLoadError={() => { setLoading(false); setError(true) }}
          loading={null}
          error={null}
        >
          <Page
            pageNumber={1}
            width={240}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
    </div>
  )
}

function PdfPreviewer({ file, title }: { file: string; title: string }) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isMobile) {
    return (
      <iframe
        src={file}
        className={styles.pdfPreviewFrame}
        title={title}
      />
    )
  }

  return (
    <div className={styles.pdfViewer}>
      <div className={styles.pdfPageCount}>
        {numPages ? `${numPages} page${numPages !== 1 ? 's' : ''}` : ''}
      </div>
      <div className={styles.pdfScroll}>
        <Document
          file={file}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          loading={<div className={styles.pdfLoading}>Loading PDF...</div>}
          error={<div className={styles.pdfError}>Failed to load PDF</div>}
        >
          {numPages && Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
            <Page
              key={p}
              pageNumber={p}
              width={Math.min(window.innerWidth - 40, 680)}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          ))}
        </Document>
      </div>
    </div>
  )
}

export function EventAssetsPage() {
  const { eventId, loading: resolving } = useResolvedEventId()
  const id = eventId
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const role = useAuthStore((s) => s.role)
  const showNotification = useUIStore((s) => s.showNotification)
  const showModal = useUIStore((s) => s.showModal)

  const [loading, setLoading] = useState(true)
  const [assets, setAssets] = useState<EventAsset[]>([])
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [previewAsset, setPreviewAsset] = useState<EventAsset | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!previewAsset) {
      setPreviewUrl(null)
      return
    }
    setPreviewUrl(signedUrls[previewAsset.id] || previewAsset.file_url)
  }, [previewAsset, signedUrls])

  const fileRef = useRef<HTMLInputElement>(null)
  const [formFile, setFormFile] = useState<File | null>(null)
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formType, setFormType] = useState<EventAsset['asset_type']>('image')

  const canDelete = role === 'super_admin' || (profile?.org_id != null)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function loadAssets() {
      setLoading(true)
      const { data, error } = await supabase
        .from('event_assets')
        .select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: false })

      if (!cancelled) {
        if (error) {
          showNotification({ variant: 'error', title: 'Failed to load assets', message: error.message })
        } else {
          const loadedAssets = (data || []) as unknown as EventAsset[]
          setAssets(loadedAssets)
          const urls: Record<string, string> = {}
          await Promise.all(loadedAssets.map(async (a) => {
            if (!isImageType(a.mime_type) && a.storage_path) {
              const { data: sd } = await supabase.storage
                .from('event-media')
                .createSignedUrl(a.storage_path, 3600)
              if (sd?.signedUrl) {
                urls[a.id] = `${sd.signedUrl}&content-disposition=inline`
              }
            }
          }))
          setSignedUrls(urls)
        }
        setLoading(false)
      }
    }

    loadAssets()
    return () => { cancelled = true }
  }, [id, showNotification])

  const categories = useMemo(() => {
    const cats = new Set<string>()
    for (const a of assets) {
      if (a.category) cats.add(a.category)
    }
    return ['all', ...Array.from(cats).sort()]
  }, [assets])

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false
      if (typeFilter !== 'all' && a.asset_type !== typeFilter) return false
      return true
    })
  }, [assets, categoryFilter, typeFilter])

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFormFile(file)
    if (!formName) setFormName(file.name.replace(/\.[^.]+$/, ''))
    const mime = file.type
    if (isImageType(mime)) {
      setFormType('image')
    } else {
      setFormType('document')
    }
  }

  const handleUpload = async () => {
    if (!id || !formFile || !formName.trim() || !user) return
    setUploading(true)

    try {
      const ext = formFile.name.split('.').pop() || 'bin'
      const path = `${id}/assets/${crypto.randomUUID()}.${ext}`

      let fileToUpload: File | Blob = formFile
      if (isImageType(formFile.type)) {
        const compressed = await compressImage(formFile)
        fileToUpload = compressed
      }

      const { error: uploadErr } = await supabase.storage
        .from('event-media')
        .upload(path, fileToUpload, {
          contentType: formFile.type,
          upsert: false,
        })
      if (uploadErr) throw uploadErr

      const { data: pubUrlData } = supabase.storage
        .from('event-media')
        .getPublicUrl(path)
      const url = pubUrlData?.publicUrl

      const { error: insertErr } = await supabase.from('event_assets').insert({
        event_id: id,
        uploaded_by: user.id,
        name: formName.trim(),
        asset_type: formType,
        category: formCategory.trim() || 'Uncategorized',
        file_size: formFile.size,
        mime_type: formFile.type,
        storage_path: path,
        file_url: url,
      })

      if (insertErr) throw insertErr

      const { data: newAsset } = await supabase
        .from('event_assets')
        .select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (newAsset) {
        setAssets((prev) => [newAsset as unknown as EventAsset, ...prev])
        if (!isImageType(newAsset.mime_type) && newAsset.storage_path) {
          const { data: sd } = await supabase.storage
            .from('event-media')
            .createSignedUrl(newAsset.storage_path, 3600)
          if (sd?.signedUrl) {
            setSignedUrls((prev) => ({ ...prev, [newAsset.id]: `${sd.signedUrl}&content-disposition=inline` }))
          }
        }
      }

      showNotification({ variant: 'success', title: 'Asset uploaded' })
      setShowForm(false)
      setFormFile(null)
      setFormName('')
      setFormCategory('')
      setFormType('image')
      if (fileRef.current) fileRef.current.value = ''
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      showNotification({ variant: 'error', title: 'Upload failed', message: msg })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = (asset: EventAsset) => {
    showModal({
      variant: 'confirm',
      title: 'Delete asset?',
      message: `Delete "${asset.name}"? This cannot be undone.`,
      actions: [
        { label: 'Cancel', variant: 'secondary', onClick: () => {} },
        {
          label: 'Delete',
          variant: 'danger',
          onClick: async () => {
            setDeleting(asset.id)
            try {
              if (asset.storage_path) {
                await supabase.storage.from('event-media').remove([asset.storage_path])
              }
              const { error } = await supabase.from('event_assets').delete().eq('id', asset.id)
              if (error) throw error
              setAssets((prev) => prev.filter((a) => a.id !== asset.id))
              setSignedUrls((prev) => { const n = { ...prev }; delete n[asset.id]; return n })
              showNotification({ variant: 'success', title: 'Asset deleted' })
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Delete failed'
              showNotification({ variant: 'error', title: 'Delete failed', message: msg })
            } finally {
              setDeleting(null)
            }
          },
        },
      ],
    })
  }

  const renderThumbnail = (asset: EventAsset) => {
    const isImg = isImageType(asset.mime_type)
    if (isImg && asset.file_url) {
      return <img src={asset.file_url} alt={asset.name} className={styles.cardThumbImg} />
    }
    const thumbUrl = signedUrls[asset.id] || asset.file_url
    if (asset.mime_type === 'application/pdf' && thumbUrl) {
      return <PdfThumbnail file={thumbUrl} />
    }
    return (
      <div className={styles.docThumb}>
        <FileText size={32} />
        <span className={styles.docThumbName}>{asset.name}</span>
      </div>
    )
  }

  if (resolving || loading) {
    return (
      <div className={styles.page}>
        <div className={styles.toolbar}>
          <div className="skeleton skeleton-text" style={{ width: 140 }} />
        </div>
        <div className={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-card" style={{ height: 260 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <DropdownMenu
            trigger={<span>{categoryFilter === 'all' ? 'All Categories' : categoryFilter}</span>}
            items={categories.map((c) => ({
              label: c === 'all' ? 'All Categories' : c,
              value: c,
            }))}
            onSelect={(item) => setCategoryFilter(item.value)}
          />
          <DropdownMenu
            trigger={<span>{ASSET_TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label || 'All Types'}</span>}
            items={ASSET_TYPE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            onSelect={(item) => setTypeFilter(item.value)}
          />
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
          <Upload size={14} /> Upload
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <FolderOpen size={40} />
          </div>
          <div className={styles.emptyStateTitle}>No assets yet</div>
          <div className={styles.emptyStateDesc}>
            Upload moodboards, images, or documents to share with your team and client.
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Upload size={14} /> Upload Your First Asset
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((asset) => (
            <div key={asset.id} className={styles.card} onClick={() => setPreviewAsset(asset)}>
              <div className={styles.cardThumb}>
                {renderThumbnail(asset)}
                <span className={styles.cardTypeBadge}>
                  {asset.asset_type === 'moodboard' ? <Grid3X3 size={12} /> : asset.asset_type === 'image' ? <Image size={12} /> : <FileText size={12} />}
                  {asset.asset_type}
                </span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardName} title={asset.name}>{asset.name}</div>
                <div className={styles.cardBadgeRow}>
                  <span className="badge badge-medium">{asset.category || 'Uncategorized'}</span>
                </div>
                <div className={styles.cardMeta}>
                  <span>{formatSize(asset.file_size)}</span>
                  <span>{timeAgo(asset.created_at)}</span>
                </div>
              </div>
              {canDelete && (
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={(e) => { e.stopPropagation(); handleDelete(asset) }}
                    disabled={deleting === asset.id}
                    aria-label={`Delete ${asset.name}`}
                  >
                    {deleting === asset.id ? (
                      <span className="spinner-loader" style={{ width: 14, height: 14 }} />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className={styles.formOverlay} onClick={() => { if (!uploading) setShowForm(false) }}>
          <div className={styles.formCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.formCardHeader}>
              <div className={styles.formCardTitle}><Upload size={16} /> Upload Asset</div>
              <button type="button" className={styles.formCardClose} onClick={() => setShowForm(false)} disabled={uploading}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.formCardBody}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>File</label>
                <div
                  className={styles.uploadArea}
                  onClick={() => fileRef.current?.click()}
                >
                  {formFile ? (
                    <div className={styles.uploadAreaPreview}>
                      {isImageType(formFile.type) && formFile ? (
                        <img src={URL.createObjectURL(formFile)} alt="" className={styles.uploadPreviewImg} />
                      ) : (
                        <FileText size={24} />
                      )}
                      <span>{formFile.name}</span>
                    </div>
                  ) : (
                    <div className={styles.uploadAreaPlaceholder}>
                      <Upload size={20} />
                      <span>Click to select a file</span>
                      <span className={styles.uploadAreaHint}>Accepts images and PDFs</span>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    className={styles.fileInput}
                    onChange={handleFilePick}
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Asset name"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Category</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Moodboard, Venue, Decor"
                    list="category-suggestions"
                  />
                  <datalist id="category-suggestions">
                    {categories.filter((c) => c !== 'all').map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Type</label>
                  <select
                    className={styles.formInput}
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as EventAsset['asset_type'])}
                  >
                    <option value="moodboard">Moodboard</option>
                    <option value="image">Image</option>
                    <option value="document">Document</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.formCardFooter}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} disabled={uploading}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={!formFile || !formName.trim() || uploading}
              >
                {uploading ? (
                  <><span className="spinner-loader" style={{ width: 14, height: 14 }} /> Uploading...</>
                ) : (
                  <><Upload size={14} /> Upload</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewAsset && (
        <div className={styles.formOverlay} onClick={() => setPreviewAsset(null)}>
          <div className={styles.previewCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.formCardHeader}>
              <div className={styles.formCardTitle}>{previewAsset.name}</div>
              <button type="button" className={styles.formCardClose} onClick={() => setPreviewAsset(null)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.previewBody}>
              {isImageType(previewAsset.mime_type) && previewUrl ? (
                <img src={previewUrl} alt={previewAsset.name} className={styles.previewImage} />
              ) : previewAsset.mime_type === 'application/pdf' && previewUrl ? (
                <PdfPreviewer file={previewUrl} title={previewAsset.name} />
              ) : (
                <div className={styles.previewFallback}>
                  <FileText size={48} />
                  <p>Preview not available for this file type.</p>
                  {previewUrl && (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      <ExternalLink size={14} /> Open File
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className={styles.formCardFooter}>
              {previewAsset.file_url && (
                <a href={previewAsset.file_url} download className="btn btn-primary">
                  <Download size={14} /> Download
                </a>
              )}
              <button type="button" className="btn btn-secondary" onClick={() => setPreviewAsset(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
