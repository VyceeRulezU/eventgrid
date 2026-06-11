import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { pdf } from '@react-pdf/renderer'
import { FileText, Users, CircleDollarSign, Building, Star, Sparkles, X } from 'lucide-react'
import { ReportPdfDocument } from './ReportPdfDocument'
import { generateReportNarrative } from '@/lib/edgeFunctions'
import type { Event, EventPhase, Issue } from '@/types'
import styles from './Aftermath.module.css'

export interface VendorRating {
  id: string
  name: string
  category: string
  rating: number
}

export interface AiNarrative {
  executiveSummary: string
  highlights: string[]
  vendorNotes: string
  issueSummary: string
  recommendations: string[]
}

export interface ReportData {
  event: Event | null
  phases: EventPhase[]
  guestCount: number
  checkedIn: number
  totalBudget: number
  totalExpense: number
  vendorCount: number
  issues: Issue[]
  issuesResolved: number
  mediaCount: number
  clientSharedCount: number
  aiNarrative?: AiNarrative | null
}

export function EventReportBuilder({ eventId }: { eventId: string }) {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const showToast = useUIStore((s) => s.showToast)
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [vendorRatings, setVendorRatings] = useState<VendorRating[]>([])
  const [showPreview, setShowPreview] = useState<'internal' | 'client' | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generatingAi, setGeneratingAi] = useState(false)

  useEffect(() => {
    if (!user) return

    async function load() {
      setLoading(true)

      const [eventRes, phasesRes, guestRes, vendorRes, issuesRes, mediaRes] = await Promise.all([
        supabase.from('events').select('*').eq('id', eventId).single(),
        supabase.from('event_phases').select('*').eq('event_id', eventId).order('phase_number'),
        supabase.from('guests').select('id, checked_in', { count: 'exact' }).eq('event_id', eventId),
        supabase.from('event_vendors').select('id, vendor:vendor_id(name, category)').eq('event_id', eventId),
        supabase.from('issues').select('*').eq('event_id', eventId).order('raised_at'),
        supabase.from('media').select('id, tag', { count: 'exact' }).eq('event_id', eventId),
      ])

      const event = eventRes.data as unknown as Event | null
      const phases = (phasesRes.data || []) as EventPhase[]
      const guests = guestRes.data as unknown as { id: string; checked_in: boolean }[] | null
      const vendors = vendorRes.data as unknown as { id: string; vendor: { name: string; category: string } | null }[] | null
      const issues = (issuesRes.data || []) as Issue[]
      const media = mediaRes.data as unknown as { id: string; tag: string | null }[] | null

      setData({
        event,
        phases,
        guestCount: guests?.length || 0,
        checkedIn: guests?.filter((g) => g.checked_in).length || 0,
        totalBudget: event?.budget_total || 0,
        totalExpense: 0,
        vendorCount: vendors?.length || 0,
        issues,
        issuesResolved: issues.filter((i) => i.resolved_at).length,
        mediaCount: media?.length || 0,
        clientSharedCount: media?.filter((m) => m.tag === 'client_share').length || 0,
      })

      if (vendors) {
        setVendorRatings(
          vendors.map((v) => ({
            id: v.id,
            name: v.vendor?.name || 'Unknown Vendor',
            category: v.vendor?.category || 'Uncategorised',
            rating: 0,
          }))
        )
      }

      setLoading(false)
    }

    load()
  }, [eventId, user])

  const completedPhases = data?.phases.filter((p) => p.status === 'completed').length || 0
  const totalPhases = data?.phases.length || 9

  const handleGenerate = async (type: 'internal' | 'client') => {
    if (!data?.event) return
    setGenerating(true)
    setGeneratingAi(true)

    let narrativeData = data
    try {
      const phases = data.phases.map((p) => ({
        phase_number: p.phase_number,
        phase_name: p.phase_name,
        status: p.status,
      }))
      const issues = data.issues.map((i) => ({
        title: i.title,
        severity: i.severity,
        resolved_at: i.resolved_at,
        lessons_learned: i.lessons_learned,
      }))

      const aiResult = await generateReportNarrative({
        event: {
          name: data.event.name,
          event_type: data.event.event_type,
          event_date: data.event.event_date,
          venue_name: data.event.venue_name,
          status: data.event.status,
        },
        phases,
        guestCount: data.guestCount,
        checkedIn: data.checkedIn,
        totalBudget: data.totalBudget,
        vendorCount: data.vendorCount,
        issues,
        issuesResolved: data.issuesResolved,
        mediaCount: data.mediaCount,
        type,
      })

      narrativeData = { ...data, aiNarrative: aiResult.narrative }
      setData(narrativeData)
    } catch (e) {
      console.warn('[AI] narrative generation failed, continuing without AI:', e)
      showToast({ type: 'warning', title: 'AI Report', body: e instanceof Error ? e.message : 'Could not generate AI narrative. PDF will be generated without it.' })
    }
    setGeneratingAi(false)

    try {
      const plannerName = user?.user_metadata?.display_name || user?.email || ''
      const blob = await pdf(
        <ReportPdfDocument data={narrativeData} vendorRatings={vendorRatings} type={type} plannerName={plannerName} />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
      setShowPreview(type)
    } catch (e) {
      console.error('[PDF] generation error:', e)
      showToast({ type: 'error', title: 'PDF Error', body: e instanceof Error ? e.message : 'Could not generate the report.' })
    }
    setGenerating(false)
  }

  const closePreview = () => {
    if (pdfUrl) { URL.revokeObjectURL(pdfUrl); setPdfUrl(null) }
    setShowPreview(null)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 'var(--space-4)' }}>
        <img src="/EventGrid-favicon.svg" alt="Loading" style={{ width: 48, height: 48, opacity: 0.5 }} />
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading report data...</div>
      </div>
    )
  }

  if (!data?.event) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-xl)' }}>
        <FileText size={24} style={{ marginBottom: 'var(--space-2)', opacity: 0.4 }} />
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Event data not found</div>
      </div>
    )
  }

  return (
    <div>
      <div className={styles.reportGrid}>
        <div className={styles.reportStat}>
          <Users size={20} className={styles.reportStatIcon} />
          <div className={styles.reportStatValue}>{data.checkedIn}/{data.guestCount}</div>
          <div className={styles.reportStatLabel}>Attendance</div>
        </div>
        <div className={styles.reportStat}>
          <CircleDollarSign size={20} className={styles.reportStatIcon} />
          <div className={styles.reportStatValue}>₦{(data.totalBudget / 100).toLocaleString('en-NG')}</div>
          <div className={styles.reportStatLabel}>Budget</div>
        </div>
        <div className={styles.reportStat}>
          <Building size={20} className={styles.reportStatIcon} />
          <div className={styles.reportStatValue}>{data.vendorCount}</div>
          <div className={styles.reportStatLabel}>Vendors</div>
        </div>
        <div className={styles.reportStat}>
          <Star size={20} className={styles.reportStatIcon} />
          <div className={styles.reportStatValue}>{completedPhases}/{totalPhases}</div>
          <div className={styles.reportStatLabel}>Phases Done</div>
        </div>
      </div>

      <div className={styles.reportGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        <div className={styles.reportStat} style={{ padding: 'var(--space-3)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{data.issues.length}</div>
          <div className={styles.reportStatLabel}>Issues</div>
        </div>
        <div className={styles.reportStat} style={{ padding: 'var(--space-3)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{data.issuesResolved}</div>
          <div className={styles.reportStatLabel}>Resolved</div>
        </div>
        <div className={styles.reportStat} style={{ padding: 'var(--space-3)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{data.mediaCount}</div>
          <div className={styles.reportStatLabel}>Photos</div>
        </div>
        <div className={styles.reportStat} style={{ padding: 'var(--space-3)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{data.clientSharedCount}</div>
          <div className={styles.reportStatLabel}>Shared with Client</div>
        </div>
      </div>

      <div className={styles.reportSection}>
        <h4 className={styles.reportSectionTitle}>Vendor Ratings</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {vendorRatings.map((vr) => (
            <div key={vr.id} className={styles.ratingRow}>
              <div className={styles.ratingInfo}>
                <div className={styles.ratingName}>{vr.name}</div>
                <div className={styles.ratingCategory}>{vr.category}</div>
              </div>
              <div className={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className="btn btn-ghost btn-icon"
                    style={{
                      width: 28,
                      height: 28,
                      padding: 0,
                      color: star <= vr.rating ? 'var(--color-accent)' : 'var(--color-border)',
                    }}
                    onClick={() =>
                      setVendorRatings((prev) =>
                        prev.map((r) => (r.id === vr.id ? { ...r, rating: star } : r))
                      )
                    }
                  >
                    <Star size={14} fill={star <= vr.rating ? 'var(--color-accent)' : 'none'} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {vendorRatings.length === 0 && (
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>No vendors for this event.</div>
        )}
      </div>

      <div className={styles.reportSection}>
        <h4 className={styles.reportSectionTitle}>Phase Completion</h4>
        <div className={styles.phaseList}>
          {data.phases.map((phase) => (
            <div key={phase.id} className={styles.phaseItem}>
              <div className={`${styles.phaseDot} ${phase.status === 'completed' ? styles.phaseDotDone : styles.phaseDotPending}`}>
                {phase.status === 'completed' && <span>&#10003;</span>}
              </div>
              <span className={`${styles.phaseLabel} ${phase.status === 'completed' ? styles.phaseLabelDone : styles.phaseLabelPending}`}>
                Phase {phase.phase_number}: {phase.phase_name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.reportActions}>
        <button
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-sm)' }}
            onClick={() => handleGenerate('internal')}
            disabled={showPreview !== null || generating}
          >
            {generatingAi ? <Sparkles size={16} className="spin" /> : <Sparkles size={16} />}
            {generatingAi ? 'Generating AI Report...' : 'Generate Internal Report'}
          </button>
          {role === 'planner' && (
            <button
              className="btn btn-secondary"
              style={{ borderRadius: 'var(--radius-sm)' }}
              onClick={() => handleGenerate('client')}
              disabled={showPreview !== null || generating}
            >
              {generatingAi ? <Sparkles size={16} className="spin" /> : <Sparkles size={16} />}
              {generatingAi ? 'Generating AI Report...' : 'Generate Client Report'}
            </button>
          )}
      </div>

      {showPreview && data?.event && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)',
        }} onClick={closePreview}>
          <div style={{
            background: '#fff', borderRadius: 12, width: '100%', maxWidth: 900,
            height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid #e5e7eb',
            }}>
              <span style={{ fontWeight: 600, color: '#111', fontSize: 14 }}>
                {showPreview === 'internal' ? 'Internal Report' : 'Client Report'} &middot; {data.event.name}
              </span>
              <button
                className="btn btn-ghost btn-icon"
                style={{ width: 32, height: 32, borderRadius: 16 }}
                onClick={closePreview}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ flex: 1 }}>
              {generating ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666', fontSize: 13 }}>
                  Generating PDF...
                </div>
              ) : pdfUrl ? (
                <embed src={pdfUrl} type="application/pdf" style={{ width: '100%', height: '100%' }} />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
