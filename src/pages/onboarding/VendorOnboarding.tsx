import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, LogOut, ArrowLeft, Star, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { SEO } from '@/components/shared/SEO'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import styles from './Onboarding.module.css'

const VENDOR_CATEGORIES = [
  'Venue',
  'Decor',
  'DJ/Sound/Konga',
  'Food + Catering',
  'Ushering Services',
  'Photography',
  'Videography',
  'Live band',
  'Cakes & Desserts',
  'Security',
  'Drinks Services',
  'Cocktails/Mocktails',
  'Makeup Artist',
  'Hair Stylist',
  'Event Stylist',
  'Wedding dress / Suits',
  'Stage/Lighting Operation',
  'MC / Hypeman',
  'Day-of Coordination',
  'Other Services'
]

export function VendorOnboarding() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [category, setCategory] = useState(VENDOR_CATEGORIES[0])

  const [loading, setLoading] = useState(false)
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const setProfile = useAuthStore((s) => s.setProfile)
  const showToast = useUIStore((s) => s.showToast)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleSubmit = async () => {
    if (!user) return
    if (!name.trim()) {
      showToast({ type: 'error', title: 'Business Name Required', body: 'Please enter your business or vendor name.' })
      return
    }
    setLoading(true)

    const updatePayload: Record<string, unknown> = {
      display_name: name.trim(),
      phone: phone.trim() || null,
      role: 'vendor',
    }

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id)

    if (error) {
      showToast({ type: 'error', title: 'Update failed', body: error.message })
      setLoading(false)
      return
    }

    // Save onboarding completed and role in Supabase Auth user metadata
    const { error: authErr } = await supabase.auth.updateUser({
      data: {
        role: 'vendor',
        onboarding_completed: true,
        vendor_category: category,
        instagram_handle: instagram.trim() || null,
      }
    })

    if (authErr) {
      showToast({ type: 'error', title: 'Session sync failed', body: authErr.message })
    }

    // Update profile in store
    if (profile) {
      setProfile({
        ...profile,
        display_name: name.trim(),
        phone: phone.trim() || null,
        role: 'vendor',
      })
    }

    showToast({ type: 'success', title: 'Vendor profile completed!', body: 'Welcome to the NaliGrid vendor network.' })
    navigate('/dashboard/vendor')
    setLoading(false)
  }

  return (
    <div className={styles.container}>
      <SEO title="Vendor Onboarding" description="Set up your vendor profile and list your services on NaliGrid." />
      {/* ── Left panel ── */}
      <div className={styles.leftPanel}>
        <div className={styles.topBar}>
          <div className={styles.branding}>
            <Link to="/">
              <img src="/ng-logo-wg.svg" alt="NaliGrid Logo" className={styles.brandLogoImage} />
            </Link>
          </div>
          <div className={styles.topRightActions}>
            <Link to="/" className={styles.backToSite}>
              <ArrowLeft size={14} />
              Back to website
            </Link>
          </div>
        </div>

        <div className={styles.leftContent}>
          <div className={styles.welcomeTag}>Vendor Space</div>
          <h1 className={styles.welcomeTitle}>Promote your services</h1>
          <p className={styles.welcomeDesc}>
            Complete your vendor profile to receive bookings from event planners, coordinate day-of operations, and review your collaborations.
          </p>
        </div>

        <div className={styles.leftTestimonial}>
          <div className={styles.testimonialCard}>
            <div className={styles.testimonialStars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={12} fill="currentColor" />
              ))}
            </div>
            <p className={styles.testimonialQuote}>
              "Listing my catering services on NaliGrid has doubled my corporate bookings. Planners assign checklists directly to me."
            </p>
            <div className={styles.testimonialUser}>
              <img className={styles.testimonialAvatar} src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face" alt="Chioma Nnaji" />
              <div className={styles.testimonialDetails}>
                <span className={styles.testimonialName}>Chioma Nnaji</span>
                <span className={styles.testimonialRole}>Catering Director</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.leftFooter}>
          <div className={styles.footerLinks}>
            <a href="#" className={styles.footerLink}>Terms</a>
            <a href="#" className={styles.footerLink}>Privacy Policy</a>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={12} /> Log Out
          </button>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className={styles.rightPanel}>
        <div className={styles.stepHeader}>
          <div className={styles.stepMeta}>
            <span className={styles.stepLabel}>Step 1 of 1 — Vendor Profile</span>
          </div>
        </div>

        <div className={styles.stepContent}>
          <div className={styles.infoBox}>
            <Info size={16} className={styles.infoIcon} />
            <p style={{ margin: 0 }}>
              Your business details will be visible to planners when they search for services and vendors in their directory.
            </p>
          </div>

          <h2 className={styles.question}>Set up your vendor listing</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label className={styles.formLabel} htmlFor="name">
                Business / Vendor Name <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                id="name"
                type="text"
                className={styles.inputField}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Elite Catering Services"
                required
              />
            </div>

            <div>
              <label className={styles.formLabel}>
                Primary Service Category <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <DropdownMenu
                trigger={category}
                items={VENDOR_CATEGORIES.map((cat) => ({ label: cat, value: cat }))}
                onSelect={(item) => setCategory(item.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className={styles.formLabel} htmlFor="phone">
                Phone Number <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                className={styles.inputField}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +234 800 000 0000"
              />
            </div>

            <div>
              <label className={styles.formLabel} htmlFor="instagram">
                Instagram Handle <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                id="instagram"
                type="text"
                className={styles.inputField}
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="e.g. @elite_catering"
              />
            </div>
          </div>
        </div>

        <div className={styles.navRow}>
          <button
            onClick={handleSubmit}
            className={styles.continueBtn}
            disabled={loading || !name.trim()}
          >
            {loading ? 'Saving Details…' : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Complete Setup <ChevronRight size={16} />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
