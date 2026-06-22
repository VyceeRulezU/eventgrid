import { Lock, Gift } from 'lucide-react'
import styles from './ModuleLock.module.css'

interface ModuleLockProps {
  onActivate: () => void
}

export function ModuleLock({ onActivate }: ModuleLockProps) {
  return (
    <div className={styles.lock}>
      <div className={styles.lockIcon}>
        <Lock size={32} />
      </div>
      <h3 className={styles.lockTitle}>Feature Locked</h3>
      <p className={styles.lockDesc}>
        Activate this event to unlock all planning features including vendors, guests, finances, tasks, team coordination, and more.
      </p>
      <button className="btn btn-primary btn-lg" onClick={onActivate}>
        <Gift size={18} /> Activate Free
      </button>
    </div>
  )
}
