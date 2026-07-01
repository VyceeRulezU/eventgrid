import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './CookieNotice.module.css'

const STORAGE_KEY = 'eg-cookie-notice-ack'

export function CookieNotice() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(STORAGE_KEY))

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    /*
     * IMPORTANT: If product analytics (e.g. PostHog, Plausible) are added in
     * future, this component must be upgraded to a real consent banner with
     * accept/reject for non-essential tracking.
     */
    <div className={styles.cookieNotice}>
      <p className={styles.cookieNotice__text}>
        We use essential cookies and local storage to keep you logged in
        and remember your preferences. See our{' '}
        <Link to="/cookies" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
          Cookie Policy
        </Link>{' '}
        for details.
      </p>
      <div className={styles.cookieNotice__actions}>
        <button className="btn btn-primary btn-sm" onClick={handleDismiss}>
          Got it
        </button>
        <Link to="/cookies" className="btn btn-ghost btn-sm">
          Cookie Policy →
        </Link>
      </div>
    </div>
  )
}
