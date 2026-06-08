import { useEffect } from 'react'
import { lazy, Suspense } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { useNotificationStore } from '@/store/notification.store'
import { getUnreadCount } from '@/lib/notifications'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { AppShell } from '@/components/layout/AppShell'
import { LandingPage } from '@/pages/landing/LandingPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage'
import { PlannerOnboarding } from '@/pages/onboarding/PlannerOnboarding'
import { CoordinatorOnboarding } from '@/pages/onboarding/CoordinatorOnboarding'
import { TeamMemberOnboarding } from '@/pages/onboarding/TeamMemberOnboarding'
import { PlannerDashboard } from '@/pages/planner/PlannerDashboard'
import { CoordinatorDashboard } from '@/pages/coordinator/CoordinatorDashboard'
import { ClientDashboard } from '@/pages/client/ClientDashboard'
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
import { LiveBoardPage } from '@/features/live-board/LiveBoardPage'

const GuestManagementPage = lazy(() => import('@/features/guests/GuestManagementPage').then(m => ({ default: m.GuestManagementPage })))
const FinancialsPage = lazy(() => import('@/features/financials/FinancialsPage').then(m => ({ default: m.FinancialsPage })))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const ClientPortalPage = lazy(() => import('@/features/client-portal/ClientPortalPage').then(m => ({ default: m.ClientPortalPage })))
const SuperAdminDashboard = lazy(() => import('@/pages/admin/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })))
const AnalyticsPage = lazy(() => import('@/pages/admin/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })))
const HelpPage = lazy(() => import('@/pages/settings/HelpPage').then(m => ({ default: m.HelpPage })))
const MyTasksPage = lazy(() => import('@/pages/team/MyTasksPage').then(m => ({ default: m.MyTasksPage })))
const FeedbackManagementPage = lazy(() => import('@/pages/admin/FeedbackManagementPage').then(m => ({ default: m.FeedbackManagementPage })))
const SuperAdminTeamPage = lazy(() => import('@/pages/admin/SuperAdminTeamPage').then(m => ({ default: m.SuperAdminTeamPage })))

const AftermathPage = lazy(() => import('@/features/aftermath/AftermathPage').then(m => ({ default: m.AftermathPage })))
import { PremiumModalContainer } from '@/components/ui/PremiumModal'
import { NotificationsDrawer } from '@/features/notifications/NotificationsDrawer'
import { AlertTriangle, Terminal, ExternalLink, RefreshCw } from 'lucide-react'

function AuthGate() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 'var(--space-4)' }}>
        <img src="/EventGrid-favicon.svg" alt="Loading" style={{ width: 56, height: 56, opacity: 0.5 }} />
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading EventGrid...</div>
      </div>
    )
  }

  if (!user) return <Navigate to="/home" replace />
  const dashboardRole = role || (user?.user_metadata?.role as string) || 'planner'
  return <Navigate to={`/dashboard/${dashboardRole}`} replace />
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
          EventGrid is a multi-role SaaS platform powered by Supabase. To run it locally, you need to configure your local environment variables.
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

export function App() {
  const setUser = useAuthStore((s) => s.setUser)
  const setProfile = useAuthStore((s) => s.setProfile)
  const setOrg = useAuthStore((s) => s.setOrg)
  const setLoading = useAuthStore((s) => s.setLoading)
  const setTheme = useUIStore((s) => s.setTheme)

  async function loadProfile(userId: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (profile) {
      setProfile(profile)
      if (profile.org_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('id, name, logo_url')
          .eq('id', profile.org_id)
          .single()
        if (org) setOrg(org)
      }
    }
  }

  useEffect(() => {
    setTheme(
      (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') ?? 'dark'
    )

    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        await loadProfile(session.user.id)
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        if (_event !== 'INITIAL_SESSION') {
          loadProfile(session.user.id)
          getUnreadCount(session.user.id).then(useNotificationStore.getState().setUnreadCount)
          setLoading(false)
        }
      } else {
        setUser(null)
        setProfile(null)
        setOrg(null)
        useNotificationStore.getState().setNotifications([])
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser, setProfile, setOrg, setLoading, setTheme])

  if (!isSupabaseConfigured) {
    return (
      <>
        <SetupNotice />
        <PremiumModalContainer />
      </>
    )
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthGate />} />
          <Route path="/home" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/portal/:token" element={
          <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 300 }} />}>
            <ClientPortalPage />
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
            <Route path="/dashboard/client" element={
              <RoleGuard allowedRole="client"><ClientDashboard /></RoleGuard>
            } />
            <Route path="/dashboard/super_admin" element={
              <RoleGuard allowedRole="super_admin"><SuperAdminDashboard /></RoleGuard>
            } />
            <Route path="/dashboard/my-tasks" element={
              <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 400 }} />}>
                <MyTasksPage />
              </Suspense>
            } />

            <Route path="/events" element={<EventsListPage />} />
            <Route path="/events/new" element={<CreateEventPage />} />
            <Route path="/events/:id" element={<EventDashboardPage />} />
            <Route path="/events/:id/team" element={<TeamPage />} />
            <Route path="/events/:id/tasks" element={<TaskBoard />} />
            <Route path="/events/:id/vendors" element={<EventVendorsPage />} />
          <Route path="/events/:id/live-board" element={<LiveBoardPage />} />
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
              <RoleGuard allowedRole="super_admin"><AnalyticsPage /></RoleGuard>
            </Suspense>
          } />
          <Route path="/admin/feedback" element={
            <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 300 }} />}>
              <RoleGuard allowedRole="super_admin"><FeedbackManagementPage /></RoleGuard>
            </Suspense>
          } />
          <Route path="/admin/team" element={
            <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 300 }} />}>
              <RoleGuard allowedRole="super_admin"><SuperAdminTeamPage /></RoleGuard>
            </Suspense>
          } />
        </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <PremiumModalContainer />
      <NotificationsDrawer />
    </>
  )
}
