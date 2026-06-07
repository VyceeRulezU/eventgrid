import styles from './FeatureSpotlightD.module.css'

// For Your Business — image LEFT (60%), feature cards RIGHT (40%)
const CARDS = [
  {
    icon: '◈',
    title: 'P&L Per Event',
    body: 'Know your actual margin after every event. Revenue, vendor costs, and fees reconciled automatically — so you know what you actually made.',
  },
  {
    icon: '◆',
    title: 'Vendor Rating History',
    body: 'Rate every vendor after each event. Build a private performance record so you never rebook a vendor who let you down at the last minute.',
  },
  {
    icon: '◇',
    title: 'Event Templates & Reports',
    body: 'Turn every event into a reusable template. Start your next event from what worked — with a full photo log and client satisfaction score attached.',
  },
]

export default function FeatureSpotlightD() {
  return (
    <section className={styles.section} id="spotlight-d">
      <div className={styles.layout}>
        {/* Image — 60% (left) */}
        <div className={styles.imagePane}>
          <img
            src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=85&auto=format&fit=crop"
            alt="Guests celebrating at a beautifully executed event"
            className={styles.eventImage}
            loading="lazy"
          />
          <div className={styles.imageOverlay}>
            <span className={styles.overlayLabel}>For Your Business</span>
          </div>
        </div>

        {/* Cards — 40% (right) */}
        <div className={styles.contentPane}>
          <div className={styles.contentInner}>
            <span className={styles.eyebrow}>For Your Business</span>
            <h2 className={styles.headline}>
              Every event builds something.<br />Make sure it's your reputation.
            </h2>
            <p className={styles.subtext}>
              EventGrid turns every event into a portfolio entry — with photos, vendor ratings, budget performance, and client satisfaction. Run better events. Grow faster.
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
