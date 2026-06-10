import { useEffect, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { FileText, Users, CircleDollarSign, Building, Star, CheckCircle, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { useResolvedEventId } from '@/hooks/useResolvedEventId'
import { PageHero } from '@/components/shared/PageHero'
import { ReportPdfDocument } from './ReportPdfDocument'
import type { Event, EventPhase, Issue } from '@/types'
import type { VendorRating, ReportData } from './EventReportBuilder'
import styles from './Aftermath.module.css'

function formatNaira(kobo: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(kobo / 100)
}

export function CompletedEventReport() {
  const { eventId, paramId, loading: idLoading } = useResolvedEventId()
  const user = useAuthStore((s) => s.user)
  const showToast = useUIStore((s) => s.showToast)
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [vendorRatings, setVendorRatings] = useState<VendorRating[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!user || !eventId) return
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
        setVendorRatings(vendors.map((v) => ({
          id: v.id, name: v.vendor?.name || 'Unknown', category: v.vendor?.category || 'Uncategorised', rating: 0,
        })))
      }
      setLoading(false)
    }
    load()
  }, [eventId, user])

  const completedPhases = data?.phases.filter((p) => p.status === 'completed').length || 0
  const totalPhases = data?.phases.length || 9

  const handleGenerate = async () => {
    if (!data?.event) return
    setGenerating(true)
    try {
      const plannerName = user?.user_metadata?.display_name || user?.email || ''
      const blob = await pdf(
        <ReportPdfDocument data={data} vendorRatings={vendorRatings} type="internal" plannerName={plannerName} />
      ).toBlob()
      setPdfUrl(URL.createObjectURL(blob))
      setShowPreview(true)
    } catch (e) {
      console.error('[PDF] generation error:', e)
      showToast({ type: 'error', title: 'PDF Error', body: e instanceof Error ? e.message : 'Could not generate the report.' })
    }
    setGenerating(false)
  }

  const closePreview = () => {
    if (pdfUrl) { URL.revokeObjectURL(pdfUrl); setPdfUrl(null) }
    setShowPreview(false)
  }

  if (idLoading || loading) {
    return (
      <div className={styles.page}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <img src="/EventGrid-favicon.svg" alt="Loading" style={{ width: 48, height: 48, opacity: 0.5 }} />
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-3)' }}>Loading report...</div>
        </div>
      </div>
    )
  }

  if (!data?.event) {
    return <div className={styles.page}><div className="empty-state"><div className="empty-state__title">Event not found</div></div></div>
  }

  return (
    <div className={styles.page}>
      <PageHero
        icon={CheckCircle}
        title="Event Report"
        subtitle={`${data.event.name} · ${data.event.event_type}`}
        backTo={`/events/${paramId}`}
        actions={
          <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={showPreview}>
            <FileText size={14} /> View Report
          </button>
        }
      />

      <div className={styles.reportGrid}>
        <div className={styles.reportStat}>
          <Users size={20} className={styles.reportStatIcon} />
          <div className={styles.reportStatValue}>{data.checkedIn}/{data.guestCount}</div>
          <div className={styles.reportStatLabel}>Attendance</div>
        </div>
        <div className={styles.reportStat}>
          <CircleDollarSign size={20} className={styles.reportStatIcon} />
          <div className={styles.reportStatValue}>{formatNaira(data.totalBudget)}</div>
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
          <div className={styles.reportStatLabel}>Phases Complete</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div className={styles.reportStat} style={{ padding: 'var(--space-3)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{data.issues.length}</div>
          <div className={styles.reportStatLabel}>Total Issues</div>
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
                Event Report &middot; {data.event.name}
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
