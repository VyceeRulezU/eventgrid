import { useState } from 'react'
import { Image, MessageSquare, FileText } from 'lucide-react'
import { PageHero } from '@/components/shared/PageHero'
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
  const [activeTab, setActiveTab] = useState<Tab>('media')

  if (loading) {
    return <div className="empty-state"><div className="empty-state__title">Loading...</div></div>
  }

  if (!eventId) {
    return <div className="empty-state"><div className="empty-state__title">Event not found</div></div>
  }

  return (
    <div className={styles.page}>
      <PageHero
        icon={FileText}
        title="Aftermath & Reports"
        backTo={`/events/${paramId}`}
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

      {activeTab === 'media' && <MediaLibrary eventId={eventId} />}
      {activeTab === 'issues' && <IssueLogReview eventId={eventId} />}
      {activeTab === 'report' && <EventReportBuilder eventId={eventId} />}
    </div>
  )
}
