import { useAuthStore } from '@/store/auth.store'
import { MessageSquare } from 'lucide-react'
import { PageHero } from '@/components/shared/PageHero'
import { FeedbackChat } from '@/components/shared/FeedbackChat'

export function FeedbackManagementPage() {
  const role = useAuthStore((s) => s.role)

  if (role !== 'super_admin') return null

  return (
    <div>
      <PageHero
        icon={MessageSquare}
        title="Feedback"
        subtitle="User submissions and inquiries"
        backTo="/admin"
      />

      <FeedbackChat mode="admin" />
    </div>
  )
}
