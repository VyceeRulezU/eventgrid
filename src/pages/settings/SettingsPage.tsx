import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, ArrowLeft, ExternalLink, LogOut, Building2, LifeBuoy, Book, Bell } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { compressImage } from '@/lib/image'
import { clearTourForRole } from '@/components/shared/AppTour'
import { SEO } from '@/components/shared/SEO'
import { PushNotificationSetup } from '@/components/shared/PushNotificationSetup'
import type { Profile } from '@/types'
import styles from './SettingsPage.module.css'

export function SettingsPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)
  const org = useAuthStore((s) => s.org)
  const role = useAuthStore((s) => s.role)
  const setProfile = useAuthStore((s) => s.setProfile)
  const setOrg = useAuthStore((s) => s.setOrg)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const showToast = useUIStore((s) => s.showToast)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [displayName, setDisplayName] = useState(profile?.display_name || user?.user_metadata?.display_name || '')
  const [phone, setPhone] = useState(profile?.phone || user?.user_metadata?.phone || '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null)
  const [saving, setSaving] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)

  const handleTestEmail = async () => {
    if (!user) return
    setTestingEmail(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboarding-emails`

      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'payment',
          email: user.email,
          first_name: profile?.display_name || user.user_metadata?.display_name || 'Test User',
          meta: {
            amount: '₦20,000',
            event_name: 'Diagnostic Test Event',
            payment_method: 'Paystack Test'
          }
        })
      })

      const text = await res.text()
      console.log('Diagnostic response:', res.status, text)

      if (!res.ok) {
        showToast({
          type: 'error',
          title: `Test email failed (Status ${res.status})`,
          body: text || 'No response body'
        })
        return
      }

      let data
      try {
        data = JSON.parse(text)
      } catch {
        // Not JSON
      }

      if (data?.error) {
        showToast({ type: 'error', title: 'Test email failed', body: `Resend error: ${data.error}` })
      } else {
        showToast({ type: 'success', title: 'Test email sent!', body: `Check inbox for receipt email.` })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown network error'
      showToast({ type: 'error', title: 'Test email failed', body: `Fetch exception: ${msg}` })
      console.error('Diagnostic fetch exception:', err)
    } finally {
      setTestingEmail(false)
    }
  }

  const [orgName, setOrgName] = useState(org?.name || '')
  const [orgCity, setOrgCity] = useState('')
  const [orgWebsite, setOrgWebsite] = useState('')
  const [orgInstagram, setOrgInstagram] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(org?.logo_url || null)
  const [savingOrg, setSavingOrg] = useState(false)

  const displayNameFinal = profile?.display_name || user?.user_metadata?.display_name || 'User'
  const avatarLetter = displayNameFinal.charAt(0).toUpperCase()
  const isPlanner = role === 'planner'

  useEffect(() => {
    if (!org?.id) return
    supabase
      .from('organizations')
      .select('name, city, website, instagram, logo_url')
      .eq('id', org.id)
      .single()
      .then(({ data }) => {
        if (!data) return
        setOrgName(data.name || org.name)
        setOrgCity(data.city || '')
        setOrgWebsite(data.website || '')
        setOrgInstagram(data.instagram || '')
        setLogoPreview(data.logo_url || org.logo_url)
      })
  }, [org?.id, org?.name, org?.logo_url])

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !supabase) return

    try {
      const compressed = await compressImage(file, 'avatar')
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `avatars/${user.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, compressed, { upsert: true })

      if (uploadError) {
        showToast({ type: 'error', title: 'Upload failed', body: uploadError.message })
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

      const { error: rpcError } = await supabase.rpc('update_own_profile', {
        p_user_id: user.id,
        p_avatar_url: publicUrl,
      })

      if (rpcError) {
        showToast({ type: 'error', title: 'Profile update failed', body: rpcError.message })
        return
      }

      setAvatarPreview(publicUrl)
      setProfile({ ...profile, avatar_url: publicUrl } as Profile)
      showToast({ type: 'success', title: 'Avatar updated', body: 'Your avatar has been updated successfully.' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not upload avatar'
      showToast({ type: 'error', title: 'Upload failed', body: message })
    }
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !org || !supabase) return

    if (file.size > 2 * 1024 * 1024) {
      showToast({ type: 'error', title: 'File too large', body: 'Logo must be under 2MB' })
      return
    }

    const ext = file.name.split('.').pop()
    const path = `org-logos/${org.id}-${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('org-assets')
      .upload(path, file, { upsert: true })

    if (uploadErr) {
      showToast({ type: 'error', title: 'Upload failed', body: uploadErr.message })
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('org-assets').getPublicUrl(path)
    setLogoPreview(publicUrl)

    const { error } = await supabase
      .from('organizations')
      .update({ logo_url: publicUrl })
      .eq('id', org.id)

    if (error) {
      showToast({ type: 'error', title: 'Save failed', body: error.message })
      return
    }

    setOrg({ ...org, logo_url: publicUrl })
    showToast({ type: 'success', title: 'Logo updated', body: 'Your organisation logo has been saved.' })
  }

  const handleSave = async () => {
    if (!user || !supabase) {
      showToast({ type: 'success', title: 'Profile updated locally' })
      return
    }
    setSaving(true)
    const { error } = await supabase.rpc('update_own_profile', {
      p_user_id: user.id,
      p_display_name: displayName,
      p_phone: phone,
    })

    if (error) {
      showToast({ type: 'error', title: 'Save failed', body: error.message })
    } else {
      setProfile({ ...profile, display_name: displayName, phone } as Profile)
      showToast({ type: 'success', title: 'Profile updated', body: 'Your changes have been saved.' })
    }
    setSaving(false)
  }

  const handleSaveOrg = async () => {
    if (!org || !supabase) return
    setSavingOrg(true)

    const { error } = await supabase
      .from('organizations')
      .update({
        name: orgName.trim(),
        city: orgCity.trim(),
        website: orgWebsite.trim() || null,
        instagram: orgInstagram.trim() || null,
      })
      .eq('id', org.id)

    if (error) {
      showToast({ type: 'error', title: 'Save failed', body: error.message })
    } else {
      setOrg({ ...org, name: orgName.trim(), logo_url: logoPreview })
      showToast({ type: 'success', title: 'Organisation updated', body: 'Your business details have been saved.' })
    }
    setSavingOrg(false)
  }

  const handleLogout = async () => {
    await supabase?.auth.signOut()
    clearAuth()
    navigate('/login')
  }

  return (
    <div className={styles.page}>
      <SEO title="Settings" description="Manage your EventGrid profile, business organization parameters, team invitations, and integration preferences." />
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Settings</h2>
      </div>

      <div className={styles.grid}>
        <div className={`card ${styles.identityCard}`} id="tour-settings-profile">
          <div className={styles.avatarWrap}>
            <div
              className={styles.avatar}
              style={avatarPreview ? { backgroundImage: `url(${avatarPreview})` } : undefined}
            >
              {!avatarPreview && avatarLetter}
            </div>
            <button type="button" onClick={handleAvatarClick} className={styles.avatarBtn} aria-label="Upload avatar">
              <Camera size={14} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
          </div>
          <div>
            <div className={styles.identityName}>{displayNameFinal}</div>
            <div className={styles.identityEmail}>{user?.email}</div>
          </div>
        </div>

        <div className="card">
          <h3 className={styles.cardTitle}>Personal Profile</h3>

          <div className="input-wrapper">
            <label className="input-label" htmlFor="settings-name">Display Name</label>
            <input
              id="settings-name"
              type="text"
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className={`input-wrapper ${styles.fieldSpaced}`}>
            <label className="input-label" htmlFor="settings-phone">Phone (+234)</label>
            <input
              id="settings-phone"
              type="tel"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 800 000 0000"
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Upload size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Organisation profile (planner only) */}
        {isPlanner && org && (
          <div className={`card ${styles.spanFull}`}>
            <h3 className={`${styles.cardTitle} ${styles.cardTitleRow}`}>
              <Building2 size={18} style={{ color: 'var(--color-accent)' }} />
              Organisation Profile
            </h3>
            <p className={styles.orgDesc}>
              Your business name and logo appear in the top bar and across EventGrid.
            </p>

            <div className={styles.orgRow}>
              <div className={styles.avatarWrap}>
                <div
                  className={styles.orgLogo}
                  style={logoPreview ? { backgroundImage: `url(${logoPreview})` } : undefined}
                >
                  {!logoPreview && (orgName || org.name).charAt(0).toUpperCase()}
                </div>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className={styles.avatarBtn}
                  aria-label="Upload organisation logo"
                >
                  <Camera size={12} />
                </button>
                <input ref={logoInputRef} type="file" accept="image/*" hidden onChange={handleLogoChange} />
              </div>

              <div className={styles.orgFields}>
                <div className="input-wrapper">
                  <label className="input-label" htmlFor="org-name">Organisation Name</label>
                  <input
                    id="org-name"
                    type="text"
                    className="input"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. NaliTech Events"
                  />
                </div>
                <div className="input-wrapper">
                  <label className="input-label" htmlFor="org-city">City</label>
                  <input
                    id="org-city"
                    type="text"
                    className="input"
                    value={orgCity}
                    onChange={(e) => setOrgCity(e.target.value)}
                    placeholder="e.g. Abuja"
                  />
                </div>
                <div className="input-wrapper">
                  <label className="input-label" htmlFor="org-website">Website</label>
                  <input
                    id="org-website"
                    type="url"
                    className="input"
                    value={orgWebsite}
                    onChange={(e) => setOrgWebsite(e.target.value)}
                    placeholder="https://yourevents.ng"
                  />
                </div>
                <div className="input-wrapper">
                  <label className="input-label" htmlFor="org-instagram">Instagram</label>
                  <input
                    id="org-instagram"
                    type="text"
                    className="input"
                    value={orgInstagram}
                    onChange={(e) => setOrgInstagram(e.target.value)}
                    placeholder="@yourbrand"
                  />
                </div>
              </div>
            </div>

            <button type="button" className="btn btn-primary" onClick={handleSaveOrg} disabled={savingOrg || !orgName.trim()}>
              <Upload size={16} />
              {savingOrg ? 'Saving...' : 'Save Organisation'}
            </button>
          </div>
        )}

        <div className="card">
          <h3 className={styles.cardTitle}>Payment Providers</h3>
          <div className={styles.providers}>
            <span>Paystack: <span className={styles.providerOk}>Configured</span></span>
            <span>Flutterwave: <span className={styles.providerOk}>Configured</span></span>
          </div>
        </div>

        {role === 'super_admin' && (
          <div className="card">
            <h3 className={styles.cardTitle}>Diagnostics (Super Admin Only)</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 1.5 }}>
              Send a test transaction email receipt to <strong>{user?.email}</strong> using the remote Supabase Edge Function to diagnose delivery issues.
            </p>
            <button type="button" className="btn btn-secondary" onClick={handleTestEmail} disabled={testingEmail || !user?.email}>
              {testingEmail ? 'Sending...' : 'Send Test Payment Email'}
            </button>
          </div>
        )}

        <div className="card">
          <h3 className={styles.cardTitle}>Quick Links</h3>
          <div className={styles.linkList}>
            <a href="https://eventgrid.ng" target="_blank" rel="noopener noreferrer" className={styles.externalLink}>
              <ExternalLink size={14} />
              Visit EventGrid website
            </a>
            <a href="/terms" target="_blank" rel="noopener noreferrer" className={styles.externalLink}>
              <ExternalLink size={14} />
              Terms of Service
            </a>
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className={styles.externalLink}>
              <ExternalLink size={14} />
              Privacy Policy
            </a>
          </div>
        </div>

        <div className="card">
          <h3 className={`${styles.cardTitle} ${styles.cardTitleRow}`}>
            <Bell size={18} style={{ color: 'var(--color-accent)' }} />
            Notifications
          </h3>
          <PushNotificationSetup />
        </div>

        {/* Help & Onboarding */}
        <div className="card">
          <h3 className={`${styles.cardTitle} ${styles.cardTitleRow}`}>
            <LifeBuoy size={18} style={{ color: 'var(--color-accent)' }} />
            Help & Onboarding
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 1.55 }}>
            Take a guided tour of EventGrid — walks you through all key features for your role.
          </p>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ gap: 'var(--space-2)' }}
            onClick={() => {
              if (role) {
                clearTourForRole(role)
                showToast({ type: 'info', title: 'Tour restarted', body: 'Navigate to your dashboard to begin.' })
              }
            }}
          >
            <LifeBuoy size={16} />
            Restart App Tour
          </button>
          <Link to="/settings/help" className={styles.helpLink}>
            <Book size={16} />
            User Manual
          </Link>
        </div>

        <div className={`card ${styles.dangerCard}`}>
          <button type="button" className="btn btn-destructive" onClick={handleLogout}>
            <LogOut size={16} />
            Log out
          </button>
          <Link to="/home" className={styles.backLink}>
            <ArrowLeft size={14} />
            Back to site
          </Link>
        </div>

        <div className="card">
          <div className={styles.version}>EventGrid v0.1.0</div>
        </div>
      </div>
    </div>
  )
}
