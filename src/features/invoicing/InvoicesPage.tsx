import { useEffect, useState } from 'react'

import { useResolvedEventId } from '@/hooks/useResolvedEventId'
import { Plus, X, Receipt, Send, CheckCircle, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { PageHero } from '@/components/shared/PageHero'
import { Tabs } from '@/components/ui/Tabs'
import { CalendarModal } from '@/components/ui/CalendarModal'
import styles from './InvoicesPage.module.css'
import type { Invoice, InvoiceItem } from '@/types'

function fmtMoney(kobo: number) { return '₦' + (kobo / 100).toLocaleString('en-NG') }

const statusColors: Record<string, string> = {
  draft: 'var(--color-text-muted)', sent: 'var(--color-accent)',
  paid: 'var(--color-success)', overdue: 'var(--color-error)', cancelled: 'var(--color-text-muted)',
}

export function InvoicesPage() {
  const { eventId, isReadOnly } = useResolvedEventId()
  const user = useAuthStore((s) => s.user)
  const showNotification = useUIStore((s) => s.showNotification)

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [eventName, setEventName] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [showDueDate, setShowDueDate] = useState(false)
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null)

  const [form, setForm] = useState({
    clientName: '', clientEmail: '', dueDate: '', notes: '',
    items: [] as InvoiceItem[], discount: 0,
  })
  const [itemForm, setItemForm] = useState({ description: '', quantity: 1, unitPrice: 0 })

  useEffect(() => { loadInvoices() }, [eventId])

  async function loadInvoices() {
    setLoading(true)
    if (!eventId) { setLoading(false); return }
    const [{ data: invData }, { data: evtData }] = await Promise.all([
      supabase.from('invoices').select('*').eq('event_id', eventId).order('created_at', { ascending: false }),
      supabase.from('events').select('name').eq('id', eventId).single(),
    ])
    if (invData) {
      setInvoices(invData as Invoice[])
      if (invData.length > 0) setActiveInvoiceId(invData[0].id)
    }
    if (evtData) setEventName(evtData.name)
    setLoading(false)
  }

  const subTotals = form.items.reduce((s, i) => s + i.amount, 0)
  const total = Math.max(0, subTotals - form.discount * 100)

  const filtered = activeTab === 'all' ? invoices : invoices.filter(i => i.status === activeTab)

  const activeInvoice = invoices.find(i => i.id === activeInvoiceId) || null

  function addItem() {
    if (!itemForm.description) return
    setForm(f => ({ ...f, items: [...f.items, { ...itemForm, unit_price: Math.round(itemForm.unitPrice * 100), amount: Math.round(itemForm.unitPrice * 100 * itemForm.quantity) }] }))
    setItemForm({ description: '', quantity: 1, unitPrice: 0 })
  }

  function removeItem(idx: number) {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  }

  function generateInvoiceNumber(): string {
    const prefix = 'INV-'
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '')
    const seq = String(invoices.length + 1).padStart(3, '0')
    return `${prefix}${date}-${seq}`
  }

  async function handleSave(status: 'draft' | 'sent') {
    if (form.items.length === 0) { showNotification({ variant: 'warning', title: 'Add at least one item' }); return }
    setSaving(true)
    const payload = {
      event_id: eventId, created_by: user!.id, invoice_number: generateInvoiceNumber(),
      client_name: form.clientName || null, client_email: form.clientEmail || null,
      items: form.items, subtotal: subTotals, discount: Math.round(form.discount * 100),
      total, amount_paid: 0, status, due_date: form.dueDate || null,
      issued_date: new Date().toISOString().slice(0, 10), notes: form.notes || null,
    }
    const { data, error } = await supabase.from('invoices').insert(payload).select().single()
    if (error) { showNotification({ variant: 'error', title: 'Failed', message: error.message }); setSaving(false); return }
    setInvoices([data as unknown as Invoice, ...invoices])
    setActiveInvoiceId(data.id)
    setShowForm(false)
    setSaving(false)
    showNotification({ variant: 'success', title: status === 'sent' ? 'Invoice sent!' : 'Invoice saved' })
  }

  async function updateStatus(inv: Invoice, status: string) {
    const updates: Partial<Invoice> = { status: status as Invoice['status'] }
    if (status === 'paid') updates.paid_at = new Date().toISOString()
    await supabase.from('invoices').update(updates).eq('id', inv.id)
    setInvoices(invoices.map(i => i.id === inv.id ? { ...i, ...updates } as Invoice : i))
    showNotification({ variant: 'success', title: `Invoice ${status}` })
  }

  if (loading) return <div><div className="skeleton skeleton-card" style={{ height: 300 }} /></div>

  if (!eventId) return <div className="empty-state"><div className="empty-state__title">Select an event</div><div className="empty-state__description">Invoices are created per event</div></div>

  if (invoices.length === 0 && !showForm) {
    return (
      <div>
        <PageHero icon={Receipt} title={`Invoices${eventName ? ` | ${eventName}` : ''}`}
          actions={
            !isReadOnly && (
              <button className="btn btn-primary btn-sm" onClick={() => {
                setForm({ clientName: '', clientEmail: '', dueDate: '', notes: '', items: [], discount: 0 })
                setShowForm(true)
              }}>
                <Plus size={16} /> New Invoice
              </button>
            )
          }
        />
        <div className="empty-state">
          <div className="empty-state__title">No invoices yet</div>
          <div className="empty-state__description">
            {isReadOnly ? 'This event is archived and has no invoices.' : 'Create invoices and track client payments for this event.'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHero icon={Receipt} title={`Invoices${eventName ? ` | ${eventName}` : ''}`}
        actions={
          !isReadOnly && (
            <button className="btn btn-primary btn-sm" onClick={() => {
              setForm({ clientName: '', clientEmail: '', dueDate: '', notes: '', items: [], discount: 0 })
              setShowForm(true)
            }}>
              <Plus size={16} /> New Invoice
            </button>
          )
        }
      />

      <Tabs tabs={[{ key: 'all', label: `All (${invoices.length})` }, ...[{ k: 'draft' }, { k: 'sent' }, { k: 'paid' }, { k: 'overdue' }].map(({ k }) => ({ key: k, label: k.toUpperCase() }))]}
        activeTab={activeTab} onChange={setActiveTab} />

      {showForm && (
        <div className="overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-card-header">
              <h3 className="modal-card-title">New Invoice</h3>
              <button className="modal-card-close" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="modal-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="input-wrapper"><label className="input-label">Client Name</label><input className="input" value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} placeholder="Client's Full Name" /></div>
                <div className="input-wrapper"><label className="input-label">Client Email</label><input className="input" type="email" value={form.clientEmail} onChange={e => setForm({...form, clientEmail: e.target.value})} placeholder="client@example.com" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="input-wrapper"><label className="input-label">Due Date</label>
                  <button className="input" type="button" onClick={() => setShowDueDate(true)} style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, height: 40 }}>
                    <Calendar size={14} /> {form.dueDate ? new Date(form.dueDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select due date...'}
                  </button>
                  <CalendarModal open={showDueDate} value={form.dueDate} onChange={d => { setForm({...form, dueDate: d}); setShowDueDate(false) }} onClose={() => setShowDueDate(false)} />
                </div>
                <div className="input-wrapper"><label className="input-label">Discount (₦)</label><input className="input" type="number" value={form.discount || ''} onChange={e => setForm({...form, discount: Number(e.target.value)})} placeholder="0" /></div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 16 }}>
                <label className="input-label" style={{ marginBottom: 12, display: 'block', fontWeight: 600 }}>Line Items</label>
                
                <div className={styles.formItemsList}>
                  {form.items.map((item, i) => (
                    <div key={i} className={styles.itemRow}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.description}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>QTY: {item.quantity} × {fmtMoney(item.unit_price)}</div>
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{fmtMoney(item.amount)}</div>
                      <button className="btn btn-ghost btn-icon btn-xs" onClick={() => removeItem(i)} style={{ color: 'var(--color-error)' }}><X size={14} /></button>
                    </div>
                  ))}
                </div>

                <div className={styles.addItemSection}>
                  <input className="input" placeholder="Item description..." value={itemForm.description} onChange={e => setItemForm({...itemForm, description: e.target.value})} style={{ flex: 1 }} />
                  <input className="input" type="number" placeholder="QTY" value={itemForm.quantity} onChange={e => setItemForm({...itemForm, quantity: Number(e.target.value)})} style={{ width: 70 }} />
                  <input className="input" type="number" placeholder="Price (₦)" value={itemForm.unitPrice || ''} onChange={e => setItemForm({...itemForm, unitPrice: Number(e.target.value)})} style={{ width: 110 }} />
                  <button className="btn btn-secondary btn-sm" onClick={addItem} disabled={!itemForm.description || itemForm.unitPrice <= 0}>Add Item</button>
                </div>
                <div className={styles.formTotalsRow}>
                  <span>Subtotal: {fmtMoney(subTotals)}</span>
                  <strong>Total: {fmtMoney(total)}</strong>
                </div>
              </div>

              <div className="input-wrapper"><label className="input-label">Notes / Terms</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Payment terms or notes..." /></div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-secondary" onClick={() => handleSave('draft')} disabled={saving}>Save Draft</button>
                <button className="btn btn-primary" onClick={() => handleSave('sent')} disabled={saving}><Send size={14} /> {saving ? 'Saving...' : 'Send Invoice'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.workspace}>
        {/* Left Side: Invoice Cards List */}
        <div className={styles.sidebar}>
          {filtered.length === 0 ? (
            <div className={styles.emptySidebar}>No invoices found</div>
          ) : (
            <div className={styles.invoiceList}>
              {filtered.map(inv => {
                const isSelected = inv.id === activeInvoiceId
                return (
                  <div
                    key={inv.id}
                    className={`${styles.invoiceCard} ${isSelected ? styles.selectedCard : ''}`}
                    onClick={() => setActiveInvoiceId(inv.id)}
                  >
                    <div className={styles.invoiceCardHeader}>
                      <span className={styles.invoiceNum}>{inv.invoice_number}</span>
                      <span className={styles.statusBadge} style={{ background: `${statusColors[inv.status]}15`, color: statusColors[inv.status] }}>
                        {inv.status}
                      </span>
                    </div>
                    <div className={styles.invoiceClient}>{inv.client_name || 'Unnamed Client'}</div>
                    <div className={styles.invoiceMeta}>
                      <span>{fmtMoney(inv.total)}</span>
                      {inv.due_date && <span>Due: {new Date(inv.due_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Side: Invoice Receipt Sheet Preview */}
        <div className={styles.previewPane}>
          {activeInvoice ? (
            <div className={styles.previewContent}>
              <div className={styles.previewActionBar}>
                <h4 style={{ margin: 0, fontWeight: 600 }}>{activeInvoice.invoice_number}</h4>
                {!isReadOnly && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {activeInvoice.status === 'draft' && (
                      <button className="btn btn-primary btn-sm" onClick={() => updateStatus(activeInvoice, 'sent')}><Send size={14} /> Send Invoice</button>
                    )}
                    {(activeInvoice.status === 'sent' || activeInvoice.status === 'overdue') && (
                      <button className="btn btn-success btn-sm" onClick={() => updateStatus(activeInvoice, 'paid')}><CheckCircle size={14} /> Mark Paid</button>
                    )}
                  </div>
                )}
              </div>

              {/* Receipt Sheet */}
              <div className={styles.receiptSheet}>
                <div className={styles.receiptHeader}>
                  <div>
                    <h2 className={styles.receiptBrand}>NaliGrid</h2>
                    <span className={styles.receiptSub}>Professional Event Management</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={styles.receiptStatusBadge} style={{ borderColor: statusColors[activeInvoice.status], color: statusColors[activeInvoice.status] }}>
                      {activeInvoice.status}
                    </div>
                  </div>
                </div>

                <div className={styles.receiptInfoGrid}>
                  <div>
                    <span className={styles.receiptInfoLabel}>Billed To</span>
                    <strong className={styles.receiptInfoVal}>{activeInvoice.client_name || 'Client Details'}</strong>
                    {activeInvoice.client_email && <span className={styles.receiptInfoSub}>{activeInvoice.client_email}</span>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={styles.receiptInfoLabel}>Invoice Metadata</span>
                    <span className={styles.receiptInfoSub}>Number: {activeInvoice.invoice_number}</span>
                    <span className={styles.receiptInfoSub}>Issued: {new Date(activeInvoice.issued_date).toLocaleDateString()}</span>
                    {activeInvoice.due_date && <span className={styles.receiptInfoSub}>Due Date: {new Date(activeInvoice.due_date).toLocaleDateString()}</span>}
                  </div>
                </div>

                {/* Items Table */}
                <table className={styles.receiptTable}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Description</th>
                      <th style={{ width: 80, textAlign: 'center' }}>QTY</th>
                      <th style={{ width: 120, textAlign: 'right' }}>Unit Price</th>
                      <th style={{ width: 120, textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ textAlign: 'left' }}>{item.description}</td>
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{fmtMoney(item.unit_price)}</td>
                        <td style={{ textAlign: 'right' }}>{fmtMoney(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals Section */}
                <div className={styles.receiptTotals}>
                  <div className={styles.receiptTotalsRow}>
                    <span>Subtotal:</span>
                    <span>{fmtMoney(activeInvoice.subtotal)}</span>
                  </div>
                  {activeInvoice.discount > 0 && (
                    <div className={styles.receiptTotalsRow} style={{ color: 'var(--color-error)' }}>
                      <span>Discount:</span>
                      <span>-{fmtMoney(activeInvoice.discount)}</span>
                    </div>
                  )}
                  <div className={`${styles.receiptTotalsRow} ${styles.receiptGrandTotal}`}>
                    <span>Grand Total:</span>
                    <span>{fmtMoney(activeInvoice.total)}</span>
                  </div>
                </div>

                {activeInvoice.notes && (
                  <div className={styles.receiptNotes}>
                    <h5>Notes & Payment Terms</h5>
                    <p>{activeInvoice.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.emptyPreview}>
              <Receipt size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }} />
              <h3>No invoice selected</h3>
              <p>Choose an invoice from the sidebar list to inspect the payment metadata and client receipt sheets.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
