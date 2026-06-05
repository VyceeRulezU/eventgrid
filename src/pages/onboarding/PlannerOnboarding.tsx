import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X, Info, Sparkles, ChevronRight, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import styles from './Onboarding.module.css'

export function PlannerOnboarding() {
  const [step, setStep] = useState(1)
  
  // Form States
  const [experience, setExperience] = useState('boutique_weddings')
  const [orgName, setOrgName] = useState('')
  const [city, setCity] = useState('Lagos')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [volume, setVolume] = useState('1-10')
  
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const user = useAuthStore((s) => s.user)
  const setOrg = useAuthStore((s) => s.setOrg)
  const showToast = useUIStore((s) => s.showToast)
  const navigate = useNavigate()

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showToast({ type: 'error', title: 'File too large', body: 'Logo must be under 2MB' })
      return
    }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)

    let logoUrl: string | null = null

    if (logoFile && logoPreview) {
      const ext = logoFile.name.split('.').pop()
      const path = `org-logos/${user.id}-${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('org-assets')
        .upload(path, logoFile, { upsert: true })

      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage
          .from('org-assets')
          .getPublicUrl(path)
        logoUrl = publicUrl
      }
    }

    const { data: org, error } = await supabase
      .rpc('create_org', {
        p_name: orgName,
        p_owner_id: user.id,
        p_city: city,
        p_logo_url: logoUrl,
      })

    if (error || !org) {
      showToast({ type: 'error', title: 'Failed to create organization', body: error?.message })
      setLoading(false)
      return
    }

    const orgData = org as { id: string; name: string; logo_url: string | null }
    
    // Save metadata locally to profiles if needed or log it
    await supabase
      .from('profiles')
      .update({
        user_metadata: {
          ...user.user_metadata,
          onboarding_completed: true,
          planner_experience: experience,
          expected_volume: volume,
        }
      })
      .eq('id', user.id)

    setOrg(orgData)
    showToast({ type: 'success', title: 'Welcome to EventGrid!', body: 'Organization set up successfully.' })
    navigate('/dashboard/planner')
    setLoading(false)
  }

  const handleNext = () => {
    if (step === 2 && !orgName.trim()) {
      showToast({ type: 'error', title: 'Organization Name Required', body: 'Please enter a name for your business.' })
      return
    }
    if (step < 3) {
      setStep((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1)
    }
  }

  return (
    <div className={styles.container}>
      {/* Left branding welcome panel */}
      <div className={styles.leftPanel}>
        <div className={styles.branding}>
          <div className={styles.brandLogo}>EG</div>
          <span className={styles.brandName}>EventGrid</span>
        </div>

        <div className={styles.leftContent}>
          <div className={styles.welcomeTag}>Get Started</div>
          <h1 className={styles.welcomeTitle}>Let's set up your workspace</h1>
          <p className={styles.welcomeDesc}>
            Join over 1,500 event planning agencies across Nigeria. Configure your workspace details to start inviting clients and managing payments.
          </p>
        </div>

        <div className={styles.leftTestimonial}>
          <p className={styles.testimonialQuote}>
            "EventGrid scaled our wedding coordination efficiency. We managed 25 premium weddings in Lagos last year alone!"
          </p>
          <div className={styles.testimonialUser}>
            <div className={styles.testimonialAvatar}>FO</div>
            <div className={styles.testimonialDetails}>
              <span className={styles.testimonialName}>Funmi Oladipupo</span>
              <span className={styles.testimonialRole}>Creative Director, Elegance Events</span>
            </div>
          </div>
        </div>

        <div className={styles.leftFooter}>
          <a href="#" className={styles.footerLink}>Terms</a>
          <a href="#" className={styles.footerLink}>Privacy Policy</a>
          <button onClick={handleLogout} className={styles.footerLink} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <LogOut size={12} /> Log Out
          </button>
        </div>
      </div>

      {/* Right panel: Wizard stepper */}
      <div className={styles.rightPanel}>
        <div className={styles.cardPanel}>
          {/* Progress Indicators */}
          <div className={styles.stepper}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`${styles.stepDot} ${s === step ? styles.stepDotActive : styles.stepDotInactive}`}
              />
            ))}
          </div>

          {step === 1 && (
            <div>
              <div className={styles.infoBox}>
                <Info size={18} className={styles.infoIcon} />
                <p>
                  Setting up your profile allows us to customize budget templates, local checklists, and contracts specifically for your agency.
                </p>
              </div>

              <h2 className={styles.question}>What best describes your event focus?</h2>

              <div className={styles.optionList}>
                {[
                  { id: 'boutique_weddings', title: 'Luxury & Boutique Weddings', desc: 'Custom high-end wedding planning for selective couples' },
                  { id: 'corporate_events', title: 'Corporate & Tech Events', desc: 'Product launches, annual dinners, AGMs, and conferences' },
                  { id: 'social_celebrations', title: 'Social Celebrations & Galas', desc: 'Birthdays, anniversaries, traditional celebrations' },
                  { id: 'all_rounder', title: 'General Event Planner', desc: 'We handle weddings, corporates, and everything in between' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    className={`${styles.optionCard} ${experience === opt.id ? styles.optionCardActive : ''}`}
                    onClick={() => setExperience(opt.id)}
                  >
                    <div className={styles.optionDetails}>
                      <span className={styles.optionTitle}>{opt.title}</span>
                      <span className={styles.optionDesc}>{opt.desc}</span>
                    </div>
                    <div className={styles.radioIndicator}>
                      <div className={styles.radioIndicatorInner} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className={styles.infoBox}>
                <Sparkles size={18} className={styles.infoIcon} style={{ color: 'var(--color-accent)' }} />
                <p>
                  This information will be displayed on client collaboration portals, automated invoices, and vendor briefs.
                </p>
              </div>

              <h2 className={styles.question}>Tell us about your organization</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="input-wrapper">
                  <label className={styles.formLabel} htmlFor="orgName">
                    Organization/Business Name <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    id="orgName"
                    type="text"
                    className={styles.inputField}
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. NaliTech Events"
                    required
                  />
                </div>

                <div className="input-wrapper">
                  <label className={styles.formLabel} htmlFor="city">City of Operations</label>
                  <input
                    id="city"
                    type="text"
                    className={styles.inputField}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lagos, Abuja, Port Harcourt"
                  />
                </div>

                <div className="input-wrapper">
                  <label className={styles.formLabel}>Business Logo</label>
                  <div
                    className={styles.uploadContainer}
                    onClick={() => fileRef.current?.click()}
                  >
                    {logoPreview ? (
                      <>
                        <img src={logoPreview} alt="Logo preview" className={styles.uploadPreview} />
                        <div className={styles.uploadText} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span>Logo selected</span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              setLogoFile(null)
                              setLogoPreview(null)
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload size={24} style={{ color: 'var(--color-accent)' }} />
                        <span className={styles.uploadText}>
                          Drag your logo here or <span className={styles.uploadActionText}>browse</span>
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          Supports JPG, PNG up to 2MB
                        </span>
                      </>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleLogo}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className={styles.infoBox}>
                <Info size={18} className={styles.infoIcon} />
                <p>
                  Help us estimate database usage and plan resource allocations to ensure zero lag on your dashboard during peak periods.
                </p>
              </div>

              <h2 className={styles.question}>What is your estimated annual event volume?</h2>

              <div className={styles.optionList}>
                {[
                  { id: '1-10', title: '1 - 10 events', desc: 'For independent planners and boutique event firms' },
                  { id: '11-30', title: '11 - 30 events', desc: 'For established agencies running concurrent setups' },
                  { id: '31-50', title: '31 - 50 events', desc: 'For multi-team agencies running weekly productions' },
                  { id: '50+', title: '50+ events', desc: 'For large event management firms and concert venues' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    className={`${styles.optionCard} ${volume === opt.id ? styles.optionCardActive : ''}`}
                    onClick={() => setVolume(opt.id)}
                  >
                    <div className={styles.optionDetails}>
                      <span className={styles.optionTitle}>{opt.title}</span>
                      <span className={styles.optionDesc}>{opt.desc}</span>
                    </div>
                    <div className={styles.radioIndicator}>
                      <div className={styles.radioIndicatorInner} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stepper Navigation */}
          <div className={styles.navRow}>
            {step > 1 && (
              <button onClick={handleBack} className={styles.backBtn} disabled={loading}>
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className={styles.continueBtn}
              disabled={loading || (step === 2 && !orgName.trim())}
            >
              {loading ? (
                'Finalizing Setup...'
              ) : step === 3 ? (
                'Finish Setup'
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Continue <ChevronRight size={16} />
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
