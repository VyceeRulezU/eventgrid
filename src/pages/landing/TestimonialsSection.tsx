import AnimatedStatValue from '../../components/shared/AnimatedStatValue'
import styles from './TestimonialsSection.module.css'

const TESTIMONIALS = [
  {
    quote:
      'I used to manage five WhatsApp groups per event. Now everything is in one place and my clients think I\'ve upgraded my whole business. Which I have.',
    name: 'Tunde Adeola',
    role: 'Wedding Planner',
    location: 'Lagos',
    image: 'https://images.unsplash.com/photo-1774804819277-09f24510f23e?w=120&q=80&auto=format&fit=crop&crop=faces',
  },
  {
    quote:
      "NaliGrid's financial tracker replaced a spreadsheet I'd been updating manually for 3 years. The balance column calculates itself. I could cry.",
    name: 'Chisom Okafor',
    role: 'Event Planner',
    location: 'Abuja',
    image: 'https://images.unsplash.com/photo-1720010943528-d709a0857650?w=120&q=80&auto=format&fit=crop&crop=faces',
  },
  {
    quote:
      'As a coordinator, the live board changed my event day. I stopped running around shouting into a walkie-talkie and started actually coordinating.',
    name: 'Blessing Nwosu',
    role: 'Event Coordinator',
    location: 'Port Harcourt',
    image: 'https://images.unsplash.com/photo-1661332186404-cfddad48db04?w=120&q=80&auto=format&fit=crop&crop=faces',
  },
  {
    quote:
      'My clients keep asking what software I\'m using because the portal looks so professional. I\'m not telling them. It\'s my competitive advantage.',
    name: 'Adunola Falade',
    role: 'Corporate Event Planner',
    location: 'Lagos',
    image: 'https://images.unsplash.com/photo-1703544022909-6968d29d505e?w=120&q=80&auto=format&fit=crop&crop=faces',
  },
]

const STATS = [
  { value: '100+', label: 'Event companies' },
  { value: '2,800+', label: 'Events coordinated' },
  { value: '₦100m+', label: 'Payments tracked' },
  { value: '4.9', label: 'Average rating' },
]

export default function TestimonialsSection() {
  return (
    <section className={styles.section} id="testimonials">
      {/* Noise overlay */}
      <div className={styles.noise} aria-hidden />

      {/* Gold rule */}
      <div className={styles.accentRule} aria-hidden />

      <div className={styles.container}>

        {/* Header row */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.eyebrow}>Social Proof</span>
            <h2 className={styles.headline}>
              Planners who stopped<br />winging it.
            </h2>
          </div>
          <div className={styles.statsRow}>
            {STATS.map((stat) => (
              <div key={stat.label} className={styles.statItem}>
                <AnimatedStatValue value={stat.value} className={styles.statValue} />
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials grid */}
        <div className={styles.grid}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className={`${styles.card} ${i === 0 ? styles.cardFeatured : ''}`}>
              <div className={styles.quoteIcon} aria-hidden>"</div>
              <blockquote className={styles.quote}>{t.quote}</blockquote>
              <div className={styles.author}>
                <img src={t.image} alt={t.name} className={styles.avatar} loading="lazy" />
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>{t.name}</span>
                  <span className={styles.authorRole}>{t.role} · {t.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
