import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import Footer from '@/pages/landing/Footer'
import { Calendar, Users, BarChart3, Shield } from 'lucide-react'
import styles from './RolesLanding.module.css'

export function PlannersLandingPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="Event Planning Software — NaliGrid"
        description="Design timelines, assign tasks, control budgets, and manage vendors from one dashboard. 10x faster event setup with reusable templates."
        url="/planners"
      />
      <Navbar />
      
      <LandingPageHero
        eyebrow="For Planners"
        title="Command Your Events from One Place"
        subtitle="Design timelines, assign tasks, control budgets, and manage vendors — all from a single dashboard built for professional event planners."
      />

      {/* Metrics Section */}
      <section className={styles.metricsSection} aria-label="Planner metrics">
        <div className={styles.container}>
          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>10x</span>
              <span className={styles.metricLbl}>Faster event setup with reusable templates and pipelines</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>₦0</span>
              <span className={styles.metricLbl}>Platform fees on client invoices and vendor payouts</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>100%</span>
              <span className={styles.metricLbl}>Transparent oversight on budgets, timelines, and team tasks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid Section */}
      <section className={styles.featuresSection} aria-label="Planner features">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Built for Professional Event Management</h2>
          <p className={styles.sectionSubtitle}>
            From initial concept to post-event report, access every tool you need to deliver flawless experiences for your clients.
          </p>

          <div className={styles.cardsGrid}>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Calendar size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Event Pipeline Builder</h3>
              <p className={styles.cardDesc}>
                Create reusable event templates with phases, milestones, and task checkpoints. Duplicate and adapt for each new client in seconds.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Users size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Team & Vendor Coordination</h3>
              <p className={styles.cardDesc}>
                Invite coordinators with granular permissions, assign vendors to specific phases, and track every stakeholder from one board.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <BarChart3 size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Budget & Analytics Dashboard</h3>
              <p className={styles.cardDesc}>
                Monitor real-time budget allocation, track vendor deposits and balances, and generate professional aftermath reports.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Shield size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Client Portal & Escrow</h3>
              <p className={styles.cardDesc}>
                Share a branded client portal for approvals and payments. Secure vendor advances with integrated escrow protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FaqSection
        items={[
          {
            category: 'Planners',
            items: [
              {
                question: 'Can I import my existing event templates?',
                answer: 'Yes, you can create reusable pipeline templates. You can also duplicate existing events to use as templates for future events.'
              },
              {
                question: 'How do I share access with my team?',
                answer: 'Invite coordinators and team members directly from the dashboard with granular permission controls for each role.'
              }
            ]
          }
        ]}
        header="Frequently Asked Questions"
        summary="Common questions about planning with NaliGrid."
      />

      <LandingCTA
        title="Ready to streamline your planning workflow?"
        description="Create your workspace, build your first event pipeline, and take full control of your planning business."
        primaryText="Start Planning"
      />

      <Footer />
    </div>
  )
}
