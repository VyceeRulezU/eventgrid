import styles from './FeatureSpotlightC.module.css'

// For Coordinators — feature cards LEFT (40%), image RIGHT (60%)
const CARDS = [
  {
    icon: '◈',
    title: 'Live Event Board',
    body: 'Every vendor station has a real-time status. Green means ready. Red means act now. No more calling around to find out what\'s happening.',
  },
  {
    icon: '◆',
    title: 'Issue Flagging with Photo',
    body: 'Log any on-site problem instantly — attach a photo, set severity, notify the right person. Issues are tracked, not forgotten in voice notes.',
  },
  {
    icon: '◇',
    title: 'Team Check-In & Attendance',
    body: 'Confirm team arrival, assign roles on the day, and track who is where. Full accountability without the WhatsApp group chaos.',
  },
]

export default function FeatureSpotlightC() {
  return (
    <section className={styles.section} id="spotlight-c">
      <div className={styles.layout}>
        {/* Cards — 40% (left) */}
        <div className={styles.contentPane}>
          <div className={styles.contentInner}>
            <span className={styles.eyebrow}>For Coordinators</span>
            <h2 className={styles.headline}>
              Your job is execution.<br />We built the execution layer.
            </h2>
            <p className={styles.subtext}>
              Coordinators live on-site, on the phone, on their feet. EventGrid gives you a mobile-first operations hub that shows you everything, instantly.
            </p>
            <div className={styles.cardStack}>
              {CARDS.map((card) => (
                <div key={card.title} className={styles.featureCard}>
                  <span className={styles.cardIcon}>{card.icon}</span>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{card.title}</h3>
                    <p className={styles.cardText}>{card.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <a href="#how-it-works" className={styles.ctaLink}>
              See how it works <span aria-hidden>→</span>
            </a>
          </div>
        </div>

        {/* Image — 60% (right) */}
        <div className={styles.imagePane}>
          <img
            src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=85&auto=format&fit=crop"
            alt="On-day event coordination and vendor management"
            className={styles.eventImage}
            loading="lazy"
          />
          <div className={styles.imageOverlay}>
            <span className={styles.overlayLabel}>For Coordinators</span>
          </div>
        </div>
      </div>
    </section>
  )
}
