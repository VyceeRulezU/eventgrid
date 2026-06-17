import { Link } from 'react-router-dom'
import styles from './RoleSection.module.css'

const IMAGES: Record<string, string> = {
  Planner: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80&auto=format&fit=crop',
  Coordinator: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80&auto=format&fit=crop',
  Vendor: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80&auto=format&fit=crop',
  Client: 'https://images.unsplash.com/photo-1695281536457-01f9a07c575b?w=800&q=80&auto=format&fit=crop',
}

export default function RoleSection() {
  const cards = [
    {
      title: 'Planner',
      desc: 'You manage the full event lifecycle — from client to closeout.',
      linkText: 'Start as Planner →',
      to: '/register',
    },
    {
      title: 'Coordinator',
      desc: 'You run the day. Tasks, vendors, team, live board. All yours.',
      linkText: 'Start as Coordinator →',
      to: '/register',
    },
    {
      title: 'Vendor',
      desc: 'You deliver the service. NaliGrid keeps you informed and on time.',
      linkText: 'Join as Vendor →',
      to: '/register',
    },
    {
      title: 'Client',
      desc: "You're trusting someone with your big day. See exactly where things stand.",
      linkText: 'Ask your planner →',
      to: '/register',
    },
  ]

  return (
    <section className={styles.section} id="roles">
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.header}>
          <span className={styles.sectionLabel}>Who It's For</span>
          <h2 className={styles.headline}>Built for every role in the event ecosystem.</h2>
        </div>

        {/* 2x2 Card Grid */}
        <div className={styles.grid}>
          {cards.map((card, index) => (
            <Link key={index} to={card.to} className={styles.card}>
              <div className={styles.cardImage}>
                <img src={IMAGES[card.title]} alt={card.title} loading="lazy" />
                <div className={styles.cardOverlay} />
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.cardDesc}>{card.desc}</p>
                <span className={styles.cardLink}>{card.linkText}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
