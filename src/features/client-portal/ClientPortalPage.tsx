import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Users, Image, LayoutGrid,
  CheckCircle2, Circle, Clock, AlertTriangle,
  FileText, Upload, X, Download, FileSpreadsheet,
  Send, Trash2, UserPlus, Mail, Loader2, ExternalLink,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PhaseTimelineTracker } from '@/components/shared/PhaseTimelineTracker'
import { PhaseSegmentBar } from '@/components/shared/PhasePipeline'
import { PageHero } from '@/components/shared/PageHero'
import { sendInvite } from '@/lib/edgeFunctions'
import { Table } from '@/components/ui/Table'
import { ReviewForm } from '@/features/reviews/ReviewForm'
import type { Event, EventPhase, Media, ClientPortal, EventVendor, Guest } from '@/types'

interface PortalAsset {
  id: string
  event_id: string
  name: string
  type: string
  category: string
  file_size: number | null
  mime_type: string | null
  file_url: string | null
  created_at: string
}
import styles from './ClientPortalPage.module.css'

interface PortalData {
  portal: ClientPortal
  event: Event
  phases: EventPhase[]
  media: Media[]
}

type ClientTab = 'timeline' | 'all' | 'active' | 'done' | 'gallery' | 'financials' | 'vendors' | 'assets' | 'guests'

/* ── SVG Progress ring ─────────────────────────── */
function ProgressRing({ pct }: { pct: number }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <div className={styles.progressRingWrap}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle className={styles.progressRingBg} cx="50" cy="50" r={r} />
        <circle
          className={styles.progressRingFg}
          cx="50" cy="50" r={r}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles.progressRingLabel}>
        <span className={styles.progressRingPct}>{pct}%</span>
        <span className={styles.progressRingDesc}>done</span>
      </div>
    </div>
  )
}

