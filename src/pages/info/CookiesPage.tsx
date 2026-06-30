import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import Footer from '@/pages/landing/Footer'
import styles from './LegalPages.module.css'

export function CookiesPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="Cookie Policy — NaliGrid"
        description="Learn how NaliGrid uses cookies and local storage to enhance your experience on the platform."
        url="/cookies"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Cookie Policy' },
        ]}
      />
      <Navbar />
      
      <LandingPageHero
        eyebrow="Legal Documents"
        title="Cookie Policy"
        subtitle="Last updated: June 9, 2026. This policy explains how NaliGrid uses cookies and local storage."
      />

      <section className={styles.legalSection} aria-label="Cookie Policy">
        <div className={styles.container}>
          <div className={styles.legalLayout}>
            <nav className={styles.sideNav} aria-label="Document index">
              <ul>
                <li><a href="#what">1. What This Policy Covers</a></li>
                <li><a href="#cookies">2. What Are Cookies and Local Storage?</a></li>
                <li><a href="#current">3. What We Currently Use</a></li>
                <li><a href="#third">4. Third-Party Cookies</a></li>
                <li><a href="#managing">5. Managing Cookies and Storage</a></li>
                <li><a href="#changes">6. Changes to This Policy</a></li>
                <li><a href="#contact">7. Contact Us</a></li>
              </ul>
            </nav>

            <div className={styles.textContent}>
              <section id="what" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>1. What This Policy Covers</h2>
                <p>This Cookie Policy explains how NaliTech Consults Limited ("we," "us," "our") uses cookies and similar technologies (such as local storage) on the NaliGrid platform ("Platform").</p>
              </section>

              <section id="cookies" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>2. What Are Cookies and Local Storage?</h2>
                <p>Cookies are small text files stored on your device by your browser. Local storage works similarly but is often used by modern web applications to store information directly in your browser without sending it back to a server with every request.</p>
              </section>

              <section id="current" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>3. What We Currently Use</h2>
                <p>The Platform currently uses <strong>strictly necessary storage only</strong>:</p>
                <table className={styles.legalTable}>
                  <thead><tr><th>Type</th><th>Purpose</th><th>Duration</th></tr></thead>
                  <tbody>
                    <tr><td>Authentication session token</td><td>Keeps you logged in so you don't need to re-enter your password on every visit</td><td>Until you log out or the session expires</td></tr>
                    <tr><td>Theme/display preference</td><td>Remembers your display preferences (e.g. light/dark mode, if applicable)</td><td>Persistent until changed</td></tr>
                    <tr><td>Cookie notice acknowledgment</td><td>Remembers that you've seen this notice</td><td>Persistent until cleared</td></tr>
                  </tbody>
                </table>
                <p>These are strictly necessary for the Platform to function and are not used for advertising, cross-site tracking, or sale of your information.</p>
              </section>

              <section id="third" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>4. Third-Party Cookies</h2>
                <p>At this time, the Platform does not use third-party advertising or analytics cookies. If this changes (for example, if we introduce product analytics to improve the Platform), we will update this policy and, where required, request your consent before such technologies are activated.</p>
              </section>

              <section id="managing" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>5. Managing Cookies and Storage</h2>
                <p>Most browsers allow you to view, manage, and delete cookies and local storage through their settings. Please note that clearing your browser's storage for this site will log you out and may reset your preferences.</p>
              </section>

              <section id="changes" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>6. Changes to This Policy</h2>
                <p>We may update this Cookie Policy as the Platform evolves, particularly if we introduce new analytics or tracking technologies. We will update the "Effective Date" above when changes are made.</p>
              </section>

              <section id="contact" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>7. Contact Us</h2>
                <p>Questions about this policy can be directed to:</p>
                <p><strong>hello@naligrid.com</strong><br />NaliTech Consults Limited<br />Abuja, Nigeria</p>
              </section>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
