import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import Footer from '@/pages/landing/Footer'
import { FileBarChart, PiggyBank, Smile, Download, FileSpreadsheet, BarChart3, Presentation } from 'lucide-react'
import styles from './FeaturesLanding.module.css'
import spotlightStyles from '@/pages/landing/FeatureSpotlightB.module.css'

export function AftermathReportsLandingPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="Automated Aftermath Reports — NaliGrid"
        description="Consolidate financial statements, guest feedback, vendor parameters, and timeline metrics into one professional PDF in under 30 seconds."
        url="/features/aftermath-reports"
      />
      <Navbar />

      <LandingPageHero
        eyebrow="Feature Showcase"
        title="Automated Aftermath Reports"
        subtitle="Consolidate financial statements, guest feedback, vendor parameters, and timeline metrics into one professional PDF document."
      />

      {/* Metrics Section */}
      <section className={styles.metricsSection} aria-label="Reports metrics">
        <div className={styles.container}>
          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>30s</span>
              <span className={styles.metricLbl}>Compile time to compile financial and guest data into a PDF report</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>0</span>
              <span className={styles.metricLbl}>Manual entry actions needed to organize budget summaries</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>100%</span>
              <span className={styles.metricLbl}>Professional PDF presentation layouts ready for clients</span>
            </div>
          </div>
        </div>
      </section>

      {/* Overlay Section */}
      <section className={spotlightStyles.section} aria-label="Reports preview">
        <div className={spotlightStyles.layout}>
          <div className={spotlightStyles.imagePane}>
            <img
              src="https://i.ibb.co/8LcDXhnp/Gemini-Generated-Image-7yqyvt7yqyvt7yqy.png"
              alt="Aftermath report dashboard"
              className={spotlightStyles.eventImage}
              loading="lazy"
            />
            <div className={spotlightStyles.imageOverlay}>
              <span className={spotlightStyles.overlayLabel}>Generated in 30 seconds</span>
            </div>
          </div>

          <div className={spotlightStyles.contentPane}>
            <div className={spotlightStyles.contentInner}>
              <span className={spotlightStyles.eyebrow}>Aftermath Reports</span>
              <h2 className={spotlightStyles.headline}>
                Flawless aftermath reports,<br />compiled instantly.
              </h2>
              <p className={spotlightStyles.subtext}>
                Impress clients and clean up P&L statements. NaliGrid consolidates budget logs, vendor balances, task results, and guest analytics into custom, branded PDF summaries.
              </p>
              <div className={spotlightStyles.cardStack}>
                {[
                  { icon: '◈', title: 'Naira Balance Sheets', body: 'Review actual budgets against targets instantly for total Naira precision.' },
                  { icon: '◆', title: 'Export Branded PDFs', body: 'Generate client-ready reports styled with your business logo.' },
                  { icon: '◇', title: 'Task & RSVP Summaries', body: 'Aggregate coordinator timelines and guest counts in visual charts.' },
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
      <section className={styles.featuresSection} aria-label="Reports benefits">
        <div className={styles.container}>
          <span className={styles.eyebrow} style={{ textAlign: 'center' }}>Benefits</span>
          <h2 className={styles.sectionTitle}>Close Every Event With Excellence</h2>
          <p className={styles.sectionSubtitle}>
            Consolidate your event budget, timeline records, and guest data into a clean PDF summary.
          </p>
          <div className={styles.cardsGrid}>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <FileSpreadsheet size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Zero Manual Compilation</h3>
              <p className={styles.cardDesc}>
                No more copying data from spreadsheets into Word documents. NaliGrid automatically pulls financial, guest, and timeline data into a single report.
              </p>
            </div>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <BarChart3 size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Visual Data Storytelling</h3>
              <p className={styles.cardDesc}>
                Budget charts, RSVP graphs, and timeline heatmaps transform raw numbers into a compelling narrative that clients and stakeholders love.
              </p>
            </div>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Presentation size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Client-Ready Deliverable</h3>
              <p className={styles.cardDesc}>
                The generated PDF features your event branding, professional typography, and data layouts. Share it immediately with no additional formatting.
              </p>
            </div>
            <div className={styles.testimonialCard}>
              <p className={styles.testimonialQuote}>
                "Managing financials and tracking payments for corporate events used to be a nightmare. Now, it's fully automated."
              </p>
              <div className={styles.testimonialAuthor}>
                <img
                  className={styles.testimonialAvatar}
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                  alt="Chinedu"
                  loading="lazy"
                />
                <div className={styles.testimonialMeta}>
                  <span className={styles.testimonialName}>Chinedu</span>
                  <span className={styles.testimonialRole}>Managing Director, Innovate Africa Events</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className={styles.featuresSection} aria-label="Reports features">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Automated Post-Event Summaries</h2>
          <p className={styles.sectionSubtitle}>
            Impress your clients and stakeholders. Export comprehensive reports detail budget details, vendor evaluations, and program highlights.
          </p>

          <div className={styles.cardsGrid}>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <PiggyBank size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Financial Reconciliation</h3>
              <p className={styles.cardDesc}>
                View actual spending against the target budget. Reconcile deposits paid, vendor balances, and event day cost metrics.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <FileBarChart size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Guest & Attendance Analytics</h3>
              <p className={styles.cardDesc}>
                Review invite parameters, guest arrival counts, VIP attendance percentages, and menu preference parameters.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Smile size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Feedback & Performance</h3>
              <p className={styles.cardDesc}>
                Consolidate post-event reviews submitted by clients, team members, and vendor coordinators.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Download size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>1-Click PDF Generation</h3>
              <p className={styles.cardDesc}>
                Generate a premium, formatted PDF document containing charts, schedules, and team milestones in seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FaqSection
        items={[
          {
            category: 'Aftermath Reports',
            items: [
              {
                question: 'What data is included in the report?',
                answer: 'Reports consolidate budget summaries, guest attendance analytics, vendor feedback, and timeline milestones into one PDF.'
              },
              {
                question: 'Can I export the report as a PDF?',
                answer: 'Yes, with one click you can generate a professionally formatted PDF ready to share with clients.'
              }
            ]
          }
        ]}
        header="Frequently Asked Questions"
        summary="Common questions about Aftermath Reports."
      />

      <LandingCTA
        title="Ready to build aftermath reports?"
        description="Run your event, collect feedback, and compile aftermath sheets instantly."
        primaryText="Compile A Report"
      />

      <Footer />
    </div>
  )
}
