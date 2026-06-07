import { useRef, useState, useEffect } from 'react'
import { useInView, animate } from 'framer-motion'

interface AnimatedStatValueProps {
  value: string
  className?: string
}

export default function AnimatedStatValue({ value: raw, className }: AnimatedStatValueProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    const match = raw.match(/^(\D*)([\d,]+(?:\.\d+)?)(\D*)$/)
    if (!match) {
      setDisplay(raw)
      return
    }
    const prefix = match[1]
    const numStr = match[2].replace(/,/g, '')
    const suffix = match[3]
    const target = parseFloat(numStr)
    const isDecimal = numStr.includes('.')

    if (!isInView) {
      setDisplay(prefix + '0' + suffix)
      return
    }

    const controls = animate(0, target, {
      duration: 2,
      ease: 'easeOut',
      onUpdate: (v) => {
        const formatted = isDecimal ? v.toFixed(1) : Math.round(v).toString()
        const withCommas = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        setDisplay(prefix + withCommas + suffix)
      },
    })
    return () => controls.stop()
  }, [isInView, raw])

  return <span ref={ref} className={className}>{display}</span>
}
