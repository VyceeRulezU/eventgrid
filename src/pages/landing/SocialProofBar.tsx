import styles from './SocialProofBar.module.css'

export default function SocialProofBar() {
  const stats = [
    { number: '500+', label: 'Events Managed' },
    { number: '₦2.4B+', label: 'Tracked' },
    { number: '4', label: 'Cities' },
    { number: '98%', label: 'Planner Retention' },
    { number: 'Rated 4.9 / 5', label: 'By Top Planners' },
  ]

  return (
    <section className={styles.section} aria-label="Platform credentials">
      <div className={styles.container}>
        <div className={styles.grid}>
          {stats.map((stat, idx) => (
            <div key={idx} className={styles.statItem}>
              <span className={styles.number}>{stat.number}</span>
              <span className={styles.label}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
