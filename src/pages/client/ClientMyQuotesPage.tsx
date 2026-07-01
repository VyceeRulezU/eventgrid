import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { PageHero } from '@/components/shared/PageHero'
import { Table, type TableColumn } from '@/components/ui/Table'

interface ClientQuoteRequest {
  id: string
  title: string
  status: string
  response_count: number
  created_at: string
  item: string | null
  budget_range: string | null
}

export function ClientMyQuotesPage() {
  const user = useAuthStore((s) => s.user)
  const [quoteRequests, setQuoteRequests] = useState<ClientQuoteRequest[]>([])
  const [viewingDetails, setViewingDetails] = useState<ClientQuoteRequest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data: quotesRes } = await supabase
        .from('client_quote_requests')
        .select('id, title, status, created_at')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (quotesRes) {
        const withCounts = await Promise.all(
          (quotesRes as any[]).map(async (q) => {
            const { count } = await supabase
              .from('client_quote_responses')
              .select('id', { count: 'exact' })
              .eq('quote_request_id', q.id)
            return { ...q, response_count: count || 0 } as ClientQuoteRequest
          })
        )
        setQuoteRequests(withCounts)
      }

      setLoading(false)
    })()
  }, [user])

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const columns: TableColumn[] = [
    { key: 'title', label: 'Request' },
    { key: 'responses', label: 'Responses' },
    { key: 'status', label: 'Status' },
    { key: 'created', label: 'Date' },
    { key: 'action', label: '', headerClassName: 'th-actions' },
  ]

  if (loading) {
    return (
      <div>
        <PageHero icon={FileText} title="My Quotes" subtitle="Your quote requests and responses" />
        <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
            <img src="/ng-new-logo.png" alt="Loading" style={{ width: 48, height: 48, opacity: 0.4 }} />
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHero
        icon={FileText}
        title="My Quotes"
        subtitle={`${quoteRequests.length} request${quoteRequests.length !== 1 ? 's' : ''} · Responses from providers`}
      />

      <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
        <Table
          columns={columns}
          loading={loading}
          empty={quoteRequests.length === 0}
          emptyIcon={FileText}
          emptyTitle="No quote requests yet"
          emptyDescription="Request quotes from planners, vendors, or coordinators."
          emptyAction={
            <Link to="/client/request-quote" className="btn btn-primary"><Plus size={16} /> Request a Quote</Link>
          }
          toolbar={
            <Link to="/client/request-quote" className="btn btn-primary btn-sm"><Plus size={14} /> New Request</Link>
          }
        >
          {quoteRequests.map((qr) => (
            <tr key={qr.id}>
              <td>
                <div style={{ fontWeight: 600 }}>{qr.title}</div>
              </td>
              <td style={{ fontSize: 'var(--text-sm)' }}>{qr.response_count} response{qr.response_count !== 1 ? 's' : ''}</td>
              <td>
                <span className={`badge badge-${qr.status === 'open' ? 'yellow' : qr.status === 'negotiating' ? 'green' : 'grey'}`}>
                  {qr.status}
                </span>
              </td>
              <td style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{formatDate(qr.created_at)}</td>
              <td>
                <button className="btn btn-ghost btn-sm" onClick={() => setViewingDetails(qr)}>View Details</button>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {viewingDetails && (
        <div className="overlay" onClick={() => setViewingDetails(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-card-header">
              <h3 className="modal-card-title">{viewingDetails.title}</h3>
              <button className="modal-card-close" onClick={() => setViewingDetails(null)}><X size={18} /></button>
            </div>
            <div className="modal-card-body" style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Status</div>
                  <span className={`badge badge-${viewingDetails.status === 'open' ? 'yellow' : viewingDetails.status === 'negotiating' ? 'green' : 'grey'}`}>{viewingDetails.status}</span>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Responses</div>
                  <div style={{ fontSize: 'var(--text-sm)' }}>{viewingDetails.response_count}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Date</div>
                  <div style={{ fontSize: 'var(--text-sm)' }}>{formatDate(viewingDetails.created_at)}</div>
                </div>
              </div>
            </div>
            <div className="modal-card__footer" style={{ padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <button className="btn btn-secondary" onClick={() => setViewingDetails(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
