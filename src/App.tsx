import { useEffect } from 'react'
import { lazy, Suspense } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Sentry } from '@/lib/sentry'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useNotificationStore } from '@/store/notification.store'
import { getUnreadCount, subscribeToNotifications } from '@/lib/notifications'
import type { Profile, UserRole } from '@/types'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { AdminGuard } from '@/components/layout/AdminGuard'
import { AppShell } from '@/components/layout/AppShell'
import { ADMIN_LOGIN_PATH } from '@/lib/config'
import { LandingPage } from '@/pages/landing/LandingPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { AcceptAdminInvite } from '@/pages/auth/AcceptAdminInvite'
import { InviteAccept } from '@/pages/auth/InviteAccept'
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage'
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import NotFoundPage from '@/pages/error/NotFoundPage'
import { PlannerOnboarding } from '@/pages/onboarding/PlannerOnboarding'
import { CoordinatorOnboarding } from '@/pages/onboarding/CoordinatorOnboarding'
import { TeamMemberOnboarding } from '@/pages/onboarding/TeamMemberOnboarding'
import { PlannerDashboard } from '@/pages/planner/PlannerDashboard'
import { CoordinatorDashboard } from '@/pages/coordinator/CoordinatorDashboard'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'
import { VendorPortal } from '@/pages/vendor/VendorPortal'
import { EventsListPage } from '@/features/events/EventsListPage'
import { CreateEventPage } from '@/features/events/CreateEventPage'
import { EventDashboardPage } from '@/features/events/EventDashboardPage'
import { VendorsPage } from '@/features/vendors/VendorsPage'
import { EventVendorsPage } from '@/features/vendors/EventVendorsPage'
import { VendorDirectoryPage } from '@/features/vendors/VendorDirectoryPage'
import { TeamPage } from '@/features/team/TeamPage'
import { TaskBoard } from '@/features/team/TaskBoard'
import { LiveFeedPage } from '@/features/live-board/LiveFeedPage'
import { CoordinatorsLandingPage } from '@/pages/roles/CoordinatorsLandingPage'
import { VendorsLandingPage } from '@/pages/roles/VendorsLandingPage'
import { PlannersLandingPage } from '@/pages/roles/PlannersLandingPage'
import { PipelineLandingPage } from '@/pages/features/PipelineLandingPage'
import { LiveBoardLandingPage } from '@/pages/features/LiveBoardLandingPage'
import { ClientPortalLandingPage } from '@/pages/features/ClientPortalLandingPage'
import { VendorTrackerLandingPage } from '@/pages/features/VendorTrackerLandingPage'
import { AftermathReportsLandingPage } from '@/pages/features/AftermathReportsLandingPage'
import { AboutPage } from '@/pages/info/AboutPage'
import { BlogPage } from '@/pages/info/BlogPage'
import { BlogPostPage } from '@/pages/info/BlogPostPage'
import { CareersPage } from '@/pages/info/CareersPage'
import { PressPage } from '@/pages/info/PressPage'
import { ContactPage } from '@/pages/info/ContactPage'
import { FAQPage } from '@/pages/info/FAQPage'
import { PricingPage } from '@/pages/info/PricingPage'
import { PrivacyPage } from '@/pages/info/PrivacyPage'
import { TermsPage } from '@/pages/info/TermsPage'
import { CookiesPage } from '@/pages/info/CookiesPage'
import { SecurityPage } from '@/pages/info/SecurityPage'
import { SurveyPage } from '@/pages/info/SurveyPage'
import { DataDeletionPage } from '@/pages/info/DataDeletionPage'
import { ScrollToTop } from '@/components/shared/ScrollToTop'
import { CookieNotice } from '@/components/CookieNotice'

