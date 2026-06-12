import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import Footer from '@/pages/landing/Footer'
import { FileBarChart, PiggyBank, Smile, Download } from 'lucide-react'
import styles from './FeaturesLanding.module.css'

export function AftermathReportsLandingPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="Automated Aftermath Reports — EventGrid"
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
