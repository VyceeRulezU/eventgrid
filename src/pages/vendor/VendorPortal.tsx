import { MyFeedback } from '@/components/shared/MyFeedback'

export function VendorPortal() {
  return (
    <div className="empty-state">
      <div className="empty-state__title">Vendor Portal</div>
      <div className="empty-state__description">
        You'll see your assigned events and deliverables here
      </div>
      <div style={{ marginTop: 'var(--space-6)', width: '100%', maxWidth: 600 }}>
        <MyFeedback />
      </div>
    </div>
  )
}
