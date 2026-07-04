import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import { FeatureTestimonial } from '@/components/shared/FeatureTestimonial'
import Footer from '@/pages/landing/Footer'
import { Truck, Wallet, FileText, CheckSquare, Calendar, ShieldCheck, Bell } from 'lucide-react'
import styles from './FeaturesLanding.module.css'
import spotlightStyles from '@/pages/landing/FeatureSpotlightB.module.css'

export function VendorTrackerLandingPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="Vendor Logistics & Payment Tracker — NaliGrid"
        description="Manage vendor relationships, contracts, deposits, and delivery schedules from one workspace. Zero booking conflicts with milestone payment tracking."
        url="/features/vendor-tracker"
      />
      <Navbar />

      <LandingPageHero
        eyebrow="Feature Showcase"
        title="Vendor Logistics & Payment Tracker"
        subtitle="Manage vendor relationships, contracts, deposits, and delivery schedules from one centralized workspace."
      />

      {/* Metrics Section */}
      <section className={styles.metricsSection} aria-label="Vendor tracking metrics">
        <div className={styles.container}>
          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>0</span>
              <span className={styles.metricLbl}>Booking conflicts or missed vendor contract clauses</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>100%</span>
              <span className={styles.metricLbl}>Milestone payment tracking with escrow security</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>₦0</span>
              <span className={styles.metricLbl}>Cash handling risks for coordinators on the event day</span>
            </div>
          </div>
        </div>
      </section>

      {/* Overlay Section */}
      <section className={spotlightStyles.section} aria-label="Vendor tracker overview">
        <div className={spotlightStyles.layout}>
          <div className={spotlightStyles.imagePane}>
            <img
              src="https://i.ibb.co/WWw8k8vQ/Gemini-Generated-Image-z0kw8tz0kw8tz0kw.png"
              alt="Vendor coordination dashboard"
              className={spotlightStyles.eventImage}
              loading="lazy"
            />
            <div className={spotlightStyles.imageOverlay}>
              <span className={spotlightStyles.overlayLabel}>Vendor management hub</span>
            </div>
          </div>

          <div className={spotlightStyles.contentPane}>
            <div className={spotlightStyles.contentInner}>
              <span className={spotlightStyles.eyebrow}>Vendor Tracker</span>
              <h2 className={spotlightStyles.headline}>
                Manage vendors and<br />payouts with ease.
              </h2>
              <p className={spotlightStyles.subtext}>
                No more WhatsApp back-and-forth or lost invoices. NaliGrid gives you a centralized vendor hub to log quotes, verify milestones, and disburse secure escrow payouts.
              </p>
              <div className={spotlightStyles.cardStack}>
                {[
                  { icon: '◆', title: 'Naira Escrow Payouts', body: 'Milestones release directly to vendors upon planner confirmation.' },
                  { icon: '◇', title: 'Consolidated Directory', body: 'Search rated vendors across Lagos, Abuja, and Port Harcourt.' },
                  { icon: '◈', title: 'Conflict-Free Schedules', body: 'Automatically align vendor load-in times on event day.' },
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
      <section className={styles.featuresSection} aria-label="Vendor tracker benefits">
        <div className={styles.container}>
          <span className={styles.eyebrow} style={{ textAlign: 'center' }}>Vendor Management</span>
          <h2 className={styles.sectionTitle}>Streamlined Sourcing & Logistics</h2>
          <p className={styles.sectionSubtitle}>
            Eliminate double bookings and keep all contract terms and invoices in one secure place.
          </p>
          <div className={styles.cardsGrid}>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Calendar size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Conflict-Free Scheduling</h3>
              <p className={styles.cardDesc}>
                Overlapping vendor arrivals are flagged automatically. See at a glance which vendors are scheduled for each time slot and avoid bottlenecks at the venue.
              </p>
            </div>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <ShieldCheck size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Contract & Invoice Vault</h3>
              <p className={styles.cardDesc}>
                Upload and store all vendor contracts, quotes, and invoices in one secure place. No more digging through email attachments on event day.
              </p>
            </div>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Bell size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Proactive Payment Reminders</h3>
              <p className={styles.cardDesc}>
                Get notified when deposits are due, balances are pending, or final payouts need processing. Never miss a vendor payment deadline again.
              </p>
            </div>
            <FeatureTestimonial />
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className={styles.featuresSection} aria-label="Vendor tracking features">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Centralized Vendor Management</h2>
          <p className={styles.sectionSubtitle}>
            From booking approval to final logistics, align decorators, caterers, DJs, and security services.
          </p>

          <div className={styles.cardsGrid}>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Truck size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Logistics Status Hub</h3>
              <p className={styles.cardDesc}>
                Track vendor arrival times, setup progress, and departure statuses. Keep coordinators informed.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Wallet size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Milestone Advances</h3>
              <p className={styles.cardDesc}>
                Track advance deposits paid to secure bookings. Stay updated on upcoming final balances.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <FileText size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Contracts & Invoices</h3>
              <p className={styles.cardDesc}>
                Upload quotes, vendor invoices, and terms of service. Keep all transaction records in one place.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <CheckSquare size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Checklists & Deliverables</h3>
              <p className={styles.cardDesc}>
                Verify deliverables (e.g. food counts, décor details) to confirm everything matches the client agreement.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FaqSection
        items={[
          {
            category: 'Vendor Tracker',
            items: [
              {
                question: 'Can I track payments to vendors?',
                answer: 'Yes, the Vendor Tracker lets you manage deposits, milestone payments, and final balances for each vendor.'
              },
              {
                question: 'Can vendors update their own status?',
                answer: 'Vendors with accounts can log in to update arrival times and mark deliverables as complete.'
              }
            ]
          }
        ]}
        header="Frequently Asked Questions"
        summary="Common questions about Vendor Tracking."
      />

      <LandingCTA
        title="Ready to track your vendors?"
        description="List your vendors, manage deposits, and coordinate setup logistics flawlessly."
        primaryText="Access Vendor Tracker"
      />

      <Footer />
    </div>
  )
}
