import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import Footer from '@/pages/landing/Footer'
import { CalendarRange, ClipboardList, Zap, ShieldCheck, Wifi, Smartphone, Bell, Clock } from 'lucide-react'
import styles from './RolesLanding.module.css'
import spotlightStyles from '@/pages/landing/FeatureSpotlightB.module.css'

export function CoordinatorsLandingPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="Event Coordination Software — NaliGrid"
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

      {/* Overlay Section — Day-of Coordination */}
      <section className={spotlightStyles.section} aria-label="Day-of coordination tools">
        <div className={spotlightStyles.layout}>
          <div className={spotlightStyles.imagePane}>
            <img
              src="https://i.ibb.co/N26d9m3V/Gemini-Generated-Image-md1sf5md1sf5md1s.png"
              alt="Coordinator managing event timeline"
              className={spotlightStyles.eventImage}
              loading="lazy"
            />
            <div className={spotlightStyles.imageOverlay}>
              <span className={spotlightStyles.overlayLabel}>Real-time sync</span>
            </div>
          </div>

          <div className={spotlightStyles.contentPane}>
            <div className={spotlightStyles.contentInner}>
              <span className={spotlightStyles.eyebrow}>Day-of Coordination</span>
              <h2 className={spotlightStyles.headline}>
                Run event day like a <br />well-oiled machine.
              </h2>
              <p className={spotlightStyles.subtext}>
                Coordinators get everything they need on their phone — live checklists, real-time timeline updates, and instant alerts when things change.
              </p>
              <div className={spotlightStyles.cardStack}>
                {[
                  { icon: '◈', title: 'Live Checklist Sync', body: 'Check off vendor arrivals, venue setup tasks, and catering milestones. The planner sees every update the second it happens.' },
                  { icon: '◆', title: 'Interactive Program Timeline', body: 'Follow the master event schedule in real time. See phase transitions, schedule shifts, and pending items at a glance.' },
                  { icon: '◇', title: 'Instant Issue Alerts', body: 'Flag delays, vendor no-shows, or equipment issues immediately. All coordinators and the planner get notified in under a second.' },
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
      <section className={styles.featuresSection} aria-label="Coordination benefits">
        <div className={styles.container}>
          <span className={styles.eyebrow} style={{ textAlign: 'center' }}>Why Coordinators Love NaliGrid</span>
          <h2 className={styles.sectionTitle}>Built for the Event Floor</h2>
          <p className={styles.sectionSubtitle}>
            No more clipboards, phone tag, or frantic walkie-talkies. Everything your team needs fits in their pocket.
          </p>
          <div className={styles.cardsGrid}>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Smartphone size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Fully Mobile-Optimized</h3>
              <p className={styles.cardDesc}>
                Works perfectly on any phone or tablet. No app download required — just open the browser and coordinate instantly from anywhere in the venue.
              </p>
            </div>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Wifi size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Offline Resilience</h3>
              <p className={styles.cardDesc}>
                Tasks and checklists save locally when the network drops. Everything syncs automatically the moment your connection is restored.
              </p>
            </div>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Bell size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Targeted Notifications</h3>
              <p className={styles.cardDesc}>
                Get alerts only for the tasks and zones you are assigned to. No noise, no irrelevant updates — just the information you need.
              </p>
            </div>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Clock size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Live Sequence Control</h3>
              <p className={styles.cardDesc}>
                View real-time updates of the reception program or master schedule. Sync instant adjustments to floor plans and logistics on the fly.
              </p>
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
                question: 'Do I need a separate app to use NaliGrid?',
                answer: 'No, NaliGrid works entirely in your mobile browser. Checklists and timelines are fully responsive on phones and tablets.'
              },
              {
                question: 'Can I use NaliGrid offline?',
                answer: 'Yes, our offline mode lets you check tasks and update checklists even without internet. Everything syncs automatically when you reconnect.'
              }
            ]
          }
        ]}
        header="Frequently Asked Questions"
        summary="Common questions about coordinating with NaliGrid."
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
