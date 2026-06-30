import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import Footer from '@/pages/landing/Footer'
import styles from './LegalPages.module.css'

export function DataDeletionPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="Data Deletion Request — NaliGrid"
        description="Learn how to request deletion of your personal data from NaliGrid in compliance with the Nigeria Data Protection Act."
        url="/data-deletion"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Data Deletion' },
        ]}
      />
      <Navbar />

      <LandingPageHero
        eyebrow="Privacy"
        title="Data Deletion Request"
        subtitle="How to request the deletion of your personal information from NaliGrid."
      />

      <section className={styles.legalSection} aria-label="Data deletion instructions">
        <div className={styles.container}>
          <div className={styles.legalLayout}>
            <nav className={styles.sideNav} aria-label="Document index">
              <ul>
                <li><a href="#overview">1. Overview</a></li>
                <li><a href="#how-to-request">2. How to Request Deletion</a></li>
                <li><a href="#what-gets-deleted">3. What Gets Deleted</a></li>
                <li><a href="#retention">4. Retention Exceptions</a></li>
                <li><a href="#timeline">5. Timeline</a></li>
                <li><a href="#contact">6. Contact</a></li>
              </ul>
            </nav>

            <div className={styles.textContent}>
              <section id="overview" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>1. Overview</h2>
                <p>NaliGrid (NaliTech Consults Limited) respects your right to control your personal data. If you wish to have your personal information deleted from our platform, you may submit a deletion request using one of the methods below. We will process your request in accordance with the Nigeria Data Protection Act 2023.</p>
              </section>

              <section id="how-to-request" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>2. How to Request Deletion</h2>
                <h3 className={styles.subTitle}>Option A — In-App (Recommended)</h3>
<p>
                   Log in to your NaliGrid account, go to{' '}
                  <strong>Settings → Account → Delete Account</strong>, and follow
                  the prompts. This will automatically initiate the deletion process.
                </p>
                <h3 className={styles.subTitle}>Option B — Email Request</h3>
                <p>
                  Send an email from the address associated with your account to{' '}
                  <strong>privacy@naligrid.com</strong> with the subject line
                  "Data Deletion Request" and include your full name and registered
                  email address so we can verify your identity.
                </p>
                <h3 className={styles.subTitle}>Option C — Web Form</h3>
                <p>
                  If you signed up using Facebook or Google and no longer have access
                  to your account, please email{' '}
                  <strong>privacy@naligrid.com</strong> from the email address you
                  used for that social login, and we will assist you.
                </p>
              </section>

              <section id="what-gets-deleted" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>3. What Gets Deleted</h2>
                <p>Upon processing your request, we will delete:</p>
                <ul>
                  <li>Your account profile (name, email, phone, preferences)</li>
                  <li>Your authentication records</li>
                  <li>Personal data you directly provided to us</li>
                </ul>
                <p>
                  Event Data about you that was entered by a Planner or Coordinator
                  (e.g., guest records, vendor records) is controlled by that
                  Planner or Coordinator. Please contact them directly to request
                  deletion of that data.
                </p>
              </section>

              <section id="retention" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>4. Retention Exceptions</h2>
                <p>
                  We may retain certain information where required by law or for
                  legitimate business purposes, such as:
                </p>
                <ul>
                  <li>Transaction records required for tax and accounting compliance (retained for the period mandated by Nigerian law)</li>
                  <li>Records necessary to prevent fraud or abuse</li>
                  <li>Anonymised or aggregated data that no longer identifies you</li>
                </ul>
              </section>

              <section id="timeline" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>5. Timeline</h2>
                <p>
                  We will acknowledge your request within 5 business days and
                  complete the deletion within 30 days of verification, unless a
                  legal exception applies. You will receive a confirmation email
                  once the deletion is complete.
                </p>
              </section>

              <section id="contact" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>6. Contact</h2>
                <p>For questions about data deletion or to submit a request:</p>
                <p>
                  <strong>privacy@naligrid.com</strong><br />
                  NaliTech Consults Limited<br />
                  Abuja, Nigeria
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
