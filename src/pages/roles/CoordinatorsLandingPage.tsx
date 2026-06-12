import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import Footer from '@/pages/landing/Footer'
import { CalendarRange, ClipboardList, Zap, ShieldCheck } from 'lucide-react'
import styles from './RolesLanding.module.css'

export function CoordinatorsLandingPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="Event Coordination Software — EventGrid"
        description="Empower on-site teams with instant task updates, interactive schedules, and real-time synchronization tools for flawless event day execution."
        url="/coordinators"
      />
      <Navbar />
      
      <LandingPageHero
        eyebrow="For Coordinators"
        title="Flawless Event Day Coordination"
        subtitle="Empower your on-site teams with instant task updates, interactive schedules, and real-time coordination tools that keep everyone perfectly synced."
      />

      {/* Metrics Section */}
      <section className={styles.metricsSection} aria-label="Coordination metrics">
        <div className={styles.container}>
          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>0ms</span>
              <span className={styles.metricLbl}>Alert delay on critical timeline updates</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>100%</span>
              <span className={styles.metricLbl}>Mobile optimization for on-the-go checklists</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>24/7</span>
              <span className={styles.metricLbl}>Real-time synchronization with lead planners</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid Section */}
      <section className={styles.featuresSection} aria-label="Coordinators features">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Streamlined Day-of Operations</h2>
          <p className={styles.sectionSubtitle}>
            No more printed checklists or frantic phone calls. Give coordinators everything they need on their phone or tablet.
          </p>

          <div className={styles.cardsGrid}>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <ClipboardList size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Mobile Checklists</h3>
              <p className={styles.cardDesc}>
                Coordinators view assigned tasks in a responsive list. Check off vendor arrivals and venue setup stages in real-time.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <CalendarRange size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Interactive Timelines</h3>
              <p className={styles.cardDesc}>
                Track live phase transitions. View details for the reception, toast, and vendor activities on a unified timeline.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Zap size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Instant Notifications</h3>
              <p className={styles.cardDesc}>
                Get immediate alerts when critical vendor logistics shift, guest parameters change, or task assignments update.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <ShieldCheck size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Secure Offline Mode</h3>
              <p className={styles.cardDesc}>
                Work smoothly even in areas with poor internet connection. Tasks sync automatically once connection is restored.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FaqSection
        items={[
          {
            category: 'Coordinators',
            items: [
              {
                question: 'Do I need a separate app to use EventGrid?',
                answer: 'No, EventGrid works entirely in your mobile browser. Checklists and timelines are fully responsive on phones and tablets.'
              },
              {
                question: 'Can I use EventGrid offline?',
                answer: 'Yes, our offline mode lets you check tasks and update checklists even without internet. Everything syncs automatically when you reconnect.'
              }
            ]
          }
        ]}
        header="Frequently Asked Questions"
        summary="Common questions about coordinating with EventGrid."
      />

      <LandingCTA
        title="Ready to coordinate like a pro?"
        description="Invite your coordinators, set schedules, and run event day operations flawlessly."
        primaryText="Start Coordinating"
      />

      <Footer />
    </div>
  )
}
