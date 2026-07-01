import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import styles from './SubmitQuoteModal.module.css'

interface LineItem {
  title: string
  description: string
  amount: number
}

interface Props {
  quoteRequest: {
    id: string
    title: string
    description: string | null
    category: string | null
    budget_range_min: number | null
    budget_range_max: number | null
    event_name: string
  }
  vendorId: string
  onClose: () => void
  onSubmit: () => void
}

export function SubmitQuoteModal({ quoteRequest, vendorId, onClose, onSubmit }: Props) {
  const showToast = useUIStore((s) => s.showToast)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [notes, setNotes] = useState('')
  const [sending, setSending] = useState(false)

  const addLineItem = () => {
    setLineItems([...lineItems, { title: '', description: '', amount: 0 }])
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const next = [...lineItems]
    next[index] = { ...next[index], [field]: value }
    setLineItems(next)
  }

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const totalAmount = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0)

  const handleSubmit = async () => {
    if (!amount && lineItems.length === 0) {
      showToast({ type: 'warning', title: 'Enter an amount or add line items' })
      return
    }

    setSending(true)

    const finalAmount = amount ? parseInt(amount) * 100 : totalAmount * 100

    const { error } = await supabase
      .from('vendor_quotes')
      .insert({
        quote_request_id: quoteRequest.id,
        vendor_id: vendorId,
        amount: finalAmount,
        description: description.trim() || null,
        line_items: lineItems.length > 0 ? lineItems : [],
        notes: notes.trim() || null,
        status: 'submitted',
      })

    if (error) {
      showToast({ type: 'error', title: 'Failed to submit quote', body: error.message })
      setSending(false)
      return
    }

    // Mark invitation as quoted
    await supabase
      .from('vendor_quote_invitations')
      .update({ status: 'quoted' })
      .eq('quote_request_id', quoteRequest.id)
      .eq('vendor_id', vendorId)

    showToast({ type: 'success', title: 'Quote submitted!' })
    setSending(false)
    onSubmit()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-card-header">
          <div>
            <h3 className="modal-card-title">Submit Quote</h3>
            <p className={styles.subtitle}>{quoteRequest.title}</p>
          </div>
          <button className="modal-card-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-card-body">
          <div className={styles.field}>
            <label className={styles.label}>Event</label>
            <p className={styles.value}>{quoteRequest.event_name}</p>
          </div>

          {quoteRequest.description && (
            <div className={styles.field}>
              <label className={styles.label}>Request details</label>
              <p className={styles.value}>{quoteRequest.description}</p>
            </div>
          )}

          {(quoteRequest.budget_range_min || quoteRequest.budget_range_max) && (
            <div className={styles.field}>
              <label className={styles.label}>Budget range</label>
              <p className={styles.value}>
                {quoteRequest.budget_range_min ? `₦${(quoteRequest.budget_range_min / 100).toLocaleString()}` : '—'}
                {' — '}
                {quoteRequest.budget_range_max ? `₦${(quoteRequest.budget_range_max / 100).toLocaleString()}` : '—'}
              </p>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Total amount (₦)</label>
            <input className={styles.input} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Or add line items below" />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea className={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of what's included..." rows={2} />
          </div>

          <div className={styles.field}>
            <div className={styles.lineItemHeader}>
              <label className={styles.label}>Line items</label>
              <button className={styles.addItemBtn} onClick={addLineItem}><Plus size={14} /> Add item</button>
            </div>
            {lineItems.map((item, i) => (
              <div key={i} className={styles.lineItem}>
                <input className={styles.itemInput} value={item.title} onChange={(e) => updateLineItem(i, 'title', e.target.value)} placeholder="Item title" />
                <input className={styles.itemInput} value={item.description} onChange={(e) => updateLineItem(i, 'description', e.target.value)} placeholder="Description" />
                <input className={styles.itemAmount} type="number" value={item.amount || ''} onChange={(e) => updateLineItem(i, 'amount', parseInt(e.target.value) || 0)} placeholder="₦" />
                <button className={styles.removeBtn} onClick={() => removeLineItem(i)}><Trash2 size={14} /></button>
              </div>
            ))}
            {lineItems.length > 0 && (
              <div className={styles.totalRow}>
                <strong>Total: ₦{totalAmount.toLocaleString()}</strong>
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Notes (optional)</label>
            <textarea className={styles.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes..." rows={2} />
          </div>
        </div>

        <div className="modal-card__footer" style={{ padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={sending}>
            {sending ? 'Submitting...' : 'Submit Quote'}
          </button>
        </div>
      </div>
    </div>
  )
}
