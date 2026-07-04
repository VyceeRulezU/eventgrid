import { useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { WelcomeEmail } from '@/lib/emails/WelcomeEmail'
import { QuickStartEmail } from '@/lib/emails/QuickStartEmail'
import { TrialReminderEmail } from '@/lib/emails/TrialReminderEmail'
import { FeedbackEmail } from '@/lib/emails/FeedbackEmail'
import { PaymentEmail } from '@/lib/emails/PaymentEmail'
import { LinkNotificationEmail } from '@/lib/emails/LinkNotificationEmail'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SEO } from '@/components/shared/SEO'
import styles from './EmailPreview.module.css'

const APP_URL = import.meta.env.VITE_APP_URL || 'https://naligrid.com'

const templates = [
  { name: 'Welcome Email', id: 'welcome', render: () => <WelcomeEmail first_name="Adebayo" dashboard_url={`${APP_URL}/login`} create_event_url={`${APP_URL}/events/new`} role="planner" /> },
  { name: 'Quick Start', id: 'quick-start', render: () => <QuickStartEmail first_name="Adebayo" create_event_url={`${APP_URL}/events/new`} /> },
  { name: 'Trial Reminder', id: 'trial-reminder', render: () => <TrialReminderEmail first_name="Adebayo" financials_url={`${APP_URL}/financials`} /> },
  { name: 'Feedback', id: 'feedback', render: () => <FeedbackEmail first_name="Adebayo" feedback_url={`${APP_URL}/settings`} /> },
  { name: 'Payment Confirmed', id: 'payment', render: () => <PaymentEmail first_name="Adebayo" event_name="Wedding of Zainab & Tunde" amount="₦20,000" payment_method="Paystack" portal_url={`${APP_URL}/login`} /> },
  { name: 'Google Linked', id: 'google-linked', render: () => <LinkNotificationEmail first_name="Adebayo" provider="google" action="linked" settings_url={`${APP_URL}/settings`} /> },
  { name: 'Google Unlinked', id: 'google-unlinked', render: () => <LinkNotificationEmail first_name="Adebayo" provider="google" action="unlinked" settings_url={`${APP_URL}/settings`} /> },
  { name: 'Facebook Linked', id: 'facebook-linked', render: () => <LinkNotificationEmail first_name="Adebayo" provider="facebook" action="linked" settings_url={`${APP_URL}/settings`} /> },
  { name: 'Facebook Unlinked', id: 'facebook-unlinked', render: () => <LinkNotificationEmail first_name="Adebayo" provider="facebook" action="unlinked" settings_url={`${APP_URL}/settings`} /> },
]

export function EmailPreviewPage() {
  const [active, setActive] = useState(templates[0].id)

  const current = templates.find((t) => t.id === active)
  const html = current ? '<!DOCTYPE html>' + renderToStaticMarkup(current.render()) : ''

  return (
    <div className={styles.page}>
      <SEO title="Email Preview" description="Preview email templates" noindex />
      <div className={styles.header}>
        <Link to="/admin" className={styles.back}><ArrowLeft size={16} /> Back to Admin</Link>
        <h1>Email Previews</h1>
        <p className={styles.subtitle}>Select a template below to preview how it renders.</p>
      </div>
      <div className={styles.layout}>
        <nav className={styles.sidebar}>
          {templates.map((t) => (
            <button
              key={t.id}
              className={`${styles.navBtn} ${active === t.id ? styles.navBtnActive : ''}`}
              onClick={() => setActive(t.id)}
            >
              {t.name}
            </button>
          ))}
        </nav>
        <div className={styles.preview}>
          {html ? (
            <iframe className={styles.iframe} srcDoc={html} title={current!.name} sandbox="" />
          ) : (
            <div className={styles.empty}>Select a template</div>
          )}
        </div>
      </div>
    </div>
  )
}
