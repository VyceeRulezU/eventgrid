import styles from './Switch.module.css'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function Switch({ checked, onChange, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`${styles.track} ${checked ? styles.on : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.thumb} />
    </button>
  )
}