/* ── Main component ────────────────────────────── */
export function ClientPortalPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ClientTab>('timeline')
  const [eventVendors, setEventVendors] = useState<EventVendor[]>([])
  const [portalAssets, setPortalAssets] = useState<PortalAsset[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [previewMedia, setPreviewMedia] = useState<Media | null>(null)
  const [previewAsset, setPreviewAsset] = useState<PortalAsset | null>(null)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteFirstName, setInviteFirstName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadName, setUploadName] = useState('')
  const [uploadCategory, setUploadCategory] = useState('')
  const [showCSV, setShowCSV] = useState(false)
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[]>([])
  const [sendingBulk, setSendingBulk] = useState(false)
  const [sendingInvites, setSendingInvites] = useState<Set<string>>(new Set())
  const fileRef = useRef<HTMLInputElement>(null)

  const sendInviteToGuest = async (guest: Guest) => {
    if (!data || !guest.email) return
    setSendingInvites((prev) => new Set(prev).add(guest.id))
    await sendInvite({
      type: 'guest_invite',
      event_id: data.event.id,
      email: guest.email,
      guest_name: guest.first_name,
      invited_by_name: 'Your Event Planner',
    })
    setSendingInvites((prev) => { const next = new Set(prev); next.delete(guest.id); return next })
  }

  const deleteGuest = async (guest: Guest) => {
    if (!data) return
    const confirmed = window.confirm(`Remove "${guest.first_name}" from the guest list?`)
    if (!confirmed) return
    await supabase.from('guests').delete().eq('id', guest.id)
    setGuests((prev) => prev.filter((g) => g.id !== guest.id))
  }

  useEffect(() => {
    if (!token) { setError('Invalid access link'); setLoading(false); return }

    supabase
      .from('client_portals')
      .select('*')
      .eq('access_token', token)
      .eq('is_active', true)
      .single()
      .then(({ data: portal, error: portalErr }) => {
        if (portalErr || !portal) { setError('Invalid or expired portal link'); setLoading(false); return }

        const isExpired = portal.expires_at && new Date(portal.expires_at) < new Date()
        if (isExpired) { setError('This portal link has expired'); setLoading(false); return }

        supabase
          .from('events')
          .select('*')
          .eq('id', portal.event_id)
          .single()
          .then(({ data: event }) => {
            if (!event) { setError('Event not found'); setLoading(false); return }

            Promise.all([
              supabase.from('event_phases').select('*').eq('event_id', event.id).order('phase_number'),
              supabase.from('media').select('*').eq('event_id', event.id).eq('tag', 'client_share').order('created_at'),
              supabase.from('event_vendors').select('*').eq('event_id', event.id).order('category'),
              supabase.from('event_assets').select('*').eq('event_id', event.id).order('created_at', { ascending: false }),
              supabase.from('guests').select('*').eq('event_id', event.id).order('created_at', { ascending: false }),
            ]).then(([phasesRes, mediaRes, vendorsRes, assetsRes, guestsRes]) => {
              setEventVendors((vendorsRes.data || []) as unknown as EventVendor[])
              setPortalAssets((assetsRes.data || []) as unknown as PortalAsset[])
              setGuests((guestsRes.data || []) as unknown as Guest[])
              supabase.from('client_portals').update({ last_accessed: new Date().toISOString() }).eq('id', portal.id).then()
              setData({
                portal,
                event: event as unknown as Event,
                phases: (phasesRes.data || []) as unknown as EventPhase[],
                media: (mediaRes.data || []) as unknown as Media[],
              })
              setLoading(false)
            })
          })
      })
  }, [token])

  const listPhases = useMemo(() => {
    if (!data) return []
    const { phases } = data
    if (activeTab === 'active') return phases.filter((p) => p.status === 'in_progress')
    if (activeTab === 'done') return phases.filter((p) => p.status === 'completed')
    return phases
  }, [data, activeTab])

  /* ── Loading ── */
  if (loading) return (
    <div className={styles.portalPage}>
      <header className={styles.portalHeader}>
        <div className={styles.headerLeft}>
          <img src="/EventGrid-logo-white.svg" alt="NaliGrid" className={styles.headerLogoLg} />
        </div>
      </header>
      <div className={styles.skeletonWrap}>
        <div className={`${styles.skeleton} ${styles.skeletonHero}`} />
        {[1,2,3].map(i => <div key={i} className={`${styles.skeleton} ${styles.skeletonCard}`} />)}
      </div>
    </div>
  )

  /* ── Error ── */
  if (error) return (
    <div className={styles.portalPage}>
      <header className={styles.portalHeader}>
        <div className={styles.headerLeft}>
          <img src="/EventGrid-logo-white.svg" alt="NaliGrid" className={styles.headerLogoLg} />
        </div>
      </header>
      <div className={styles.errorWrap}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}><AlertTriangle size={28} /></div>
          <div className={styles.errorTitle}>{error}</div>
          <div className={styles.errorSub}>
            Please contact your event planner for a new access link.
          </div>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
            Go Home
          </button>
        </div>
      </div>
    </div>
  )

  if (!data) return null

  const { event, phases, media } = data
  const completed = phases.filter((p) => p.status === 'completed').length
  const activeCount = phases.filter((p) => p.status === 'in_progress').length
  const progressPct = phases.length ? Math.round((completed / phases.length) * 100) : 0
  const eventDate = event.event_date ? new Date(event.event_date) : null

  const heroSubtitle = [
    eventDate ? eventDate.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '',
    event.venue_name ? `${event.venue_name}${event.venue_address ? `, ${event.venue_address}` : ''}` : '',
    event.guest_count ? `${event.guest_count.toLocaleString()} guests` : '',
  ].filter(Boolean).join(' · ')

  return (
    <div className={styles.portalPage}>
      <header className={styles.portalHeader}>
        <div className={styles.headerLeft}>
          <img src="/EventGrid-logo-white.svg" alt="NaliGrid" className={styles.headerLogoLg} />
          <div className={styles.headerDivider} />
          <span className={styles.headerPortalBadge}>Client Portal</span>
        </div>
      </header>

      <div className={styles.portalBody}>
        <PageHero
          icon={LayoutGrid}
          title={`Event Portal | ${event.name}`}
          subtitle={heroSubtitle}
          breadcrumbs={[{ label: event.event_type || 'Event' }]}
          actions={
            <div className={styles.pageHeroActions}>
              <ProgressRing pct={progressPct} />
              <div className={styles.heroProgressText}>
                {completed} of {phases.length} phases complete
              </div>
            </div>
          }
        />

        <div className={styles.heroProgressBar}>
          <PhaseSegmentBar phases={phases} />
        </div>

        {/* ── Content area ── */}
        <div className={styles.mainContent}>

        {/* Stats strip */}
        <div className={styles.statsStrip}>
          <div className={styles.statChip}>
            <div className={styles.statChipValue}>{phases.length}</div>
            <div className={styles.statChipLabel}>Total Phases</div>
          </div>
          <div className={styles.statChip}>
            <div className={styles.statChipValue}>{completed}</div>
            <div className={styles.statChipLabel}>Completed</div>
          </div>
          <div className={styles.statChip}>
            <div className={styles.statChipValue}>{activeCount}</div>
            <div className={styles.statChipLabel}>In Progress</div>
          </div>
          <div className={styles.statChip}>
            <div className={styles.statChipValue}>{media.length}</div>
            <div className={styles.statChipLabel}>Shared Media</div>
          </div>
          <div className={styles.statChip}>
            <div className={styles.statChipValue}>{guests.length}</div>
            <div className={styles.statChipLabel}>Guests</div>
          </div>
          {eventDate && (
            <div className={styles.statChip}>
              <div className={styles.statChipValue}>
                {Math.max(0, Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}
              </div>
              <div className={styles.statChipLabel}>Days Away</div>
            </div>
          )}
        </div>

        {/* Pill tab bar */}
        <div className={styles.tabBar}>
          {([
            ['timeline', 'Timeline', <Clock key="t" size={13} />],
            ['all', 'All Phases', phases.length],
            ['active', 'Active', activeCount > 0 ? activeCount : null],
            ['done', 'Done', completed > 0 ? completed : null],
            ['gallery', 'Gallery', media.length > 0 ? media.length : null],
            ['financials', 'Financials', null],
            ['vendors', 'Vendors', eventVendors.length > 0 ? eventVendors.length : null],
            ['assets', 'Moodboard', portalAssets.length > 0 ? portalAssets.length : null],
            ['guests', 'Guests', guests.length > 0 ? guests.length : null],
          ] as const).map(([key, label, badge]) => (
            <button
              key={key}
              type="button"
              className={`${styles.tabBtn} ${activeTab === key ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(key as ClientTab)}
            >
              {typeof badge === 'object' ? badge : null}
              {label}
              {typeof badge === 'number' && badge !== null ? (
                <span className={styles.tabCount}>{badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Timeline */}
        {activeTab === 'timeline' && (
          <>
            <PhaseTimelineTracker phases={phases} event={event} readOnly />
            {data?.event?.created_by && (
              <div style={{ marginTop: 'var(--space-6)' }}>
                <ReviewForm
                  reviewedId={data.event.created_by}
                  eventId={data.event.id}
                  reviewerRole="client"
                  anonymous
                />
              </div>
            )}
          </>
        )}

        {/* Phase list */}
        {(activeTab === 'all' || activeTab === 'active' || activeTab === 'done') && (
          <Table
            columns={[
              { key: 'num', label: '#' },
              { key: 'name', label: 'Phase' },
              { key: 'status', label: 'Status' },
              { key: 'due', label: 'Due' },
            ]}
            minWidth="500px"
            empty={listPhases.length === 0}
            emptyIcon={Circle}
            emptyTitle="No phases here yet"
            emptyDescription={activeTab === 'active' ? 'No phases are currently in progress.' : 'No completed phases yet.'}
          >
            {listPhases.map((phase) => {
              const isComplete = phase.status === 'completed'
              const isCurrent = phase.status === 'in_progress'
              const isBlocked = phase.status === 'blocked'
              return (
                <tr key={phase.id}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 700, background: isComplete ? 'var(--color-accent)' : 'var(--color-accent-muted)', color: isComplete ? '#000' : 'var(--color-accent)' }}>
                      {phase.phase_number}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{phase.phase_name}</div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        color: isComplete ? 'var(--color-accent)' : isCurrent ? 'var(--color-info)' : isBlocked ? 'var(--color-warning)' : 'var(--color-text-muted)',
                        fontWeight: isComplete || isCurrent || isBlocked ? 600 : 400,
                        fontSize: 'var(--text-xs)',
                      }}>
                        {isComplete ? <CheckCircle2 size={12} /> : isCurrent ? <Clock size={12} /> : isBlocked ? <AlertTriangle size={12} /> : <Circle size={12} />}
                        {isComplete ? 'Completed' : isCurrent ? 'In Progress' : isBlocked ? 'On Hold' : 'Not Started'}
                      </span>
                      {phase.completed_at && isComplete && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          · {new Date(phase.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {phase.due_date ? (
                      <span>Due {new Date(phase.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </Table>
        )}

        {/* Financials */}
        {activeTab === 'financials' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
              <div className={styles.finCard}>
                <div className={styles.finLabel}>Total Budget</div>
                <div className={styles.finValue}>₦{(event.budget_total || 0).toLocaleString()}</div>
              </div>
              <div className={styles.finCard}>
                <div className={styles.finLabel}>Total Vendor Cost</div>
                <div className={styles.finValue}>₦{eventVendors.reduce((s, v) => s + (v.total_amount || 0), 0).toLocaleString()}</div>
              </div>
              <div className={styles.finCard}>
                <div className={styles.finLabel}>Paid</div>
                <div className={styles.finValue} style={{ color: 'var(--color-success)' }}>
                  ₦{eventVendors.filter(v => v.payment_status === 'paid').reduce((s, v) => s + (v.total_amount || 0), 0).toLocaleString()}
                </div>
              </div>
              <div className={styles.finCard}>
                <div className={styles.finLabel}>Outstanding</div>
                <div className={styles.finValue} style={{ color: 'var(--color-warning)' }}>
                  ₦{eventVendors.filter(v => v.payment_status !== 'paid').reduce((s, v) => s + (v.total_amount || 0), 0).toLocaleString()}
                </div>
              </div>
            </div>
            {eventVendors.filter(v => v.total_amount > 0).length > 0 && (
              <div>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--color-text-primary)' }}>Vendor Payments</h4>
                <div className={styles.finTableWrap}>
                  <table className={styles.finTable}>
                    <thead>
                      <tr>
                        <th>Vendor</th>
                        <th>Category</th>
                        <th>Total</th>
                        <th>Advance Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventVendors.filter(v => v.total_amount > 0).map((v) => (
                        <tr key={v.id}>
                          <td style={{ fontWeight: 600 }}>{v.vendor_name}</td>
                          <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>{v.category}</td>
                          <td>₦{v.total_amount.toLocaleString()}</td>
                          <td style={{ color: 'var(--color-success)' }}>₦{(v.advance_paid || 0).toLocaleString()}</td>
                          <td style={{ color: 'var(--color-warning)' }}>₦{(v.balance || 0).toLocaleString()}</td>
                          <td>
                            <span className={`badge ${v.payment_status === 'paid' ? 'badge-success' : v.payment_status === 'advance' ? 'badge-medium' : 'badge-error'}`} style={{ fontSize: 10 }}>{v.payment_status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Gallery */}
        {activeTab === 'gallery' && (
          <>
            {media.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}><Image size={24} /></div>
                <div className={styles.emptyStateTitle}>No shared media yet</div>
                <div className={styles.emptyStateSub}>Your planner will share photos and documents here after the event.</div>
              </div>
            ) : (
              <div className={styles.galleryGrid}>
                {media.map((m) => (
                  <div key={m.id} className={styles.mediaCard} style={{ cursor: 'pointer' }} onClick={() => setPreviewMedia(m)}>
                    <img src={m.url} alt={m.caption || ''} className={styles.mediaImg} loading="lazy" />
                    {m.caption && <div className={styles.mediaCaption}>{m.caption}</div>}
                  </div>
                ))}
              </div>
            )}
            {previewMedia && (
              <div className={styles.modalOverlay} onClick={() => setPreviewMedia(null)}>
                <div className={styles.mediaPreviewCard} onClick={(e) => e.stopPropagation()}>
                  <button type="button" className={styles.modalClose} onClick={() => setPreviewMedia(null)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={18} />
                  </button>
                  <img src={previewMedia.url} alt={previewMedia.caption || ''} className={styles.mediaPreviewFull} />
                  {previewMedia.caption && <div className={styles.mediaPreviewCaption}>{previewMedia.caption}</div>}
                </div>
              </div>
            )}
          </>
        )}

        {/* Assets */}
        {activeTab === 'assets' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowUploadForm(true)}>
                <Upload size={14} /> Upload
              </button>
            </div>
            {portalAssets.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}><Image size={24} /></div>
                <div className={styles.emptyStateTitle}>No shared assets yet</div>
                <div className={styles.emptyStateSub}>Your planner will share moodboards, images, and documents here.</div>
              </div>
            ) : (
              <div className={styles.galleryGrid}>
                {portalAssets.map((asset) => {
                  const isImg = asset.mime_type?.startsWith('image/')
                  return (
                    <div key={asset.id} className={styles.mediaCard} onClick={() => setPreviewAsset(asset)} style={{ cursor: 'pointer' }}>
                      {isImg && asset.file_url ? (
                        <img src={asset.file_url} alt={asset.name} className={styles.mediaImg} loading="lazy" />
                      ) : asset.mime_type === 'application/pdf' && asset.file_url ? (
                        <iframe
                          src={asset.file_url}
                          className={styles.mediaImg}
                          title={asset.name}
                          style={{ border: 'none' }}
                        />
                      ) : (
                        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-3)' }}>
                          <FileText size={36} style={{ opacity: 0.4 }} />
                        </div>
                      )}
                      <div style={{ padding: 'var(--space-2) var(--space-3)' }}>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>{asset.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-surface-3)' }}>{asset.category || 'Uncategorized'}</span>
                          {asset.file_size ? (
                            <span>{(asset.file_size / 1024 / 1024).toFixed(1)} MB</span>
                          ) : null}
                        </div>
                      </div>
                      {asset.file_url && (
                        <a
                          href={asset.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            position: 'absolute', bottom: 8, right: 8,
                            padding: '4px 10px', borderRadius: 'var(--radius-md)',
                            background: 'rgba(0,0,0,0.6)', color: '#fff',
                            fontSize: 11, fontWeight: 600, textDecoration: 'none',
                            backdropFilter: 'blur(4px)',
                          }}
                        >
                          <ExternalLink size={11} style={{ marginRight: 3 }} /> View
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Asset Preview Modal */}
        {previewAsset && (
          <div className={styles.modalOverlay} onClick={() => setPreviewAsset(null)}>
            <div className={styles.mediaPreviewCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div className={styles.modalTitle}>{previewAsset.name}</div>
                <button type="button" className={styles.modalClose} onClick={() => setPreviewAsset(null)}>
                  <X size={18} />
                </button>
              </div>
              {previewAsset.mime_type?.startsWith('image/') && previewAsset.file_url ? (
                <img src={previewAsset.file_url} alt={previewAsset.name} className={styles.mediaPreviewFull} />
              ) : previewAsset.mime_type === 'application/pdf' && previewAsset.file_url ? (
                <iframe
                  src={previewAsset.file_url}
                  style={{ width: '100%', height: '70vh', border: 'none' }}
                  title={previewAsset.name}
                />
              ) : (
                <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                  <FileText size={48} style={{ opacity: 0.4, marginBottom: 'var(--space-4)' }} />
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>Preview not available for this file type.</p>
                  {previewAsset.file_url && (
                    <a href={previewAsset.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                      <ExternalLink size={14} /> Open File
                    </a>
                  )}
                </div>
              )}
              <div className={styles.modalFooter}>
                {previewAsset.file_url && (
                  <a href={previewAsset.file_url} download className="btn btn-primary">
                    <Download size={14} /> Download
                  </a>
                )}
                <button type="button" className="btn btn-secondary" onClick={() => setPreviewAsset(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Vendors */}
        {activeTab === 'vendors' && (
          <Table
            columns={[
              { key: 'name', label: 'Vendor' },
              { key: 'category', label: 'Category' },
              { key: 'service', label: 'Service' },
              { key: 'amount', label: 'Amount' },
              { key: 'status', label: 'Status' },
            ]}
            minWidth="600px"
            empty={eventVendors.length === 0}
            emptyIcon={Users}
            emptyTitle="No vendors assigned"
            emptyDescription="Your planner will add vendors and service providers here."
          >
            {eventVendors.map((ev) => (
              <tr key={ev.id}>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 700, background: 'var(--color-accent-muted)', color: 'var(--color-accent)', flexShrink: 0 }}>
                      {(ev.vendor_name || '?')[0].toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{ev.vendor_name}</span>
                  </div>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{ev.category}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {ev.service_desc || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>₦{ev.total_amount.toLocaleString()}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span className={`badge ${ev.booking_status === 'confirmed' || ev.booking_status === 'paid' ? 'badge-success' : ev.booking_status === 'cancelled' ? 'badge-error' : 'badge-medium'}`}>
                    {ev.booking_status}
                  </span>
                </td>
              </tr>
            ))}
          </Table>
        )}

        {/* Guests */}
        {activeTab === 'guests' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {guests.length} guest{guests.length !== 1 ? 's' : ''}
                  {guests.filter((g) => !!g.email).length > 0 && (
                    <> · {guests.filter((g) => !!g.email).length} with email</>
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                  const headers = 'first_name,last_name,email,phone,group_name\n';
                  const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = 'guest-template.csv';
                  a.click();
                  URL.revokeObjectURL(a.href);
                }}>
                  <Download size={14} /> Template
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCSV(true)}>
                  <FileSpreadsheet size={14} /> Import CSV
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={sendingBulk || guests.filter((g) => !!g.email).length === 0}
                  onClick={async () => {
                    if (!data) return
                    setSendingBulk(true)
                    const withEmail = guests.filter((g) => !!g.email)
                    for (const g of withEmail) {
                      setSendingInvites((prev) => new Set(prev).add(g.id))
                      try {
                        await sendInvite({
                          type: 'guest_invite',
                          event_id: data.event.id,
                          email: g.email!,
                          guest_name: g.first_name,
                          invited_by_name: 'Your Event Planner',
                        })
                      } catch {}
                      setSendingInvites((prev) => { const next = new Set(prev); next.delete(g.id); return next })
                    }
                    setSendingBulk(false)
                  }}
                >
                  <Send size={14} /> {sendingBulk ? 'Sending...' : 'Send Invitations'}
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowInviteForm(true)}>
                  <UserPlus size={14} /> Invite Guest
                </button>
              </div>
            </div>
            <Table
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'rsvp', label: 'RSVP' },
                { key: 'actions', label: '' },
              ]}
              minWidth="600px"
              empty={guests.length === 0}
              emptyIcon={Users}
              emptyTitle="No guests yet"
              emptyDescription="Invite your guests so they can receive event updates."
            >
              {guests.map((g) => (
                <tr key={g.id}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 700, background: 'var(--color-accent-muted)', color: 'var(--color-accent)', flexShrink: 0 }}>
                        {(g.first_name || '?')[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {g.first_name}{g.last_name ? ` ${g.last_name}` : ''}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}>
                    {g.email ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-text-secondary)' }}>
                        <Mail size={11} /> {g.email}
                      </span>
                    ) : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    {g.phone || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span className={`${styles.rsvpBadge} ${g.rsvp_status === 'confirmed' ? styles.rsvpConfirmed : g.rsvp_status === 'declined' ? styles.rsvpDeclined : g.rsvp_status === 'maybe' ? styles.rsvpMaybe : styles.rsvpPending}`}>
                        {g.rsvp_status === 'confirmed' ? 'Confirmed' : g.rsvp_status === 'declined' ? 'Declined' : g.rsvp_status === 'maybe' ? 'Maybe' : 'Pending'}
                      </span>
                      {g.email && !sendingInvites.has(g.id) && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '2px 6px', fontSize: 10 }}
                          onClick={() => sendInviteToGuest(g)}
                          title="Send invite"
                        >
                          <Send size={11} />
                        </button>
                      )}
                      {sendingInvites.has(g.id) && (
                        <Loader2 size={12} className="spin" style={{ color: 'var(--color-accent)' }} />
                      )}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => deleteGuest(g)}
                      style={{
                        background: 'none', border: 'none', color: 'var(--color-text-muted)',
                        cursor: 'pointer', padding: '4px', borderRadius: 'var(--radius-sm)',
                      }}
                      title={`Remove ${g.first_name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </Table>
          </>
        )}
      </div>
      </div>

      {/* ── Invite Guest Modal ── */}
      {showInviteForm && (
        <div className={styles.modalOverlay} onClick={() => { if (!inviting) setShowInviteForm(false) }}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}><UserPlus size={16} /> Invite Guest</div>
              <button type="button" className={styles.modalClose} onClick={() => setShowInviteForm(false)} disabled={inviting}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>First Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={inviteFirstName}
                  onChange={(e) => setInviteFirstName(e.target.value)}
                  placeholder="Guest's first name"
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Email</label>
                <input
                  type="email"
                  className={styles.formInput}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="guest@example.com"
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowInviteForm(false)} disabled={inviting}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  if (!inviteFirstName.trim() || !inviteEmail.trim() || inviting || !data) return
                  setInviting(true)
                  const result = await sendInvite({
                    type: 'guest_invite',
                    event_id: data.event.id,
                    email: inviteEmail.trim(),
                    guest_name: inviteFirstName.trim(),
                    invited_by_name: 'Your Event Planner',
                  })
                  if (result.success) {
                    const { data: updated } = await supabase
                      .from('guests')
                      .select('*')
                      .eq('event_id', data.event.id)
                      .order('created_at', { ascending: false })
                    if (updated) setGuests(updated as unknown as Guest[])
                    setShowInviteForm(false)
                    setInviteFirstName('')
                    setInviteEmail('')
                  }
                  setInviting(false)
                }}
                disabled={!inviteFirstName.trim() || !inviteEmail.trim() || inviting}
              >
                {inviting ? (
                  <><Loader2 size={14} className="spin" /> Sending...</>
                ) : (
                  <><Mail size={14} /> Send Invite</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload Asset Modal ── */}
      {showUploadForm && (
        <div className={styles.modalOverlay} onClick={() => { if (!uploading) setShowUploadForm(false) }}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}><Upload size={16} /> Upload Asset</div>
              <button type="button" className={styles.modalClose} onClick={() => setShowUploadForm(false)} disabled={uploading}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>File</label>
                <div
                  className={styles.uploadArea}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploadFile ? (
                    <div className={styles.uploadAreaPreview}>
                      {uploadFile.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(uploadFile)} alt="" className={styles.uploadPreviewImg} />
                      ) : (
                        <FileText size={24} />
                      )}
                      <span>{uploadFile.name}</span>
                    </div>
                  ) : (
                    <div className={styles.uploadAreaPlaceholder}>
                      <Upload size={20} />
                      <span>Click to select a file</span>
                      <span className={styles.uploadAreaHint}>Images, PDFs, and documents</span>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    className={styles.fileInput}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setUploadFile(file)
                      if (!uploadName) setUploadName(file.name.replace(/\.[^.]+$/, ''))
                    }}
                  />
                </div>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="Asset name"
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Category</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  placeholder="e.g. Moodboard, Venue, Decor"
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowUploadForm(false)} disabled={uploading}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  if (!data || !uploadFile || !uploadName.trim() || uploading) return
                  setUploading(true)
                  try {
                    const ext = uploadFile.name.split('.').pop() || 'bin'
                    const path = `${data.event.id}/portal/${crypto.randomUUID()}.${ext}`
                    const { error: uploadErr } = await supabase.storage
                      .from('event-media')
                      .upload(path, uploadFile, {
                        contentType: uploadFile.type,
                        upsert: false,
                      })
                    if (uploadErr) throw uploadErr
                    const { data: pubUrlData } = supabase.storage
                      .from('event-media')
                      .getPublicUrl(path)
                    const url = pubUrlData?.publicUrl || ''
                    const mime = uploadFile.type
                    const assetType = mime.startsWith('image/') ? 'image' : 'document'
                    const { error: insertErr } = await supabase.from('event_assets').insert({
                      event_id: data.event.id,
                      name: uploadName.trim(),
                      asset_type: assetType,
                      category: uploadCategory.trim() || 'General',
                      file_size: uploadFile.size,
                      mime_type: mime,
                      storage_path: path,
                      file_url: url,
                    })
                    if (insertErr) throw insertErr
                    const { data: freshAssets } = await supabase
                      .from('event_assets')
                      .select('*')
                      .eq('event_id', data.event.id)
                      .order('created_at', { ascending: false })
                    if (freshAssets) setPortalAssets(freshAssets as unknown as PortalAsset[])
                    setShowUploadForm(false)
                    setUploadFile(null)
                    setUploadName('')
                    setUploadCategory('')
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : 'Upload failed'
                    alert(msg)
                  } finally {
                    setUploading(false)
                  }
                }}
                disabled={!uploadFile || !uploadName.trim() || uploading}
              >
                {uploading ? (
                  <><Loader2 size={14} className="spin" /> Uploading...</>
                ) : (
                  <><Upload size={14} /> Upload</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CSV Import Modal ── */}
      {showCSV && data && (
        <div className={styles.modalOverlay} onClick={() => setShowCSV(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}><FileSpreadsheet size={16} /> Import Guests from CSV</div>
              <button type="button" className={styles.modalClose} onClick={() => setShowCSV(false)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
                CSV headers: <code>first_name, last_name, email, phone, group_name</code>
              </p>
              <div
                className={styles.uploadArea}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.csv';
                  input.onchange = () => {
                    const file = input.files?.[0];
                    if (!file) return;
                    import('papaparse').then(({ default: Papa }) => {
                      Papa.parse(file, {
                        header: true,
                        skipEmptyLines: true,
                        complete: (results) => setCsvPreview(results.data as Record<string, string>[]),
                      });
                    });
                  };
                  input.click();
                }}
              >
                {csvPreview.length > 0 ? (
                  <div className={styles.uploadAreaPreview}>
                    <FileSpreadsheet size={24} />
                    <span>{csvPreview.length} rows ready to import</span>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', maxHeight: 120, overflowY: 'auto', textAlign: 'left', width: '100%' }}>
                      {csvPreview.slice(0, 10).map((r, i) => (
                        <div key={i} style={{ padding: '2px 0' }}>{r.first_name || r['First Name'] || r.name || r.Name || `Row ${i + 1}`}</div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.uploadAreaPlaceholder}>
                    <FileSpreadsheet size={20} />
                    <span>Click to select a CSV file</span>
                    <span className={styles.uploadAreaHint}>Headers: first_name, last_name, email, phone, group_name</span>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowCSV(false); setCsvPreview([]) }}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={csvPreview.length === 0}
                onClick={async () => {
                  if (!data) return;
                  const rows = csvPreview.map((r) => ({
                    event_id: data.event.id,
                    first_name: r.first_name || r['First Name'] || r.name || r.Name || '',
                    last_name: r.last_name || r['Last Name'] || null,
                    phone: r.phone || r.Phone || r.telephone || null,
                    email: r.email || r.Email || null,
                    group_name: r.group_name || r.Group || r['Group Name'] || null,
                    rsvp_status: 'pending' as const,
                  })).filter(r => r.first_name);
                  if (rows.length === 0) return;
                  const { error } = await supabase.from('guests').insert(rows as any);
                  if (error) { alert(error.message); return; }
                  for (const row of rows) {
                    if (row.email) {
                      sendInvite({
                        type: 'guest_invite',
                        event_id: data.event.id,
                        email: row.email,
                        guest_name: row.first_name,
                        invited_by_name: 'Your Event Planner',
                      }).catch(() => {});
                    }
                  }
                  const { data: updated } = await supabase
                    .from('guests')
                    .select('*')
                    .eq('event_id', data.event.id)
                    .order('created_at', { ascending: false });
                  if (updated) setGuests(updated as unknown as Guest[]);
                  setShowCSV(false);
                  setCsvPreview([]);
                }}
              >
                <Upload size={14} /> Import {csvPreview.length} Guest{csvPreview.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className={styles.portalFooter}>
        <LayoutGrid size={12} />
        Powered by NaliGrid · Your planner manages all operational details
      </footer>
    </div>
  )
}
