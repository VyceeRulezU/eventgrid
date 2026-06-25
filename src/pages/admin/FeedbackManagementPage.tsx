import { useAuthStore } from '@/store/auth.store'
import { MessageSquare } from 'lucide-react'
import { AdminPageHero } from '@/components/shared/AdminPageHero'
import { FeedbackChat } from '@/components/shared/FeedbackChat'

export function FeedbackManagementPage() {
  const role = useAuthStore((s) => s.role)

  if (role !== 'super_admin' && role !== 'admin_monitor' && role !== 'admin_support') return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <AdminPageHero
        icon={MessageSquare}
        title="Feedback"
        subtitle="User submissions and inquiries"
        backTo="/admin"
      />

      <FeedbackChat mode="admin" />
    </div>
  )
}
