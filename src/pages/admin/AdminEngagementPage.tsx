import { useState } from 'react'
import { ClipboardList, Gift, Mail, ListChecks } from 'lucide-react'
import { AdminPageHero } from '@/components/shared/AdminPageHero'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import { AdminSurveyResponsesPage } from './AdminSurveyResponsesPage'
import { AdminReferralsPage } from './AdminReferralsPage'
import { AdminEmailMarketingPage } from './AdminEmailMarketingPage'

const tabs: TabItem<string>[] = [
  { key: 'email', label: 'Email Marketing', icon: <Mail size={16} /> },
  { key: 'referrals', label: 'Referrals', icon: <Gift size={16} /> },
  { key: 'commissions', label: 'Commissions', icon: <ListChecks size={16} /> },
  { key: 'surveys', label: 'Survey Responses', icon: <ClipboardList size={16} /> },
]

export function AdminEngagementPage() {
  const [activeTab, setActiveTab] = useState('email')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <AdminPageHero
        icon={Mail}
        title="Engagement"
        subtitle="Survey responses, referrals, commission payouts, and email marketing"
        backTo="/admin"
      />

      <div style={{ padding: '0 var(--space-6)', borderBottom: '1px solid var(--color-border-subtle)' }}>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {activeTab === 'surveys' && <AdminSurveyResponsesPage embedded />}
        {activeTab === 'commissions' && <AdminReferralsPage embedded activeSubTab="commissions" />}
        {activeTab === 'referrals' && <AdminReferralsPage embedded activeSubTab="codes" />}
        {activeTab === 'email' && <AdminEmailMarketingPage />}
      </div>
    </div>
  )
}
