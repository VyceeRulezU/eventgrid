import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, ArrowLeft, ExternalLink, LogOut, Building2, LifeBuoy, Book, Bell, Send, Trash2, AlertTriangle, MessageSquareText, User, Settings, Sparkles, Eye, EyeOff, X } from 'lucide-react'
import { uploadFile } from '@/lib/storage'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { EVENT_FEE_DISPLAY } from '@/lib/pricing'
import { compressImage } from '@/lib/image'
import { clearTourForRole } from '@/components/shared/AppTour'
import { sendLinkNotification } from '@/lib/edgeFunctions'
import { Switch } from '@/components/ui/Switch'
import { SEO } from '@/components/shared/SEO'
import { PushNotificationSetup } from '@/components/shared/PushNotificationSetup'
import { FeedbackFormModal } from '@/features/feedback/FeedbackFormModal'
import { Tabs } from '@/components/ui/Tabs'
import { PageHero } from '@/components/shared/PageHero'
import { AdminPageHero } from '@/components/shared/AdminPageHero'
import type { Profile } from '@/types'
import styles from './SettingsPage.module.css'

export function SettingsPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)
  const org = useAuthStore((s) => s.org)
  const role = useAuthStore((s) => s.role)
  const betaLabelVisible = useAuthStore((s) => s.betaLabelVisible)
  const setBetaLabelVisible = useAuthStore((s) => s.setBetaLabelVisible)
  const setProfile = useAuthStore((s) => s.setProfile)
  const setOrg = useAuthStore((s) => s.setOrg)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const showToast = useUIStore((s) => s.showToast)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<'profile' | 'org' | 'preferences' | 'upgrades' | 'support'>('profile')

  const [displayName, setDisplayName] = useState(profile?.display_name || user?.user_metadata?.display_name || '')
  const [phone, setPhone] = useState(profile?.phone || user?.user_metadata?.phone || '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null)
  const [saving, setSaving] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showBetaLabel, setShowBetaLabel] = useState(betaLabelVisible)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [linkingGoogle, setLinkingGoogle] = useState(false)
  const [linkingFacebook, setLinkingFacebook] = useState(false)
  const [passwordModal, setPasswordModal] = useState<{ provider: 'google' | 'facebook' } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [settingPassword, setSettingPassword] = useState(false)

  const googleIdentities = user?.identities?.filter((i) => i.provider === 'google') ?? []
  const linkedGoogle = googleIdentities.length > 0
  const facebookIdentities = user?.identities?.filter((i) => i.provider === 'facebook') ?? []
  const linkedFacebook = facebookIdentities.length > 0
  const totalIdentities = user?.identities?.length ?? 0

  const handleLinkGoogle = async () => {
    setLinkingGoogle(true)
    try {
      const { error } = await supabase.auth.linkIdentity({ provider: 'google' })
      if (error) {
        showToast({ type: 'error', title: 'Link failed', body: error.message })
      } else {
        const { data } = await supabase.auth.getUser()
        if (data?.user) useAuthStore.getState().setUser(data.user)
        showToast({ type: 'success', title: 'Google account linked', body: 'You can now sign in with Google.' })
        sendLinkNotification({ email: user!.email!, first_name: displayNameFinal, provider: 'google', action: 'linked' }).catch(() => {})
      }
    } catch {
      showToast({ type: 'error', title: 'Link failed', body: 'An unexpected error occurred.' })
    } finally {
      setLinkingGoogle(false)
    }
  }

  const handleUnlinkGoogle = async () => {
    const identity = googleIdentities[0]
    if (!identity) return
    if (totalIdentities <= 1) {
      setPasswordModal({ provider: 'google' })
      return
    }
    setLinkingGoogle(true)
    try {
      const { error } = await supabase.auth.unlinkIdentity(identity)
      if (error) {
        showToast({ type: 'error', title: 'Unlink failed', body: error.message })
      } else {
        const { data } = await supabase.auth.getUser()
        if (data?.user) useAuthStore.getState().setUser(data.user)
        showToast({ type: 'success', title: 'Google account unlinked' })
        sendLinkNotification({ email: user!.email!, first_name: displayNameFinal, provider: 'google', action: 'unlinked' }).catch(() => {})
      }
    } catch {
      showToast({ type: 'error', title: 'Unlink failed', body: 'An unexpected error occurred.' })
    } finally {
      setLinkingGoogle(false)
    }
  }

  const handleLinkFacebook = async () => {
    setLinkingFacebook(true)
    try {
      const { error } = await supabase.auth.linkIdentity({ provider: 'facebook' })
      if (error) {
        showToast({ type: 'error', title: 'Link failed', body: error.message })
      } else {
        const { data } = await supabase.auth.getUser()
        if (data?.user) useAuthStore.getState().setUser(data.user)
        showToast({ type: 'success', title: 'Facebook account linked', body: 'You can now sign in with Facebook.' })
        sendLinkNotification({ email: user!.email!, first_name: displayNameFinal, provider: 'facebook', action: 'linked' }).catch(() => {})
      }
    } catch {
      showToast({ type: 'error', title: 'Link failed', body: 'An unexpected error occurred.' })
    } finally {
      setLinkingFacebook(false)
    }
  }

  const handleUnlinkFacebook = async () => {
    const identity = facebookIdentities[0]
    if (!identity) return
    if (totalIdentities <= 1) {
      setPasswordModal({ provider: 'facebook' })
      return
    }
    setLinkingFacebook(true)
    try {
      const { error } = await supabase.auth.unlinkIdentity(identity)
      if (error) {
        showToast({ type: 'error', title: 'Unlink failed', body: error.message })
      } else {
        const { data } = await supabase.auth.getUser()
        if (data?.user) useAuthStore.getState().setUser(data.user)
        showToast({ type: 'success', title: 'Facebook account unlinked' })
        sendLinkNotification({ email: user!.email!, first_name: displayNameFinal, provider: 'facebook', action: 'unlinked' }).catch(() => {})
      }
    } catch {
      showToast({ type: 'error', title: 'Unlink failed', body: 'An unexpected error occurred.' })
    } finally {
      setLinkingFacebook(false)
    }
  }

  const handleSetPasswordAndUnlink = async () => {
    const modal = passwordModal
    if (!modal) return

    if (newPassword.length < 6) {
      showToast({ type: 'error', title: 'Password too short', body: 'Password must be at least 6 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      showToast({ type: 'error', title: 'Passwords do not match', body: 'New password and confirmation must match.' })
      return
    }

    setSettingPassword(true)
    try {
      const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword })
      if (pwErr) {
        showToast({ type: 'error', title: 'Failed to set password', body: pwErr.message })
        return
      }

      const identity = modal.provider === 'google' ? googleIdentities[0] : facebookIdentities[0]
      if (!identity) {
        showToast({ type: 'error', title: 'Identity not found', body: 'Could not find the linked account.' })
        return
      }

      const { error: unlinkErr } = await supabase.auth.unlinkIdentity(identity)
      if (unlinkErr) {
        showToast({ type: 'error', title: 'Unlink failed', body: unlinkErr.message })
        return
      }

      const { data } = await supabase.auth.getUser()
      if (data?.user) useAuthStore.getState().setUser(data.user)
      showToast({ type: 'success', title: `${modal.provider === 'google' ? 'Google' : 'Facebook'} account unlinked`, body: 'You can now sign in with your password.' })
      sendLinkNotification({ email: user!.email!, first_name: displayNameFinal, provider: modal.provider, action: 'unlinked' }).catch(() => {})
      setPasswordModal(null)
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      showToast({ type: 'error', title: 'Failed', body: 'An unexpected error occurred.' })
    } finally {
      setSettingPassword(false)
    }
  }

  const handleToggleBetaLabel = async (value: boolean) => {
    setShowBetaLabel(value)
    const { error } = await supabase
      .from('app_settings')
      .update({ show_beta_label: value })
      .eq('id', 1)
    if (error) {
      setShowBetaLabel(!value)
      showToast({ type: 'error', title: 'Failed to update', body: error.message })
      return
    }
    setBetaLabelVisible(value)
  }

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
            amount: EVENT_FEE_DISPLAY,
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
  const [orgOwnerId, setOrgOwnerId] = useState<string | null>(org?.owner_id || null)
  const [savingOrg, setSavingOrg] = useState(false)

  const displayNameFinal = profile?.display_name || user?.user_metadata?.display_name || 'User'
  const avatarLetter = displayNameFinal.charAt(0).toUpperCase()

  useEffect(() => {
    if (!org?.id) return
    supabase
      .from('organizations')
      .select('name, city, website, instagram, logo_url, owner_id')
      .eq('id', org.id)
      .single()
      .then(({ data }) => {
        if (!data) return
        setOrgName(data.name || org.name)
        setOrgCity(data.city || '')
        setOrgWebsite(data.website || '')
        setOrgInstagram(data.instagram || '')
        setLogoPreview(data.logo_url || org.logo_url)
        setOrgOwnerId(data.owner_id || null)
      })
  }, [org?.id, org?.name, org?.logo_url, user?.id])

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !supabase) return

    try {
      const compressed = await compressImage(file, 'avatar')
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `avatars/${user.id}/avatar.${ext}`

      const { url: publicUrl } = await uploadFile('avatars', compressed, path)

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

  const [uploadingLogo, setUploadingLogo] = useState(false)

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !org || !supabase) return
    if (uploadingLogo) return

    if (file.size > 2 * 1024 * 1024) {
      showToast({ type: 'error', title: 'File too large', body: 'Logo must be under 2MB' })
      return
    }

    setUploadingLogo(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${org.id}/org-logos/${Date.now()}.${ext}`

      const { url: publicUrl } = await uploadFile('org-assets', file, path)
      setLogoPreview(publicUrl)

      const { error } = await supabase.rpc('update_org', {
        p_id: org.id,
        p_logo_url: publicUrl,
      })

      if (error) {
        showToast({ type: 'error', title: 'Save failed', body: error.message })
        return
      }

      setOrg({ ...org, logo_url: publicUrl })
      showToast({ type: 'success', title: 'Logo updated', body: 'Your organisation logo has been saved.' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload logo'
      showToast({ type: 'error', title: 'Upload failed', body: message })
    } finally {
      setUploadingLogo(false)
    }
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

    const { error } = await supabase.rpc('update_org', {
      p_id: org.id,
      p_name: orgName.trim(),
      p_city: orgCity.trim() || null,
      p_website: orgWebsite.trim() || null,
      p_instagram: orgInstagram.trim() || null,
    })

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

  const handleDeleteAccount = async () => {
    if (!user) return
    setDeletingAccount(true)
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: user.id },
      })
      if (error) {
        let detail = error.message
        try { if (error.context?.json) { const b = await error.context.json(); detail = b?.error || detail } } catch {}
        throw new Error(detail)
      }
      if (data?.error) throw new Error(data.error)

      await supabase?.auth.signOut()
      clearAuth()
      navigate('/login')
      showToast({ type: 'success', title: 'Account deleted', body: 'Your account has been permanently deleted.' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete account'
      showToast({ type: 'error', title: 'Deletion failed', body: msg })
    } finally {
      setDeletingAccount(false)
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
    }
  }

  const isAdminRole = role && ['super_admin', 'admin_monitor', 'admin_support'].includes(role)

  const tabs = [
    { key: 'profile' as const, label: 'Profile', icon: <User size={16} /> },
    { key: 'org' as const, label: 'Organisation', icon: <Building2 size={16} /> },
    { key: 'preferences' as const, label: 'Preferences', icon: <Settings size={16} /> },
    ...(!isAdminRole ? [{ key: 'upgrades' as const, label: 'Transitions', icon: <Sparkles size={16} /> }] : []),
    { key: 'support' as const, label: 'Support & Security', icon: <LifeBuoy size={16} /> },
  ]

  return (
    <div className={styles.page}>
      <SEO title="Settings" description="Manage your NaliGrid profile, business organization parameters, team invitations, and integration preferences." />
      {isAdminRole ? (
        <AdminPageHero icon={Settings} title="Settings" subtitle="Profile and preferences" backTo="/admin" />
      ) : (
        <PageHero icon={Settings} title="Settings" subtitle="Profile and preferences" backTo="/home" />
      )}

      <div className={styles.tabWrapper}>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className={styles.grid}>
        {/* ==================== PROFILE TAB ==================== */}
        {activeTab === 'profile' && (
          <>
            <div className={`card ${styles.identityCard}`} id="tour-settings-profile">
              <div className={styles.identityRow}>
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

              <hr className={styles.identityDivider} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Google</div>
                    {linkedGoogle && googleIdentities[0]?.identity_data?.email && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                        {googleIdentities[0].identity_data.email}
                      </div>
                    )}
                  </div>
                </div>
                {linkedGoogle ? (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleUnlinkGoogle}
                    disabled={linkingGoogle}
                    style={{ color: 'var(--color-danger, #dc2626)', borderColor: 'var(--color-danger, #dc2626)' }}
                  >
                    {linkingGoogle ? 'Removing...' : 'Unlink'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleLinkGoogle}
                    disabled={linkingGoogle}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    Link Google Account
                  </button>
                )}
              </div>

              <hr className={styles.identityDivider} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Facebook</div>
                    {linkedFacebook && facebookIdentities[0]?.identity_data?.email && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                        {facebookIdentities[0].identity_data.email}
                      </div>
                    )}
                  </div>
                </div>
                {linkedFacebook ? (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleUnlinkFacebook}
                    disabled={linkingFacebook}
                    style={{ color: 'var(--color-danger, #dc2626)', borderColor: 'var(--color-danger, #dc2626)' }}
                  >
                    {linkingFacebook ? 'Removing...' : 'Unlink'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleLinkFacebook}
                    disabled={linkingFacebook}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    Link Facebook Account
                  </button>
                )}
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
          </>
        )}

        {/* ==================== ORGANISATION TAB ==================== */}
        {activeTab === 'org' && (
          <div className={`card ${styles.spanFull}`}>
            <h3 className={`${styles.cardTitle} ${styles.cardTitleRow}`}>
              <Building2 size={18} style={{ color: 'var(--color-accent)' }} />
              Organisation Profile
            </h3>

            {!org ? (
              <div style={{ padding: 'var(--space-6) 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <Building2 size={32} style={{ opacity: 0.3, margin: '0 auto 8px', display: 'block' }} />
                <p style={{ marginBottom: 'var(--space-4)' }}>You are not part of any organisation yet.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate('/onboarding/planner')}
                >
                  Create Organisation
                </button>
              </div>
            ) : orgOwnerId && orgOwnerId !== user?.id && role === 'planner' ? (
              <div style={{ padding: 'var(--space-6) 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <Building2 size={32} style={{ opacity: 0.3, margin: '0 auto 8px', display: 'block' }} />
                <p style={{ marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
                  You are currently a member of <strong>{orgName || org.name}</strong>.<br />
                  Since your role was upgraded to <strong>Event Planner</strong>, you can set up and manage your own independent organisation.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={async () => {
                    const { error } = await supabase.rpc('change_user_org', { p_new_org_id: null })
                    if (error) {
                      showToast({ type: 'error', title: 'Action failed', body: error.message })
                      return
                    }
                    setOrg(null)
                    setProfile({ ...profile, org_id: null } as Profile)
                    navigate('/onboarding/planner')
                  }}
                >
                  Create My Own Organisation
                </button>
              </div>
            ) : (
              <>
                <p className={styles.orgDesc}>
                  Your business name and logo appear in the top bar and across NaliGrid.
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
              </>
            )}
          </div>
        )}

        {/* ==================== PREFERENCES TAB ==================== */}
        {activeTab === 'preferences' && (
          <>
            <div className="card">
              <h3 className={styles.cardTitle}>Payment Providers</h3>
              <div className={styles.providers}>
                <span>Paystack: <span className={styles.providerOk}>Configured</span></span>
                <span>Korapay: <span className={styles.providerOk}>Configured</span></span>
              </div>
            </div>

            <div className="card">
              <h3 className={`${styles.cardTitle} ${styles.cardTitleRow}`}>
                <Bell size={18} style={{ color: 'var(--color-accent)' }} />
                Notifications
              </h3>
              <PushNotificationSetup />
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

            {role === 'super_admin' && org && (
              <div className="card">
                <h3 className={styles.cardTitle}>Beta Label</h3>
                <div className={styles.toggleRow}>
                  <div className={styles.toggleLabel}>
                    <span>Show "Beta" label in top bar</span>
                    <span>When turned off, the Beta badge is hidden for all users.</span>
                  </div>
                  <Switch checked={showBetaLabel} onChange={handleToggleBetaLabel} />
                </div>
              </div>
            )}
          </>
        )}

        {/* ==================== TRANSITIONS TAB ==================== */}
        {activeTab === 'upgrades' && (
          <RoleTransitions
            currentRole={role}
            userId={user?.id}
            navigate={navigate}
            supabase={supabase}
            showToast={showToast}
            setProfile={setProfile}
          />
        )}

        {/* ==================== SUPPORT & SECURITY TAB ==================== */}
        {activeTab === 'support' && (
          <>
            <div className="card">
              <h3 className={`${styles.cardTitle} ${styles.cardTitleRow}`}>
                <LifeBuoy size={18} style={{ color: 'var(--color-accent)' }} />
                Help &amp; Onboarding
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 1.55 }}>
                Take a guided tour of NaliGrid — walks you through all key features for your role.
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

            <div className="card">
              <h3 className={`${styles.cardTitle} ${styles.cardTitleRow}`}>
                <Send size={18} style={{ color: 'var(--color-accent)' }} />
                Feedback
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 1.55 }}>
                Have a complaint, suggestion, or idea? Share it with the NaliGrid team directly.
              </p>
              <button type="button" className="btn btn-primary" onClick={() => setShowFeedback(true)}>
                <Send size={16} />
                Send Feedback
              </button>
            </div>

            {role === 'super_admin' && (
              <div className="card">
                <h3 className={`${styles.cardTitle} ${styles.cardTitleRow}`}>
                  <MessageSquareText size={18} style={{ color: 'var(--color-accent)' }} />
                  Testimonials
                </h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 1.55 }}>
                  Manage the social proof quotes displayed on the landing page. Set featured cards and control display order.
                </p>
                <Link to="/admin/testimonials" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', textDecoration: 'none' }}>
                  <MessageSquareText size={16} />
                  Manage Testimonials
                </Link>
              </div>
            )}

            <div className="card">
              <h3 className={styles.cardTitle}>Quick Links</h3>
              <div className={styles.linkList}>
                <a href="https://naligrid.com" target="_blank" rel="noopener noreferrer" className={styles.externalLink}>
                  <ExternalLink size={14} />
                  Visit NaliGrid website
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

            <div className={`card ${styles.deleteCard}`} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className={styles.deleteHeader}>
                <AlertTriangle size={18} className={styles.deleteIcon} />
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>Delete Account</h3>
              </div>
              <p className={styles.deleteWarning} style={{ flex: 1 }}>
                Permanently delete your account and all associated data — events, guests, tasks, and media.
                This action <strong>cannot</strong> be undone.
              </p>

              {!showDeleteConfirm ? (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 size={16} />
                    Delete Account
                  </button>
                </div>
              ) : (
                <div className={styles.deleteConfirm}>
                  <p className={styles.deleteConfirmPrompt}>
                    Type <strong>DELETE</strong> to confirm:
                  </p>
                  <input
                    type="text"
                    className="input"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    autoFocus
                  />
                  <div className={styles.deleteActions}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setDeleteConfirmText('')
                      }}
                      disabled={deletingAccount}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                    >
                      {deletingAccount ? 'Deleting...' : 'Delete My Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <div className={styles.version}>NaliGrid v0.2.0</div>
            </div>
          </>
        )}
      </div>

      {passwordModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          padding: 'var(--space-4)',
        }} onClick={() => { setPasswordModal(null); setNewPassword(''); setConfirmPassword('') }}>
          <div className="card" style={{
            width: '100%', maxWidth: 420, padding: 'var(--space-6)',
            position: 'relative',
          }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => { setPasswordModal(null); setNewPassword(''); setConfirmPassword('') }}
              style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4 }}
              aria-label="Close"
            ><X size={18} /></button>

            <h3 style={{ margin: '0 0 4px', fontSize: 'var(--text-lg)', fontWeight: 700 }}>Set Password</h3>
            <p style={{ margin: '0 0 var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Your {passwordModal.provider === 'google' ? 'Google' : 'Facebook'} account is your only sign-in method. Set a password to unlink it and sign in with email + password instead.
            </p>

            <div className="input-wrapper" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="input-label" htmlFor="set-pw">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="set-pw"
                  type={showNewPassword ? 'text' : 'password'}
                  className="input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  style={{ paddingRight: 36, width: '100%' }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-text-muted)' }}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="input-wrapper" style={{ marginBottom: 'var(--space-5)' }}>
              <label className="input-label" htmlFor="confirm-pw">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirm-pw"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  style={{ paddingRight: 36, width: '100%' }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-text-muted)' }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => { setPasswordModal(null); setNewPassword(''); setConfirmPassword('') }}
                disabled={settingPassword}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleSetPasswordAndUnlink}
                disabled={settingPassword || !newPassword || !confirmPassword}
              >
                {settingPassword ? 'Setting…' : 'Set Password & Unlink'}
              </button>
            </div>
          </div>
        </div>
      )}
      <FeedbackFormModal open={showFeedback} onClose={() => setShowFeedback(false)} />
    </div>
  )
}

const ROLE_META: Record<string, { title: string; description: string }> = {
  planner: {
    title: 'Event Planner',
    description: 'Create your own planning business, manage budget templates, collaborate with teams, and share portals with clients.',
  },
  coordinator: {
    title: 'Coordinator',
    description: 'Manage coordination timelines and checklists, choose your specialization, and offer freelance operations.',
  },
  vendor: {
    title: 'Service Vendor',
    description: 'List your service brand in the NaliGrid directory and receive bookings from planners.',
  },
  team_member: {
    title: 'Team Member',
    description: 'Join an existing event and collaborate with your team on tasks, checklists, and live coordination.',
  },
}

const ROLE_LEVEL: Record<string, number> = {
  planner: 4,
  coordinator: 3,
  vendor: 2,
  team_member: 1,
}

function RoleTransitions({
  currentRole,
  userId,
  navigate,
  supabase,
  showToast,
  setProfile,
}: {
  currentRole: string | null
  userId: string | undefined
  navigate: (url: string) => void
  supabase: any
  showToast: any
  setProfile: (p: any) => void
}) {
  const [confirmingRole, setConfirmingRole] = useState<string | null>(null)
  const [switching, setSwitching] = useState(false)

  const availableRoles = Object.keys(ROLE_META).filter((r) => r !== currentRole)

  const handleSwitch = async (targetRole: string) => {
    if (targetRole === 'team_member') {
      setConfirmingRole(targetRole)
      return
    }

    if (targetRole === 'planner') {
      navigate('/onboarding/planner')
    } else if (targetRole === 'coordinator') {
      navigate('/onboarding/coordinator?upgrade=true')
    } else if (targetRole === 'vendor') {
      navigate('/onboarding/vendor')
    }
  }

  const handleConfirmTeamMember = async () => {
    if (!userId) return
    setSwitching(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'team_member' })
        .eq('id', userId)
      if (error) throw error

      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (updatedProfile) {
        setProfile(updatedProfile)
      }

      showToast({ type: 'success', title: 'Role updated', body: 'You are now a Team Member.' })
    } catch (err: any) {
      showToast({ type: 'error', title: 'Switch failed', body: err?.message || 'Unexpected error' })
    } finally {
      setSwitching(false)
      setConfirmingRole(null)
    }
  }

  return (
    <div className={styles.transitionContainer}>
      <h3 className={styles.cardTitle}>Role Transitions</h3>
      <p className={styles.orgDesc}>
        Switch to any role that fits your needs. Your current role is <strong>{currentRole?.replace('_', ' ')}</strong>.
      </p>

      <div className={styles.upgradeGrid}>
        {availableRoles.map((targetRole) => {
          const meta = ROLE_META[targetRole]
          const label = currentRole && ROLE_LEVEL[targetRole] > ROLE_LEVEL[currentRole] ? 'Upgrade' : 'Downgrade'

          return (
            <div className={styles.upgradeCard} key={targetRole}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <h4 className={styles.upgradeCardTitle}>{meta.title}</h4>
                  <span className={`badge ${label === 'Upgrade' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: 'var(--text-xs)', padding: '2px 8px' }}>
                    {label}
                  </span>
                </div>
                <p className={styles.upgradeCardDesc} style={{ marginTop: 'var(--space-2)' }}>
                  {meta.description}
                </p>
              </div>
              {confirmingRole === targetRole ? (
                <div className={styles.deleteConfirm} style={{ marginTop: 'var(--space-4)' }}>
                  <p className={styles.deleteConfirmPrompt}>
                    <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: 'var(--space-1)' }} />
                    This removes event management capabilities. Continue?
                  </p>
                  <div className={styles.deleteActions}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setConfirmingRole(null)}
                      disabled={switching}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-destructive"
                      onClick={handleConfirmTeamMember}
                      disabled={switching}
                    >
                      {switching ? 'Switching...' : 'Switch to Team Member'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: 'var(--space-4)' }}
                  onClick={() => handleSwitch(targetRole)}
                >
                  {label === 'Upgrade' ? 'Become a ' : 'Switch to '}{meta.title}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