const GuestManagementPage = lazy(() => import('@/features/guests/GuestManagementPage').then(m => ({ default: m.GuestManagementPage })))
const FinancialsPage = lazy(() => import('@/features/financials/FinancialsPage').then(m => ({ default: m.FinancialsPage })))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const ClientPortalPage = lazy(() => import('@/features/client-portal/ClientPortalPage').then(m => ({ default: m.ClientPortalPage })))
const ReferralPortalPage = lazy(() => import('@/features/referrals/ReferralPortalPage').then(m => ({ default: m.ReferralPortalPage })))
const SuperAdminDashboard = lazy(() => import('@/pages/admin/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })))
const HelpPage = lazy(() => import('@/pages/settings/HelpPage').then(m => ({ default: m.HelpPage })))
const MyTasksPage = lazy(() => import('@/pages/team/MyTasksPage').then(m => ({ default: m.MyTasksPage })))
const FeedbackManagementPage = lazy(() => import('@/pages/admin/FeedbackManagementPage').then(m => ({ default: m.FeedbackManagementPage })))
const SuperAdminTeamPage = lazy(() => import('@/pages/admin/SuperAdminTeamPage').then(m => ({ default: m.SuperAdminTeamPage })))
const AdminSurveyResponsesPage = lazy(() => import('@/pages/admin/AdminSurveyResponsesPage').then(m => ({ default: m.AdminSurveyResponsesPage })))
const AdminManagePage = lazy(() => import('@/pages/admin/AdminManagePage').then(m => ({ default: m.AdminManagePage })))
const AnalyticsPage = lazy(() => import('@/pages/admin/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })))
const AdminMyTasksPage = lazy(() => import('@/pages/admin/AdminMyTasksPage').then(m => ({ default: m.AdminMyTasksPage })))
const AdminEventsListPage = lazy(() => import('@/pages/admin/AdminEventsListPage').then(m => ({ default: m.AdminEventsListPage })))
const AdminVendorsPage = lazy(() => import('@/pages/admin/AdminVendorsPage').then(m => ({ default: m.AdminVendorsPage })))
const AdminVendorDirectoryPage = lazy(() => import('@/pages/admin/AdminVendorDirectoryPage').then(m => ({ default: m.AdminVendorDirectoryPage })))
const AdminTestimonialsPage = lazy(() => import('@/pages/admin/AdminTestimonialsPage').then(m => ({ default: m.AdminTestimonialsPage })))
const AdminReferralsPage = lazy(() => import('@/pages/admin/AdminReferralsPage').then(m => ({ default: m.AdminReferralsPage })))


const EventAssetsPage = lazy(() => import('@/features/assets/EventAssetsPage').then(m => ({ default: m.EventAssetsPage })))
const AftermathPage = lazy(() => import('@/features/aftermath/AftermathPage').then(m => ({ default: m.AftermathPage })))
const CompletedEventReport = lazy(() => import('@/features/aftermath/CompletedEventReport').then(m => ({ default: m.CompletedEventReport })))
const GuestRsvpPage = lazy(() => import('@/features/guests/GuestRsvpPage').then(m => ({ default: m.GuestRsvpPage })))
import { PremiumModalContainer } from '@/components/ui/PremiumModal'
import { NotificationsDrawer } from '@/features/notifications/NotificationsDrawer'
import { AlertTriangle, Terminal, ExternalLink, RefreshCw } from 'lucide-react'

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, message: string) {
  let timeoutId: number | null = null
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs)
  })

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId)
    }
  }) as Promise<T>
}

function AuthGate() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const role = useAuthStore((s) => s.role)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading || (user && !profile)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 'var(--space-4)' }}>
        <img src="/ng-new-logo.png" alt="Loading" style={{ width: 56, height: 56, opacity: 0.5 }} />
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading NaliGrid...</div>
      </div>
    )
  }

  if (!user) return <Navigate to="/home" replace />
  const r = role || (user?.user_metadata?.role as string) || 'planner'
  return <Navigate to={r === 'super_admin' ? '/admin' : `/dashboard/${r}`} replace />
}

