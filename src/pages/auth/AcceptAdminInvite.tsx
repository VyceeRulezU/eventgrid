import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Shield, ShieldCheck, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { SEO } from '@/components/shared/SEO'
import styles from './Auth.module.css'

const roleConfig: Record<string, { label: string; icon: typeof Shield; desc: string; color: string }> = {
  super_admin: { label: 'Super Admin', icon: ShieldCheck, desc: 'Full platform-wide access to manage all events, users, and settings.', color: '#D4A017' },
  monitor: { label: 'Monitor', icon: Shield, desc: 'Read-only access to analytics, events, and platform data.', color: '#60A5FA' },
  admin_support: { label: 'Support', icon: Users, desc: 'Manage feedback, users, and platform support tasks.', color: '#34D399' },
}

export function AcceptAdminInvite() {
  const [searchParams] = useSearchParams()
  const roleParam = searchParams.get('role') || 'monitor'
  const config = roleConfig[roleParam] || roleConfig.monitor
  const Icon = config.icon

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
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

    const { error } = await supabase.auth.signUp({
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

    if (error) {
      showNotification({ variant: 'error', title: 'Sign up failed', message: error.message })
      setLoading(false)
      return
    }

    try {
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ email: email.trim() }),
        }
      )
    } catch { /* auto-confirm is best-effort */ }

    navigate('/login?verified=true', { replace: true })
  }

  return (
    <>
      <SEO title={`Accept ${config.label} Invite — EventGrid`} />
      <div className={styles.container}>
        <div className={styles.leftPanel}>
          <div className={styles.floatingCard}>
            <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)', color: 'var(--color-accent)', fontSize: 'var(--text-sm)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Icon size={16} />
                  EventGrid Admin
                </div>
                <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 700, lineHeight: 1.15, margin: 0, color: 'var(--color-text-primary)' }}>
                  Platform <span style={{ color: 'var(--color-accent)' }}>Invitation</span>
                </h1>
                <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', lineHeight: 1.6, maxWidth: 420 }}>
                  You have been invited to join the EventGrid platform. Create your account to get started.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.formContainer}>
            <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 400 }}>
              <div style={{ marginBottom: 'var(--space-6)', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-full)', background: `${config.color}20`, color: config.color, fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                  <Icon size={14} />
                  {config.label}
                </div>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-1)', color: 'var(--color-text-primary)' }}>
                  Accept Invitation
                </h2>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                  {config.desc}
                </p>
              </div>

              <div className="input-wrapper" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="input-label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  className={styles.inputField}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="input-wrapper" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="input-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className={styles.inputField}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="input-wrapper" style={{ marginBottom: 'var(--space-5)' }}>
                <label className="input-label" htmlFor="password">Create Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={styles.inputField}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    minLength={6}
                    required
                    style={{ paddingRight: '36px' }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#ffffff', opacity: 0.6, transition: 'opacity var(--transition-fast)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', minHeight: 44, fontSize: 'var(--text-sm)', fontWeight: 600 }}
              >
                {loading ? 'Creating account...' : `Accept ${config.label} Invitation`}
              </button>

              <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                Already have an account? <a href="/login" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>Sign in</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
