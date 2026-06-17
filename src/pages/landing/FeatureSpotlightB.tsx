import styles from './FeatureSpotlightB.module.css'

// For Planners — image LEFT (60%), feature cards RIGHT (40%)
const CARDS = [
  {
    icon: '◈',
    title: 'Full 9-Phase Pipeline',
    body: 'Every event follows a structured journey — from lead capture to aftermath review. No phase gets skipped, no detail gets missed.',
  },
  {
    icon: '◆',
    title: 'Naira Financial Ledger',
    body: 'Track every payment, advance, and balance in real time. Your P&L per event, visible only to you — not your coordinators or vendors.',
  },
  {
    icon: '◇',
    title: 'Client Portal Included',
    body: 'Share a link. Your client sees phase progress, approves decisions, and stops calling you for updates — all from one clean view.',
  },
]

export default function FeatureSpotlightB() {
  return (
    <section className={styles.section} id="spotlight-b">
      <div className={styles.layout}>
        {/* Image — 60% */}
        <div className={styles.imagePane}>
          <img
            src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=85&auto=format&fit=crop"
            alt="Premium wedding reception event setup"
            className={styles.eventImage}
            loading="lazy"
          />
          <div className={styles.imageOverlay}>
            <span className={styles.overlayLabel}>For Event Planners</span>
          </div>
        </div>

        {/* Cards — 40% */}
        <div className={styles.contentPane}>
          <div className={styles.contentInner}>
            <span className={styles.eyebrow}>For Planners</span>
            <h2 className={styles.headline}>
              Stop managing chaos.<br />Start running events.
            </h2>
            <p className={styles.subtext}>
              NaliGrid gives planners a single command centre for every event — from the client's first message to final payment.
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
      </div>
    </section>
  )
}
