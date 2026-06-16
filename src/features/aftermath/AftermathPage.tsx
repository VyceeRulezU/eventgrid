import { useState, useEffect } from 'react'
import { Image, MessageSquare, FileText, LayoutDashboard, Users, Building, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHero } from '@/components/shared/PageHero'
import { MediaLibrary } from './MediaLibrary'
import { IssueLogReview } from './IssueLogReview'
import { EventReportBuilder } from './EventReportBuilder'
import { ReviewsList } from '@/features/reviews/ReviewsList'
import { useResolvedEventId } from '@/hooks/useResolvedEventId'
import { useAuthStore } from '@/store/auth.store'
import { supabase } from '@/lib/supabase'
import styles from './Aftermath.module.css'

type Tab = 'summary' | 'media' | 'issues' | 'report' | 'reviews'

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'summary', label: 'Summary', icon: LayoutDashboard },
  { key: 'media', label: 'Media', icon: Image },
  { key: 'issues', label: 'Issues', icon: MessageSquare },
  { key: 'report', label: 'Report', icon: FileText },
  { key: 'reviews', label: 'Reviews', icon: Star },
]

export function AftermathPage() {
  const { eventId, paramId, loading: idLoading } = useResolvedEventId()
  const user = useAuthStore((s) => s.user)
  const [eventName, setEventName] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const [summary, setSummary] = useState({ guestCount: 0, checkedIn: 0, vendorCount: 0, issueCount: 0, mediaCount: 0, completedPhases: 0, totalPhases: 9 })

  useEffect(() => {
    if (!eventId) return
    supabase.from('events').select('name').eq('id', eventId).single().then(({ data }) => { if (data) setEventName(data.name) })
    Promise.all([
      supabase.from('guests').select('id, checked_in', { count: 'exact' }).eq('event_id', eventId),
      supabase.from('event_vendors').select('id', { count: 'exact', head: true }).eq('event_id', eventId),
      supabase.from('issues').select('id', { count: 'exact', head: true }).eq('event_id', eventId),
      supabase.from('media').select('id', { count: 'exact', head: true }).eq('event_id', eventId),
      supabase.from('event_phases').select('status').eq('event_id', eventId),
    ]).then(([guestsRes, vendorsRes, issuesRes, mediaRes, phasesRes]) => {
      const guests = guestsRes.data as unknown as { id: string; checked_in: boolean }[] | null
      const phases = phasesRes.data as unknown as { status: string }[] | null
      setSummary({
        guestCount: guests?.length || 0,
        checkedIn: guests?.filter(g => g.checked_in).length || 0,
        vendorCount: vendorsRes.count || 0,
        issueCount: issuesRes.count || 0,
        mediaCount: mediaRes.count || 0,
        completedPhases: phases?.filter(p => p.status === 'completed').length || 0,
        totalPhases: phases?.length || 9,
      })
    })
  }, [eventId])

  if (idLoading) {
    return <div className="empty-state"><div className="empty-state__title">Loading...</div></div>
  }

  if (!eventId) {
    return <div className="empty-state"><div className="empty-state__title">Event not found</div></div>
  }

  return (
    <div className={styles.page}>
      <PageHero
        icon={FileText}
        title={`Aftermath & Reports${eventName ? ` | ${eventName}` : ''}`}
        backTo={`/events/${paramId}`}
        actions={
          <Link to={`/events/${paramId}/report`} className="btn btn-primary btn-sm">
            <FileText size={14} /> View Full Report
          </Link>
        }
      />

      <div className={styles.tabBar}>
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'summary' && (
        <div>
          <div className={styles.reportGrid}>
            <div className={styles.reportStat}>
              <Users size={20} className={styles.reportStatIcon} />
              <div className={styles.reportStatValue}>{summary.checkedIn}/{summary.guestCount}</div>
              <div className={styles.reportStatLabel}>Attendance</div>
            </div>
            <div className={styles.reportStat}>
              <Building size={20} className={styles.reportStatIcon} />
              <div className={styles.reportStatValue}>{summary.vendorCount}</div>
              <div className={styles.reportStatLabel}>Vendors</div>
            </div>
            <div className={styles.reportStat}>
              <MessageSquare size={20} className={styles.reportStatIcon} />
              <div className={styles.reportStatValue}>{summary.issueCount}</div>
              <div className={styles.reportStatLabel}>Issues</div>
            </div>
            <div className={styles.reportStat}>
              <Star size={20} className={styles.reportStatIcon} />
              <div className={styles.reportStatValue}>{summary.completedPhases}/{summary.totalPhases}</div>
              <div className={styles.reportStatLabel}>Phases</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginTop: 'var(--space-4)' }}>
            {[
              { tab: 'media' as Tab, label: 'Media Gallery', icon: Image, count: summary.mediaCount },
              { tab: 'issues' as Tab, label: 'Issue Log', icon: MessageSquare, count: summary.issueCount },
              { tab: 'report' as Tab, label: 'Full Report', icon: FileText, count: null },
            ].map(item => (
              <button
                key={item.tab}
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveTab(item.tab)}
                style={{ borderRadius: 'var(--radius-sm)' }}
              >
                <item.icon size={14} />
                {item.label}{item.count !== null ? ` (${item.count})` : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'media' && <MediaLibrary eventId={eventId} />}
      {activeTab === 'issues' && <IssueLogReview eventId={eventId} />}
      {activeTab === 'report' && <EventReportBuilder eventId={eventId} />}
      {activeTab === 'reviews' && <ReviewsList userId={user?.id || ''} eventId={eventId} />}
    </div>
  )
}
