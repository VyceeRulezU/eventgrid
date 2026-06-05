import { type InputHTMLAttributes, forwardRef } from 'react'
import styles from './Checkbox.module.css'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  'aria-label'?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={`${styles.checkbox} ${className}`}
      {...props}
    />
  )
)
Checkbox.displayName = 'Checkbox'
