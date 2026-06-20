import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AnimatedStatValue from '../../components/shared/AnimatedStatValue'
import styles from './TestimonialsSection.module.css'

interface Testimonial {
  id: string
  name: string
  role: string
  location: string
  quote: string
  image_url: string
  display_order: number
  is_featured: boolean
}

const FALLBACK: Testimonial[] = [
  {
    id: 'fb-1',
    quote: 'I used to manage five WhatsApp groups per event. Now everything is in one place and my clients think I\'ve upgraded my whole business. Which I have.',
    name: 'Tunde Adeola',
    role: 'Wedding Planner',
    location: 'Lagos',
    image_url: 'https://images.unsplash.com/photo-1774804819277-09f24510f23e?w=120&q=80&auto=format&fit=crop&crop=faces',
    display_order: 0,
    is_featured: true,
  },
  {
    id: 'fb-2',
    quote: 'NaliGrid\'s financial tracker replaced a spreadsheet I\'d been updating manually for 3 years. The balance column calculates itself. I could cry.',
    name: 'Chisom Okafor',
    role: 'Event Planner',
    location: 'Abuja',
    image_url: 'https://images.unsplash.com/photo-1720010943528-d709a0857650?w=120&q=80&auto=format&fit=crop&crop=faces',
    display_order: 1,
    is_featured: false,
  },
  {
    id: 'fb-3',
    quote: 'As a coordinator, the live board changed my event day. I stopped running around shouting into a walkie-talkie and started actually coordinating.',
    name: 'Blessing Nwosu',
    role: 'Event Coordinator',
    location: 'Port Harcourt',
    image_url: 'https://images.unsplash.com/photo-1661332186404-cfddad48db04?w=120&q=80&auto=format&fit=crop&crop=faces',
    display_order: 2,
    is_featured: false,
  },
  {
    id: 'fb-4',
    quote: 'My clients keep asking what software I\'m using because the portal looks so professional. I\'m not telling them. It\'s my competitive advantage.',
    name: 'Adunola Falade',
    role: 'Corporate Event Planner',
    location: 'Lagos',
    image_url: 'https://images.unsplash.com/photo-1703544022909-6968d29d505e?w=120&q=80&auto=format&fit=crop&crop=faces',
    display_order: 3,
    is_featured: false,
  },
]

const STATS = [
  { value: '100+', label: 'Event companies' },
  { value: '2,800+', label: 'Events coordinated' },
  { value: '₦100m+', label: 'Payments tracked' },
  { value: '4.9', label: 'Average rating' },
]

export default function TestimonialsSection() {
  const [items, setItems] = useState(FALLBACK)

  useEffect(() => {
    supabase
      .from('testimonials')
      .select('*')
      .order('display_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const sorted = [...data].sort((a, b) => {
            if (a.is_featured && !b.is_featured) return -1
            if (!a.is_featured && b.is_featured) return 1
            return a.display_order - b.display_order
          })
          setItems(sorted)
        }
      })
  }, [])

  return (
    <section className={styles.section} id="testimonials">
      <div className={styles.noise} aria-hidden />
      <div className={styles.accentRule} aria-hidden />
      <div className={styles.container}>
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

        <div className={styles.grid}>
          {items.map((t, i) => (
            <div key={t.id} className={`${styles.card} ${i === 0 ? styles.cardFeatured : ''}`}>
              <div className={styles.quoteIcon} aria-hidden>"</div>
              <blockquote className={styles.quote}>{t.quote}</blockquote>
              <div className={styles.author}>
                {t.image_url ? (
                  <img src={t.image_url} alt={t.name} className={styles.avatar} loading="lazy" />
                ) : (
                  <div className={styles.avatarPlaceholder}>{t.name.charAt(0)}</div>
                )}
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>{t.name}</span>
                  <span className={styles.authorRole}>{t.role}{t.role && t.location ? ' · ' : ''}{t.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
