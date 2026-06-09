import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import Footer from '@/pages/landing/Footer'
import styles from './LegalPages.module.css'

export function PrivacyPage() {
  return (
    <div className={styles.pageWrapper}>
      <Navbar />
      
      <LandingPageHero
        eyebrow="Legal Documents"
        title="Privacy Policy"
        subtitle="Last updated: June 9, 2026. This policy explains how EventGrid collects, protects, and handles your data."
      />

      <section className={styles.legalSection} aria-label="Privacy terms">
        <div className={styles.container}>
          <div className={styles.legalLayout}>
            {/* Table of Contents */}
            <nav className={styles.sideNav} aria-label="Document index">
              <ul>
                <li><a href="#info-collect">1. Information We Collect</a></li>
                <li><a href="#info-use">2. How We Use Information</a></li>
                <li><a href="#info-share">3. Data Sharing & Security</a></li>
                <li><a href="#info-rights">4. Your Privacy Rights</a></li>
              </ul>
            </nav>

            {/* Document Content */}
            <div className={styles.textContent}>
              <section id="info-collect" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>1. Information We Collect</h2>
                <p>
                  At EventGrid, we gather information necessary to facilitate premium event coordination and secure payments:
                </p>
                <ul>
                  <li><strong>Account Metadata</strong>: Registration details such as name, email, phone numbers, and profile avatars.</li>
                  <li><strong>Event Parameters</strong>: Names, dates, venue coordinates, budgets, guest counts, and task checklists.</li>
                  <li><strong>Payment Logs</strong>: Gateway transaction references from Paystack or Flutterwave used to confirm event activation. We do not store credit card credentials.</li>
                </ul>
              </section>

              <section id="info-use" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>2. How We Use Information</h2>
                <p>
                  We utilize collected information to maintain service reliability, compile reports, and secure communication:
                </p>
                <ul>
                  <li>To synchronize real-time tasks and activity streams via websockets.</li>
                  <li>To dispatch coordinator invites and client portal magic links.</li>
                  <li>To verify bank deposits and authorize vendor milestone payouts.</li>
                  <li>To automatically compile post-event aftermath financial statements and PDF reports.</li>
                </ul>
              </section>

              <section id="info-share" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>3. Data Sharing & Security</h2>
                <p>
                  Your event parameters and planner directories are private. We enforce strict guidelines for data protection:
                </p>
                <ul>
                  <li>We do not sell planner database records or client portals.</li>
                  <li>We share data with verified subprocessors (e.g., Supabase Auth/DB, Paystack, Flutterwave, Resend) solely to run services.</li>
                  <li>All databases utilize Row-Level Security (RLS) policies to isolate workspace data.</li>
                </ul>
              </section>

              <section id="info-rights" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>4. Your Privacy Rights</h2>
                <p>
                  Planners and coordinators retain complete authority over their database profiles:
                </p>
                <p>
                  You can modify settings, export guest checklists, transfer workspace ownership, or delete event parameters at any time from your dashboard settings. Contact our support desk at hello@eventgrid.ng for assistance.
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
