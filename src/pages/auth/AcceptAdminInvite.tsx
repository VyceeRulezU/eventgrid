import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Shield, ShieldCheck, Users, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { SEO } from '@/components/shared/SEO'
import { ADMIN_LOGIN_PATH } from '@/lib/config'
import '../admin/admin-auth.css'

const roleConfig: Record<string, { label: string; icon: typeof Shield; desc: string; color: string }> = {
  super_admin: { label: 'Super Admin', icon: ShieldCheck, desc: 'Full platform-wide access to manage all events, users, and settings.', color: '#D4A017' },
  admin_monitor: { label: 'Monitor', icon: Shield, desc: 'Read-only access to analytics, events, and platform data.', color: '#60A5FA' },
  admin_support: { label: 'Support', icon: Users, desc: 'Manage feedback, users, and platform support tasks.', color: '#34D399' },
}

export function AcceptAdminInvite() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const roleParam = searchParams.get('role') || 'admin_monitor'
  const config = roleConfig[roleParam] || roleConfig.admin_monitor
  const Icon = config.icon

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)
  const [activeUser, setActiveUser] = useState<any>(null)
  
  const showNotification = useUIStore((s) => s.showNotification)

  const validRoles = Object.keys(roleConfig)
  if (!validRoles.includes(roleParam)) {
    navigate('/register', { replace: true })
    return null
  }

  useEffect(() => {
    let active = true

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (active && session?.user) {
          setActiveUser(session.user)
          setEmail(session.user.email || '')
          if (session.user.user_metadata?.display_name) {
            setName(session.user.user_metadata.display_name)
          }
        }
      } catch (err) {
        console.error('Error fetching session:', err)
      } finally {
        if (active) setCheckingSession(false)
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        if (session?.user) {
          setActiveUser(session.user)
          setEmail(session.user.email || '')
          if (session.user.user_metadata?.display_name) {
            setName(session.user.user_metadata.display_name)
          }
        } else {
          setActiveUser(null)
        }
        setCheckingSession(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !password) return
    setLoading(true)
    setError('')

    if (activeUser) {
      // 1. Update password and metadata on the auth user
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: {
          display_name: name.trim(),
        },
      })

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      // 2. Sync display name to profiles via SECURITY DEFINER stored procedure (bypasses RLS)
      try {
        const { error: profileError } = await supabase.rpc('update_own_profile', {
          p_user_id: activeUser.id,
          p_display_name: name.trim(),
        })
        if (profileError) {
          console.error('Profile display name update failed:', profileError)
        }
      } catch (err) {
        console.error('Exception updating own profile:', err)
      }

      // 3. Verify the invite is still valid (not cancelled/deleted)
      const { data: pendingInvite, error: inviteCheckErr } = await supabase
        .from('admin_invites')
        .select('id, status')
        .eq('email', activeUser.email?.trim())
        .maybeSingle()

      if (inviteCheckErr) {
        console.error('Failed to check invite status:', inviteCheckErr)
      }

      if (!pendingInvite || pendingInvite.status !== 'pending') {
        setError('This invitation is no longer valid. It may have been cancelled or expired.')
        setTimeout(() => navigate('/login', { replace: true }), 4000)
        setLoading(false)
        return
      }

      // 4. Update profile with admin role and is_super_admin flag (MUST run before marking invite accepted)
      try {
        await supabase.rpc('accept_admin_invite', {
          p_user_id: activeUser.id,
          p_role: roleParam,
          p_email: activeUser.email?.trim(),
        })
      } catch (err) {
        console.error('Exception accepting admin invite role:', err)
      }

      // 5. Mark the admin invitation as accepted
      try {
        const { error: inviteError } = await supabase
          .from('admin_invites')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
          })
          .eq('email', activeUser.email?.trim())
        if (inviteError) {
          console.error('Failed to update admin invite status:', inviteError)
        }
      } catch (err) {
        console.error('Exception updating admin invite status:', err)
      }

      showNotification({
        variant: 'success',
        title: 'Invitation accepted',
        message: 'Your administrator account has been set up successfully.',
      })
      navigate('/', { replace: true })
      return
    }

    setError('Invalid invitation session. Please use the link sent to your email.')
    setLoading(false)
  }

  if (checkingSession) {
    return (
      <div className="adminAuthContainer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 'var(--space-4)', backgroundColor: '#0B1120' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--color-accent)' }} />
        <p style={{ color: '#9CA3AF', fontSize: 'var(--text-sm)' }}>Verifying invitation session...</p>
      </div>
    )
  }

  if (!activeUser) {
    return (
      <>
        <SEO title={`Accept ${config.label} Invite — NaliGrid`} />
        <div className="adminAuthContainer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0B1120' }}>
          <div className="adminAuthLeft" style={{ maxWidth: '480px', width: '100%', padding: '40px', border: '1px solid #2a3a4e', borderRadius: '16px', backgroundColor: '#1a2432', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <div style={{ marginBottom: '24px' }}>
              <a href="/"><img src="/ng-logo-wg.svg" alt="NaliGrid" style={{ height: 36, width: 'auto', margin: '0 auto' }} /></a>
            </div>
            <div className="adminAuthBadge" style={{ background: `${config.color}18`, color: config.color, margin: '0 auto 16px', display: 'inline-flex' }}>
              <Icon size={13} />
              {config.label}
            </div>
            <h1 className="adminAuthTitle" style={{ fontSize: '24px', marginBottom: '12px' }}>Invalid Invitation</h1>
            <p className="adminAuthDesc" style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '24px', lineHeight: 1.5 }}>
              This page can only be accessed using a secure invitation link. Please check your email for the link or contact a system administrator.
            </p>
            <Link to={ADMIN_LOGIN_PATH} className="adminAuthSubmit" style={{ display: 'block', backgroundColor: config.color, color: '#111827', textDecoration: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, textAlign: 'center' }}>
              Go to Login Page
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SEO title={`Accept ${config.label} Invite — NaliGrid`} />
      <div className="adminAuthContainer">
        <div className="adminAuthLeft">
          <div className="adminAuthTopBar">
            <a href="/"><img src="/ng-logo-wg.svg" alt="NaliGrid" style={{ height: 36, width: 'auto', zIndex: 2, position: 'relative' }} /></a>
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
              <Link to={ADMIN_LOGIN_PATH} className="adminAuthFooterLink" style={{ color: config.color }}>Sign in</Link>
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
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="input adminAuthInput" disabled={true} />
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
              {loading ? 'Configuring account...' : `Accept ${config.label} Invitation`}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
