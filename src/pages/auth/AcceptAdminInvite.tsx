import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Shield, ShieldCheck, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { SEO } from '@/components/shared/SEO'
import '../admin/admin-auth.css'

const roleConfig: Record<string, { label: string; icon: typeof Shield; desc: string; color: string }> = {
  super_admin: { label: 'Super Admin', icon: ShieldCheck, desc: 'Full platform-wide access to manage all events, users, and settings.', color: '#D4A017' },
  monitor: { label: 'Monitor', icon: Shield, desc: 'Read-only access to analytics, events, and platform data.', color: '#60A5FA' },
  admin_support: { label: 'Support', icon: Users, desc: 'Manage feedback, users, and platform support tasks.', color: '#34D399' },
}

export function AcceptAdminInvite() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const roleParam = searchParams.get('role') || 'monitor'
  const config = roleConfig[roleParam] || roleConfig.monitor
  const Icon = config.icon

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const showNotification = useUIStore((s) => s.showNotification)

  const validRoles = Object.keys(roleConfig)
  if (!validRoles.includes(roleParam)) {
    navigate('/register', { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password) return
    setLoading(true)
    setError('')

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: name.trim(),
          role: 'planner',
          is_super_admin: true,
          invite_role: roleParam,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    try {
      const { data: newProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim())
        .maybeSingle()
      if (newProfile?.id) {
        await supabase.from('super_admins').upsert({ user_id: newProfile.id }, { onConflict: 'user_id' })
      }
    } catch { /* best-effort */ }

    let confirmed = false
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ email: email.trim() }),
        }
      )
      const body = await res.json()
      confirmed = body?.success === true
    } catch { /* best-effort */ }

    if (confirmed) {
      showNotification({ variant: 'success', title: 'Account created', message: 'You can now sign in with your password.' })
      navigate('/admin/login', { replace: true })
    } else {
      navigate('/verify-email', { replace: true })
    }
  }

  return (
    <>
      <SEO title={`Accept ${config.label} Invite — NaliGrid`} />
      <div className="adminAuthContainer">
        <div className="adminAuthLeft">
          <div className="adminAuthTopBar">
            <img src="/EventGrid-logo-white.svg" alt="NaliGrid" style={{ height: 36, width: 'auto', zIndex: 2, position: 'relative' }} />
          </div>

          <div className="adminAuthCenter">
            <div className="adminAuthCenterContent">
              <div className="adminAuthBadge" style={{ background: `${config.color}18`, color: config.color }}>
                <Icon size={13} />
                {config.label}
              </div>
              <h1 className="adminAuthTitle">Platform Invitation</h1>
              <p className="adminAuthDesc">
                You have been invited to join NaliGrid as a <strong style={{ color: config.color }}>{config.label}</strong>. {config.desc}
              </p>
            </div>
          </div>

          <div className="adminAuthFooter">
            <p className="adminAuthFooterText">
              Already have an account?{' '}
              <a href="/admin/login" className="adminAuthFooterLink" style={{ color: config.color }}>Sign in</a>
            </p>
          </div>
        </div>

        <div className="adminAuthRight">
          <form onSubmit={handleSubmit} className="adminAuthForm">
            <h2 className="adminAuthFormTitle">Create your account</h2>
            <p className="adminAuthFormDesc">Set up your credentials to access the admin panel.</p>

            {error && <div className="adminAuthError error">{error}</div>}

            <div className="input-wrapper" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="input-label adminAuthLabel" htmlFor="name">Full Name</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required className="input adminAuthInput" />
            </div>

            <div className="input-wrapper" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="input-label adminAuthLabel" htmlFor="email">Email Address</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="input adminAuthInput" />
            </div>

            <div className="input-wrapper" style={{ marginBottom: 'var(--space-5)' }}>
              <label className="input-label adminAuthLabel" htmlFor="password">Create Password</label>
              <div style={{ position: 'relative' }}>
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" minLength={6} required className="input adminAuthInput" style={{ paddingRight: '36px' }} />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="passwordToggle">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="adminAuthSubmit" style={{ backgroundColor: config.color, color: '#111827', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Creating account...' : `Accept ${config.label} Invitation`}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
