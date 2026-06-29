import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, X, Receipt, Send, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { PageHero } from '@/components/shared/PageHero'
import { Tabs } from '@/components/ui/Tabs'
import styles from './InvoicesPage.module.css'
import type { Invoice, InvoiceItem } from '@/types'

function fmtMoney(kobo: number) { return '₦' + (kobo / 100).toLocaleString('en-NG') }

const statusColors: Record<string, string> = {
  draft: 'var(--color-text-muted)', sent: 'var(--color-accent)',
  paid: 'var(--color-success)', overdue: 'var(--color-error)', cancelled: 'var(--color-text-muted)',
}

export function InvoicesPage() {
  const { id: eventId } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const showNotification = useUIStore((s) => s.showNotification)

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const [form, setForm] = useState({
    clientName: '', clientEmail: '', dueDate: '', notes: '',
    items: [] as InvoiceItem[], discount: 0,
  })
  const [itemForm, setItemForm] = useState({ description: '', quantity: 1, unitPrice: 0 })

  useEffect(() => { loadInvoices() }, [eventId])

  async function loadInvoices() {
    setLoading(true)
    if (!eventId) { setLoading(false); return }
    const { data } = await supabase.from('invoices').select('*').eq('event_id', eventId).order('created_at', { ascending: false })
    if (data) setInvoices(data as Invoice[])
    setLoading(false)
  }

  const subTotals = form.items.reduce((s, i) => s + i.amount, 0)
  const total = Math.max(0, subTotals - form.discount * 100)

  const filtered = activeTab === 'all' ? invoices : invoices.filter(i => i.status === activeTab)

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

  return (
    <div>
      <PageHero icon={Receipt} title="Invoices"
        actions={<button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={16} /> New Invoice</button>}
      />

      <Tabs tabs={[{ key: 'all', label: `All (${invoices.length})` }, ...[{ k: 'draft' }, { k: 'sent' }, { k: 'paid' }, { k: 'overdue' }].map(({ k }) => ({ key: k, label: k }))]}
        activeTab={activeTab} onChange={setActiveTab} />

      {showForm && (
        <div className="overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-card-header">
              <h3 className="modal-card-title">New Invoice</h3>
              <button className="modal-card-close" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="modal-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-wrapper"><label className="input-label">Client Name</label><input className="input" value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} /></div>
                <div className="input-wrapper"><label className="input-label">Client Email</label><input className="input" type="email" value={form.clientEmail} onChange={e => setForm({...form, clientEmail: e.target.value})} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-wrapper"><label className="input-label">Due Date</label><input className="input" type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} /></div>
                <div className="input-wrapper"><label className="input-label">Discount (₦)</label><input className="input" type="number" value={form.discount || ''} onChange={e => setForm({...form, discount: Number(e.target.value)})} /></div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 12, marginTop: 4 }}>
                <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>Line Items</label>
                {form.items.map((item, i) => (
                  <div key={i} className={styles.itemRow}>
                    <div style={{ flex: 1 }}><strong>{item.description}</strong><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>QTY: {item.quantity} × {fmtMoney(item.unit_price)}</div></div>
                    <div style={{ fontWeight: 600 }}>{fmtMoney(item.amount)}</div>
                    <button className="btn btn-ghost btn-icon btn-xs" onClick={() => removeItem(i)}><X size={14} /></button>
                  </div>
                ))}
                <div className={styles.addItem}>
                  <input className="input" placeholder="Description" value={itemForm.description} onChange={e => setItemForm({...itemForm, description: e.target.value})} style={{ flex: 1 }} />
                  <input className="input" type="number" placeholder="QTY" value={itemForm.quantity} onChange={e => setItemForm({...itemForm, quantity: Number(e.target.value)})} style={{ width: 60 }} />
                  <input className="input" type="number" placeholder="Price (₦)" value={itemForm.unitPrice || ''} onChange={e => setItemForm({...itemForm, unitPrice: Number(e.target.value)})} style={{ width: 100 }} />
                  <button className="btn btn-secondary btn-sm" onClick={addItem}>Add</button>
                </div>
                <div className={styles.totalRow}>Subtotal: {fmtMoney(subTotals)} | Total: {fmtMoney(total)}</div>
              </div>

              <div className="input-wrapper"><label className="input-label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-secondary" onClick={() => handleSave('draft')} disabled={saving}>Save Draft</button>
                <button className="btn btn-primary" onClick={() => handleSave('sent')} disabled={saving}><Send size={14} /> {saving ? 'Saving...' : 'Send Invoice'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state__title">No invoices yet</div></div>
        ) : filtered.map(inv => (
          <div key={inv.id} className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{inv.invoice_number}</span>
                  <span className={styles.statusBadge} style={{ background: `${statusColors[inv.status]}20`, color: statusColors[inv.status] }}>
                    {inv.status}
                  </span>
                </div>
                {inv.client_name && <div style={{ fontSize: 'var(--text-sm)' }}>{inv.client_name}</div>}
                <div style={{ display: 'flex', gap: 12, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  <span>{fmtMoney(inv.total)}</span>
                  {inv.due_date && <span>Due: {new Date(inv.due_date).toLocaleDateString()}</span>}
                  <span>{inv.items.length} items</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {inv.status === 'draft' && (
                  <button className="btn btn-primary btn-sm" onClick={() => updateStatus(inv, 'sent')}><Send size={14} /> Send</button>
                )}
                {(inv.status === 'sent' || inv.status === 'overdue') && (
                  <button className="btn btn-success btn-sm" onClick={() => updateStatus(inv, 'paid')}><CheckCircle size={14} /> Mark Paid</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
