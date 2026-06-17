import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import Footer from '@/pages/landing/Footer'
import { Sparkles } from 'lucide-react'
import styles from './PricingPage.module.css'

export function PricingPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="Pricing — NaliGrid Plans"
        description="Predictable event management pricing. Register today to lock in 50% early access when plans launch in Q3 2026."
        url="/pricing"
      />
      <Navbar />
      
      <LandingPageHero
        eyebrow="Pricing Plans"
        title="Predictable, Operational Value"
        subtitle="Manage your events with clear budgets. Select a plan configured perfectly for your planning business."
      />

      {/* Pricing Spotlight Section */}
      <section className={styles.pricingSection} aria-label="Subscription tiers">
        <div className={styles.container}>
          
          <div className={styles.comingSoonSpotlight}>
            <div className={styles.spotlightContent}>
              <div className={styles.badgeWrap}>
                <Sparkles size={14} className={styles.badgeIcon} />
                <span className={styles.badgeText}>LAUNCHING SOON</span>
              </div>
              <h2 className={styles.spotlightTitle}>Pricing Plans Coming Q3 2026</h2>
              <p className={styles.spotlightDesc}>
                We are currently polishing our automated payment gateways and fintech escrow compliance models. Register your account today to **lock in 3 months of early access at 50% off** once tiers launch!
              </p>
            </div>
          </div>

          <div className={styles.plansPreviewGrid}>
            <div className={styles.planCard}>
              <h3 className={styles.planName}>Standard</h3>
              <div className={styles.priceRow}>
                <span className={styles.currency}>₦</span>
                <span className={styles.price}>--</span>
                <span className={styles.period}>/month</span>
              </div>
              <ul className={styles.featureList}>
                <li>Up to 2 active events</li>
                <li>3 coordinators per event</li>
                <li>Standard checklists sync</li>
                <li>Email support desk</li>
              </ul>
            </div>

            <div className={`${styles.planCard} ${styles.planCardFeatured}`}>
              <div className={styles.featuredLabel}>POPULAR</div>
              <h3 className={styles.planName}>Pro Planner</h3>
              <div className={styles.priceRow}>
                <span className={styles.currency}>₦</span>
                <span className={styles.price}>--</span>
                <span className={styles.period}>/month</span>
              </div>
              <ul className={styles.featureList}>
                <li>Unlimited active events</li>
                <li>Unlimited coordinators</li>
                <li>Live Board Activity Stream</li>
                <li>Aftermath Report PDF Export</li>
                <li>Priority support & APIs</li>
              </ul>
            </div>

            <div className={styles.planCard}>
              <h3 className={styles.planName}>Agency</h3>
              <div className={styles.priceRow}>
                <span className={styles.currency}>₦</span>
                <span className={styles.price}>--</span>
                <span className={styles.period}>/month</span>
              </div>
              <ul className={styles.featureList}>
                <li>Multi-workspace access</li>
                <li>Custom organization subdomains</li>
                <li>Advanced vendor escrows</li>
                <li>24/7 dedicated support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <FaqSection
        items={[
          {
            category: 'Pricing',
            items: [
              {
                question: 'When will pricing plans launch?',
                answer: 'Our pricing tiers are scheduled to launch in Q3 2026. Early adopters can lock in 50% off for the first 3 months.'
              },
              {
                question: 'Is there a free plan?',
                answer: 'Yes, you can register a free draft account today with no credit card required to explore the workspace.'
              }
            ]
          }
        ]}
        header="Frequently Asked Questions"
        summary="Common questions about NaliGrid pricing."
      />

      <LandingCTA
        title="Lock in early-bird access today."
        description="Register a free draft account and secure your discount eligibility immediately."
        primaryText="Try NaliGrid Free"
      />

      <Footer />
    </div>
  )
}
