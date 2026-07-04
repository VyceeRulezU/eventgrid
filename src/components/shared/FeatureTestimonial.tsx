import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from '@/pages/features/FeaturesLanding.module.css'

interface Testimonial {
  name: string
  role: string
  quote: string
  image_url: string
}

const FALLBACKS: Testimonial[] = [
  {
    name: 'Tolu & Chioma',
    role: 'Founders, Premium Nuptials',
    quote: '"NaliGrid has completely changed how we coordinate weddings in Lagos. Our clients love the live timeline tracker!"',
    image_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face',
  },
  {
    name: 'Blessing Nwosu',
    role: 'Event Coordinator, Port Harcourt',
    quote: '"As a coordinator, the live board changed my event day. I stopped running around shouting into a walkie-talkie and started actually coordinating."',
    image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  },
  {
    name: 'Adunola Falade',
    role: 'Corporate Event Planner, Lagos',
    quote: '"My clients keep asking what software I\'m using because the portal looks so professional. I\'m not telling them. It\'s my competitive advantage."',
    image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face',
  },
  {
    name: 'Halima',
    role: 'Lead Coordinator, Oasis Event Architects',
    quote: '"The vendor directory and chat interface saved us days of calls for our Abuja conference."',
    image_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
  },
  {
    name: 'Chinedu',
    role: 'Managing Director, Innovate Africa Events',
    quote: '"Managing financials and tracking payments for corporate events used to be a nightmare. Now, it\'s fully automated."',
    image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  },
]

export function FeatureTestimonial() {
  const [t, setT] = useState<Testimonial | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.from('testimonials').select('name, role, quote, image_url')
      if (cancelled) return
      if (error || !data || data.length === 0) {
        const pick = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)]
        setT(pick)
        return
      }
      const pick = data[Math.floor(Math.random() * data.length)]
      setT({ name: pick.name, role: `${pick.role}${pick.location ? ', ' + pick.location : ''}`, quote: `"${pick.quote}"`, image_url: pick.image_url })
    })()
    return () => { cancelled = true }
  }, [])

  if (!t) return null

  return (
    <div className={styles.testimonialCard}>
      <p className={styles.testimonialQuote}>{t.quote}</p>
      <div className={styles.testimonialAuthor}>
        <img className={styles.testimonialAvatar} src={t.image_url} alt={t.name} loading="lazy" />
        <div className={styles.testimonialMeta}>
          <span className={styles.testimonialName}>{t.name}</span>
          <span className={styles.testimonialRole}>{t.role}</span>
        </div>
      </div>
    </div>
  )
}
