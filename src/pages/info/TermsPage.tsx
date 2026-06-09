import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import Footer from '@/pages/landing/Footer'
import styles from './LegalPages.module.css'

export function TermsPage() {
  return (
    <div className={styles.pageWrapper}>
      <Navbar />
      
      <LandingPageHero
        eyebrow="Legal Documents"
        title="Terms of Service"
        subtitle="Last updated: June 9, 2026. Review rules for using EventGrid workspace channels and transaction gates."
      />

      <section className={styles.legalSection} aria-label="Terms of service text">
        <div className={styles.container}>
          <div className={styles.legalLayout}>
            {/* Table of Contents */}
            <nav className={styles.sideNav} aria-label="Document index">
              <ul>
                <li><a href="#terms-agree">1. User Agreement</a></li>
                <li><a href="#terms-roles">2. Workspace Roles</a></li>
                <li><a href="#terms-pay">3. Payments & Escrow</a></li>
                <li><a href="#terms-liability">4. Uptime & Liability</a></li>
              </ul>
            </nav>

            {/* Document Content */}
            <div className={styles.textContent}>
              <section id="terms-agree" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>1. User Agreement</h2>
                <p>
                  By creating an account on EventGrid, you agree to comply with our guidelines:
                </p>
                <p>
                  You agree to use our SaaS platform solely for legal event coordination, guest seating layouts, team task management, and verified vendor bookings. Any unauthorized reverse engineering or service disruption is strictly prohibited.
                </p>
              </section>

              <section id="terms-roles" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>2. Workspace Roles & Permissions</h2>
                <p>
                  Our platform utilizes role-specific constraints to organize permissions:
                </p>
                <ul>
                  <li><strong>Planners</strong> retain workspace ownership, manage financial tables, and verify vendor milestones.</li>
                  <li><strong>Coordinators</strong> carry editing permissions for task checklists and live program boards.</li>
                  <li><strong>Vendors</strong> receive and manage quotes, view logistics timelines, and track payout statuses.</li>
                  <li><strong>Clients</strong> maintain read-only access to portal metrics, guest seat allocations, and budget charts.</li>
                </ul>
              </section>

              <section id="terms-pay" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>3. Payment Gateways & Escrow Rules</h2>
                <p>
                  Transaction terms govern our verified event checkout gates:
                </p>
                <ul>
                  <li>All payment activations undergo secure server-to-server validation. Modifying payment columns via the client-side API is blocked by database triggers.</li>
                  <li>Escrow deposits and vendor advance releases must be authorized by the lead planner on the workspace database.</li>
                  <li>Gateway processing rates are determined by Paystack or Flutterwave. EventGrid is not liable for gateway outages.</li>
                </ul>
              </section>

              <section id="terms-liability" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>4. Uptime & Liability</h2>
                <p>
                  EventGrid is provided "as is" with a commitment to high availability:
                </p>
                <p>
                  We are not liable for guest timeline overruns on event day or vendor delivery errors. We maintain automated daily backups of event parameters, but planners are encouraged to export aftermath PDF reports for archives.
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
