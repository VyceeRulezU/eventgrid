import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Upload, X, Info, Sparkles, ChevronRight, LogOut, ArrowLeft, Star, Check, Calendar, Users, User, Briefcase, Building2, MapPin, Target } from 'lucide-react'
import { SEO } from '@/components/shared/SEO'
import { supabase } from '@/lib/supabase'
import { uploadFile } from '@/lib/storage'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import styles from './Onboarding.module.css'

const STEP_LABELS = ['Company Profile', 'Primary Focus', 'Secondary Services', 'Workspace Scale', 'Welcome']

const PRIMARY_OPTIONS = [
  {
    id: 'boutique_weddings',
    title: 'Luxury Weddings',
    desc: 'High-end custom wedding productions',
  },
  {
    id: 'corporate_events',
    title: 'Corporate & Tech',
    desc: 'Conferences, launches, and summits',
  },
  {
    id: 'social_celebrations',
    title: 'Social & Galas',
    desc: 'Birthdays, anniversaries, and milestones',
  },
  {
    id: 'concerts_entertainment',
    title: 'Concerts & Shows',
    desc: 'Live performances, festivals, and gigs',
  }
]

const SECONDARY_OPTIONS = [
  {
    id: 'venue_management',
    title: 'Venue Management',
    desc: 'Site operations and hall coordination',
  },
  {
    id: 'catering',
    title: 'Catering & Food',
    desc: 'Buffets, banquets, and menu sourcing',
  },
  {
    id: 'photography',
    title: 'Photo & Video',
    desc: 'Capturing memories and live coverage',
  },
  {
    id: 'decor_design',
    title: 'Decor & Flowers',
    desc: 'Designing layout, stage, and floral concepts',
  }
]

const VOLUME_OPTIONS = [
  { id: '1-10', title: '1 – 10 events', desc: 'For independent planners and boutique event firms', icon: Calendar },
  { id: '11-30', title: '11 – 30 events', desc: 'For established agencies running concurrent setups', icon: Briefcase },
  { id: '31-50', title: '31 – 50 events', desc: 'For multi-team agencies running weekly productions', icon: Building2 },
  { id: '50+', title: '50+ events', desc: 'For large event management firms and concert venues', icon: Sparkles },
]

const TEAM_OPTIONS = [
  { id: 'solo', title: 'Solo — Just me', desc: 'Independent planner handling everything personally', icon: User },
  { id: '2-5', title: 'Small Team — 2 to 5 members', desc: 'A core team with occasional freelancers', icon: Users },
  { id: '6-15', title: 'Growing Agency — 6 to 15 members', desc: 'Dedicated teams for sales, operations, and delivery', icon: Users },
  { id: '16+', title: 'Large Firm — 16+ members', desc: 'Multi-department agency with specialized roles', icon: Building2 },
]

