import { useEffect, useState, useRef } from 'react'
import React from 'react'
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'
import { Plus, Search, Wallet, Upload, FileSpreadsheet, X, AlertTriangle, Check, Pencil, Trash2, TrendingUp } from 'lucide-react'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { Tabs } from '@/components/ui/Tabs'
import { PageHero } from '@/components/shared/PageHero'
import styles from './FinancialsPage.module.css'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { PnLSummary } from './PnLSummary'
import { PaymentAlerts } from './PaymentAlerts'
import { IncomeTab } from './IncomeTab'
import { BudgetAllocations } from './BudgetAllocations'
import { PettyCashLog } from './PettyCashLog'

type PaymentStatus = 'unpaid' | 'advance' | 'paid'

interface FinancialEntry {
  id: string
  event_id: string
  vendor_name: string
  description: string
  category: string
  quantity: number
  total_amount: number
  advance_paid: number
  balance: number
  payment_status: PaymentStatus
  payment_date: string | null
  notes: string | null
}

const categories = [
  'Venue & Facility', 'Catering', 'Decor & Design', 'Audio/Visual',
  'Photography', 'Videography', 'Transportation', 'Fashion & Beauty',
  'Entertainment', 'Stationery', 'Security', 'Other',
]

const statusColors: Record<PaymentStatus, { bg: string; text: string; label: string }> = {
  unpaid: { bg: 'var(--color-payment-unpaid-bg)', text: 'var(--color-payment-unpaid)', label: 'Unpaid' },
  advance: { bg: 'var(--color-payment-advance-bg)', text: 'var(--color-payment-advance)', label: 'Advance' },
  paid: { bg: 'var(--color-payment-paid-bg)', text: 'var(--color-payment-paid)', label: 'Paid' },
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

export function FinancialsPage() {
  const [searchParams] = useSearchParams()
  const { id: routeId } = useParams<{ id: string }>()
  const eventId = routeId || searchParams.get('event')
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const org = useAuthStore((s) => s.org)
  const showNotification = useUIStore((s) => s.showNotification)
  const showModal = useUIStore((s) => s.showModal)

  const [entries, setEntries] = useState<FinancialEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importRows, setImportRows] = useState<Partial<FinancialEntry>[]>([])
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [events, setEvents] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({
    eventId: eventId || '',
    vendorName: '',
    description: '',
    category: 'Other',
    quantity: 1,
    total: 0,
    advance: 0,
  })
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null)
  const [editForm, setEditForm] = useState({
    vendorName: '',
    description: '',
    category: 'Other',
    quantity: 1,
    total: 0,
    advance: 0,
  })
  const [editSaving, setEditSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'vendors' | 'income'>('vendors')
  const [clientPayments, setClientPayments] = useState<{ amount: number; status: string; due_date: string | null; description: string }[]>([])
  const [pettyCashTotal, setPettyCashTotal] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  // CSV Parser — no external deps, handles comma-delimited files
  function parseCsv(text: string): Record<string, string>[] {
    const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim())
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map((h) => h.replace(/"/g, '').trim().toLowerCase())
    return lines.slice(1).map((line) => {
      const values = line.match(/(?:"([^"]*)"|([^,]+)|(?=,)|(?<=,))/g)?.map((v) => v.replace(/"/g, '').trim()) || []
      return headers.reduce<Record<string, string>>((acc, h, i) => { acc[h] = values[i] || ''; return acc }, {})
    })
  }

  function handleImportFile(file: File) {
    setImportError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = parseCsv(text)
      if (rows.length === 0) {
        setImportError('No data rows found. Make sure your CSV has headers and at least one row.')
        return
      }
      // Map flexible column names
      const mapped = rows.map((r) => {
        const totalAmt = parseFloat(r.total || r['total amount'] || r['amount'] || '0') * 100
        const advAmt = parseFloat(r.advance || r['advance paid'] || r['paid'] || '0') * 100
        const bal = totalAmt - advAmt
        const status: PaymentStatus = advAmt >= totalAmt ? 'paid' : advAmt > 0 ? 'advance' : 'unpaid'
        return {
          vendor_name: r.vendor || r['vendor name'] || r.name || '',
          description: r.description || r.service || r.desc || '',
          category: r.category || r.type || 'Other',
          quantity: parseInt(r.quantity || r.qty || '1', 10) || 1,
          total_amount: totalAmt,
          advance_paid: advAmt,
          balance: bal,
          payment_status: status,
        } as Partial<FinancialEntry>
      }).filter((r) => r.vendor_name)

      if (mapped.length === 0) {
        setImportError('No valid rows found. Ensure your CSV has a "vendor" or "vendor name" column.')
        return
      }
      setImportRows(mapped)
    }
    reader.readAsText(file)
  }

  const handleImportConfirm = async () => {
    const eid = eventId || events[0]?.id
    if (!eid || importRows.length === 0) return
    setImporting(true)

    const toInsert = importRows.map((r) => ({ ...r, event_id: eid }))
    const { data, error } = await supabase.from('financial_entries').insert(toInsert).select()

    if (error) {
      showNotification({ variant: 'error', title: 'Import failed', message: error.message })
      setImporting(false)
      return
    }

    setEntries([...(data as unknown as FinancialEntry[]), ...entries])
    showNotification({ variant: 'success', title: `${importRows.length} entries imported` })
    setImportRows([])
    setShowImport(false)
    setImporting(false)
  }

  useEffect(() => {
    if (!user || !org) { setLoading(false); return }

    const orgId = org.id

    async function load() {
      const { data: evts } = await supabase
        .from('events')
        .select('id, name')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .order('event_date', { ascending: false })

      if (evts) setEvents(evts as unknown as { id: string; name: string }[])

      const defaultEid = eventId || evts?.[0]?.id
      if (defaultEid) {
        let resolvedId = defaultEid
        // Check if the id is a slug (does not match uuid format)
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(defaultEid)) {
          const { data: evt } = await supabase
            .from('events')
            .select('id')
            .eq('slug', defaultEid)
            .is('deleted_at', null)
            .single()
          if (evt) {
            resolvedId = evt.id
          }
        }

        setForm(f => ({ ...f, eventId: resolvedId }))

        const [{ data }, { data: cpData }] = await Promise.all([
          supabase
            .from('financial_entries')
            .select('*')
            .eq('event_id', resolvedId)
            .order('category', { ascending: true })
            .order('sort_order', { ascending: true }),
          supabase
            .from('client_payments')
            .select('amount, status, due_date, description')
            .eq('event_id', resolvedId),
        ])

        if (data) setEntries(data as unknown as FinancialEntry[])
        if (cpData) setClientPayments(cpData as typeof clientPayments)
      }
      setLoading(false)
    }

    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, org, eventId])

  const filtered = entries.filter((e) =>
    e.vendor_name.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  )

  const grouped = categories.reduce<Record<string, FinancialEntry[]>>((acc, cat) => {
    const items = filtered.filter((e) => e.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})

  const summary = entries.reduce(
    (acc, e) => ({
      budget: acc.budget + e.total_amount,
      paid: acc.paid + e.advance_paid,
      outstanding: acc.outstanding + e.balance,
    }),
    { budget: 0, paid: 0, outstanding: 0 }
  )

  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
  const dueVendors = entries.filter(e => e.balance > 0 && e.payment_status !== 'paid')
  const totalVendorDue = dueVendors.reduce((s, e) => s + e.balance, 0)

  const fourteenDaysFromNow = new Date()
  fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14)
  const dueClients = clientPayments.filter(p => p.status !== 'received' && p.due_date && new Date(p.due_date) <= fourteenDaysFromNow)
  const totalClientDue = dueClients.reduce((s, p) => s + p.amount, 0)

  const totalRevenue = clientPayments.filter(p => p.status === 'received').reduce((s, p) => s + p.amount, 0)
  const totalVendorCost = entries.reduce((s, e) => s + e.total_amount, 0)

  const handleAdd = async () => {
    if (!form.vendorName || !form.eventId) {
      showNotification({ variant: 'warning', title: 'Missing fields', message: 'Vendor name and event are required' })
      return
    }

    setSaving(true)
    const totalKobo = form.total * 100
    const advanceKobo = form.advance * 100
    const status: PaymentStatus = advanceKobo >= totalKobo ? 'paid' : advanceKobo > 0 ? 'advance' : 'unpaid'

    const { data, error } = await supabase
      .from('financial_entries')
      .insert({
        event_id: form.eventId,
        vendor_name: form.vendorName,
        description: form.description,
        category: form.category,
        quantity: form.quantity,
        total_amount: totalKobo,
        advance_paid: advanceKobo,
        payment_status: status,
      })
      .select()
      .single()

    if (error) {
      showNotification({ variant: 'error', title: 'Failed to add entry', message: error.message })
      setSaving(false)
      return
    }

    setEntries([...(data as unknown as FinancialEntry[] ? [data as unknown as FinancialEntry] : []), ...entries])
    setForm({ eventId: form.eventId, vendorName: '', description: '', category: 'Other', quantity: 1, total: 0, advance: 0 })
    setShowForm(false)
    setSaving(false)
    showNotification({ variant: 'success', title: 'Entry added' })
  }

  const handleEditSave = async () => {
    if (!editForm.vendorName || !editingEntry) {
      showNotification({ variant: 'warning', title: 'Missing fields', message: 'Vendor name is required' })
      return
    }

    setEditSaving(true)
    const totalKobo = editForm.total * 100
    const advanceKobo = editForm.advance * 100
    const status: PaymentStatus = advanceKobo >= totalKobo ? 'paid' : advanceKobo > 0 ? 'advance' : 'unpaid'

    const { error } = await supabase
      .from('financial_entries')
      .update({
        vendor_name: editForm.vendorName,
        description: editForm.description,
        category: editForm.category,
        quantity: editForm.quantity,
        total_amount: totalKobo,
        advance_paid: advanceKobo,
        payment_status: status,
      })
      .eq('id', editingEntry.id)

    if (error) {
      showNotification({ variant: 'error', title: 'Failed to update entry', message: error.message })
      setEditSaving(false)
      return
    }

    setEntries(entries.map((e) =>
      e.id === editingEntry.id
        ? {
            ...e,
            vendor_name: editForm.vendorName,
            description: editForm.description,
            category: editForm.category,
            quantity: editForm.quantity,
            total_amount: totalKobo,
            advance_paid: advanceKobo,
            balance: totalKobo - advanceKobo,
            payment_status: status,
          }
        : e
    ))
    setEditSaving(false)
    setEditingEntry(null)
    showNotification({ variant: 'success', title: 'Entry updated' })
  }

  function openEditModal(entry: FinancialEntry) {
    setEditForm({
      vendorName: entry.vendor_name,
      description: entry.description || '',
      category: entry.category,
      quantity: entry.quantity,
      total: entry.total_amount / 100,
      advance: entry.advance_paid / 100,
    })
    setEditingEntry(entry)
  }

  function handleDelete(id: string) {
    showModal({
      variant: 'confirm',
      title: 'Delete entry?',
      message: 'Delete this financial entry? This cannot be undone.',
      actions: [
        { label: 'Cancel', variant: 'secondary' as const, onClick: () => {} },
        {
          label: 'Delete',
          variant: 'danger' as const,
          onClick: async () => {
            const { error } = await supabase
              .from('financial_entries')
              .delete()
              .eq('id', id)

            if (error) {
              showNotification({ variant: 'error', title: 'Failed to delete', message: error.message })
              return
            }

            setEntries(entries.filter((e) => e.id !== id))
            showNotification({ variant: 'success', title: 'Entry deleted' })
          },
        },
      ],
    })
  }

  const activeEventName = events.find((e) => e.id === (eventId || events[0]?.id))?.name

  if (loading) {
    return (
      <div>
        <div className="skeleton skeleton-card" style={{ height: 80, marginBottom: 'var(--space-4)' }} />
        <div className="skeleton skeleton-card" style={{ height: 300 }} />
      </div>
    )
  }

  return (
    <div>
      <PageHero
        icon={Wallet}
        title="Financials"
        subtitle={activeEventName || undefined}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                className={`input ${styles.searchInput}`}
                placeholder="Search vendors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className={styles.dropdownFilterWrap}>
              <DropdownMenu
                trigger={
                  <span style={{ color: 'var(--color-text-primary)' }}>
                    {events.find((e) => e.id === (eventId || events[0]?.id))?.name || 'All events'}
                  </span>
                }
                items={events.map((e) => ({ label: e.name, value: e.id }))}
                onSelect={(item) => { navigate(`/events/${item.value}/financials`) }}
              />
            </div>
            <input
              ref={importRef}
              type="file"
              accept=".csv,.txt"
              className={styles.hiddenFile}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) { handleImportFile(f); setShowImport(true) }
                e.target.value = ''
              }}
            />
            <button
              className={`btn btn-secondary btn-sm ${styles.toolbarBtn}`}
              onClick={() => importRef.current?.click()}
              id="import-csv-btn"
            >
              <Upload size={16} />
              Import CSV
            </button>
            <button className={`btn btn-primary btn-sm ${styles.toolbarBtn}`} onClick={() => setShowForm(!showForm)} id="add-entry-btn">
              <Plus size={16} />
              Add Entry
            </button>
          </div>
        }
      />

      <div className={styles.summaryGrid}>
        {[
          { label: 'Total Budget', value: formatNaira(summary.budget), color: 'var(--color-text-primary)' },
          { label: 'Total Paid', value: formatNaira(summary.paid), color: 'var(--color-success)' },
          { label: 'Outstanding', value: formatNaira(summary.outstanding), color: summary.outstanding > 0 ? 'var(--color-error)' : 'var(--color-success)' },
          { label: 'Entries', value: entries.length.toString(), color: 'var(--color-text-primary)' },
        ].map((card) => (
          <div key={card.label} className={`card ${styles.summaryCard}`}>
            <div className={styles.summaryLabel}>{card.label}</div>
            <div className={styles.summaryValue} style={{ color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      <PnLSummary totalRevenue={totalRevenue} totalVendorCost={totalVendorCost} pettyCashTotal={pettyCashTotal} />

      <PaymentAlerts
        dueVendors={dueVendors.map(e => ({ vendor_name: e.vendor_name, balance: e.balance }))}
        dueClients={dueClients.map(p => ({ description: p.description, amount: p.amount, due_date: p.due_date || '' }))}
        totalVendorDue={totalVendorDue}
        totalClientDue={totalClientDue}
        onReviewVendor={() => {
          setActiveTab('vendors')
          setTimeout(() => {
            document.querySelector('.financial-table-wrapper')?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        }}
        onReviewClient={() => {
          setActiveTab('income')
          setTimeout(() => {
            document.querySelector('.financial-table-wrapper')?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        }}
      />

      <Tabs
        tabs={[
          { key: 'vendors', label: 'Vendor Payments', icon: <Wallet size={16} /> },
          { key: 'income', label: 'Income & Budget', icon: <TrendingUp size={16} /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'vendors' ? (
        <>

      {/* ── CSV Import Modal ── */}
      {showImport && (
        <div className={styles.csvOverlay}>
          <div className={styles.csvModal}>
            <div className={styles.csvModalHeader}>
              <h3 className={styles.csvModalTitle}>
                <FileSpreadsheet size={18} className={styles.csvTitleIcon} />
                Import from CSV
              </h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setShowImport(false); setImportRows([]); setImportError(null) }}>
                <X size={18} />
              </button>
            </div>

            {importError && (
              <div className={styles.importError}>
                <AlertTriangle size={16} />
                {importError}
              </div>
            )}

            {importRows.length === 0 ? (
              <div
                className="import-dropzone"
                onClick={() => importRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over') }}
                onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('drag-over')
                  const f = e.dataTransfer.files[0]
                  if (f) handleImportFile(f)
                }}
              >
                <FileSpreadsheet size={32} className={styles.dropzoneIcon} />
                <div className={styles.dropzoneHeading}>Drop your CSV file here</div>
                <div className={styles.dropzoneSubtitle}>
                  Or click to browse. Supports <strong>.csv</strong> files.
                </div>
                <div className={styles.dropzoneColumns}>
                  Expected columns: <code>vendor</code>, <code>description</code>, <code>category</code>, <code>quantity</code>, <code>total</code>, <code>advance</code>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.importRowsContainer}>
                  <div className={styles.importRowsInfo}>
                    <Check size={14} className={styles.importRowsCheck} />
                    {importRows.length} rows ready to import
                  </div>
                  <div className="financial-table-wrapper">
                    <table className="financial-table">
                      <thead>
                        <tr>
                          <th>Vendor</th>
                          <th>Description</th>
                          <th>Category</th>
                          <th>QTY</th>
                          <th className="col-amount">Total (₦)</th>
                          <th className="col-amount">Advance (₦)</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importRows.slice(0, 20).map((row, i) => (
                          <tr key={i}>
                            <td className={styles.vendorNameCell}>{row.vendor_name}</td>
                            <td className={styles.entryDescCell}>{row.description}</td>
                            <td>{row.category}</td>
                            <td>{row.quantity}</td>
                            <td className="col-amount">{formatNaira(row.total_amount || 0)}</td>
                            <td className="col-amount">{formatNaira(row.advance_paid || 0)}</td>
                            <td>
                              <span className={`badge badge-${row.payment_status}`}>
                                <span className="badge-dot" />
                                {row.payment_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {importRows.length > 20 && (
                          <tr>
                            <td colSpan={7} className={styles.subtotalLabel} style={{ textAlign: 'center' }}>
                              ...and {importRows.length - 20} more rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className={styles.importActions}>
                  <button
                    className={`btn btn-primary ${styles.importConfirmBtn}`}
                    onClick={handleImportConfirm}
                    disabled={importing}
                  >
                    <Upload size={16} />
                    {importing ? 'Importing...' : `Import ${importRows.length} Entries`}
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => { setImportRows([]); setImportError(null) }}
                  >
                    Choose Different File
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>New Entry</h3>
          <div className={styles.formGrid}>
            {!eventId && (
              <div className={`input-wrapper ${styles.formFullWidth}`}>
                <label className="input-label">Event</label>
                <DropdownMenu
                  trigger={<span>{events.find((e) => e.id === form.eventId)?.name || 'Select event...'}</span>}
                  items={events.map((e) => ({ label: e.name, value: e.id }))}
                  onSelect={(item) => setForm({ ...form, eventId: item.value })}
                />
              </div>
            )}
            <div className={`input-wrapper ${styles.formFullWidth}`}>
              <label className="input-label">Vendor Name</label>
              <input className="input" value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} placeholder="Vendor name" />
            </div>
            <div className={`input-wrapper ${styles.formFullWidth}`}>
              <label className="input-label">Description</label>
              <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Service description" />
            </div>
            <div className="input-wrapper">
              <label className="input-label">Category</label>
              <DropdownMenu
                trigger={<span>{form.category}</span>}
                items={categories.map((c) => ({ label: c, value: c }))}
                onSelect={(item) => setForm({ ...form, category: item.value })}
              />
            </div>
            <div className="input-wrapper">
              <label className="input-label">QTY</label>
              <input className="input" type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            </div>
            <div className="input-wrapper">
              <label className="input-label">Total (₦)</label>
              <input className="input" type="number" min={0} value={form.total} onChange={(e) => setForm({ ...form, total: Number(e.target.value) })} placeholder="0" />
            </div>
            <div className="input-wrapper">
              <label className="input-label">Advance Paid (₦)</label>
              <input className="input" type="number" min={0} value={form.advance} onChange={(e) => setForm({ ...form, advance: Number(e.target.value) })} placeholder="0" />
            </div>
          </div>
          <div className={styles.formActions}>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Edit Entry Modal ── */}
      {editingEntry && (
        <div className="overlay" onClick={() => setEditingEntry(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header">
              <h3 className="modal-card-title">Edit Entry</h3>
              <button className="modal-card-close" onClick={() => setEditingEntry(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="modal-card-body">
              <div className="input-wrapper">
                <label className="input-label">Vendor Name</label>
                <input className="input" value={editForm.vendorName} onChange={(e) => setEditForm({ ...editForm, vendorName: e.target.value })} placeholder="Vendor name" />
              </div>
              <div className="input-wrapper">
                <label className="input-label">Description</label>
                <input className="input" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Service description" />
              </div>
              <div className={styles.editGrid}>
                <div className="input-wrapper">
                  <label className="input-label">Category</label>
                  <DropdownMenu
                    trigger={<span>{editForm.category}</span>}
                    items={categories.map((c) => ({ label: c, value: c }))}
                    onSelect={(item) => setEditForm({ ...editForm, category: item.value })}
                  />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">QTY</label>
                  <input className="input" type="number" min={1} value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })} />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Total (₦)</label>
                  <input className="input" type="number" min={0} value={editForm.total} onChange={(e) => setEditForm({ ...editForm, total: Number(e.target.value) })} placeholder="0" />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Advance Paid (₦)</label>
                  <input className="input" type="number" min={0} value={editForm.advance} onChange={(e) => setEditForm({ ...editForm, advance: Number(e.target.value) })} placeholder="0" />
                </div>
              </div>
              <div className={styles.editActions}>
                <button className="btn btn-primary" onClick={handleEditSave} disabled={editSaving}>
                  {editSaving ? 'Saving...' : 'Update Entry'}
                </button>
                <button className="btn btn-ghost" onClick={() => setEditingEntry(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <Wallet size={24} />
          </div>
          <div className="empty-state__title">No entries yet</div>
          <div className="empty-state__description">
            Add your first vendor payment entry to start tracking finances
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Add Entry
          </button>
        </div>
      ) : (
        <div className="financial-table-wrapper">
          <table className="financial-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Description</th>
                <th>QTY</th>
                <th className="col-amount">Total (₦)</th>
                <th className="col-amount">Advance (₦)</th>
                <th className="col-amount">Balance (₦)</th>
                <th>Status</th>
                <th style={{ width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([category, items]) => (
                <React.Fragment key={category}>
                  <tr className="category-row">
                    <td colSpan={8}>{category}</td>
                  </tr>
                  {items.map((entry) => {
                    const balance = entry.balance
                    return (
                      <tr key={entry.id}>
                        <td className={styles.vendorNameCell}>{entry.vendor_name}</td>
                        <td className={styles.entryDescCell}>{entry.description}</td>
                        <td>{entry.quantity}</td>
                        <td className="col-amount">{formatNaira(entry.total_amount)}</td>
                        <td className="col-amount">{formatNaira(entry.advance_paid)}</td>
                        <td className={`col-amount ${balance === 0 ? 'is-settled' : 'is-outstanding'}`}>
                          {formatNaira(balance)}
                        </td>
                        <td>
                          <span className={`badge badge-${entry.payment_status}`}>
                            <span className="badge-dot" />
                            {statusColors[entry.payment_status].label}
                          </span>
                        </td>
                        <td className={styles.actionCell}>
                          <button
                            className={`btn btn-ghost btn-icon ${styles.actionBtn}`}
                            onClick={() => openEditModal(entry)}
                            title="Edit entry"
                            type="button"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className={`btn btn-ghost btn-icon ${styles.deleteBtn}`}
                            onClick={() => handleDelete(entry.id)}
                            title="Delete entry"
                            type="button"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  <tr>
                    <td colSpan={3} className={styles.subtotalLabel}>
                      Subtotal
                    </td>
                    <td className={`col-amount ${styles.subtotalValue}`}>
                      {formatNaira(items.reduce((s, e) => s + e.total_amount, 0))}
                    </td>
                    <td className={`col-amount ${styles.subtotalValue}`}>
                      {formatNaira(items.reduce((s, e) => s + e.advance_paid, 0))}
                    </td>
                    <td className={`col-amount ${styles.subtotalValue}`}>
                      {formatNaira(items.reduce((s, e) => s + e.balance, 0))}
                    </td>
                    <td />
                    <td />
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
            {entries.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={3}>Grand Total</td>
                  <td className="col-amount">{formatNaira(summary.budget)}</td>
                  <td className="col-amount">{formatNaira(summary.paid)}</td>
                  <td className="col-amount">{formatNaira(summary.outstanding)}</td>
                  <td />
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
      </>

      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <IncomeTab
            eventId={eventId || events[0]?.id || ''}
            refreshKey={refreshKey}
            onUpdate={(payments) => {
              setClientPayments(payments)
              setRefreshKey(k => k + 1)
            }}
          />
          <BudgetAllocations eventId={eventId || events[0]?.id || ''} />
          <PettyCashLog eventId={eventId || events[0]?.id || ''} onTotalChange={setPettyCashTotal} />
        </div>
      )}
    </div>
  )
}
