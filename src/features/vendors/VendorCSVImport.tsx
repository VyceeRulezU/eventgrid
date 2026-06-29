import { useState, useRef } from 'react'
import { Upload, Download, X, Check, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import type { Vendor } from '@/types'

const CSV_TEMPLATE = `name,category,contact_name,phone,email,instagram,website,notes,rating
Royal Bakes,Decor,Chioma Okafor,08031234567,chioma@royalbakes.com,royal_bakes,royalbakes.com,Best cake vendor in Lagos,5
Prime Events,Venue,Emeka Nwosu,08079876543,emeka@primeevents.com,,primeevents.com,Premier event venue,4`

const REQUIRED_COLUMNS = ['name']

const ALLOWED_COLUMNS = ['name', 'category', 'contact_name', 'phone', 'email', 'instagram', 'website', 'notes', 'rating']

interface VendorCSVImportProps {
  orgId: string
  onDone: (imported: Vendor[]) => void
  onCancel: () => void
}

interface ImportResult {
  success: number
  errors: { row: number; message: string }[]
}

export function VendorCSVImport({ orgId, onDone, onCancel }: VendorCSVImportProps) {
  const showNotification = useUIStore((s) => s.showNotification)
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vendor-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)

    const text = await file.text()
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })

    if (parsed.errors.length > 0) {
      showNotification({ variant: 'error', title: 'CSV parse error', message: parsed.errors[0].message })
      return
    }

    const headers = parsed.meta.fields || []
    const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c))
    if (missing.length > 0) {
      showNotification({ variant: 'error', title: 'Invalid CSV', message: `Missing required column(s): ${missing.join(', ')}` })
      return
    }

    const invalidCols = headers.filter((h) => !ALLOWED_COLUMNS.includes(h))
    if (invalidCols.length > 0) {
      showNotification({ variant: 'warning', title: 'Unknown columns', message: `Ignoring: ${invalidCols.join(', ')}. Allowed: ${ALLOWED_COLUMNS.join(', ')}` })
    }

    setImporting(true)
    const errors: ImportResult['errors'] = []
    const rows: Record<string, unknown>[] = []

    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i]
      const name = row.name?.trim()
      if (!name) {
        errors.push({ row: i + 2, message: 'Name is required' })
        continue
      }

      const rating = row.rating?.trim()
      rows.push({
        org_id: orgId,
        name,
        category: row.category?.trim() || null,
        contact_name: row.contact_name?.trim() || null,
        phone: row.phone?.trim() || null,
        email: row.email?.trim() || null,
        instagram: row.instagram?.trim() || null,
        website: row.website?.trim() || null,
        notes: row.notes?.trim() || null,
        rating: rating ? parseInt(rating, 10) : null,
      })
    }

    if (rows.length === 0) {
      showNotification({ variant: 'error', title: 'No valid rows', message: 'No valid vendor rows found in the CSV.' })
      setImporting(false)
      return
    }

    const { data, error } = await supabase
      .from('vendors')
      .insert(rows)
      .select()

    if (error) {
      showNotification({ variant: 'error', title: 'Import failed', message: error.message })
      setImporting(false)
      return
    }

    const imported = (data || []) as unknown as Vendor[]
    setResult({ success: imported.length, errors })
    setImporting(false)

    if (imported.length > 0) {
      showNotification({ variant: 'success', title: 'Vendors imported', message: `${imported.length} vendor${imported.length !== 1 ? 's' : ''} added` })
      onDone(imported)
    }
  }

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-card-header">
          <h3 className="modal-card-title">Import Vendors from CSV</h3>
          <button className="modal-card-close" onClick={onCancel} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Upload a CSV file with your vendor list. The first row must contain column headers.
            Only <strong>name</strong> is required; all other fields are optional.
          </div>

          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            <strong>Supported columns:</strong> {ALLOWED_COLUMNS.join(', ')}
          </div>

          <button className="btn btn-ghost btn-sm" onClick={downloadTemplate} style={{ alignSelf: 'flex-start', gap: 'var(--space-1)' }}>
            <Download size={14} />
            Download CSV template
          </button>

          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFile}
          />

          {!result && (
            <button
              className="btn btn-primary"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              style={{ gap: 'var(--space-2)' }}
            >
              <Upload size={16} />
              {importing ? 'Importing...' : 'Select CSV file'}
            </button>
          )}

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                <Check size={16} style={{ color: 'var(--color-success)' }} />
                {result.success} vendor{result.success !== 1 ? 's' : ''} imported
              </div>
              {result.errors.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}>
                  {result.errors.map((e, i) => (
                    <div key={i} style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <AlertCircle size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>Row {e.row}: {e.message}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <button className="btn btn-primary btn-sm" onClick={() => { setResult(null); if (fileRef.current) fileRef.current.value = '' }} style={{ gap: 'var(--space-1)' }}>
                  <Upload size={14} />
                  Import another
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => onDone([])}>Done</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