export function PlannerOnboarding() {
  const [step, setStep] = useState(1)

  // Step 1: Company Profile
  const [orgName, setOrgName] = useState('')
  const [city, setCity] = useState('Lagos')
  const [state, setState] = useState('Lagos')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Step 2: Primary Focus
  const [experience, setExperience] = useState('boutique_weddings')

  // Step 3: Secondary Services (Multi-select)
  const [secondaryServices, setSecondaryServices] = useState<string[]>([])

  // Step 4: Workspace Scale
  const [volume, setVolume] = useState('1-10')
  const [teamSize, setTeamSize] = useState('2-5')

  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const user = useAuthStore((s) => s.user)
  const setOrg = useAuthStore((s) => s.setOrg)
  const showToast = useUIStore((s) => s.showToast)
  const navigate = useNavigate()
  const existingOrg = useAuthStore((s) => s.profile?.org_id)

  useEffect(() => {
    if (existingOrg) {
      navigate('/dashboard/planner', { replace: true })
    }
  }, [existingOrg, navigate])

  const TOTAL_STEPS = 5

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

  const toggleSecondaryService = (serviceId: string) => {
    setSecondaryServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    )
  }

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)

    let logoUrl: string | null = null

    if (logoFile && logoPreview) {
      const ext = logoFile.name.split('.').pop()
      const path = `org-logos/${user.id}-${Date.now()}.${ext}`
      try {
        const { url } = await uploadFile('org-assets', logoFile, path)
        logoUrl = url
      } catch {
        // upload failed silently — logoUrl stays null
      }
    }

    const { data: org, error } = await supabase
      .rpc('create_org', {
        p_name: orgName,
        p_owner_id: user.id,
        p_city: `${city}, ${state}`,
        p_logo_url: logoUrl,
      })

    if (error || !org) {
      showToast({ type: 'error', title: 'Failed to create organization', body: error?.message })
      setLoading(false)
      return
    }

    const orgData = org as { id: string; name: string; logo_url: string | null }

    // Save onboarding completed in Supabase Auth user metadata
    const { error: authErr } = await supabase.auth.updateUser({
      data: {
        onboarding_completed: true,
        planner_experience: experience,
        secondary_services: secondaryServices,
        expected_volume: volume,
        team_size: teamSize,
      }
    })

    if (authErr) {
      showToast({ type: 'error', title: 'Session sync failed', body: authErr.message })
    }

    setOrg(orgData)
    showToast({ type: 'success', title: 'Welcome to EventGrid!', body: 'Organization set up successfully.' })
    navigate('/dashboard/planner')
    setLoading(false)
  }

  const handleNext = () => {
    if (step === 1 && !orgName.trim()) {
      showToast({ type: 'error', title: 'Organization Name Required', body: 'Please enter a name for your business.' })
      return
    }
    if (step < TOTAL_STEPS) {
      setStep((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1)
  }

  return (
    <div className={styles.container}>
      <SEO title="Planner Onboarding" description="Set up your event planning organization profile, team collaboration, and workspace configurations on EventGrid." />
      {/* ── Left panel ── */}
      <div className={styles.leftPanel}>
        <div className={styles.topBar}>
          <div className={styles.branding}>
            <Link to="/">
              <img src="/EventGrid-logo-white.svg" alt="EventGrid Logo" className={styles.brandLogoImage} />
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
          <div className={styles.welcomeTag}>Get Started</div>
          <h1 className={styles.welcomeTitle}>Let's set up your workspace</h1>
          <p className={styles.welcomeDesc}>
            Join over 1,500 event planning agencies across Nigeria. Configure your workspace to start managing events and payments.
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
              "EventGrid scaled our wedding coordination efficiency. We managed 25 premium weddings in Lagos last year alone!"
            </p>
            <div className={styles.testimonialUser}>
              <img className={styles.testimonialAvatar} src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face" alt="Funmi Oladipupo" />
              <div className={styles.testimonialDetails}>
                <span className={styles.testimonialName}>Funmi Oladipupo</span>
                <span className={styles.testimonialRole}>Creative Director, Elegance Events</span>
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
            <span className={styles.stepLabel}>Step {step} of {TOTAL_STEPS} — {STEP_LABELS[step - 1]}</span>
            <div className={styles.stepper}>
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  className={`${styles.stepDot} ${i + 1 === step ? styles.stepDotActive : styles.stepDotInactive}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.stepContent} key={step}>

          {step === 1 && (
            <div>
              <div className={styles.infoBox}>
                <Sparkles size={16} className={styles.infoIcon} />
                <p style={{ margin: 0 }}>
                  This information will be displayed on client collaboration portals, automated invoices, and vendor briefs.
                </p>
              </div>

              <h2 className={styles.question}>Tell us about your organization</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label className={styles.formLabel} htmlFor="orgName">
                    Organization / Business Name <span style={{ color: 'var(--color-error)' }}>*</span>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label className={styles.formLabel} htmlFor="city">City</label>
                    <input
                      id="city"
                      type="text"
                      className={styles.inputField}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Lagos"
                    />
                  </div>
                  <div>
                    <label className={styles.formLabel} htmlFor="state">State</label>
                    <input
                      id="state"
                      type="text"
                      className={styles.inputField}
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Lagos"
                    />
                  </div>
                </div>

                <div>
                  <label className={styles.formLabel}>Business Logo <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span></label>
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
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--color-text-muted)', display: 'flex' }}
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

          {step === 2 && (
            <div>
              <div className={styles.infoBox}>
                <Info size={16} className={styles.infoIcon} />
                <p style={{ margin: 0 }}>
                  Setting up your profile allows us to customize budget templates, local checklists, and contracts specifically for your agency.
                </p>
              </div>

              <h2 className={styles.question}>What is your primary event focus?</h2>

              <div className={styles.photoGrid}>
                {PRIMARY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    className={`${styles.photoCard} ${experience === opt.id ? styles.photoCardActive : ''}`}
                    onClick={() => setExperience(opt.id)}
                  >
                    <div className={styles.photoCardOverlay} />
                    <div className={styles.photoCardContent}>
                      <div className={styles.photoCardTitle}>
                        {opt.title}
                        <div className={styles.radioIndicator} style={{ border: experience === opt.id ? '2px solid var(--color-accent)' : '2px solid rgba(255,255,255,0.6)' }}>
                          <div className={styles.radioIndicatorInner} style={{ opacity: experience === opt.id ? 1 : 0, transform: experience === opt.id ? 'scale(1)' : 'scale(0.4)' }} />
                        </div>
                      </div>
                      <div className={styles.photoCardDesc}>{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className={styles.infoBox}>
                <Sparkles size={16} className={styles.infoIcon} />
                <p style={{ margin: 0 }}>
                  Select additional operational services you contract or coordinate. This tailors your vendor directory categories.
                </p>
              </div>

              <h2 className={styles.question}>Which secondary services do you coordinate?</h2>

              <div className={styles.photoGrid}>
                {SECONDARY_OPTIONS.map((opt) => {
                  const isSelected = secondaryServices.includes(opt.id)
                  return (
                    <button
                      key={opt.id}
                      className={`${styles.photoCard} ${isSelected ? styles.photoCardActive : ''}`}
                      onClick={() => toggleSecondaryService(opt.id)}
                    >
                      <div className={styles.photoCardOverlay} />
                      <div className={styles.photoCardContent}>
                        <div className={styles.photoCardTitle}>
                          {opt.title}
                          <div className={styles.checkboxIndicator} style={{ borderColor: isSelected ? 'var(--color-accent)' : 'rgba(255,255,255,0.6)' }}>
                            {isSelected && <Check size={12} style={{ color: '#fff' }} />}
                          </div>
                        </div>
                        <div className={styles.photoCardDesc}>{opt.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className={styles.infoBox}>
                <Info size={16} className={styles.infoIcon} />
                <p style={{ margin: 0 }}>
                  Help us estimate database usage and allocate resources to ensure zero lag on your dashboard during peak periods.
                </p>
              </div>

              <h2 className={styles.question}>Estimated annual event volume & team size</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                <div>
                  <label className={styles.formLabel}>Estimated Annual Event Volume</label>
                  <div className={styles.optionGrid}>
                    {VOLUME_OPTIONS.map((opt) => {
                      const Icon = opt.icon
                      const isActive = volume === opt.id
                      return (
                        <button
                          key={opt.id}
                          className={`${styles.optionCard} ${isActive ? styles.optionCardActive : ''}`}
                          onClick={() => setVolume(opt.id)}
                        >
                          <div className={styles.optionCardHeader}>
                            <div className={styles.optionIconWrapper}>
                              <Icon size={16} />
                            </div>
                            <div className={styles.radioIndicator}>
                              <div className={styles.radioIndicatorInner} />
                            </div>
                          </div>
                          <div className={styles.optionDetails}>
                            <span className={styles.optionTitle}>{opt.title}</span>
                            <span className={styles.optionDesc}>{opt.desc}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className={styles.formLabel}>How large is your team?</label>
                  <div className={styles.optionGrid}>
                    {TEAM_OPTIONS.map((opt) => {
                      const Icon = opt.icon
                      const isActive = teamSize === opt.id
                      return (
                        <button
                          key={opt.id}
                          className={`${styles.optionCard} ${isActive ? styles.optionCardActive : ''}`}
                          onClick={() => setTeamSize(opt.id)}
                        >
                          <div className={styles.optionCardHeader}>
                            <div className={styles.optionIconWrapper}>
                              <Icon size={16} />
                            </div>
                            <div className={styles.radioIndicator}>
                              <div className={styles.radioIndicatorInner} />
                            </div>
                          </div>
                          <div className={styles.optionDetails}>
                            <span className={styles.optionTitle}>{opt.title}</span>
                            <span className={styles.optionDesc}>{opt.desc}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <div className={styles.infoBox}>
                <Sparkles size={16} className={styles.infoIcon} />
                <p style={{ margin: 0 }}>
                  You are all set! Review your details below to finalize setting up your premium EventGrid workspace.
                </p>
              </div>

              <h2 className={styles.question}>Welcome to EventGrid!</h2>

              <div className={styles.summaryCard}>
                <div className={styles.summaryHeader}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Business Logo" className={styles.summaryLogo} />
                  ) : (
                    <div className={styles.summaryLogoFallback}>
                      {orgName.trim().slice(0, 2).toUpperCase() || 'EG'}
                    </div>
                  )}
                  <div className={styles.summaryBusinessInfo}>
                    <h3 className={styles.summaryTitle}>{orgName}</h3>
                    <div className={styles.summaryLocation}>
                      <MapPin size={12} className={styles.locationIcon} />
                      <span>{city}, {state}</span>
                    </div>
                  </div>
                  <div className={styles.summaryBadge}>
                    <span className={styles.summaryStatusDot} />
                    Ready to Launch
                  </div>
                </div>

                <div className={styles.summaryDivider} />

                <div className={styles.summaryGrid}>
                  <div className={styles.summaryGridItem}>
                    <span className={styles.summaryItemLabel}>Primary Focus</span>
                    <div className={styles.summaryItemValueContainer}>
                      <Target size={14} className={styles.summaryItemIcon} />
                      <span className={styles.summaryItemValue}>
                        {PRIMARY_OPTIONS.find((o) => o.id === experience)?.title || experience}
                      </span>
                    </div>
                  </div>

                  <div className={styles.summaryGridItem}>
                    <span className={styles.summaryItemLabel}>Expected Volume</span>
                    <div className={styles.summaryItemValueContainer}>
                      <Calendar size={14} className={styles.summaryItemIcon} />
                      <span className={styles.summaryItemValue}>
                        {VOLUME_OPTIONS.find((o) => o.id === volume)?.title || `${volume} events/yr`}
                      </span>
                    </div>
                  </div>

                  <div className={styles.summaryGridItem}>
                    <span className={styles.summaryItemLabel}>Team Scale</span>
                    <div className={styles.summaryItemValueContainer}>
                      <Users size={14} className={styles.summaryItemIcon} />
                      <span className={styles.summaryItemValue}>
                        {TEAM_OPTIONS.find((o) => o.id === teamSize)?.title?.split(' — ')[0] || teamSize}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.summaryDivider} />

                <div className={styles.summarySection}>
                  <span className={styles.summarySectionLabel}>Selected Capabilities & Services</span>
                  <div className={styles.serviceBadgesList}>
                    <div className={styles.serviceBadgeActive}>
                      <Check size={10} />
                      <span>Event Coordination</span>
                    </div>
                    {secondaryServices.length > 0 ? (
                      secondaryServices.map((id) => {
                        const title = SECONDARY_OPTIONS.find((o) => o.id === id)?.title || id
                        return (
                          <div key={id} className={styles.serviceBadge}>
                            <Check size={10} />
                            <span>{title}</span>
                          </div>
                        )
                      })
                    ) : (
                      <div className={styles.serviceBadgeMuted}>
                        No secondary services selected
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.summaryDivider} />

                <div className={styles.dashboardPreviewContainer}>
                  <div className={styles.previewSidebar}>
                    <div className={styles.previewSidebarDotActive} />
                    <div className={styles.previewSidebarDot} />
                    <div className={styles.previewSidebarDot} />
                    <div className={styles.previewSidebarDot} />
                  </div>
                  <div className={styles.previewMain}>
                    <div className={styles.previewHeaderBar}>
                      <div className={styles.previewHeaderTitle} />
                      <div className={styles.previewHeaderAvatar} />
                    </div>
                    <div className={styles.previewCardsGrid}>
                      <div className={styles.previewCardMini}>
                        <div className={styles.previewCardLineShort} />
                        <div className={styles.previewCardLineLong} />
                      </div>
                      <div className={styles.previewCardMiniActive}>
                        <div className={styles.previewCardLineShortGold} />
                        <div className={styles.previewCardLineLongGold} />
                      </div>
                      <div className={styles.previewCardMini}>
                        <div className={styles.previewCardLineShort} />
                        <div className={styles.previewCardLineLong} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.launchDisclaimer}>
                <Sparkles size={14} className={styles.disclaimerIcon} />
                <p style={{ margin: 0 }}>
                  By launching your workspace, we will automatically set up your dashboard, configure database tables, and personalize templates based on these settings.
                </p>
              </div>
            </div>
          )}

        </div>

        <div className={styles.navRow}>
          {step > 1 && (
            <button onClick={handleBack} className={styles.stepBackBtn} disabled={loading}>
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className={styles.continueBtn}
            disabled={loading || (step === 1 && !orgName.trim())}
          >
            {loading ? 'Launching Workspace…' : step === TOTAL_STEPS ? 'Launch Workspace' : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Continue <ChevronRight size={16} />
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
