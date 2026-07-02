import { useEffect, useState, forwardRef } from 'react'
import { FileText, MessageSquare, Search, Check, X, type LucideProps } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { notify } from '@/lib/notifications'
import { PageHero } from '@/components/shared/PageHero'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import { Table, type TableColumn } from '@/components/ui/Table'
import type { ClientQuoteRequest } from '@/types'
import styles from './PlannerVendorQuotesPage.module.css'

const NairaIcon = forwardRef<SVGSVGElement, LucideProps>(({ size = 24, ...props }, ref) => (
  <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <text x="12" y="16" textAnchor="middle" dominantBaseline="central" fontSize="15" fontWeight="bold" fill="currentColor" stroke="none">₦</text>
  </svg>
))
NairaIcon.displayName = 'NairaIcon'

type TabKey = 'client-requests' | 'vendor-quotes'

const TABS: TabItem<TabKey>[] = [
  { key: 'client-requests', label: 'Client Requests', icon: <FileText size={16} /> },
  { key: 'vendor-quotes', label: 'Vendor Quotes', icon: <NairaIcon size={16} /> },
]

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
  const role = useAuthStore((s) => s.role)
  const showNotification = useUIStore((s) => s.showNotification)
  const showToast = useUIStore((s) => s.showToast)
  const [activeTab, setActiveTab] = useState<TabKey>('client-requests')

  // ── Client Requests state ──
  const [requests, setRequests] = useState<ClientQuoteRequest[]>([])
  const [myResponses, setMyResponses] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [responseMsg, setResponseMsg] = useState('')
  const [responseAmount, setResponseAmount] = useState('')
  const [responsePortfolio, setResponsePortfolio] = useState('')
  const [sending, setSending] = useState(false)
  const [requestsLoading, setRequestsLoading] = useState(true)

  // ── Vendor Quotes state ──
  const [quotes, setQuotes] = useState<VendorQuote[]>([])
  const [viewingDetails, setViewingDetails] = useState<VendorQuote | null>(null)
  const [quotesLoading, setQuotesLoading] = useState(true)

  const providerRole = (role === 'planner' || role === 'coordinator' || role === 'vendor') ? role : null

  // ── Load Client Requests ──
  useEffect(() => {
    if (!user || !providerRole) { setRequestsLoading(false); return }
    ;(async () => {
      const [reqRes, respRes] = await Promise.all([
        supabase
          .from('client_quote_requests')
          .select('*')
          .in('status', ['open', 'negotiating'])
          .order('created_at', { ascending: false }),
        supabase
          .from('client_quote_responses')
          .select('quote_request_id')
          .eq('respondent_id', user.id),
      ])
      if (reqRes.data) setRequests(reqRes.data as ClientQuoteRequest[])
      if (respRes.data) setMyResponses(new Set(respRes.data.map((r: any) => r.quote_request_id)))
      setRequestsLoading(false)
    })()
  }, [user, providerRole])

  // ── Load Vendor Quotes ──
  useEffect(() => {
    if (!user) return
    ;(async () => {
      const orgId = org?.id
      if (!orgId) { setQuotesLoading(false); return }

      const { data: requestsData } = await supabase
        .from('vendor_quote_requests')
        .select('id')
        .eq('org_id', orgId)

      if (!requestsData || requestsData.length === 0) { setQuotesLoading(false); return }

      const qrIds = requestsData.map((r: any) => r.id)
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
      setQuotesLoading(false)
    })()
  }, [user, org])

  // ── Vendor Quote Actions ──
  const handleAccept = async (quote: VendorQuote) => {
    const { data, error } = await supabase
      .from('vendor_quotes')
      .update({ status: 'accepted' })
      .eq('id', quote.id)
      .select()
    if (error || !data?.length) {
      showNotification({ variant: 'error', title: 'Failed to accept', message: error?.message || 'No rows updated' })
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
    const { data, error } = await supabase
      .from('vendor_quotes')
      .update({ status: 'rejected' })
      .eq('id', quote.id)
      .select()
    if (error || !data?.length) {
      showNotification({ variant: 'error', title: 'Failed to reject', message: error?.message || 'No rows updated' })
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

  // ── Client Request Actions ──
  const handleRespond = async (requestId: string) => {
    if (!user || !providerRole) return
    if (!responseMsg.trim()) { showToast({ type: 'warning', title: 'Message is required' }); return }

    setSending(true)
    const { error } = await supabase
      .from('client_quote_responses')
      .insert({
        quote_request_id: requestId,
        respondent_id: user.id,
        respondent_role: providerRole,
        message: responseMsg.trim(),
        estimated_amount: responseAmount ? parseInt(responseAmount) * 100 : null,
        portfolio_links: responsePortfolio.trim() ? responsePortfolio.split(',').map((s) => s.trim()).filter(Boolean) : [],
        status: 'pending',
      })

    if (error) {
      showToast({ type: 'error', title: 'Failed to respond', body: error.message })
      setSending(false)
      return
    }

    const { data: clientReq } = await supabase
      .from('client_quote_requests')
      .select('client_id, title')
      .eq('id', requestId)
      .single()
    if (clientReq) {
      notify({ type: 'quote_response_received', recipientId: clientReq.client_id, payload: { title: 'New quote response', body: `Someone responded to your request "${clientReq.title}"` } })
    }

    showToast({ type: 'success', title: 'Response sent!' })
    setMyResponses((prev) => new Set(prev).add(requestId))
    setRespondingId(null)
    setResponseMsg('')
    setResponseAmount('')
    setResponsePortfolio('')
    setSending(false)
  }

  const formatCurrency = (val: number | null) => {
    if (val == null) return '—'
    return `₦${(val / 100).toLocaleString()}`
  }

  const quoteColumns: TableColumn[] = [
    { key: 'title', label: 'Request' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'event', label: 'Event' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'action', label: '', headerClassName: 'th-actions' },
  ]

  const filteredRequests = search
    ? requests.filter((r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(search.toLowerCase())
      )
    : requests

  return (
    <div>
      <PageHero
        icon={FileText}
        title="Quote Center"
        subtitle={`${requests.length} client request${requests.length !== 1 ? 's' : ''} · ${quotes.length} vendor quote${quotes.length !== 1 ? 's' : ''}`}
      />

      <div className={styles.tabWrapper}>
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className={styles.content}>
        {/* ── Client Requests Tab ── */}
        {activeTab === 'client-requests' && (
          <>
            <div className={styles.searchWrap}>
              <Search size={14} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search requests..."
              />
            </div>

            {requestsLoading ? (
              <div className={styles.loadingWrap}>
                <img src="/ng-new-logo.png" alt="Loading" className={styles.loadingImg} />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className={`empty-state ${styles.emptyState}`}>
                <div className="empty-state__icon"><FileText size={24} /></div>
                <div className="empty-state__title">No open requests</div>
                <div className="empty-state__description">Check back later for new quote requests from clients.</div>
              </div>
            ) : (
              <div className={styles.requestList}>
                {filteredRequests.map((req) => {
                  const alreadyResponded = myResponses.has(req.id)
                  return (
                    <div key={req.id} className={styles.requestCard}>
                      <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>{req.title}</h3>
                        <span className={`badge badge-${req.status === 'open' ? 'yellow' : 'green'}`}>
                          <span className="badge-dot" />
                          {req.status}
                        </span>
                      </div>

                      {req.description && <p className={styles.cardDesc}>{req.description}</p>}

                      <div className={styles.cardMeta}>
                        {req.event_type && <span className={styles.metaTag}>{req.event_type}</span>}
                        {req.event_date && <span className={styles.metaTag}>{new Date(req.event_date).toLocaleDateString()}</span>}
                        {req.guest_count && <span className={styles.metaTag}>{req.guest_count} guests</span>}
                        {req.budget_range && <span className={styles.metaTag}>Budget: ₦{req.budget_range}</span>}
                        {req.preferred_roles?.length > 0 && (
                          <span className={styles.metaTag}>Looking for: {req.preferred_roles.join(', ')}</span>
                        )}
                      </div>

                      {alreadyResponded ? (
                        <div className={styles.respondedBadge}>
                          <MessageSquare size={14} /> You've responded
                        </div>
                      ) : respondingId === req.id ? (
                        <div className={styles.responseForm}>
                          <textarea
                            className={`${styles.fieldInput} ${styles.textarea}`}
                            value={responseMsg}
                            onChange={(e) => setResponseMsg(e.target.value)}
                            placeholder="Your message to the client..."
                            rows={3}
                          />
                          <div className={styles.responseRow}>
                            <input className={styles.fieldInput} type="number" value={responseAmount} onChange={(e) => setResponseAmount(e.target.value)} placeholder="Est. amount (₦)" />
                            <input className={styles.fieldInput} value={responsePortfolio} onChange={(e) => setResponsePortfolio(e.target.value)} placeholder="Portfolio URLs (comma separated)" />
                          </div>
                          <div className={styles.responseActions}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setRespondingId(null)}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={() => handleRespond(req.id)} disabled={sending}>
                              {sending ? 'Sending...' : 'Send Response'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button className={`btn btn-primary btn-sm ${styles.respondBtn}`} onClick={() => { setRespondingId(req.id); setResponseMsg(''); setResponseAmount(''); setResponsePortfolio('') }}>
                          <MessageSquare size={14} /> Respond
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── Vendor Quotes Tab ── */}
        {activeTab === 'vendor-quotes' && (
          <Table
            columns={quoteColumns}
            loading={quotesLoading}
            empty={quotes.length === 0}
            emptyIcon={NairaIcon}
            emptyTitle="No vendor quotes yet"
            emptyDescription="Quotes from vendors will appear here once they respond to your requests."
          >
            {quotes.length > 0 && quotes.map((q) => (
              <tr key={q.id} className={styles.tableRow}>
                <td><div className={styles.cellTitle}>{q.title}</div></td>
                <td className={styles.cellText}>{q.vendor_name}</td>
                <td className={styles.cellText}>{q.event_name}</td>
                <td className={styles.cellAmount}>{formatCurrency(q.amount)}</td>
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
        )}
      </div>

      {/* ── Vendor Quote Details Modal ── */}
      {viewingDetails && (
        <div className="overlay" onClick={() => setViewingDetails(null)}>
          <div className={`modal-card ${styles.modalCard}`} onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header">
              <h3 className="modal-card-title">{viewingDetails.title}</h3>
              <button className="modal-card-close" onClick={() => setViewingDetails(null)}><X size={18} /></button>
            </div>
            <div className={`modal-card-body ${styles.modalBody}`}>
              {viewingDetails.description && (
                <div>
                  <div className={styles.fieldLabel}>Description</div>
                  <div className={styles.fieldDesc}>{viewingDetails.description}</div>
                </div>
              )}

              <div className={styles.infoGrid}>
                <div>
                  <div className={styles.fieldLabel}>Vendor</div>
                  <div className={styles.fieldValue}>{viewingDetails.vendor_name}</div>
                </div>
                <div>
                  <div className={styles.fieldLabel}>Event</div>
                  <div className={styles.fieldValue}>{viewingDetails.event_name}</div>
                </div>
                <div>
                  <div className={styles.fieldLabel}>Amount</div>
                  <div className={styles.fieldValueBold}>{formatCurrency(viewingDetails.amount)}</div>
                </div>
                <div>
                  <div className={styles.fieldLabel}>Status</div>
                  <span className={`badge badge-${viewingDetails.status === 'accepted' ? 'green' : viewingDetails.status === 'rejected' ? 'red' : viewingDetails.status === 'revised' ? 'yellow' : 'grey'}`}>
                    {viewingDetails.status}
                  </span>
                </div>
              </div>

              {viewingDetails.line_items.length > 0 && (
                <div>
                  <div className={styles.lineItemsLabel}>Line Items</div>
                  <div className={styles.lineItemsList}>
                    {viewingDetails.line_items.map((item: any, i: number) => (
                      <div key={i} className={styles.lineItemRow}>
                        <span>{item.description || `Item ${i + 1}`}</span>
                        <span className={styles.lineItemAmount}>₦{(item.amount != null ? item.amount / 100 : 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingDetails.notes && (
                <div>
                  <div className={styles.fieldLabel}>Notes</div>
                  <div className={styles.fieldNotes}>{viewingDetails.notes}</div>
                </div>
              )}
            </div>
            <div className={`modal-card__footer ${styles.modalFooter}`}>
              {viewingDetails.status === 'submitted' && (
                <>
                  <button className="btn btn-primary" onClick={() => { handleAccept(viewingDetails) }}><Check size={14} /> Accept</button>
                  <button className="btn btn-secondary" onClick={() => { handleReject(viewingDetails) }}><X size={14} /> Reject</button>
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
