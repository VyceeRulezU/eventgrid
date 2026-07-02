import { useEffect, useState } from 'react'
import { DollarSign, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { PageHero } from '@/components/shared/PageHero'
import { Table, type TableColumn } from '@/components/ui/Table'
import styles from './PlannerVendorQuotesPage.module.css'

interface VendorQuote {
  id: string
  vendor_id: string
  quote_request_id: string
  vendor_name: string
  title: string
  event_name: string
  amount: number | null
  description: string | null
  notes: string | null
  status: string
  created_at: string
  line_items: any[]
}

export function PlannerVendorQuotesPage() {
  const user = useAuthStore((s) => s.user)
  const org = useAuthStore((s) => s.org)
  const showNotification = useUIStore((s) => s.showNotification)
  const [quotes, setQuotes] = useState<VendorQuote[]>([])
  const [viewingDetails, setViewingDetails] = useState<VendorQuote | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const orgId = org?.id
      if (!orgId) {
        setLoading(false)
        return
      }

      const { data: requests } = await supabase
        .from('vendor_quote_requests')
        .select('id')
        .eq('org_id', orgId)

      if (!requests || requests.length === 0) {
        setLoading(false)
        return
      }

      const qrIds = requests.map((r: any) => r.id)

      const { data: vendorQuotes } = await supabase
        .from('vendor_quotes')
        .select(`
          id, vendor_id, quote_request_id, amount, description, line_items, notes, status, created_at,
          vendor:vendor_id(id, name),
          request:quote_request_id(id, title, event_id, events!inner(name))
        `)
        .in('quote_request_id', qrIds)
        .order('created_at', { ascending: false })

      if (vendorQuotes) {
        setQuotes((vendorQuotes as any[]).map((q: any) => ({
          id: q.id,
          vendor_id: q.vendor_id,
          quote_request_id: q.quote_request_id,
          vendor_name: q.vendor?.name || 'Unknown',
          title: q.request?.title || '',
          event_name: q.request?.events?.name || 'Unknown Event',
          amount: q.amount,
          description: q.description,
          notes: q.notes,
          status: q.status,
          created_at: q.created_at,
          line_items: q.line_items || [],
        })))
      }

      setLoading(false)
    })()
  }, [user, org])

  const handleAccept = async (quote: VendorQuote) => {
    const { error } = await supabase
      .from('vendor_quotes')
      .update({ status: 'accepted' })
      .eq('id', quote.id)
    if (error) {
      showNotification({ variant: 'error', title: 'Failed to accept', message: error.message })
      return
    }

    await supabase
      .from('vendor_quote_invitations')
      .update({ status: 'accepted' })
      .eq('quote_request_id', quote.quote_request_id)
      .eq('vendor_id', quote.vendor_id)

    setQuotes((prev) => prev.map((q) => q.id === quote.id ? { ...q, status: 'accepted' } : q))
    setViewingDetails((prev) => prev?.id === quote.id ? { ...prev, status: 'accepted' } : prev)
    showNotification({ variant: 'success', title: 'Quote accepted' })
  }

  const handleReject = async (quote: VendorQuote) => {
    const { error } = await supabase
      .from('vendor_quotes')
      .update({ status: 'rejected' })
      .eq('id', quote.id)
    if (error) {
      showNotification({ variant: 'error', title: 'Failed to reject', message: error.message })
      return
    }

    await supabase
      .from('vendor_quote_invitations')
      .update({ status: 'declined' })
      .eq('quote_request_id', quote.quote_request_id)
      .eq('vendor_id', quote.vendor_id)

    setQuotes((prev) => prev.map((q) => q.id === quote.id ? { ...q, status: 'rejected' } : q))
    setViewingDetails((prev) => prev?.id === quote.id ? { ...prev, status: 'rejected' } : prev)
    showNotification({ variant: 'success', title: 'Quote rejected' })
  }

  const formatCurrency = (val: number | null) => {
    if (val == null) return '—'
    return `₦${(val / 100).toLocaleString()}`
  }

  const columns: TableColumn[] = [
    { key: 'title', label: 'Request' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'event', label: 'Event' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'action', label: '', headerClassName: 'th-actions' },
  ]

  if (loading) {
    return (
      <div>
        <PageHero icon={DollarSign} title="Vendor Quotes" subtitle="Review quotes submitted by vendors" />
        <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
            <img src="/ng-new-logo.png" alt="Loading" style={{ width: 48, height: 48, opacity: 0.4 }} />
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!org?.id) {
    return (
      <div>
        <PageHero icon={DollarSign} title="Vendor Quotes" subtitle="Review quotes submitted by vendors" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '30vh', gap: 'var(--space-4)', padding: 'var(--space-12)' }}>
          <DollarSign size={48} style={{ opacity: 0.3 }} />
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>No organization found</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Set up your organization to manage vendor quotes.</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHero
        icon={DollarSign}
        title="Vendor Quotes"
        subtitle={`${quotes.length} quote${quotes.length !== 1 ? 's' : ''} from vendors`}
      />

      <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
        <Table
          columns={columns}
          loading={loading}
          empty={quotes.length === 0}
          emptyIcon={DollarSign}
          emptyTitle="No vendor quotes yet"
          emptyDescription="Quotes from vendors will appear here once they respond to your requests."
        >
          {quotes.map((q) => (
            <tr key={q.id} className={styles.tableRow}>
              <td>
                <div style={{ fontWeight: 600 }}>{q.title}</div>
              </td>
              <td style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{q.vendor_name}</td>
              <td style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{q.event_name}</td>
              <td style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap', fontWeight: 600 }}>
                {formatCurrency(q.amount)}
              </td>
              <td>
                <span className={`badge badge-${q.status === 'accepted' ? 'green' : q.status === 'rejected' ? 'red' : q.status === 'revised' ? 'yellow' : 'grey'}`}>
                  {q.status}
                </span>
              </td>
              <td>
                <div className={styles.actionsCell}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setViewingDetails(q)}>View Details</button>
                  {q.status === 'submitted' && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleAccept(q)}>
                      <Check size={14} /> Accept
                    </button>
                  )}
                  {q.status === 'submitted' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleReject(q)}>
                      <X size={14} /> Reject
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {viewingDetails && (
        <div className="overlay" onClick={() => setViewingDetails(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-card-header">
              <h3 className="modal-card-title">{viewingDetails.title}</h3>
              <button className="modal-card-close" onClick={() => setViewingDetails(null)}><X size={18} /></button>
            </div>
            <div className="modal-card-body" style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {viewingDetails.description && (
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Description</div>
                  <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{viewingDetails.description}</div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Vendor</div>
                  <div style={{ fontSize: 'var(--text-sm)' }}>{viewingDetails.vendor_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Event</div>
                  <div style={{ fontSize: 'var(--text-sm)' }}>{viewingDetails.event_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Amount</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{formatCurrency(viewingDetails.amount)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Status</div>
                  <span className={`badge badge-${viewingDetails.status === 'accepted' ? 'green' : viewingDetails.status === 'rejected' ? 'red' : viewingDetails.status === 'revised' ? 'yellow' : 'grey'}`}>
                    {viewingDetails.status}
                  </span>
                </div>
              </div>

              {viewingDetails.line_items.length > 0 && (
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-2)' }}>Line Items</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    {viewingDetails.line_items.map((item: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                        <span>{item.description || `Item ${i + 1}`}</span>
                        <span style={{ fontWeight: 600 }}>₦{(item.amount != null ? item.amount / 100 : 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingDetails.notes && (
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Notes</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>{viewingDetails.notes}</div>
                </div>
              )}
            </div>
            <div className="modal-card__footer" style={{ padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              {viewingDetails.status === 'submitted' && (
                <>
                  <button className="btn btn-primary" onClick={() => { handleAccept(viewingDetails) }}>
                    <Check size={14} /> Accept
                  </button>
                  <button className="btn btn-secondary" onClick={() => { handleReject(viewingDetails) }}>
                    <X size={14} /> Reject
                  </button>
                </>
              )}
              <button className="btn btn-ghost" onClick={() => setViewingDetails(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
