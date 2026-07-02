import { useEffect, useState } from 'react'
import { forwardRef } from 'react'
import { Filter, X, type LucideProps } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { PageHero } from '@/components/shared/PageHero'
import { Table, type TableColumn } from '@/components/ui/Table'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { SubmitQuoteModal } from './SubmitQuoteModal'
import styles from './VendorQuotesPage.module.css'

const NairaIcon = forwardRef<SVGSVGElement, LucideProps>(({ size = 24, ...props }, ref) => (
  <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <text x="12" y="16" textAnchor="middle" dominantBaseline="central" fontSize="15" fontWeight="bold" fill="currentColor" stroke="none">₦</text>
  </svg>
))
NairaIcon.displayName = 'NairaIcon'

interface QuoteRequest {
  id: string
  title: string
  category: string | null
  budget_min: number | null
  budget_max: number | null
  deadline: string | null
  invitation_status: string
  description: string | null
  created_by_name: string
  event_name: string | null
  created_at: string
}

type ViewFilter = 'all' | 'pending' | 'answered'

export function VendorQuotesPage() {
  const user = useAuthStore((s) => s.user)
  const showNotification = useUIStore((s) => s.showNotification)
  const [requests, setRequests] = useState<QuoteRequest[]>([])
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [submittingQuote, setSubmittingQuote] = useState<QuoteRequest | null>(null)
  const [viewingDetails, setViewingDetails] = useState<QuoteRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ViewFilter>('all')

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data: listing } = await supabase
        .from('vendors')
        .select('id')
        .eq('claimed_by_vendor_id', user.id)
        .is('deleted_at', null)
        .limit(1)
        .maybeSingle()

      if (!listing?.id) {
        setLoading(false)
        return
      }

      setVendorId(listing.id)

      const { data: invitations } = await supabase
        .from('vendor_quote_invitations')
        .select('id, quote_request_id, status, created_at')
        .eq('vendor_id', listing.id)

      if (invitations && invitations.length > 0) {
        const qrIds = [...new Set(invitations.map((i: any) => i.quote_request_id))]
        const { data: qrs } = await supabase
          .from('vendor_quote_requests')
          .select('id, title, description, category, budget_range_min, budget_range_max, response_deadline, created_at, event_id, created_by')
          .in('id', qrIds)
          .order('created_at', { ascending: false })

        if (qrs) {
          const profileIds = [...new Set(qrs.map((q: any) => q.created_by))]
          const eventIds = [...new Set(qrs.map((q: any) => q.event_id).filter(Boolean))]

          const [{ data: events }, names] = await Promise.all([
            supabase.from('events').select('id, name').in('id', eventIds),
            Promise.all(profileIds.map(async (uid: string) => {
              const { data } = await supabase.rpc('get_user_display_name', { uid })
              return { uid, name: data || 'Unknown' }
            })),
          ])
          const profileMap = new Map(names.map((n: any) => [n.uid, n.name]))
          const eventMap = new Map((events || []).map((e: any) => [e.id, e.name]))

          const invByQr = new Map(invitations.map((i: any) => [i.quote_request_id, i]))
          setRequests(qrs.map((q: any) => {
            const inv = invByQr.get(q.id)
            return {
              id: q.id,
              title: q.title,
              category: q.category,
              budget_min: q.budget_range_min,
              budget_max: q.budget_range_max,
              deadline: q.response_deadline,
              description: q.description,
              invitation_status: inv?.status || 'pending',
              created_by_name: profileMap.get(q.created_by) || 'Unknown',
              event_name: eventMap.get(q.event_id) || null,
              created_at: q.created_at,
            }
          }))
        }
      }

      setLoading(false)
    })()
  }, [user])

  const formatCurrency = (val: number | null) => {
    if (val == null) return '—'
    return `₦${(val / 100).toLocaleString()}`
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const filtered = requests.filter((r) => {
    if (filter === 'pending') return r.invitation_status === 'pending'
    if (filter === 'answered') return r.invitation_status === 'quoted' || r.invitation_status === 'accepted' || r.invitation_status === 'declined'
    return true
  })

  const columns: TableColumn[] = [
    { key: 'title', label: 'Request' },
    { key: 'requested_by', label: 'Requested By' },
    { key: 'event', label: 'Event' },
    { key: 'budget', label: 'Budget' },
    { key: 'deadline', label: 'Deadline' },
    { key: 'status', label: 'Status' },
    { key: 'action', label: '', headerClassName: 'th-actions' },
  ]

  if (loading) {
    return (
      <div>
        <PageHero icon={NairaIcon} title="Quote Requests" subtitle="Respond to incoming quote requests" />
        <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
            <img src="/ng-new-logo.png" alt="Loading" style={{ width: 48, height: 48, opacity: 0.4 }} />
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!vendorId) {
    return (
      <div>
        <PageHero icon={NairaIcon} title="Quote Requests" subtitle="Respond to incoming quote requests" />
        <div className="empty-state" style={{ padding: 'var(--space-12)' }}>
          <div className="empty-state__icon"><NairaIcon size={32} /></div>
          <div className="empty-state__title">No vendor listing found</div>
          <div className="empty-state__description">Complete your vendor onboarding to receive quote requests.</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHero
        icon={NairaIcon}
        title="Quote Requests"
        subtitle={`${requests.length} request${requests.length !== 1 ? 's' : ''} from event planners`}
      />

      <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
        <Table
          columns={columns}
          loading={loading}
          empty={filtered.length === 0}
          emptyIcon={NairaIcon}
          emptyTitle={filter === 'all' ? 'No quote requests yet' : filter === 'pending' ? 'No pending requests' : 'No answered requests'}
          emptyDescription="Quote requests from planners will appear here."
          toolbar={
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <DropdownMenu
                trigger={<span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-sm)' }}><Filter size={14} />{filter === 'all' ? 'All Requests' : filter === 'pending' ? 'Pending' : 'Answered'}</span>}
                items={[
                  { label: 'All Requests', value: 'all' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Answered', value: 'answered' },
                ]}
                onSelect={(item) => setFilter(item.value as ViewFilter)}
              />
            </div>
          }
        >
          {filtered.map((r) => (
            <tr key={r.id} className={styles.tableRow}>
              <td>
                <div className={styles.requestCell}>
                  <div className={styles.requestCellTitle}>{r.title}</div>
                  {r.description && <div className={styles.requestCellDesc}>{r.description}</div>}
                </div>
              </td>
              <td style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{r.created_by_name}</td>
              <td style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{r.event_name || '—'}</td>
              <td style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>
                {r.budget_min != null || r.budget_max != null
                  ? `${formatCurrency(r.budget_min)} – ${formatCurrency(r.budget_max)}`
                  : '—'}
              </td>
              <td style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{formatDate(r.deadline)}</td>
              <td>
                <span className={`badge badge-${r.invitation_status === 'pending' ? 'yellow' : r.invitation_status === 'quoted' || r.invitation_status === 'accepted' ? 'green' : 'grey'}`}>
                  {r.invitation_status}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setViewingDetails(r)}>View Details</button>
                  {r.invitation_status === 'pending' && (
                    <button className="btn btn-primary btn-sm" onClick={() => setSubmittingQuote(r)}>Submit Quote</button>
                  )}
                </div>
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
            <div className="modal-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {viewingDetails.description && (
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Description</div>
                  <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{viewingDetails.description}</div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Requested By</div>
                  <div style={{ fontSize: 'var(--text-sm)' }}>{viewingDetails.created_by_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Event</div>
                  <div style={{ fontSize: 'var(--text-sm)' }}>{viewingDetails.event_name || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Category</div>
                  <div style={{ fontSize: 'var(--text-sm)' }}>{viewingDetails.category || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Response Deadline</div>
                  <div style={{ fontSize: 'var(--text-sm)' }}>{formatDate(viewingDetails.deadline)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Budget Range</div>
                  <div style={{ fontSize: 'var(--text-sm)' }}>
                    {viewingDetails.budget_min != null || viewingDetails.budget_max != null
                      ? `${formatCurrency(viewingDetails.budget_min)} – ${formatCurrency(viewingDetails.budget_max)}`
                      : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Status</div>
                  <span className={`badge badge-${viewingDetails.invitation_status === 'pending' ? 'yellow' : viewingDetails.invitation_status === 'quoted' || viewingDetails.invitation_status === 'accepted' ? 'green' : 'grey'}`}>
                    {viewingDetails.invitation_status}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-card__footer" style={{ padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              {viewingDetails.invitation_status === 'pending' && (
                <button className="btn btn-primary" onClick={() => { setViewingDetails(null); setSubmittingQuote(viewingDetails) }}>Submit Quote</button>
              )}
              <button className="btn btn-secondary" onClick={() => setViewingDetails(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {submittingQuote && vendorId && (
        <SubmitQuoteModal
          quoteRequest={{
            id: submittingQuote.id,
            title: submittingQuote.title,
            description: submittingQuote.description,
            category: submittingQuote.category,
            budget_range_min: submittingQuote.budget_min,
            budget_range_max: submittingQuote.budget_max,
            event_name: submittingQuote.event_name || '',
          }}
          vendorId={vendorId}
          onClose={() => setSubmittingQuote(null)}
          onSubmit={() => {
            const id = submittingQuote.id
            setSubmittingQuote(null)
            setRequests((prev) => prev.map((r) => r.id === id ? { ...r, invitation_status: 'quoted' } : r))
            showNotification({ variant: 'success', title: 'Quote submitted!' })
          }}
        />
      )}
    </div>
  )
}
