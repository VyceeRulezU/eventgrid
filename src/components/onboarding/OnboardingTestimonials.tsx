import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from '@/pages/onboarding/Onboarding.module.css'

interface Testimonial {
  id: string
  name: string
  role: string
  quote: string
  image_url: string
}

const FALLBACK: Testimonial[] = [
  {
    id: 'fb-1',
    name: 'Funmi Oladipupo',
    role: 'Creative Director, Elegance Events',
    quote: 'NaliGrid scaled our wedding coordination efficiency. We managed 25 premium weddings in Lagos last year alone!',
    image_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: 'fb-2',
    name: 'Chioma Nnaji',
    role: 'Catering Director',
    quote: 'Listing my catering services on NaliGrid has doubled my corporate bookings. Planners assign checklists directly to me.',
    image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: 'fb-3',
    name: 'Tobi Adeleke',
    role: 'Lead Day-of Coordinator',
    quote: 'NaliGrid keeps my event day tasks completely organized. I can view the timeline on my phone and update checklists in real-time.',
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: 'fb-4',
    name: 'Halima',
    role: 'Lead Coordinator, Oasis Event Architects',
    quote: 'The vendor directory and chat interface saved us days of calls for our Abuja conference.',
    image_url: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: 'fb-5',
    name: 'Tolu & Chioma',
    role: 'Founders, Premium Nuptials',
    quote: 'NaliGrid has completely changed how we coordinate weddings in Lagos. Our clients love the live timeline tracker!',
    image_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face',
  },
]

let seeded = false
function seededShuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor((seeded ? 0.5 : Math.random()) * (i + 1))
    seeded = true
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function OnboardingTestimonials() {
  const [entries, setEntries] = useState<Testimonial[]>(FALLBACK)

  useEffect(() => {
    supabase
      .from('testimonials')
      .select('*')
      .order('display_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setEntries(
            data.map((t) => ({
              id: t.id,
              name: t.name,
              role: t.role,
              quote: t.quote,
              image_url: t.image_url,
            }))
          )
        }
      })
  }, [])

  const random = seededShuffle(entries)
  const t = random[0]

  if (!t) return null

  return (
    <div className={styles.leftTestimonial}>
      <div className={styles.testimonialCard}>
        <div className={styles.testimonialStars}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={12} fill="currentColor" />
          ))}
        </div>
        <p className={styles.testimonialQuote}>"{t.quote}"</p>
        <div className={styles.testimonialUser}>
          {t.image_url ? (
            <img className={styles.testimonialAvatar} src={t.image_url} alt={t.name} />
          ) : (
            <div className={styles.testimonialAvatar}>
              {t.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className={styles.testimonialDetails}>
            <span className={styles.testimonialName}>{t.name}</span>
            <span className={styles.testimonialRole}>{t.role}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
