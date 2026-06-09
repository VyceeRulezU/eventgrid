import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import Footer from '@/pages/landing/Footer'
import { Mail, Phone, MapPin } from 'lucide-react'
import styles from './ContactPage.module.css'

export function ContactPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Thank you! Your inquiry has been submitted successfully.')
  }

  return (
    <div className={styles.pageWrapper}>
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
                  <input type="text" id="name" required className={styles.input} placeholder="e.g. Tunde Johnson" />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>Email Address</label>
                  <input type="email" id="email" required className={styles.input} placeholder="e.g. tunde@example.com" />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="message" className={styles.label}>Message</label>
                  <textarea id="message" required rows={5} className={styles.textarea} placeholder="How can we help your event day coordination?"></textarea>
                </div>
                <button type="submit" className={styles.submitBtn} id="contact-submit-btn">Send Message</button>
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
                  <a href="mailto:hello@eventgrid.ng" className={styles.infoLink}>hello@eventgrid.ng</a>
                </div>
              </div>

              <div className={styles.detailBlock}>
                <h3 className={styles.detailsTitle}>Call Center Support</h3>
                <p className={styles.detailsDesc}>
                  For urgent event setup or payment assistance on weekends.
                </p>
                <div className={styles.infoRow}>
                  <Phone size={16} className={styles.infoIcon} />
                  <a href="tel:+2348001234567" className={styles.infoLink}>+234 (800) 123-4567</a>
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
