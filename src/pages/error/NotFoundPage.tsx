import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Compass, Home } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/pages/landing/Footer'
import { useAuthStore } from '@/store/auth.store'
import { SEO } from '@/components/shared/SEO'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)

  const dashboardRole = role || (user?.user_metadata?.role as string) || 'planner'
  const dashboardLink = user ? `/dashboard/${dashboardRole}` : '/home'

  const description = pathname.startsWith('/events')
    ? 'This event page does not exist or the event may have been removed.'
    : pathname.startsWith('/dashboard')
      ? 'The dashboard section you are trying to access does not exist.'
      : pathname.startsWith('/admin')
        ? 'The admin section you are looking for does not exist.'
        : pathname.startsWith('/vendors')
          ? 'This vendor page does not exist.'
          : pathname.startsWith('/settings')
            ? 'This settings page does not exist.'
            : `The page "${pathname}" does not exist or has been moved.`

  return (
    <div className={styles.wrapper}>
      <SEO 
        title="404 — Page Not Found" 
        description={description}
      />
      
      {/* Navbar at top */}
      <Navbar />

      {/* Grid asset backgrounds */}
      <div className={styles.gridBackground} />
      <div className={styles.gridOverlay} />

      {/* Main content in center */}
      <main className={styles.content}>
        
        {/* Animated Radar Graphic */}
        <div className={styles.radarContainer} aria-hidden="true">
          <div className={styles.radarOuterRing} />
          <div className={styles.axisHorizontal} />
          <div className={styles.axisVertical} />
          <div className={styles.radarSweep} />
          <div className={styles.pulsePoint} />
        </div>

        {/* Text information */}
        <div className={styles.badge}>
          <span className={styles.badgePulse} />
          Error Code: 404
        </div>
        
        <h1 className={styles.headline}>Page Not Found</h1>
        <p className={styles.description}>{description}</p>

        {/* Buttons / Actions */}
        <div className={styles.actions}>
          <button 
            onClick={() => navigate(-1)} 
            className="btn btn-secondary"
            aria-label="Go to the previous page"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
          
          <button 
            onClick={() => navigate(dashboardLink)} 
            className="btn btn-primary"
            aria-label={user ? "Return to Dashboard" : "Return to Home Page"}
          >
            {user ? (
              <>
                <Compass size={16} />
                Return to Dashboard
              </>
            ) : (
              <>
                <Home size={16} />
                Go Home
              </>
            )}
          </button>
        </div>
      </main>

      {/* Footer at bottom */}
      <Footer />
    </div>
  )
}
