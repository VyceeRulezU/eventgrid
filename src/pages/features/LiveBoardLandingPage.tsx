import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import Footer from '@/pages/landing/Footer'
import { Radio, AlertCircle, Play, Users, Activity, Bell, Wifi } from 'lucide-react'
import styles from './FeaturesLanding.module.css'
import spotlightStyles from '@/pages/landing/FeatureSpotlightB.module.css'

export function LiveBoardLandingPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="Live Feed & Event Board — NaliGrid"
        description="Bring event day operations alive with real-time task checkoffs, live program monitoring, and team coordination via secure websockets."
        url="/features/live-board"
      />
      <Navbar />

      <LandingPageHero
        eyebrow="Feature Showcase"
        title="Live Feed & Event Board"
        subtitle="Bring event day operations alive. Watch live task checkoffs, monitor program progress, and coordinate with teams in real-time."
      />

      {/* Metrics Section */}
      <section className={styles.metricsSection} aria-label="Live Board metrics">
        <div className={styles.container}>
          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>&lt; 1s</span>
              <span className={styles.metricLbl}>Real-time synchronization latency via secure websockets</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>0</span>
              <span className={styles.metricLbl}>Missed timeline milestones on the master event day program</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>24/7</span>
              <span className={styles.metricLbl}>Unified activity feed tracing log details for compliance audits</span>
            </div>
          </div>
        </div>
      </section>

      {/* Overlay Section */}
      <section className={spotlightStyles.section} aria-label="Live board in action">
        <div className={spotlightStyles.layout}>
          <div className={spotlightStyles.imagePane}>
            <img
              src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&q=85&auto=format&fit=crop"
              alt="Live event coordination dashboard"
              className={spotlightStyles.eventImage}
              loading="lazy"
            />
            <div className={spotlightStyles.imageOverlay}>
              <span className={spotlightStyles.overlayLabel}>Sub-second sync</span>
            </div>
          </div>

          <div className={spotlightStyles.contentPane}>
            <div className={spotlightStyles.contentInner}>
              <span className={spotlightStyles.eyebrow}>Live Operations</span>
              <h2 className={spotlightStyles.headline}>
                See event day unfold <br />as it happens.
              </h2>
              <p className={spotlightStyles.subtext}>
                The Live Board is your mission control for event day. Every vendor check-in, task completion, and schedule shift appears in under one second — so your team always has the full picture.
              </p>
              <div className={spotlightStyles.cardStack}>
                {[
                  { icon: '◈', title: 'Live Activity Feed', body: 'A scrolling timeline of every action taken by coordinators, vendors, and team members. Filter by zone, role, or task type.' },
                  { icon: '◆', title: 'Master Program Timeline', body: 'Follow the official event schedule in real time. The timeline auto-advances and alerts coordinators when items run over.' },
                  { icon: '◇', title: 'Issue Flagging & Resolution', body: 'Flag problems instantly — vendor delay, equipment failure, schedule conflict. Everyone who needs to know gets notified immediately.' },
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
      <section className={styles.featuresSection} aria-label="Live board benefits">
        <div className={styles.container}>
          <span className={styles.eyebrow} style={{ textAlign: 'center' }}>Why Real-Time Matters</span>
          <h2 className={styles.sectionTitle}>No Delays. No Surprises.</h2>
          <p className={styles.sectionSubtitle}>
            When every second counts, your coordination tools need to keep pace. NaliGrid Live Board ensures your team operates as one unit.
          </p>
          <div className={styles.cardsGrid}>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Activity size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Zero-Lag Broadcast</h3>
              <p className={styles.cardDesc}>
                Powered by secure websockets, every update reaches all connected devices in under a second. Everyone on your team sees the same reality.
              </p>
            </div>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Bell size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Role-Targeted Alerts</h3>
              <p className={styles.cardDesc}>
                Coordinators only get notified about items relevant to their zone. The head planner sees everything. No noise, no distraction.
              </p>
            </div>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Wifi size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Projection-Ready Display</h3>
              <p className={styles.cardDesc}>
                The Live Board is designed to be displayed on venue screens. Everyone — from stage manager to catering lead — stays in sync at a glance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className={styles.featuresSection} aria-label="Live Board features">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Sync Your Event Day Operations</h2>
          <p className={styles.sectionSubtitle}>
            Broadcast live notifications, resolve schedule conflicts, and coordinate MC program cues in real-time.
          </p>

          <div className={styles.cardsGrid}>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Radio size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Live Activity Stream</h3>
              <p className={styles.cardDesc}>
                A chronological feed displaying coordinator actions, vendor check-ins, and guest entry alerts as they happen.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Play size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Master Program Run-down</h3>
              <p className={styles.cardDesc}>
                Follow the master event schedule. Automatically ping coordinators when program items shift or overrun.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <AlertCircle size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Instant Issue Flagging</h3>
              <p className={styles.cardDesc}>
                Flag delays, venue issues, or vendor absences immediately. Get other coordinators on-site to resolve them.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Users size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Team Coordination Hub</h3>
              <p className={styles.cardDesc}>
                Coordinate between planners, stage managers, decorators, and caterers. View who is assigned to active sectors.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FaqSection
        items={[
          {
            category: 'Live Board',
            items: [
              {
                question: 'How real-time is the Live Feed?',
                answer: 'Updates appear in under 1 second via secure websocket connections, ensuring your team always has the latest information.'
              },
              {
                question: 'Can the Live Board be displayed on a screen?',
                answer: 'Yes, the Live Board is designed to be projected on event day screens so all coordinators can see live updates at a glance.'
              }
            ]
          }
        ]}
        header="Frequently Asked Questions"
        summary="Common questions about the Live Board."
      />

      <LandingCTA
        title="Ready to go live?"
        description="Activate your real-time board, invite coordinators, and run flawless events."
        primaryText="Access Live Board"
      />

      <Footer />
    </div>
  )
}
