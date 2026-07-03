import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import Footer from '@/pages/landing/Footer'
import { Landmark, Compass, Eye, ShieldAlert, Link, LockKeyhole, ClipboardCheck } from 'lucide-react'
import styles from './FeaturesLanding.module.css'
import spotlightStyles from '@/pages/landing/FeatureSpotlightB.module.css'

export function ClientPortalLandingPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="Interactive Client Portal — NaliGrid"
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

      {/* Overlay Section */}
      <section className={spotlightStyles.section} aria-label="Client portal preview">
        <div className={spotlightStyles.layout}>
          <div className={spotlightStyles.imagePane}>
            <img
              src="https://i.ibb.co/mCHxnj2v/image.jpg"
              alt="Client portal dashboard preview"
              className={spotlightStyles.eventImage}
              loading="lazy"
            />
            <div className={spotlightStyles.imageOverlay}>
              <span className={spotlightStyles.overlayLabel}>Read-only peace of mind</span>
            </div>
          </div>

          <div className={spotlightStyles.contentPane}>
            <div className={spotlightStyles.contentInner}>
              <span className={spotlightStyles.eyebrow}>Client Portal</span>
              <h2 className={spotlightStyles.headline}>
                A professional portal<br />for client approvals.
              </h2>
              <p className={spotlightStyles.subtext}>
                Stop answering "are we there yet" calls. Share a secure, branded portal link where your clients can monitor phase progress and sign off on decisions.
              </p>
              <div className={spotlightStyles.cardStack}>
                {[
                  { icon: '◇', title: 'Branded Portal Link', body: 'Share a read-only portal styled with your logo and brand colors.' },
                  { icon: '◈', title: 'Milestone Approvals', body: 'Let clients approve vendor bookings and stage designs digitally.' },
                  { icon: '◆', title: 'Secure Payment Ledger', body: 'Clients view invoices, Naira receipts, and outstanding budgets safely.' },
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
      <section className={styles.featuresSection} aria-label="Client portal benefits">
        <div className={styles.container}>
          <span className={styles.eyebrow} style={{ textAlign: 'center' }}>Portal Benefits</span>
          <h2 className={styles.sectionTitle}>Build Trust Through Transparency</h2>
          <p className={styles.sectionSubtitle}>
            Give your clients a polished, professional oversight space without sharing internal planning details.
          </p>
          <div className={styles.cardsGrid}>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Link size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>One-Click Share</h3>
              <p className={styles.cardDesc}>
                Generate a secure magic link in seconds. Share it via email or WhatsApp — clients access their portal instantly with no account creation required.
              </p>
            </div>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <LockKeyhole size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Granular Access Control</h3>
              <p className={styles.cardDesc}>
                Choose exactly what each client can see — budget only, timeline only, or full visibility. Your event data stays protected and controlled.
              </p>
            </div>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <ClipboardCheck size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Approval Workflows</h3>
              <p className={styles.cardDesc}>
                Clients can review and approve vendor deposit releases, menu selections, and budget adjustments directly from their portal — no back-and-forth.
              </p>
            </div>
            <div className={styles.testimonialCard}>
              <p className={styles.testimonialQuote}>
                "My clients keep asking what software I'm using because the portal looks so professional. I'm not telling them. It's my competitive advantage."
              </p>
              <div className={styles.testimonialAuthor}>
                <img
                  className={styles.testimonialAvatar}
                  src="https://images.unsplash.com/photo-1703544022909-6968d29d505e?w=120&q=80&auto=format&fit=crop&crop=faces"
                  alt="Adunola Falade"
                  loading="lazy"
                />
                <div className={styles.testimonialMeta}>
                  <span className={styles.testimonialName}>Adunola Falade</span>
                  <span className={styles.testimonialRole}>Corporate Event Planner, Lagos</span>
                </div>
              </div>
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
