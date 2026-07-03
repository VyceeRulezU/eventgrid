import { useState } from 'react'
import { SEO } from '@/components/shared/SEO'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/pages/landing/Footer'
import { ClipboardList, Check } from 'lucide-react'

const ROLE_OPTIONS = [
  { value: 'planner', label: 'Event Planner' },
  { value: 'coordinator', label: 'Event Coordinator' },
  { value: 'both', label: 'Both' },
  { value: 'other', label: 'Other' },
]

const FEATURE_OPTIONS = [
  'Budget Management',
  'Task Management',
  'Vendor Management',
  'Guest Management',
  'Floor Plan Designer',
  'Client Portal',
  'Team Collaboration',
  'Live Event Feed',
  'Aftermath Reports',
  'Proposals & Quotes',
  'Payment Processing',
  'CRM & Leads',
]

export function SurveyPage() {
  const showToast = useUIStore((s) => s.showToast)
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    respondent_name: '',
    respondent_email: '',
    respondent_role: '',
    open_to_software: false,
    currently_using: false,
    current_software_names: '',
    pay_per_event: '',
    preferred_billing: '',
    important_features: [] as string[],
    wanted_features: '',
    additional_feedback: '',
  })

  const toggleFeature = (feature: string) => {
    setForm((prev) => ({
      ...prev,
      important_features: prev.important_features.includes(feature)
        ? prev.important_features.filter((f) => f !== feature)
        : [...prev.important_features, feature],
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
      pay_per_event: form.pay_per_event || null,
      preferred_billing: form.preferred_billing || null,
      important_features: form.important_features,
      wanted_features: form.wanted_features || null,
      additional_feedback: form.additional_feedback || null,
    })

    setSending(false)

    if (error) {
      showToast({ type: 'error', title: 'Submission failed', body: error.message })
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <>
        <SEO title="Survey Submitted" description="Thank you for completing the survey." />
        <Navbar />
        <div style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-6)',
          background: 'var(--color-bg)',
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: 480,
            padding: 'var(--space-10)',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{
              width: 64, height: 64,
              background: 'var(--color-accent)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Check size={32} color="#fff" />
            </div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 8 }}>Thank You!</h1>
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              Your response has been recorded. We appreciate your time and feedback.
            </p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <SEO title="Survey" description="Help us improve NaliGrid by sharing your event planning needs." />
      <Navbar />
      <div style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        padding: 'var(--space-8) var(--space-4)',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <div style={{
              width: 56, height: 56,
              background: 'var(--color-accent)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <ClipboardList size={28} color="#fff" />
            </div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 8 }}>NaliGrid Survey</h1>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
              Help us understand your event planning needs so we can build the best tools for you.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>About You</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label className="input-label">Name <span style={{ color: 'var(--color-text-muted)' }}>(optional)</span></label>
                  <input
                    className="input"
                    value={form.respondent_name}
                    onChange={(e) => setForm({ ...form, respondent_name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="input-label">Email <span style={{ color: 'var(--color-text-muted)' }}>(optional)</span></label>
                  <input
                    className="input"
                    type="email"
                    value={form.respondent_email}
                    onChange={(e) => setForm({ ...form, respondent_email: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="input-label">What best describes you?</label>
                  <select
                    className="input"
                    value={form.respondent_role}
                    onChange={(e) => setForm({ ...form, respondent_role: e.target.value })}
                  >
                    <option value="">Select your role</option>
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Software Usage</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.open_to_software}
                    onChange={(e) => setForm({ ...form, open_to_software: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: 'var(--color-accent)' }}
                  />
                  <span style={{ fontSize: 'var(--text-sm)' }}>I am open to using event planning software</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.currently_using}
                    onChange={(e) => setForm({ ...form, currently_using: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: 'var(--color-accent)' }}
                  />
                  <span style={{ fontSize: 'var(--text-sm)' }}>I currently use event planning software</span>
                </label>

                {form.currently_using && (
                  <div>
                    <label className="input-label">Which software(s) do you currently use?</label>
                    <input
                      className="input"
                      value={form.current_software_names}
                      onChange={(e) => setForm({ ...form, current_software_names: e.target.value })}
                      placeholder="e.g. HoneyBook, Aisle Planner, etc."
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Pricing Preference</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label className="input-label">Preferred billing model</label>
                  <select
                    className="input"
                    value={form.preferred_billing}
                    onChange={(e) => setForm({ ...form, preferred_billing: e.target.value })}
                  >
                    <option value="">Select billing preference</option>
                    <option value="monthly">Monthly subscription</option>
                    <option value="yearly">Yearly subscription</option>
                    <option value="per_event">Per event</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">How much would you be willing to pay per event? <span style={{ color: 'var(--color-text-muted)' }}>(optional)</span></label>
                  <input
                    className="input"
                    value={form.pay_per_event}
                    onChange={(e) => setForm({ ...form, pay_per_event: e.target.value })}
                    placeholder="e.g. ₦50,000"
                  />
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Features</h2>

              <div>
                <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>
                  Which features are most important to you? <span style={{ color: 'var(--color-text-muted)' }}>(select all that apply)</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {FEATURE_OPTIONS.map((feature) => {
                    const selected = form.important_features.includes(feature)
                    return (
                      <button
                        key={feature}
                        type="button"
                        onClick={() => toggleFeature(feature)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          border: selected ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                          background: selected ? 'var(--color-accent-light)' : 'var(--color-surface)',
                          color: selected ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: selected ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {feature}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ marginTop: 'var(--space-4)' }}>
                <label className="input-label">What other features would you like to see? <span style={{ color: 'var(--color-text-muted)' }}>(optional)</span></label>
                <textarea
                  className="input"
                  rows={3}
                  value={form.wanted_features}
                  onChange={(e) => setForm({ ...form, wanted_features: e.target.value })}
                  placeholder="Tell us what else you'd find useful..."
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Additional Feedback</h2>
              <textarea
                className="input"
                rows={4}
                value={form.additional_feedback}
                onChange={(e) => setForm({ ...form, additional_feedback: e.target.value })}
                placeholder="Any other thoughts or suggestions?"
                style={{ resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending}
              style={{ width: '100%', padding: '14px', fontSize: 'var(--text-base)' }}
            >
              {sending ? 'Submitting...' : 'Submit Survey'}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  )
}
