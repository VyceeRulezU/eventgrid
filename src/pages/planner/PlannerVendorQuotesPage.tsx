import { useEffect, useState } from 'react'
import { DollarSign, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import styles from './PlannerDashboard.module.css'

interface VendorQuote {
  id: string
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
          id, amount, description, line_items, notes, status, created_at,
          vendor:vendor_id(id, name),
          request:quote_request_id(id, title, event_id, events!inner(name))
        `)
        .in('quote_request_id', qrIds)
        .order('created_at', { ascending: false })

      if (vendorQuotes) {
        setQuotes((vendorQuotes as any[]).map((q: any) => ({
          id: q.id,
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

  const handleAccept = async (quoteId: string) => {
    const { error } = await supabase
      .from('vendor_quotes')
      .update({ status: 'accepted' })
      .eq('id', quoteId)
    if (error) {
      showNotification({ variant: 'error', title: 'Failed to accept', message: error.message })
    } else {
      setQuotes((prev) => prev.map((q) => q.id === quoteId ? { ...q, status: 'accepted' } : q))
      showNotification({ variant: 'success', title: 'Quote accepted' })
    }
  }

  const handleReject = async (quoteId: string) => {
    const { error } = await supabase
      .from('vendor_quotes')
      .update({ status: 'rejected' })
      .eq('id', quoteId)
    if (error) {
      showNotification({ variant: 'error', title: 'Failed to reject', message: error.message })
    } else {
      setQuotes((prev) => prev.map((q) => q.id === quoteId ? { ...q, status: 'rejected' } : q))
      showNotification({ variant: 'success', title: 'Quote rejected' })
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 'var(--space-4)' }}>
        <img src="/ng-new-logo.png" alt="Loading" style={{ width: 56, height: 56, opacity: 0.4 }} />
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading vendor quotes...</div>
      </div>
    )
  }

  if (!org?.id) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 'var(--space-4)' }}>
        <DollarSign size={48} style={{ opacity: 0.3 }} />
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>No organization found</div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Set up your organization to manage vendor quotes.</div>
      </div>
    )
  }

  return (
    <div className={styles.dashboard}>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Vendor Quotes</h1>
          <p className="page-header__subtitle">Review quotes submitted by vendors ({quotes.length})</p>
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-12)' }}>
          <div className="empty-state__icon"><DollarSign size={32} /></div>
          <div className="empty-state__title">No vendor quotes yet</div>
          <div className="empty-state__description">
            Quotes from vendors will appear here once they respond to your requests.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {quotes.map((q) => (
            <div key={q.id} className="card" style={{ padding: 'var(--space-5) var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{q.title}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    {q.vendor_name} · {q.event_name}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span className={`badge badge-${q.status === 'accepted' ? 'green' : q.status === 'rejected' ? 'red' : q.status === 'revised' ? 'yellow' : 'grey'}`}>
                    {q.status}
                  </span>
                  {q.amount != null && (
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-accent)' }}>
                      ₦{(q.amount / 100).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {q.description && (
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                  {q.description}
                </div>
              )}

              {q.line_items.length > 0 && (
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-2)' }}>Line Items</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    {q.line_items.map((item: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                        <span>{item.description || `Item ${i + 1}`}</span>
                        <span style={{ fontWeight: 600 }}>₦{(item.amount != null ? item.amount / 100 : 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {q.notes && (
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontStyle: 'italic', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-2)' }}>
                  {q.notes}
                </div>
              )}

              {q.status === 'submitted' && (
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-3)' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => handleAccept(q.id)}>
                    <Check size={14} /> Accept
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleReject(q.id)}>
                    <X size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
