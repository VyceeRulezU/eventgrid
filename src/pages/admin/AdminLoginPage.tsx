import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { SEO } from '@/components/shared/SEO'
import { useCaptchaToken, CaptchaField, hasCaptcha } from '@/lib/captcha'
import './admin-auth.css'

export function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { token: captchaTokenValue, setToken: setCaptchaToken, getToken: getCaptchaToken } = useCaptchaToken()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const verified = searchParams.get('verified')
  const showNotification = useUIStore((s) => s.showNotification)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true)
    setError('')

    const captchaToken = getCaptchaToken()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
      ...(captchaToken && { options: { captchaToken } }),
    })

    if (signInError) {
      if (signInError.message?.toLowerCase().includes('email not confirmed')) {
        setError('Your email has not been confirmed yet. Please check your inbox for the confirmation link.')
      } else {
        setError(signInError.message)
      }
      setLoading(false)
      return
    }

    showNotification({ variant: 'success', title: 'Signed in' })
    navigate('/admin', { replace: true })
  }

  return (
    <>
      <SEO title="Admin Login — NaliGrid" />
      <div className="adminAuthContainer">
        <div className="adminAuthLeft">
          <div className="adminAuthTopBar">
            <img src="/EventGrid-logo-white.svg" alt="NaliGrid" style={{ height: 36, width: 'auto', zIndex: 2, position: 'relative' }} />
          </div>

          <div className="adminAuthCenter">
            <div className="adminAuthCenterContent">
              <div className="adminAuthBadge" style={{ background: 'rgba(212,160,23,0.1)', color: '#D4A017' }}>
                <Shield size={13} />
                Admin Portal
              </div>
              <h1 className="adminAuthTitle">Admin Sign In</h1>
              <p className="adminAuthDesc">
                Sign in to manage NaliGrid platform settings, users, and analytics.
              </p>
            </div>
          </div>

          <div className="adminAuthFooter">
            <p className="adminAuthFooterText">
              Not an admin?{' '}
              <a href="/login" className="adminAuthFooterLink" style={{ color: '#D4A017' }}>User sign in</a>
            </p>
          </div>
        </div>

        <div className="adminAuthRight">
          <form onSubmit={handleSubmit} className="adminAuthForm">
            <h2 className="adminAuthFormTitle">Welcome back</h2>
            <p className="adminAuthFormDesc">Sign in to the admin panel.</p>

            {verified === 'true' && (
              <div className="adminAuthError success">Email verified! You can now sign in.</div>
            )}

            {error && <div className="adminAuthError error">{error}</div>}

            <div className="input-wrapper" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="input-label adminAuthLabel" htmlFor="email">Email Address</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@naligrid.com" required className="input adminAuthInput" />
            </div>

            <div className="input-wrapper" style={{ marginBottom: 'var(--space-5)' }}>
              <label className="input-label adminAuthLabel" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required className="input adminAuthInput" style={{ paddingRight: '36px' }} />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="passwordToggle">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <CaptchaField onToken={setCaptchaToken} />
            <button type="submit" disabled={loading || (hasCaptcha && !captchaTokenValue)} className="adminAuthSubmit" style={{ backgroundColor: '#D4A017', color: '#111827', opacity: loading || (hasCaptcha && !captchaTokenValue) ? 0.6 : 1 }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
