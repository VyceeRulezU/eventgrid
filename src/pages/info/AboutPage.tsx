import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import Footer from '@/pages/landing/Footer'
import styles from './InfoPages.module.css'

export function AboutPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="About EventGrid — Our Story"
        description="EventGrid closes the gap in event management. Over 5,000 events coordinated across Nigeria with ₦5B+ in budgets tracked securely."
        url="/about"
      />
      <Navbar />
      
      <LandingPageHero
        eyebrow="About Us"
        title="Closing the Gap in Event Management"
        subtitle="EventGrid was built out of a simple frustration: managing vendor schedules, budgets, and team checklists shouldn't be chaotic."
      />

      {/* Metrics Section */}
      <section className={styles.metricsSection} aria-label="About metrics">
        <div className={styles.container}>
          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>5,000+</span>
              <span className={styles.metricLbl}>Successful corporate and private events coordinated</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>6</span>
              <span className={styles.metricLbl}>Major cities across Nigeria with active vendor networks</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>₦5B+</span>
              <span className={styles.metricLbl}>Transaction budgets managed and tracked securely</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mission / Content Section */}
      <section className={styles.contentSection} aria-label="Our mission">
        <div className={styles.container}>
          <div className={styles.splitGrid}>
            <div className={styles.textBlock}>
              <span className={styles.eyebrow}>Our Mission</span>
              <h2 className={styles.title}>To make event day chaos completely invisible.</h2>
              <p className={styles.desc}>
                We believe event planners and host coordinators should focus on their craft—designing premium guest experiences—rather than clipboard management, manual spreadsheets, and payment follow-ups.
              </p>
            </div>
            <div className={styles.textBlock}>
              <span className={styles.eyebrow}>Our Philosophy</span>
              <h2 className={styles.title}>The best tools feel like modern superpowers.</h2>
              <p className={styles.desc}>
                EventGrid integrates vendor directories, live activity feeds, secure payment triggers, and aftermath report generation into a single, beautiful workspace. We design with a focus on speed, clarity, and reliability.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FaqSection
        items={[
          {
            category: 'General',
            items: [
              {
                question: 'What is EventGrid?',
                answer: 'EventGrid is a premium, multi-role event management workspace that helps planners, venue coordinators, and vendors collaborate in real-time.'
              },
              {
                question: 'Who is EventGrid for?',
                answer: 'EventGrid is built for event planners, venue coordinators, vendors, and clients who need a unified workspace to manage events from planning through aftermath.'
              }
            ]
          }
        ]}
        header="Frequently Asked Questions"
        summary="Quick answers about EventGrid."
      />

      <LandingCTA
        title="Let's build the future of events."
        description="Join thousands of event professionals using EventGrid to scale their operational capacity."
        primaryText="Get Started Now"
      />

      <Footer />
    </div>
  )
}
