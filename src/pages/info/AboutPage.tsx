import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import BlogSection from '@/pages/landing/BlogSection'
import { FaqSection } from '@/components/shared/FaqSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import Footer from '@/pages/landing/Footer'
import { Target, Shield, Zap, Award } from 'lucide-react'
import styles from './InfoPages.module.css'
import spotlightStyles from '@/pages/landing/FeatureSpotlightB.module.css'

export function AboutPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="About NaliGrid — Our Story"
        description="NaliGrid closes the gap in event management. Over 5,000 events coordinated across Nigeria with ₦5B+ in budgets tracked securely."
        url="/about"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'About' },
        ]}
      />
      <Navbar />

      <LandingPageHero
        eyebrow="About Us"
        title="Closing the Gap in Event Management"
        subtitle="NaliGrid was built out of a simple frustration: managing vendor schedules, budgets, and team checklists shouldn't be chaotic."
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

      {/* Our Story — FeatureSpotlightB-style overlay section */}
      <section className={spotlightStyles.section} aria-label="Our story">
        <div className={spotlightStyles.layout}>
          <div className={spotlightStyles.imagePane}>
            <img
              src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=85&auto=format&fit=crop"
              alt="Event management team collaborating"
              className={spotlightStyles.eventImage}
              loading="lazy"
            />
            <div className={spotlightStyles.imageOverlay}>
              <span className={spotlightStyles.overlayLabel}>Founded 2024</span>
            </div>
          </div>

          <div className={spotlightStyles.contentPane}>
            <div className={spotlightStyles.contentInner}>
              <span className={spotlightStyles.eyebrow}>Our Story</span>
              <h2 className={spotlightStyles.headline}>
                From chaos to clarity.<br />A better way to run events.
              </h2>
              <p className={spotlightStyles.subtext}>
                NaliGrid was founded by event professionals who were tired of juggling spreadsheets, WhatsApp groups, and paper checklists. We built a single workspace where every phase of an event — from vendor booking to post-event report — lives in one place.
              </p>
              <div className={spotlightStyles.cardStack}>
                {[
                  { icon: '◈', title: 'Founded by Event Professionals', body: 'Our team has coordinated hundreds of events across Nigeria. We built NaliGrid to solve the problems we experienced first-hand.' },
                  { icon: '◆', title: 'Purpose-Built for Africa', body: 'Designed for the unique dynamics of the Nigerian event industry — from vendor advances to venue coordination across major cities.' },
                  { icon: '◇', title: 'Open by Design', body: 'Every feature is built with transparency in mind. Clients, planners, coordinators, and vendors each see exactly what they need.' },
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

      {/* Our Values Section */}
      <section className={styles.contentSection} aria-label="Our values">
        <div className={styles.container}>
          <span className={styles.eyebrow} style={{ textAlign: 'center' }}>Our Values</span>
          <h2 className={styles.sectionTitle}>What Drives Us</h2>
          <p className={styles.sectionSubtitle}>
            Every decision we make is guided by the principles that define how we build, support, and grow.
          </p>
          <div className={styles.valuesGrid}>
            {[
              { icon: Target, title: 'Clarity Over Complexity', desc: 'Event coordination is hard enough. We strip away unnecessary friction so every user — planner, coordinator, or vendor — can focus on what matters most: delivering exceptional experiences.' },
              { icon: Shield, title: 'Trust Through Transparency', desc: 'Every payment, every task update, every timeline change is visible to the right people at the right time. No hidden delays, no surprise costs.' },
              { icon: Zap, title: 'Speed Without Sacrifice', desc: 'Real-time sync, instant notifications, and sub-second page loads mean event teams never wait for the tool. We optimise every interaction for velocity.' },
              { icon: Award, title: 'Reliability Under Pressure', desc: 'Events don’t get a second chance. We build NaliGrid to be bulletproof and highly reliable, ensuring your workspace stays online and perfectly synced when the pressure is on.' },
            ].map((v) => (
              <div key={v.title} className={styles.valueCard}>
                <div className={styles.valueIconWrap}>
                  <v.icon size={22} className={styles.valueIcon} />
                </div>
                <h3 className={styles.valueTitle}>{v.title}</h3>
                <p className={styles.valueDesc}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission / Philosophy Section */}
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
                NaliGrid integrates vendor directories, live activity feeds, secure payment triggers, and aftermath report generation into a single, beautiful workspace. We design with a focus on speed, clarity, and reliability.
              </p>
            </div>
          </div>
        </div>
      </section>

      <BlogSection hideEyebrow />

      <FaqSection
        items={[
          {
            category: 'General',
            items: [
              {
                question: 'What is NaliGrid?',
                answer: 'NaliGrid is a premium, multi-role event management workspace that helps planners, venue coordinators, and vendors collaborate in real-time.'
              },
              {
                question: 'Who is NaliGrid for?',
                answer: 'NaliGrid is built for event planners, venue coordinators, vendors, and clients who need a unified workspace to manage events from planning through aftermath.'
              }
            ]
          }
        ]}
        header="Frequently Asked Questions"
        summary="Quick answers about NaliGrid."
      />

      <LandingCTA
        title="Let's build the future of events."
        description="Join thousands of event professionals using NaliGrid to scale their operational capacity."
        primaryText="Get Started Now"
      />

      <Footer />
    </div>
  )
}
