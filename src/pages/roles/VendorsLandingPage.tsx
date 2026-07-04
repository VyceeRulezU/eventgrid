import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import Footer from '@/pages/landing/Footer'
import { Store, Wallet, Clock, CheckCircle, Star, TrendingUp, Shield } from 'lucide-react'
import styles from './RolesLanding.module.css'
import spotlightStyles from '@/pages/landing/FeatureSpotlightB.module.css'

export function VendorsLandingPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="Vendor Marketplace for Events — NaliGrid"
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

      {/* Overlay Section — Vendor Success */}
      <section className={spotlightStyles.section} aria-label="Vendor success tools">
        <div className={spotlightStyles.layout}>
          <div className={spotlightStyles.imagePane}>
            <img
              src="https://i.ibb.co/TxVKsj0n/Gemini-Generated-Image-usmzs7usmzs7usmz.png"
              alt="Event vendor setting up"
              className={spotlightStyles.eventImage}
              loading="lazy"
            />
            <div className={spotlightStyles.imageOverlay}>
              <span className={spotlightStyles.overlayLabel}>Trusted by vendors across Nigeria</span>
            </div>
          </div>

          <div className={spotlightStyles.contentPane}>
            <div className={spotlightStyles.contentInner}>
              <span className={spotlightStyles.eyebrow}>For Vendors</span>
              <h2 className={spotlightStyles.headline}>
                More bookings, less <br />payment hassle.
              </h2>
              <p className={spotlightStyles.subtext}>
                NaliGrid connects vendors with serious planners who need verified professionals. Build your profile, receive booking requests, and get paid securely — all from one dashboard.
              </p>
              <div className={spotlightStyles.cardStack}>
                {[
                  { icon: '◈', title: 'Smart Matching to Planners', body: 'Get discovered by planners searching for your category. Your profile shows past work, reviews, and starting prices so planners can book with confidence.' },
                  { icon: '◆', title: 'Milestone Payment Escrow', body: 'Deposits and final balances are secured in escrow. Funds are released automatically when you complete agreed milestones — no chasing clients.' },
                  { icon: '◇', title: 'Calendar & Availability Sync', body: 'Avoid double-bookings. Update your availability once and planners see real-time open slots. No more back-and-forth scheduling.' },
                ].map((card) => (
                  <div key={card.title} className={spotlightStyles.featureCard}>
                    <span className={spotlightStyles.cardIcon}>{card.icon}</span>
                    <div className={spotlightStyles.cardBody}>
                      <h3 className={spotlightStyles.cardTitle}>{card.title}</h3>
                      <p className={spotlightStyles.cardText}>{card.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={styles.featuresSection} aria-label="Vendor benefits">
        <div className={styles.container}>
          <span className={styles.eyebrow} style={{ textAlign: 'center' }}>Vendor Benefits</span>
          <h2 className={styles.sectionTitle}>Grow Your Business with Confidence</h2>
          <p className={styles.sectionSubtitle}>
            Whether you are a caterer, DJ, decorator, or photographer — NaliGrid gives you the tools to win more clients and get paid faster.
          </p>
          <div className={styles.cardsGrid}>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Star size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Verified Reviews Build Trust</h3>
              <p className={styles.cardDesc}>
                Collect verified reviews from real planners after every event. Future clients see authentic feedback that helps them choose you with confidence.
              </p>
            </div>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <TrendingUp size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Free Profile Listing</h3>
              <p className={styles.cardDesc}>
                Create a professional storefront for free. Showcase your portfolio, services, and pricing. Only pay a small service fee on completed bookings.
              </p>
            </div>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Shield size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Dispute Resolution Support</h3>
              <p className={styles.cardDesc}>
                Our support team mediates any payment disputes. Escrow ensures funds are never released until both parties confirm milestone completion.
              </p>
            </div>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Wallet size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Direct Bank Payouts</h3>
              <p className={styles.cardDesc}>
                Get paid safely and directly. Funds are deposited by planners into escrow and disbursed straight to your bank account upon verification.
              </p>
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
        summary="Common questions about selling on NaliGrid."
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
