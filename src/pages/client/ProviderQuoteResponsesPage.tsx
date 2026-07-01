import { useEffect, useState } from 'react'
import { FileText, MessageSquare, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { notify } from '@/lib/notifications'
import { PageHero } from '@/components/shared/PageHero'
import type { ClientQuoteRequest } from '@/types'
import styles from './ProviderQuoteResponsesPage.module.css'

export function ProviderQuoteResponsesPage() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const showToast = useUIStore((s) => s.showToast)
  const [requests, setRequests] = useState<ClientQuoteRequest[]>([])
  const [myResponses, setMyResponses] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [responseMsg, setResponseMsg] = useState('')
  const [responseAmount, setResponseAmount] = useState('')
  const [responsePortfolio, setResponsePortfolio] = useState('')
  const [sending, setSending] = useState(false)

  const providerRole = (role === 'planner' || role === 'coordinator' || role === 'vendor') ? role : null

  useEffect(() => {
    if (!user || !providerRole) { setLoading(false); return }

    async function load() {
      const uid = user!.id
      const [reqRes, respRes] = await Promise.all([
        supabase
          .from('client_quote_requests')
          .select('*')
          .in('status', ['open', 'negotiating'])
          .order('created_at', { ascending: false }),
        supabase
          .from('client_quote_responses')
          .select('quote_request_id')
          .eq('respondent_id', uid),
      ])

      if (reqRes.data) setRequests(reqRes.data as ClientQuoteRequest[])
      if (respRes.data) setMyResponses(new Set(respRes.data.map((r: any) => r.quote_request_id)))
      setLoading(false)
    }

    load()
  }, [user, providerRole])

  if (!providerRole) {
    return (
      <div className={styles.page}>
        <PageHero icon={FileText} title="Quote Requests" />
        <div className="empty-state">
          <div className="empty-state__icon"><FileText size={24} /></div>
          <div className="empty-state__title">Not available</div>
          <div className="empty-state__description">Only planners, coordinators, and vendors can respond to quote requests.</div>
        </div>
      </div>
    )
  }

  const filtered = search
    ? requests.filter((r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(search.toLowerCase())
      )
    : requests

  const handleRespond = async (requestId: string) => {
    if (!user || !providerRole) return
    if (!responseMsg.trim()) {
      showToast({ type: 'warning', title: 'Message is required' })
      return
    }

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

    // Notify the client
    const { data: clientReq } = await supabase
      .from('client_quote_requests')
      .select('client_id, title')
      .eq('id', requestId)
      .single()
    if (clientReq) {
      notify({
        type: 'quote_response_received',
        recipientId: clientReq.client_id,
        payload: {
          title: 'New quote response',
          body: `Someone responded to your request "${clientReq.title}"`,
        },
      })
    }

    showToast({ type: 'success', title: 'Response sent!' })
    setMyResponses((prev) => new Set(prev).add(requestId))
    setRespondingId(null)
    setResponseMsg('')
    setResponseAmount('')
    setResponsePortfolio('')
    setSending(false)
  }

  return (
    <div className={styles.page}>
      <PageHero icon={FileText} title="Quote Requests" subtitle="Browse requests from clients looking for event professionals." />

      <div className={styles.searchWrap}>
        <Search size={14} className={styles.searchIcon} />
        <input className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requests..." />
      </div>

      {loading ? (
        <div className={styles.loadingWrap}>
          <img src="/ng-new-logo.png" alt="Loading" style={{ width: 48, height: 48, opacity: 0.5 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon"><FileText size={24} /></div>
          <div className="empty-state__title">No open requests</div>
          <div className="empty-state__description">Check back later for new quote requests from clients.</div>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((req) => {
            const alreadyResponded = myResponses.has(req.id)
            return (
              <div key={req.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{req.title}</h3>
                  <span className={`badge badge-${req.status === 'open' ? 'yellow' : 'green'}`}>
                    <span className="badge-dot" />
                    {req.status}
                  </span>
                </div>

                {req.description && <p className={styles.cardDesc}>{req.description}</p>}

                <div className={styles.cardMeta}>
                  {req.event_type && <span>{req.event_type}</span>}
                  {req.event_date && <span>{new Date(req.event_date).toLocaleDateString()}</span>}
                  {req.guest_count && <span>{req.guest_count} guests</span>}
                  {req.budget_range && <span>Budget: ₦{req.budget_range}</span>}
                  {req.preferred_roles?.length > 0 && (
                    <span>Looking for: {req.preferred_roles.join(', ')}</span>
                  )}
                </div>

                {alreadyResponded ? (
                  <div className={styles.respondedBadge}>
                    <MessageSquare size={14} /> You've responded
                  </div>
                ) : respondingId === req.id ? (
                  <div className={styles.responseForm}>
                    <textarea
                      className={styles.responseTextarea}
                      value={responseMsg}
                      onChange={(e) => setResponseMsg(e.target.value)}
                      placeholder="Your message to the client..."
                      rows={3}
                    />
                    <div className={styles.responseRow}>
                      <input
                        className={styles.responseInput}
                        type="number"
                        value={responseAmount}
                        onChange={(e) => setResponseAmount(e.target.value)}
                        placeholder="Est. amount (₦)"
                      />
                      <input
                        className={styles.responseInput}
                        value={responsePortfolio}
                        onChange={(e) => setResponsePortfolio(e.target.value)}
                        placeholder="Portfolio URLs (comma separated)"
                      />
                    </div>
                    <div className={styles.responseActions}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setRespondingId(null)}>Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={() => handleRespond(req.id)} disabled={sending}>
                        {sending ? 'Sending...' : 'Send Response'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => { setRespondingId(req.id); setResponseMsg(''); setResponseAmount(''); setResponsePortfolio('') }}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <MessageSquare size={14} /> Respond
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
