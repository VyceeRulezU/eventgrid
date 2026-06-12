import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import Footer from '@/pages/landing/Footer'
import { Store, Wallet, Clock, CheckCircle } from 'lucide-react'
import styles from './RolesLanding.module.css'

export function VendorsLandingPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="Vendor Marketplace for Events — EventGrid"
        description="Connect with top planners, receive verified bookings, manage milestones, and secure escrow payments on Nigeria's premium event vendor network."
        url="/vendors-landing"
      />
      <Navbar />
      
      <LandingPageHero
        eyebrow="For Vendors"
        title="Scale Your Event Business"
        subtitle="Connect with top planners, receive verified bookings, manage milestones, and secure payments directly on Nigeria's premium event network."
      />

      {/* Metrics Section */}
      <section className={styles.metricsSection} aria-label="Vendor metrics">
        <div className={styles.container}>
          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>5k+</span>
              <span className={styles.metricLbl}>Active planners sourcing vendor services weekly</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>₦0</span>
              <span className={styles.metricLbl}>Subscription fees on basic profile builder listings</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>100%</span>
              <span className={styles.metricLbl}>Escrow guarantee on milestone deposits</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className={styles.featuresSection} aria-label="Vendor features">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Everything You Need to Run Your Business</h2>
          <p className={styles.sectionSubtitle}>
            From initial booking quotes to final payouts, manage all client interactions from a centralized portal.
          </p>

          <div className={styles.cardsGrid}>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Store size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Digital Storefront</h3>
              <p className={styles.cardDesc}>
                Set up a professional profile displaying services, previous event galleries, testimonials, and starting prices.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Clock size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Real-time Schedules</h3>
              <p className={styles.cardDesc}>
                Avoid double-bookings. Sync your availability calendar and automatically get updates on event logistics.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Wallet size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Secured Escrow Payments</h3>
              <p className={styles.cardDesc}>
                Secure contract amounts using payment escrow. Receive direct deposits for mobilization and final payouts promptly.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <CheckCircle size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Verified Reviews</h3>
              <p className={styles.cardDesc}>
                Gain credibility with verified reviews submitted by real planners post-event to highlight your service quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FaqSection
        items={[
          {
            category: 'Vendors',
            items: [
              {
                question: 'Is there a fee to list my services?',
                answer: 'No, basic profile listing is completely free. You only pay a small service fee on completed bookings.'
              },
              {
                question: 'How do I get paid?',
                answer: 'Payments are processed through our secure escrow system. Clients deposit funds, and payouts are released upon milestone completion.'
              }
            ]
          }
        ]}
        header="Frequently Asked Questions"
        summary="Common questions about selling on EventGrid."
      />

      <LandingCTA
        title="Ready to showcase your services?"
        description="Join Nigeria's leading directory of verified event vendors and secure more bookings today."
        primaryText="Join the Network"
      />

      <Footer />
    </div>
  )
}
