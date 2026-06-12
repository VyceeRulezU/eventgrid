import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import Footer from '@/pages/landing/Footer'
import { Landmark, Compass, Eye, ShieldAlert } from 'lucide-react'
import styles from './FeaturesLanding.module.css'

export function ClientPortalLandingPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="Interactive Client Portal — EventGrid"
        description="Offer clients a premium read-only dashboard with real-time RSVP numbers, budget breakdowns, and timeline updates — no more email chains."
        url="/features/client-portal"
      />
      <Navbar />
      
      <LandingPageHero
        eyebrow="Feature Showcase"
        title="Interactive Client Portal"
        subtitle="Offer your clients a premium, read-only dashboard. Share RSVP numbers, budget breakdowns, and timeline updates in real-time."
      />

      {/* Metrics Section */}
      <section className={styles.metricsSection} aria-label="Client Portal metrics">
        <div className={styles.container}>
          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>100%</span>
              <span className={styles.metricLbl}>Progress transparency on phase milestones and checklists</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>1-Click</span>
              <span className={styles.metricLbl}>Secure access invitation using temporary magic links</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>0</span>
              <span className={styles.metricLbl}>Email chains or missed updates regarding event budgets</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className={styles.featuresSection} aria-label="Client Portal features">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>A Unified Dashboard for Your Clients</h2>
          <p className={styles.sectionSubtitle}>
            Give clients the peace of mind they deserve. Share live details without granting editing access to core settings.
          </p>

          <div className={styles.cardsGrid}>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Landmark size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Live Budget Breakdown</h3>
              <p className={styles.cardDesc}>
                Clients view budget category charts, payments made to vendors, and upcoming installment deadlines.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Compass size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>RSVP & Guest Tracker</h3>
              <p className={styles.cardDesc}>
                Let clients monitor live RSVP responses, dietary preferences, and VIP table seating parameters directly.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Eye size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Timeline Tracking</h3>
              <p className={styles.cardDesc}>
                Keep clients informed. Share active planning phases, completed items, and high-level milestones easily.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <ShieldAlert size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Escrow Payment Approvals</h3>
              <p className={styles.cardDesc}>
                Clients can authorize vendor deposits, unlock milestone payments, and track final balances safely.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FaqSection
        items={[
          {
            category: 'Client Portal',
            items: [
              {
                question: 'Is the client portal secure?',
                answer: 'Yes, portals are read-only and accessed via secure magic links. Clients cannot modify any event data.'
              },
              {
                question: 'Can I customize what clients see?',
                answer: 'Yes, you control which sections — budget, timeline, guest tracking — are visible to each client.'
              }
            ]
          }
        ]}
        header="Frequently Asked Questions"
        summary="Common questions about the Client Portal."
      />

      <LandingCTA
        title="Ready to delight your clients?"
        description="Generate secure portals, share progress, and provide a premium event planning experience."
        primaryText="Share a Portal Link"
      />

      <Footer />
    </div>
  )
}
