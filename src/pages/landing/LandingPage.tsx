import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  LayoutDashboard, Star, Play,
  Calendar, Users, Wallet, Radio,
  ClipboardList, FileText, CreditCard
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { LandingNavbar } from '@/components/layout/LandingNavbar'
import { LandingFooter } from '@/components/layout/LandingFooter'
import styles from './LandingPage.module.css'

const HERO_BG =
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1600&auto=format&fit=crop&q=80'

const ROLE_CARDS = [
  { title: 'Planners', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80' },
  { title: 'Coordinators', image: 'https://images.unsplash.com/photo-1528605248644-14dd0422be468?w=600&auto=format&fit=crop&q=80' },
  { title: 'Vendors', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop&q=80' },
  { title: 'Clients', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&auto=format&fit=crop&q=80' },
  { title: 'Venues', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&auto=format&fit=crop&q=80' },
  { title: 'Caterers', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&auto=format&fit=crop&q=80' },
]

const LAPTOP_CARDS = [
  { label: 'Wedding', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=300&auto=format&fit=crop&q=80' },
  { label: 'Corporate', image: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=300&auto=format&fit=crop&q=80' },
  { label: 'Birthday', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=300&auto=format&fit=crop&q=80' },
  { label: 'Gala', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=300&auto=format&fit=crop&q=80' },
]

const STATS = [
  { value: '9', label: 'Event phases tracked' },
  { value: '₦0', label: 'Monthly subscription' },
  { value: '100%', label: 'Naira-native payments' },
]

const FEATURES = [
  { icon: Calendar, title: '9-Phase Pipeline', desc: 'From lead onboarding to post-event analysis — every stage mapped and tracked.' },
  { icon: Radio, title: 'Live Event Board', desc: 'Real-time status monitoring on event day. No more frantic phone calls.' },
  { icon: Wallet, title: 'Naira Financials', desc: 'Track deposits, balances, and vendor payouts in ₦ — planner-only access.' },
  { icon: Users, title: 'Guest Management', desc: 'RSVP tracking, seating plans, CSV import, and live check-in on event day.' },
  { icon: ClipboardList, title: 'Vendor Directory', desc: 'Source, quote, book, and pay vendors — all linked to event deliverables.' },
  { icon: FileText, title: 'Aftermath Reports', desc: 'One-click PDF reports with photos, budgets, and lessons learned.' },
  { icon: CreditCard, title: 'Paystack & Flutterwave', desc: 'Accept card, bank transfer, and USSD payments seamlessly.' },
  { icon: Users, title: 'Client Portal', desc: 'Token-based read-only access so clients stay informed without the noise.' },
  { icon: ClipboardList, title: 'Task Board', desc: 'Kanban-style task management per event for your entire team.' },
]

const REVIEWS = [
  { name: 'Tolani Alao', initial: 'T', text: 'EventGrid transformed our wedding planning. Tracking vendor deposits in Naira on one dashboard saved us from Excel chaos.' },
  { name: 'Emeka Okafor', initial: 'E', text: 'The live board on event day is a game changer. Coordinators knew exactly when vendors arrived without a single call.' },
  { name: 'Aisha Bello', initial: 'A', text: 'Clients love the read-only portal. Daily WhatsApp check-ins dropped by 80% since we started using EventGrid.' },
  { name: 'Oluchi Amadi', initial: 'O', text: 'Single-click budget tracking and client portals that actually impress. Built for how Nigerian planners really work.' },
  { name: 'Chidi Nwosu', initial: 'C', text: 'Finally replaced our WhatsApp threads and spreadsheets. The 9-phase tracker keeps every event on schedule.' },
]

const SUCCESS_IMAGE =
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&auto=format&fit=crop&q=80'

const DUAL_CTA = [
  { title: 'Try It Free', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop&q=80', to: '/register' },
  { title: 'For Members', image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80', to: '/login' },
]

const VIDEO_IMAGE =
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&auto=format&fit=crop&q=80'

export function LandingPage() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const isLoggedIn = !!user

  return (
    <div className={styles.page}>
      <Helmet>
        <title>EventGrid — Software for Event Pros</title>
        <meta
          name="description"
          content="The premium event management platform built for Nigerian planners, coordinators, vendors, and clients."
        />
      </Helmet>

      <LandingNavbar />

      {/* Hero */}
      <section className={styles.hero}>
        <div
          className={styles.heroBg}
          style={{ backgroundImage: `url(${HERO_BG})` }}
          role="img"
          aria-label="Event professional working in a bright studio"
        />
        <div className={styles.heroOverlay} aria-hidden="true" />
        <div className={styles.heroContent}>
          <div className={styles.heroLayout}>
            <div className={styles.heroCtaWrap}>
              {isLoggedIn ? (
                <Link to={`/dashboard/${role || 'planner'}`} className={styles.btnGold}>
                  <LayoutDashboard size={18} />
                  Go to Dashboard
                </Link>
              ) : (
                <Link to="/register" className={styles.btnGold}>
                  Get Started
                </Link>
              )}
            </div>
            <h1 className={styles.heroTitle}>Software for Event Pros</h1>
          </div>
        </div>
      </section>

      {/* Built for every event professional */}
      <section className={styles.builtFor} id="roles">
        <div className={styles.sectionInner}>
          <h2 className={styles.builtForTitle}>Built for Every Event Professional</h2>
          <p className={styles.builtForDesc}>
            EventGrid brings planners, coordinators, vendors, and clients onto one premium platform —
            replacing WhatsApp threads, Excel sheets, and phone-call confirmations with a single source of truth.
          </p>
          {!isLoggedIn && (
            <Link to="/register" className={styles.btnGold}>
              Get Started
            </Link>
          )}
        </div>

        {/* Laptop mockup */}
        <div className={styles.laptopWrap}>
          <div className={styles.laptop}>
            <div className={styles.laptopScreen}>
              {LAPTOP_CARDS.map((card) => (
                <div key={card.label} className={styles.laptopCard}>
                  <div
                    className={styles.laptopCardImg}
                    style={{ backgroundImage: `url(${card.image})` }}
                  />
                  <div className={styles.laptopCardLabel}>{card.label}</div>
                </div>
              ))}
            </div>
            <div className={styles.laptopBase} aria-hidden="true" />
          </div>
          <div className={styles.laptopShadow} aria-hidden="true" />
        </div>

        {/* Role category grid */}
        <div className={styles.roleGrid}>
          {ROLE_CARDS.map((card) => (
            <div key={card.title} className={styles.roleCard}>
              <img src={card.image} alt="" className={styles.roleCardImg} loading="lazy" />
              <div className={styles.roleCardOverlay}>
                <h3 className={styles.roleCardTitle}>{card.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Success story */}
      <section className={styles.success}>
        <div className={styles.successImageWrap}>
          <img
            src={SUCCESS_IMAGE}
            alt="Bride at a Nigerian wedding celebration"
            className={styles.successImage}
            loading="lazy"
          />
          <div className={styles.successFloatCard}>
            <div className={styles.successFloatName}>Amadi × Okonkwo Wedding</div>
            <div className={styles.successFloatMeta}>120 guests · Transcorp Hilton, Abuja</div>
          </div>
        </div>
        <div className={styles.successQuote}>
          <blockquote className={styles.successQuoteText}>
            I saved 18 hours per event my first month using EventGrid
          </blockquote>
          <Link to="/register" className={styles.btnGold}>
            Get Started
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <section className={styles.stats} aria-label="Platform highlights">
        <div className={styles.statsGrid}>
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className={styles.features} id="features">
        <div className={styles.sectionInner}>
          <div className={styles.featureGrid}>
            {FEATURES.map((feature) => (
              <div key={feature.title} className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <feature.icon size={20} />
                </div>
                <div>
                  <h3 className={styles.featureTitle}>{feature.title}</h3>
                  <p className={styles.featureDesc}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={styles.pricing} id="pricing">
        <div className={styles.sectionInner}>
          <h2 className={styles.pricingTitle}>Simple, Per-Event Pricing</h2>
          <p className={styles.pricingDesc}>Pay only when you activate an event. No monthly subscriptions.</p>
          <div className={styles.pricingGrid}>
            {[
              { tier: 'Free Draft', price: '₦0', guests: 'Explore risk-free' },
              { tier: 'Intimate', price: '₦5,000', guests: 'Under 100 guests' },
              { tier: 'Standard', price: '₦10,000', guests: '100–300 guests', highlight: true },
              { tier: 'Large', price: '₦15,000', guests: '300+ / corporate' },
            ].map((plan) => (
              <div
                key={plan.tier}
                className={`${styles.pricingCard} ${plan.highlight ? styles.pricingCardHighlight : ''}`}
              >
                <div className={styles.pricingTier}>{plan.tier}</div>
                <div className={styles.pricingPrice}>{plan.price}</div>
                <div className={styles.pricingGuests}>{plan.guests}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dual CTA */}
      <section className={styles.dualCta}>
        {DUAL_CTA.map((card) => (
          <Link key={card.title} to={card.to} className={styles.dualCard}>
            <div
              className={styles.dualCardBg}
              style={{ backgroundImage: `url(${card.image})` }}
            />
            <div className={styles.dualCardOverlay} aria-hidden="true" />
            <h3 className={styles.dualCardTitle}>{card.title}</h3>
          </Link>
        ))}
      </section>

      {/* Reviews row 1 */}
      <section className={styles.reviews} aria-label="Customer reviews">
        <div className={styles.reviewsTrack}>
          <div className={`${styles.reviewCard} ${styles.reviewCardWide}`}>
            <div className={styles.reviewGoogle}>
              <span className={styles.reviewGoogleLogo}>Google</span>
              <div className={styles.reviewStars} aria-label="5 out of 5 stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="#F4B400" color="#F4B400" />
                ))}
              </div>
            </div>
            <p className={styles.reviewText}>
              Rated 5 stars by Nigerian event professionals on Google Reviews
            </p>
          </div>
          {REVIEWS.map((review) => (
            <div key={review.name} className={styles.reviewCard}>
              <div className={styles.reviewAvatar}>{review.initial}</div>
              <div className={styles.reviewName}>{review.name}</div>
              <div className={styles.reviewStars} aria-hidden="true">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} fill="#F4B400" color="#F4B400" />
                ))}
              </div>
              <p className={styles.reviewText}>"{review.text}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* Video testimonial */}
      <section className={styles.videoSection}>
        <div className={styles.videoThumb}>
          <img
            src={VIDEO_IMAGE}
            alt="Event planner sharing her experience"
            className={styles.videoThumbImg}
            loading="lazy"
          />
          <div className={styles.videoPlay} aria-hidden="true">
            <div className={styles.videoPlayBtn}>
              <Play size={24} fill="currentColor" />
            </div>
          </div>
        </div>
        <div className={styles.videoQuote}>
          <blockquote className={styles.videoQuoteText}>
            "EventGrid gave me back my weekends. No more 2am WhatsApp threads."
          </blockquote>
        </div>
      </section>

      {/* Reviews row 2 */}
      <section className={styles.reviewsAlt} aria-label="More customer reviews">
        <div className={styles.reviewsTrack}>
          {REVIEWS.slice(0, 3).map((review) => (
            <div key={`alt-${review.name}`} className={styles.reviewCard}>
              <div className={styles.reviewAvatar}>{review.initial}</div>
              <div className={styles.reviewName}>{review.name}</div>
              <div className={styles.reviewStars} aria-hidden="true">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} fill="#F4B400" color="#F4B400" />
                ))}
              </div>
              <p className={styles.reviewText}>"{review.text}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pre-footer CTA */}
      <section className={styles.preFooter}>
        <Link to="/register" className={`${styles.btnGold} ${styles.preFooterBtn}`}>
          Try It Free
        </Link>
      </section>

      <LandingFooter />
    </div>
  )
}
