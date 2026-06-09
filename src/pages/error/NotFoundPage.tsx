import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Compass, CompassIcon, Home, RefreshCcw } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/pages/landing/Footer'
import { useAuthStore } from '@/store/auth.store'
import { SEO } from '@/components/shared/SEO'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)

  const dashboardRole = role || (user?.user_metadata?.role as string) || 'planner'
  const dashboardLink = user ? `/dashboard/${dashboardRole}` : '/home'

  return (
    <div className={styles.wrapper}>
      <SEO 
        title="404 - Coordinates Lost" 
        description="The page you are looking for does not exist or has been moved out of EventGrid bounds." 
      />
      
      {/* Navbar at top */}
      <Navbar />

      {/* Grid asset backgrounds */}
      <div className={styles.gridBackground} />
      <div className={styles.gridOverlay} />

      {/* Main content in center */}
      <main className={styles.content}>
        
        {/* Animated Radar/Compass Graphic */}
        <div className={styles.radarContainer} aria-hidden="true">
          <div className={styles.radarGridCircle} style={{ width: '180px', height: '180px' }} />
          <div className={styles.radarGridCircle} style={{ width: '120px', height: '120px' }} />
          <div className={styles.radarGridCircle} style={{ width: '60px', height: '60px' }} />
          
          <div className={styles.axisHorizontal} />
          <div className={styles.axisVertical} />
          
          <div className={styles.radarSweep} />
          
          <div className={styles.pulsePoint} />
          
          <div className={styles.compassLabel} style={{ top: '6px' }}>N</div>
          <div className={styles.compassLabel} style={{ bottom: '6px' }}>S</div>
          <div className={styles.compassLabel} style={{ right: '6px' }}>E</div>
          <div className={styles.compassLabel} style={{ left: '6px' }}>W</div>
        </div>

        {/* Text information */}
        <div className={styles.badge}>
          <span className={styles.badgePulse} />
          Error Code: 404
        </div>
        
        <h1 className={styles.headline}>Coordinates Lost</h1>
        <p className={styles.description}>
          The page or checklist workspace module you are seeking is located outside EventGrid's active coordinate system.
        </p>

        {/* Buttons / Actions */}
        <div className={styles.actions}>
          <button 
            onClick={() => navigate(-1)} 
            className={styles.secondaryBtn}
            aria-label="Go to the previous page"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
          
          <button 
            onClick={() => navigate(dashboardLink)} 
            className={styles.primaryBtn}
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
