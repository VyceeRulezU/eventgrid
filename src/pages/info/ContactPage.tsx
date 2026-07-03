import { useState } from 'react'
import { SEO } from '@/components/shared/SEO'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { checkRateLimit } from '@/lib/rateLimit'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import Footer from '@/pages/landing/Footer'
import { Mail, Phone, MapPin } from 'lucide-react'
import styles from './ContactPage.module.css'

export function ContactPage() {
  const [sending, setSending] = useState(false)
  const showToast = useUIStore((s) => s.showToast)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (sending) return
    if (!checkRateLimit('contact-form', 3, 60000)) {
      showToast({ type: 'error', title: 'Too many requests', body: 'Please wait a moment before trying again.' })
      return
    }
    setSending(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const message = formData.get('message') as string

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact`

      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, message })
      })

      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || `Error ${res.status}`)
      }

      showToast({ type: 'success', title: 'Message sent!', body: 'We\'ll get back to you within 12–24 business hours.' })
      form.reset()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      showToast({ type: 'error', title: 'Failed to send', body: msg })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="Contact NaliGrid — Get in Touch"
        description="Have questions about onboarding, vendor listing verifications, pricing, or API customizations? Contact the NaliGrid team."
        url="/contact"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Contact' },
        ]}
      />
      <Navbar />
      
      <LandingPageHero
        eyebrow="Contact Us"
        title="Get in Touch with Our Team"
        subtitle="Have questions about onboarding, vendor listing verifications, pricing models, or api customizations? We are here to support you."
      />

      {/* Form and details Section */}
      <section className={styles.contactSection} aria-label="Contact form and info">
        <div className={styles.container}>
          <div className={styles.contactLayout}>
            {/* Left side Form */}
            <div className={styles.formCard}>
              <h2 className={styles.cardTitle}>Send Us a Message</h2>
              <form onSubmit={handleSubmit} className={styles.contactForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.label}>Full Name</label>
                  <input type="text" id="name" name="name" required className={styles.input} placeholder="e.g. Tunde Johnson" />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>Email Address</label>
                  <input type="email" id="email" name="email" required className={styles.input} placeholder="e.g. tunde@example.com" />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="message" className={styles.label}>Message</label>
                  <textarea id="message" name="message" required rows={5} className={styles.textarea} placeholder="How can we help your event day coordination?"></textarea>
                </div>
                <button type="submit" disabled={sending} className={styles.submitBtn} id="contact-submit-btn">
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

            {/* Right side Details */}
            <div className={styles.detailsPane}>
              <div className={styles.detailBlock}>
                <h3 className={styles.detailsTitle}>General Inquiries</h3>
                <p className={styles.detailsDesc}>
                  We'll respond to your email within 12–24 business hours.
                </p>
                <div className={styles.infoRow}>
                  <Mail size={16} className={styles.infoIcon} />
                  <a href="mailto:hello@naligrid.com" className={styles.infoLink}>hello@naligrid.com</a>
                </div>
              </div>

              <div className={styles.detailBlock}>
                <h3 className={styles.detailsTitle}>Call Center Support</h3>
                <p className={styles.detailsDesc}>
                  For urgent event setup or payment assistance on weekends.
                </p>
                <div className={styles.infoRow}>
                  <Phone size={16} className={styles.infoIcon} />
                  <a href="tel:+2348176964239" className={styles.infoLink}>+234 817 696 4239</a>
                </div>
              </div>

              <div className={styles.detailBlock}>
                <h3 className={styles.detailsTitle}>HQ Address</h3>
                <div className={styles.infoRow}>
                  <MapPin size={18} className={styles.infoIcon} style={{ flexShrink: 0 }} />
                  <span className={styles.infoText}>
                    12, Wuse II District,<br />
                    Abuja, FCT, Nigeria 🇳🇬
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
