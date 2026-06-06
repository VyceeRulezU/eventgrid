import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Image, MessageSquare, FileText } from 'lucide-react'
import { MediaLibrary } from './MediaLibrary'
import { IssueLogReview } from './IssueLogReview'
import { EventReportBuilder } from './EventReportBuilder'
import { useResolvedEventId } from '@/hooks/useResolvedEventId'
import styles from './Aftermath.module.css'

type Tab = 'media' | 'issues' | 'report'

const TABS: { key: Tab; label: string; icon: typeof Image }[] = [
  { key: 'media', label: 'Media', icon: Image },
  { key: 'issues', label: 'Issues', icon: MessageSquare },
  { key: 'report', label: 'Report', icon: FileText },
]

export function AftermathPage() {
  const { eventId, paramId, loading } = useResolvedEventId()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('media')

  if (loading) {
    return <div className="empty-state"><div className="empty-state__title">Loading...</div></div>
  }

  if (!eventId) {
    return <div className="empty-state"><div className="empty-state__title">Event not found</div></div>
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className="btn btn-ghost btn-icon" style={{ borderRadius: 'var(--radius-sm)' }} onClick={() => navigate(`/events/${paramId}`)}>
          <ArrowLeft size={20} />
        </button>
        <h2 className={styles.headerTitle}>Aftermath & Reports</h2>
      </div>

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

      {activeTab === 'media' && <MediaLibrary eventId={eventId} />}
      {activeTab === 'issues' && <IssueLogReview eventId={eventId} />}
      {activeTab === 'report' && <EventReportBuilder eventId={eventId} />}
    </div>
  )
}
