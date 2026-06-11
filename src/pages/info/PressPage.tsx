import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import Footer from '@/pages/landing/Footer'
import { Download, FileText, Image } from 'lucide-react'
import styles from './InfoPages.module.css'

export function PressPage() {
  return (
    <div className={styles.pageWrapper}>
      <Navbar />
      
      <LandingPageHero
        eyebrow="Press Kit"
        title="EventGrid Media Assets"
        subtitle="Access official logos, brand colors, executive headshots, and event operations research papers for media coverage."
      />

      {/* Media Assets Section */}
      <section className={styles.assetsSection} aria-label="Media assets list">
        <div className={styles.container}>
          <div className={styles.cardsGrid}>
            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <Image size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Brand Logo Package</h3>
              <p className={styles.cardDesc}>
                Includes high-resolution SVG and PNG logos in dark, light, and gold formats, plus app icon layouts.
              </p>
              <button className={styles.downloadBtn} id="download-logo-pkg">
                <Download size={14} /> Download ZIP
              </button>
            </div>

            <div className={styles.card}>
              <div className={`${styles.iconWrap} ${styles.goldGlow}`}>
                <FileText size={22} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>Press Release Archive</h3>
              <p className={styles.cardDesc}>
                Read about our recent feature releases, vendor milestones, fintech escrow licensing, and funding announcements.
              </p>
              <button className={styles.downloadBtn} id="download-press-archive">
                <Download size={14} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      </section>

      <FaqSection
        items={[
          {
            category: 'Press & Media',
            items: [
              {
                question: 'How do I request an interview?',
                answer: 'Send an email to press@eventgrid.ng with your publication details, story angle, and deadline.'
              },
              {
                question: 'Can I use EventGrid logos and assets?',
                answer: 'Yes, our brand assets are available for download in the Press Kit section above. Please follow our brand guidelines.'
              }
            ]
          }
        ]}
        header="Frequently Asked Questions"
        summary="Common questions for press and media."
      />

      <LandingCTA
        title="Looking for media comments?"
        description="For press inquiries, exclusive updates, or interview coordination with our leadership, email us."
        primaryText="Contact Press Team"
        primaryHref="mailto:press@eventgrid.ng"
      />

      <Footer />
    </div>
  )
}