function SetupNotice() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#111827',
      color: '#F9FAFB',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding: '24px',
    }}>
      <div style={{
        maxWidth: '560px',
        width: '100%',
        backgroundColor: '#1F2937',
        border: '1px solid #374151',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(212, 160, 23, 0.15)',
            color: '#D4A017',
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#F9FAFB' }}>
              Database Setup Required
            </h1>
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
              Missing environment variables in <code>.env.local</code>
            </p>
          </div>
        </div>

        <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#D1D5DB', marginBottom: '24px' }}>
          NaliGrid is a multi-role SaaS platform powered by Supabase. To run it locally, you need to configure your local environment variables.
        </p>

        <div style={{
          backgroundColor: '#111827',
          borderRadius: '10px',
          border: '1px solid #374151',
          padding: '16px',
          marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#9CA3AF', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={14} /> Step 1: Open .env.local
          </h2>
          <p style={{ fontSize: '13px', color: '#D1D5DB', margin: '0 0 12px 0', lineHeight: 1.5 }}>
            Open the file <code>.env.local</code> in your project root and add your Supabase credentials:
          </p>
          <pre style={{
            margin: 0,
            fontSize: '12px',
            color: '#34D399',
            backgroundColor: '#0F172A',
            padding: '12px',
            borderRadius: '6px',
            overflowX: 'auto',
            fontFamily: 'Consolas, Monaco, monospace',
            lineHeight: 1.5,
          }}>
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
          </pre>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D4A017', marginTop: '7px' }} />
            <div style={{ fontSize: '13px', color: '#D1D5DB', lineHeight: 1.5 }}>
              <strong>Step 2:</strong> Get these keys from your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: '#D4A017', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>Supabase Dashboard <ExternalLink size={11} /></a> under Project Settings &gt; API.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D4A017', marginTop: '7px' }} />
            <div style={{ fontSize: '13px', color: '#D1D5DB', lineHeight: 1.5 }}>
              <strong>Step 3:</strong> Save the file and restart the development server with <code>npm run dev</code>.
            </div>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          style={{
            width: '100%',
            backgroundColor: '#D4A017',
            color: '#111827',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background-color 0.2s',
            cursor: 'pointer',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#B8860B'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#D4A017'}
        >
          <RefreshCw size={16} /> I've updated the file — Reload Page
        </button>
      </div>
    </div>
  )
}

function ErrorFallback({ error }: { error?: unknown }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#111827', color: '#F9FAFB',
      fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 24,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Something went wrong</h1>
        <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          An unexpected error occurred. The team has been notified.
        </p>
        {error ? (
          <div style={{
            background: '#1F2937', borderRadius: 8, padding: 16, marginBottom: 24,
            textAlign: 'left', fontSize: 12, fontFamily: 'monospace',
            color: '#FCA5A5', overflowX: 'auto', maxHeight: 160, overflowY: 'auto',
          }}>
            <div style={{ color: '#9CA3AF', marginBottom: 4 }}>Error details:</div>
            {String(error instanceof Error ? error.message : error)}
          </div>
        ) : null}
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: '#D4A017', color: '#111827', fontWeight: 700,
            cursor: 'pointer', fontSize: 14,
          }}
        >
          Reload Page
        </button>
      </div>
    </div>
  )
}

export function App() {
  const setUser = useAuthStore((s) => s.setUser)
  const setProfile = useAuthStore((s) => s.setProfile)
  const setOrg = useAuthStore((s) => s.setOrg)
  const setBetaLabelVisible = useAuthStore((s) => s.setBetaLabelVisible)
  const setLoading = useAuthStore((s) => s.setLoading)
  async function loadProfile(userId: string, user?: User) {
    let profile: Profile | null = null
    let error: unknown = null

    try {
      const result = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        8000,
        'Profile request timed out.'
      )
      profile = result.data
      error = result.error
    } catch (err) {
      error = err
    }

    if (profile) {
      if (!profile.display_name) {
        const name = user?.user_metadata?.display_name || user?.email?.split('@')[0] || null
        if (name) {
          await supabase.from('profiles').update({ display_name: name }).eq('id', userId)
          profile.display_name = name
        }
      }
      setProfile(profile)
      if (profile.org_id) {
        try {
          const { data: org } = await withTimeout(
            supabase
              .from('organizations')
              .select('id, name, logo_url, show_beta_label')
              .eq('id', profile.org_id)
              .single(),
            8000,
            'Organization request timed out.'
          )
          if (org) setOrg({ ...org, show_beta_label: org.show_beta_label ?? true })
        } catch (err) {
          console.warn('Unable to load organization:', err instanceof Error ? err.message : err)
        }
      }

      try {
        const { data: settings } = await supabase
          .from('app_settings')
          .select('show_beta_label')
          .eq('id', 1)
          .single()
        if (settings) setBetaLabelVisible(settings.show_beta_label)
      } catch (err) {
        console.warn('Unable to load app settings:', err instanceof Error ? err.message : err)
      }
      return
    }

    if (error) {
      console.warn('Unable to load profile:', error instanceof Error ? error.message : error)
    }

    const fallbackProfile: Profile = {
      id: userId,
      email: user?.email || '',
      display_name: (user?.user_metadata?.display_name as string) || null,
      phone: (user?.user_metadata?.phone as string) || null,
      avatar_url: null,
      role: (user?.user_metadata?.role as UserRole) || 'planner',
      org_id: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setProfile(fallbackProfile)
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let isMounted = true

    async function initializeAuth() {
      try {
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          8000,
          'Session request timed out.'
        )
        if (!isMounted) return

        if (session?.user) {
          setUser(session.user)
          await loadProfile(session.user.id, session.user)
        } else {
          setUser(null)
          setProfile(null)
          setOrg(null)
        }
      } catch (err) {
        console.warn('Unable to initialize auth:', err instanceof Error ? err.message : err)
        if (isMounted) {
          setUser(null)
          setProfile(null)
          setOrg(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        if (_event !== 'INITIAL_SESSION') {
          loadProfile(session.user.id, session.user).finally(() => setLoading(false))
          getUnreadCount(session.user.id).then(useNotificationStore.getState().setUnreadCount)
        }
      } else {
        setUser(null)
        setProfile(null)
        setOrg(null)
        useNotificationStore.getState().setNotifications([])
        useNotificationStore.getState().setUnreadCount(0)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [setUser, setProfile, setOrg, setLoading])

  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToNotifications(user.id, () => {
      getUnreadCount(user.id).then(useNotificationStore.getState().setUnreadCount)
    })
    return unsub
  }, [user])

  if (!isSupabaseConfigured) {
    return (
      <Sentry.ErrorBoundary fallback={({ error }) => <ErrorFallback error={error} />}>
        <SetupNotice />
        <PremiumModalContainer />
      </Sentry.ErrorBoundary>
    )
  }

  return (
    <Sentry.ErrorBoundary fallback={({ error }) => <ErrorFallback error={error} />}>
      <Analytics />
      <SpeedInsights />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<AuthGate />} />
          <Route path="/home" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/accept-admin-invite" element={<AcceptAdminInvite />} />
          <Route path="/invite/accept" element={<InviteAccept />} />
          <Route path={ADMIN_LOGIN_PATH} element={<AdminLoginPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/coordinators" element={<CoordinatorsLandingPage />} />
          <Route path="/planners" element={<PlannersLandingPage />} />
          <Route path="/vendors-landing" element={<VendorsLandingPage />} />
          <Route path="/features/pipeline" element={<PipelineLandingPage />} />
          <Route path="/features/live-board" element={<LiveBoardLandingPage />} />
          <Route path="/features/client-portal" element={<ClientPortalLandingPage />} />
          <Route path="/features/vendor-tracker" element={<VendorTrackerLandingPage />} />
          <Route path="/features/aftermath-reports" element={<AftermathReportsLandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/press" element={<PressPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/survey" element={<SurveyPage />} />
          <Route path="/data-deletion" element={<DataDeletionPage />} />
        <Route path="/portal/:token" element={
          <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 300 }} />}>
            <ClientPortalPage />
          </Suspense>
        } />
        <Route path="/portal/referral/:token" element={
          <Suspense fallback={<div className="empty-state"><div className="empty-state__title">Loading...</div></div>}>
            <ReferralPortalPage />
          </Suspense>
        } />

        <Route path="/rsvp" element={
          <Suspense fallback={<div className="empty-state"><div className="empty-state__title">Loading...</div></div>}>
            <GuestRsvpPage />
          </Suspense>
        } />
        <Route path="/onboarding/planner" element={
          <AuthGuard><PlannerOnboarding /></AuthGuard>
        } />
          <Route path="/onboarding/coordinator" element={
            <AuthGuard><CoordinatorOnboarding /></AuthGuard>
          } />
          <Route path="/onboarding/team-member" element={
            <AuthGuard><TeamMemberOnboarding /></AuthGuard>
          } />

          <Route element={<AuthGuard><AppShell /></AuthGuard>}>
            <Route path="/dashboard/planner" element={
              <RoleGuard allowedRole="planner"><PlannerDashboard /></RoleGuard>
            } />
            <Route path="/dashboard/coordinator" element={
              <RoleGuard allowedRole="coordinator"><CoordinatorDashboard /></RoleGuard>
            } />
            <Route path="/dashboard/vendor" element={
              <RoleGuard allowedRole="vendor"><VendorPortal /></RoleGuard>
            } />
            <Route path="/dashboard/client" element={<Navigate to="/vendors/directory" replace />} />
            <Route path="/dashboard/my-tasks" element={
              <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 400 }} />}>
                <MyTasksPage />
              </Suspense>
            } />
            <Route path="/dashboard/team_member" element={<Navigate to="/dashboard/my-tasks" replace />} />

            <Route path="/events" element={<EventsListPage />} />
            <Route path="/events/new" element={<CreateEventPage />} />
            <Route path="/events/:id" element={<EventDashboardPage />} />
            <Route path="/events/:id/team" element={<TeamPage />} />
            <Route path="/events/:id/tasks" element={<TaskBoard />} />
            <Route path="/events/:id/vendors" element={<EventVendorsPage />} />
          <Route path="/events/:id/live-board" element={<LiveFeedPage />} />
          <Route path="/events/:id/assets" element={
            <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 400 }} />}>
              <EventAssetsPage />
            </Suspense>
          } />
          <Route path="/events/:id/guests" element={
            <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 400 }} />}>
              <GuestManagementPage />
            </Suspense>
          } />
          <Route path="/events/:id/aftermath" element={
            <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 400 }} />}>
              <AftermathPage />
            </Suspense>
          } />
          <Route path="/events/:id/report" element={
            <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 400 }} />}>
              <CompletedEventReport />
            </Suspense>
          } />
          <Route path="/financials" element={
              <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 300 }} />}>
                <RoleGuard allowedRole="planner"><FinancialsPage /></RoleGuard>
              </Suspense>
            } />
          <Route path="/events/:id/financials" element={
              <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 300 }} />}>
                <RoleGuard allowedRole="planner"><FinancialsPage /></RoleGuard>
              </Suspense>
            } />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/vendors/directory" element={<VendorDirectoryPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={
            <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 300 }} />}>
              <SettingsPage />
            </Suspense>
          } />
          <Route path="/settings/help" element={
            <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 300 }} />}>
              <HelpPage />
            </Suspense>
          } />
          <Route path="/admin" element={
            <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 300 }} />}>
              <RoleGuard allowedRole="super_admin"><SuperAdminDashboard /></RoleGuard>
            </Suspense>
          } />
          <Route path="/admin/feedback" element={
            <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 300 }} />}>
              <RoleGuard allowedRole="admin_support"><FeedbackManagementPage /></RoleGuard>
            </Suspense>
          } />
          <Route path="/admin/surveys" element={
            <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 300 }} />}>
              <RoleGuard allowedRole="super_admin"><AdminSurveyResponsesPage /></RoleGuard>
            </Suspense>
          } />
          <Route path="/admin/team" element={
            <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 300 }} />}>
              <RoleGuard allowedRole="super_admin"><SuperAdminTeamPage /></RoleGuard>
            </Suspense>
          } />
          <Route path="/admin/manage" element={
            <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 300 }} />}>
              <RoleGuard allowedRole="super_admin"><AdminManagePage /></RoleGuard>
            </Suspense>
          } />

          <Route path="/admin/analytics" element={
            <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 300 }} />}>
              <RoleGuard allowedRole={['monitor', 'admin_support']}><AnalyticsPage /></RoleGuard>
            </Suspense>
          } />
          <Route path="/admin/my-tasks" element={
            <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 300 }} />}>
              <AdminGuard><AdminMyTasksPage /></AdminGuard>
            </Suspense>
          } />
          <Route path="/admin/events" element={
            <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 300 }} />}>
              <AdminGuard><AdminEventsListPage /></AdminGuard>
            </Suspense>
          } />
          <Route path="/admin/vendors" element={
            <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 300 }} />}>
              <AdminGuard><AdminVendorsPage /></AdminGuard>
            </Suspense>
          } />
          <Route path="/admin/vendors/directory" element={
            <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 300 }} />}>
              <RoleGuard allowedRole="super_admin"><AdminVendorDirectoryPage /></RoleGuard>
            </Suspense>
          } />
          <Route path="/admin/testimonials" element={
            <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 300 }} />}>
              <RoleGuard allowedRole="super_admin"><AdminTestimonialsPage /></RoleGuard>
            </Suspense>
          } />
          <Route path="/admin/referrals" element={
            <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 300 }} />}>
              <RoleGuard allowedRole="super_admin"><AdminReferralsPage /></RoleGuard>
            </Suspense>
          } />
        </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <NotificationsDrawer />
        <CookieNotice />
      </BrowserRouter>
      <PremiumModalContainer />
    </Sentry.ErrorBoundary>
  )
}
