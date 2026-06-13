import { useState } from 'react'
import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import Footer from '@/pages/landing/Footer'
import { supabase } from '@/lib/supabase'
import { LayoutGrid, CheckCircle2, Sparkles, Send, Loader2 } from 'lucide-react'
import { DropdownMenu, type DropdownItem } from '@/components/ui/DropdownMenu'
import styles from './SurveyPage.module.css'

const roleItems: DropdownItem[] = [
  { label: 'Event Planner', value: 'planner' },
  { label: 'Event Coordinator', value: 'coordinator' },
  { label: 'Both Planner & Coordinator', value: 'both' },
  { label: 'Other', value: 'other' },
]

const billingItems: DropdownItem[] = [
  { label: 'Per event', value: 'per_event' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Yearly', value: 'yearly' },
]

const CURRENT_FEATURES = [
  'Event Pipeline & Timeline Management',
  'Task Management with Team Collaboration',
  'Vendor Sourcing & Booking',
  'Financial Management (Budget, P&L, Petty Cash)',
  'Guest Management & RSVP',
  'Live Board (Real-time Event Coordination)',
  'Media Gallery & Sharing',
  'Post-Event Aftermath Reports',
  'Client Portal (Share progress with clients)',
  'Team Notifications & Alerts',
]

export function SurveyPage() {
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)

  const [form, setForm] = useState({
    respondent_name: '',
    respondent_email: '',
    respondent_role: '',
    open_to_software: false,
    currently_using: false,
    current_software_names: '',
    preferred_billing: '',
    pay_per_event: '',
    monthly_amount: '',
    quarterly_amount: '',
    yearly_amount: '',
    important_features: [] as string[],
    wanted_features: '',
    additional_feedback: '',
  })

  const toggleFeature = (f: string) => {
    setForm((prev) => ({
      ...prev,
      important_features: prev.important_features.includes(f)
        ? prev.important_features.filter((x) => x !== f)
        : [...prev.important_features, f],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    const { error } = await supabase.from('survey_responses').insert({
      respondent_name: form.respondent_name || null,
      respondent_email: form.respondent_email || null,
      respondent_role: form.respondent_role || null,
      open_to_software: form.open_to_software,
      currently_using: form.currently_using,
      current_software_names: form.current_software_names || null,
      preferred_billing: form.preferred_billing || null,
      pay_per_event: form.pay_per_event || null,
      monthly_amount: form.monthly_amount || null,
      quarterly_amount: form.quarterly_amount || null,
      yearly_amount: form.yearly_amount || null,
      important_features: form.important_features,
      wanted_features: form.wanted_features || null,
      additional_feedback: form.additional_feedback || null,
    })
    setSending(false)
    if (error) {
      alert(`Something went wrong: ${error.message}`)
      return
    }
    setSubmitted(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (submitted) {
    return (
      <div className={styles.pageWrapper}>
        <SEO title="Thank You — EventGrid Survey" />
        <Navbar />
        <LandingPageHero
          eyebrow="Survey"
          title="Thank You!"
          subtitle="Your response has been recorded. We appreciate your time and feedback — it helps us build a better platform for event professionals."
        />
        <div className={styles.thankYou}>
          <div className={styles.thankYouCard}>
            <div className={styles.thankYouIcon}><Sparkles size={32} /></div>
            <h2 className={styles.thankYouTitle}>Thank You!</h2>
            <p className={styles.thankYouDesc}>
              Your response has been recorded. We appreciate your time and feedback — it helps us build a better platform for event professionals.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="EventGrid Survey — Help Shape the Future of Event Management"
        description="Take our 3-minute survey and help us build the best event management platform for planners and coordinators in Nigeria."
        url="/survey"
      />
      <Navbar />

      <LandingPageHero
        eyebrow="Survey"
        title="Help Shape EventGrid"
        subtitle="EventGrid is a comprehensive event management platform built for Nigerian event planners and coordinators. We handle everything from pipeline tracking and vendor management to guest RSVPs and post-event reports. This short survey helps us understand what matters most to you so we can build the right product at the right price."
      />

      <div className={styles.pageContainer}>
        <form onSubmit={handleSubmit} className={styles.surveyForm}>
          {/* ── Adoption ── */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Adoption</h2>

            <div className={styles.field}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={form.open_to_software}
                  onChange={(e) => setForm((p) => ({ ...p, open_to_software: e.target.checked }))}
                />
                I am open to using an event planning software for a seamless operation
              </label>
            </div>

            <div className={styles.field}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={form.currently_using}
                  onChange={(e) => setForm((p) => ({ ...p, currently_using: e.target.checked }))}
                />
                I am currently using an event planning software
              </label>
            </div>

            {form.currently_using && (
              <div className={styles.field}>
                <label className={styles.label}>What software(s) are you currently using?</label>
                <input
                  type="text"
                  className={styles.input}
                  value={form.current_software_names}
                  onChange={(e) => setForm((p) => ({ ...p, current_software_names: e.target.value }))}
                  placeholder="e.g. Trello, Asana, Google Sheets"
                />
              </div>
            )}
          </div>

          {/* ── About You ── */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>About You</h2>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Name <span className={styles.optional}>(optional)</span></label>
                <input
                  type="text"
                  className={styles.input}
                  value={form.respondent_name}
                  onChange={(e) => setForm((p) => ({ ...p, respondent_name: e.target.value }))}
                  placeholder="Your name"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email <span className={styles.optional}>(optional)</span></label>
                <input
                  type="email"
                  className={styles.input}
                  value={form.respondent_email}
                  onChange={(e) => setForm((p) => ({ ...p, respondent_email: e.target.value }))}
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>You are a...</label>
              <DropdownMenu
                trigger={<span>{form.respondent_role ? roleItems.find(i => i.value === form.respondent_role)?.label : 'Select your role'}</span>}
                items={roleItems}
                onSelect={(item) => setForm((p) => ({ ...p, respondent_role: item.value }))}
              />
            </div>
          </div>

          {/* ── Pricing ── */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Pricing</h2>

            <div className={styles.field}>
              <label className={styles.label}>Would you rather pay for the service per event, monthly, quarterly or yearly?</label>
              <DropdownMenu
                trigger={<span>{form.preferred_billing ? billingItems.find(i => i.value === form.preferred_billing)?.label : 'Select billing preference'}</span>}
                items={billingItems}
                onSelect={(item) => setForm((p) => ({ ...p, preferred_billing: item.value }))}
              />
            </div>

            {form.preferred_billing === 'per_event' && (
              <div className={styles.field}>
                <label className={styles.label}>How much would you be willing to pay <strong>per event</strong>?</label>
                <input
                  type="text"
                  className={styles.input}
                  value={form.pay_per_event}
                  onChange={(e) => setForm((p) => ({ ...p, pay_per_event: e.target.value }))}
                  placeholder="e.g. ₦15,000"
                />
              </div>
            )}

            {form.preferred_billing === 'monthly' && (
              <div className={styles.field}>
                <label className={styles.label}>How much would you be willing to pay <strong>monthly</strong>?</label>
                <input
                  type="text"
                  className={styles.input}
                  value={form.monthly_amount}
                  onChange={(e) => setForm((p) => ({ ...p, monthly_amount: e.target.value }))}
                  placeholder="e.g. ₦10,000"
                />
              </div>
            )}

            {form.preferred_billing === 'quarterly' && (
              <div className={styles.field}>
                <label className={styles.label}>How much would you be willing to pay <strong>quarterly</strong>?</label>
                <input
                  type="text"
                  className={styles.input}
                  value={form.quarterly_amount}
                  onChange={(e) => setForm((p) => ({ ...p, quarterly_amount: e.target.value }))}
                  placeholder="e.g. ₦25,000"
                />
              </div>
            )}

            {form.preferred_billing === 'yearly' && (
              <div className={styles.field}>
                <label className={styles.label}>How much would you be willing to pay <strong>yearly</strong>?</label>
                <input
                  type="text"
                  className={styles.input}
                  value={form.yearly_amount}
                  onChange={(e) => setForm((p) => ({ ...p, yearly_amount: e.target.value }))}
                  placeholder="e.g. ₦100,000"
                />
              </div>
            )}
          </div>

          {/* ── Features ── */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Features</h2>

            <div className={styles.field}>
              <label className={styles.label}>
                Which features are most important to you? <span className={styles.optional}>(select all that apply)</span>
              </label>
              <div className={styles.featureGrid}>
                {CURRENT_FEATURES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`${styles.featureChip} ${form.important_features.includes(f) ? styles.featureChipActive : ''}`}
                    onClick={() => toggleFeature(f)}
                  >
                    {form.important_features.includes(f) ? <CheckCircle2 size={14} /> : <LayoutGrid size={14} />}
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>What features would you like added?</label>
              <textarea
                className={styles.textarea}
                rows={3}
                value={form.wanted_features}
                onChange={(e) => setForm((p) => ({ ...p, wanted_features: e.target.value }))}
                placeholder="Tell us what's missing or what would make your work easier..."
              />
            </div>
          </div>

          {/* ── Additional Feedback ── */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Anything Else?</h2>
            <div className={styles.field}>
              <textarea
                className={styles.textarea}
                rows={4}
                value={form.additional_feedback}
                onChange={(e) => setForm((p) => ({ ...p, additional_feedback: e.target.value }))}
                placeholder="Pricing thoughts, feature requests, comparisons to other tools, anything at all..."
              />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={sending}>
            {sending ? (
              <><Loader2 size={16} className="spin" /> Submitting...</>
            ) : (
              <><Send size={16} /> Submit Survey</>
            )}
          </button>
        </form>
      </div>

      <Footer />
    </div>
  )
}
