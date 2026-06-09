import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import Footer from '@/pages/landing/Footer'
import styles from './LegalPages.module.css'

export function CookiesPage() {
  return (
    <div className={styles.pageWrapper}>
      <Navbar />
      
      <LandingPageHero
        eyebrow="Legal Documents"
        title="Cookie Policy"
        subtitle="Last updated: June 9, 2026. This policy outlines how EventGrid utilizes browser cookies to improve your coordination experience."
      />

      <section className={styles.legalSection} aria-label="Cookie guidelines">
        <div className={styles.container}>
          <div className={styles.legalLayout}>
            {/* Table of Contents */}
            <nav className={styles.sideNav} aria-label="Document index">
              <ul>
                <li><a href="#cookies-what">1. What are Cookies?</a></li>
                <li><a href="#cookies-how">2. How We Use Cookies</a></li>
                <li><a href="#cookies-types">3. Types of Cookies We Use</a></li>
                <li><a href="#cookies-manage">4. Managing Preferences</a></li>
              </ul>
            </nav>

            {/* Document Content */}
            <div className={styles.textContent}>
              <section id="cookies-what" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>1. What are Cookies?</h2>
                <p>
                  Cookies are small text files stored in your web browser by websites you visit. They help sites remember session logs, language settings, and dashboard parameters to offer a smoother experience.
                </p>
              </section>

              <section id="cookies-how" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>2. How We Use Cookies</h2>
                <p>
                  EventGrid requires cookies to trace active coordinator workspaces and secure planner dashboard channels:
                </p>
                <ul>
                  <li>To keep you authenticated and logged in during your planning sessions.</li>
                  <li>To save user metadata parameters (like your role, workspace IDs, and themes).</li>
                  <li>To monitor dashboard loading speeds and capture client error logs securely.</li>
                </ul>
              </section>

              <section id="cookies-types" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>3. Types of Cookies We Use</h2>
                <p>
                  We categorize our cookies into two main categories:
                </p>
                <ul>
                  <li><strong>Core Cookies (Required)</strong>: Used by Supabase Auth to verify session tokens. Without these, you cannot log in or edit checklists.</li>
                  <li><strong>Analytics Cookies (Optional)</strong>: Used by Vercel Analytics and Speed Insights to monitor project performance. These do not gather private coordinator data.</li>
                </ul>
              </section>

              <section id="cookies-manage" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>4. Managing Preferences</h2>
                <p>
                  You can configure your web browser to block or delete cookies. However, please note that blocking core cookies will prevent you from accessing authenticated event workspaces and planning dashboards.
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
