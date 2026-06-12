import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import Footer from '@/pages/landing/Footer'
import { GitMerge, Layers, Clock, Settings } from 'lucide-react'
import styles from './FeaturesLanding.module.css'

export function PipelineLandingPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="Visual Event Pipeline — EventGrid"
        description="Structure your event workflow from booking to closeout with 9 default timeline phases, 1-click PDF exports, and full audit trails for every task."
        url="/features/pipeline"
      />
      <Navbar />
      
      <LandingPageHero
        eyebrow="Feature Showcase"
        title="Visual Event Pipeline"
        subtitle="Manage event stages dynamically. Structure your workflow from initial booking through venue coordination to final closeout."
      />

      {/* Metrics Section */}
      <section className={styles.metricsSection} aria-label="Pipeline metrics">
        <div className={styles.container}>
          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>9</span>
              <span className={styles.metricLbl}>Default timeline phases optimized for Nigerian events</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>100%</span>
              <span className={styles.metricLbl}>Audit trail tracing for every task checklist action</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>1-Click</span>
              <span className={styles.metricLbl}>Export timeline summary to PDF client reports</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards Section */}
      <section className={styles.featuresSection} aria-label="Pipeline features">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Master Your Event Schedules</h2>
          <p className={styles.sectionSubtitle}>
            Break your event setup down into structured phases. Easily update task dependencies and monitor progress.
          </p>

          <div className={styles.cardsGrid}>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Layers size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Dynamic Milestone Tracking</h3>
              <p className={styles.cardDesc}>
                Divide event timelines into custom phases. Track overall completion rates dynamically as checklists get resolved.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <GitMerge size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Dependency Workflow</h3>
              <p className={styles.cardDesc}>
                Link vendor payments, approvals, and setup tasks. Ensure next steps are unblocked only when dependencies finish.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Clock size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Phase Due Dates</h3>
              <p className={styles.cardDesc}>
                Assign clear deadlines for each phase. Keep team members accountable with proactive notification alerts.
              </p>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Settings size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Flexible Customization</h3>
              <p className={styles.cardDesc}>
                Add custom event phases, edit names, or re-order steps. Tailor the system perfectly to your planning methodology.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FaqSection
        items={[
          {
            category: 'Pipelines',
            items: [
              {
                question: 'Can I customize pipeline phases?',
                answer: 'Yes, you can add, remove, or reorder phases to match your unique event planning workflow.'
              },
              {
                question: 'Can I reuse pipelines for future events?',
                answer: 'Absolutely. Save any event as a template and duplicate it for new clients with one click.'
              }
            ]
          }
        ]}
        header="Frequently Asked Questions"
        summary="Common questions about Event Pipelines."
      />

      <LandingCTA
        title="Ready to organize your timelines?"
        description="Build custom event pipelines, assign tasks, and track project completion rates instantly."
        primaryText="Build Your First Pipeline"
      />

      <Footer />
    </div>
  )
}
