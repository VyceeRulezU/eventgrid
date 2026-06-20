import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import styles from '@/pages/auth/Auth.module.css'

import weddingImg from '@/assets/images/wedding_event_hall.png'
import corporateImg from '@/assets/images/corporate_event_hall.png'
import traditionalImg from '@/assets/images/traditional_event.png'

interface AuthTestimonial {
  id: string
  name: string
  role: string
  quote: string
  image_url: string
}

const BACKGROUNDS = [weddingImg, corporateImg, traditionalImg]

const FALLBACK: AuthTestimonial[] = [
  {
    id: 'fb-1',
    name: 'Tolu & Chioma',
    role: 'Founders, Premium Nuptials',
    quote: 'NaliGrid has completely changed how we coordinate weddings in Lagos. Our clients love the live timeline tracker!',
    image_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: 'fb-2',
    name: 'Chinedu',
    role: 'Managing Director, Innovate Africa Events',
    quote: "Managing financials and tracking payments for corporate events used to be a nightmare. Now, it's fully automated.",
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: 'fb-3',
    name: 'Halima',
    role: 'Lead Coordinator, Oasis Event Architects',
    quote: 'The vendor directory and chat interface saved us days of calls for our Abuja conference.',
    image_url: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=100&h=100&fit=crop&crop=face',
  },
]

export function AuthTestimonials() {
  const [slides, setSlides] = useState<AuthTestimonial[]>(FALLBACK)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    supabase
      .from('testimonials')
      .select('*')
      .order('display_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setSlides(
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

  useEffect(() => {
    if (slides.length === 0) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  const slide = slides[currentSlide]
  if (!slide) return null

  return (
    <div className={styles.leftPanel}>
      <div className={styles.floatingCard}>
        <div className={styles.sliderContainer}>
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`${styles.slide} ${idx === currentSlide ? styles.slideActive : ''}`}
              style={
                idx <= currentSlide
                  ? { backgroundImage: `url(${BACKGROUNDS[idx % BACKGROUNDS.length]})` }
                  : undefined
              }
            />
          ))}
        </div>
        <div className={styles.overlay} />

        <div className={styles.leftContent}>
          <div className={styles.branding}>
            <Link to="/">
              <img src="/EventGrid-logo-white.svg" alt="NaliGrid Logo" className={styles.brandLogoImage} />
            </Link>
          </div>

          <div className={styles.testimonialWrapper}>
            <div className={styles.testimonialCard}>
              <div className={styles.stars}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" />
                ))}
              </div>
              <p className={styles.quoteText}>"{slide.quote}"</p>

              <div className={styles.authorInfo}>
                {slide.image_url ? (
                  <img loading="lazy" className={styles.authorAvatar} src={slide.image_url} alt={slide.name} />
                ) : (
                  <div className={styles.authorAvatar}>
                    {slide.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className={styles.authorDetails}>
                  <span className={styles.authorName}>{slide.name}</span>
                  <span className={styles.authorRole}>{slide.role}</span>
                </div>
              </div>
            </div>

            <div className={styles.sliderDots}>
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`${styles.dot} ${idx === currentSlide ? styles.dotActive : ''}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
