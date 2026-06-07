import { useState, useEffect, useCallback, useRef } from 'react'
import { HelpCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { TOUR_STEPS, type TourRole } from './tourSteps'
import styles from './AppTour.module.css'

const STORAGE_KEY = (role: string) => `eg_tour_done_${role}`

// Exported so Settings can trigger it
export function clearTourForRole(role: string) {
  localStorage.removeItem(STORAGE_KEY(role))
}

function useSpotlightRect(targetId: string | null, step: number) {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!targetId) {
      setRect(null)
      return
    }
    const update = () => {
      const el = document.getElementById(targetId)
      if (el) {
        const r = el.getBoundingClientRect()
        // Add generous padding around the element
        const PADDING = 8
        setRect(new DOMRect(
          r.left - PADDING,
          r.top - PADDING,
          r.width + PADDING * 2,
          r.height + PADDING * 2,
        ))
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      } else {
        setRect(null)
      }
    }
    // Small delay to let DOM settle
    const t = setTimeout(update, 150)
    return () => clearTimeout(t)
  }, [targetId, step])

  return rect
}

function computeTooltipPosition(rect: DOMRect | null, placement: string, vw: number, vh: number) {
  const TW = 320
  const TH = 200 // estimated height
  const GAP = 16

  if (!rect) {
    return {
      top: vh / 2 - TH / 2,
      left: vw / 2 - TW / 2,
    }
  }

  switch (placement) {
    case 'bottom':
      return {
        top: Math.min(rect.bottom + GAP, vh - TH - 8),
        left: Math.max(8, Math.min(rect.left + rect.width / 2 - TW / 2, vw - TW - 8)),
      }
    case 'top':
      return {
        top: Math.max(8, rect.top - TH - GAP),
        left: Math.max(8, Math.min(rect.left + rect.width / 2 - TW / 2, vw - TW - 8)),
      }
    case 'right':
      return {
        top: Math.max(8, Math.min(rect.top + rect.height / 2 - TH / 2, vh - TH - 8)),
        left: Math.min(rect.right + GAP, vw - TW - 8),
      }
    case 'left':
      return {
        top: Math.max(8, Math.min(rect.top + rect.height / 2 - TH / 2, vh - TH - 8)),
        left: Math.max(8, rect.left - TW - GAP),
      }
    default:
      return { top: vh / 2 - TH / 2, left: vw / 2 - TW / 2 }
  }
}

export function AppTour() {
  const role = useAuthStore((s) => s.role) as TourRole | null
  const steps = role && TOUR_STEPS[role] ? TOUR_STEPS[role] : []

  const [phase, setPhase] = useState<'idle' | 'welcome' | 'touring' | 'done'>('idle')
  const [stepIndex, setStepIndex] = useState(0)
  const [vw, setVw] = useState(window.innerWidth)
  const [vh, setVh] = useState(window.innerHeight)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Handle resize
  useEffect(() => {
    const onResize = () => { setVw(window.innerWidth); setVh(window.innerHeight) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Auto-start for first-time users (after 800ms delay)
  useEffect(() => {
    if (!role) return
    const done = localStorage.getItem(STORAGE_KEY(role))
    if (!done) {
      const t = setTimeout(() => setPhase('welcome'), 800)
      return () => clearTimeout(t)
    }
  }, [role])

  const currentStep = steps[stepIndex]
  const rect = useSpotlightRect(
    phase === 'touring' ? (currentStep?.targetId ?? null) : null,
    stepIndex,
  )

  const finishTour = useCallback(() => {
    if (role) localStorage.setItem(STORAGE_KEY(role), '1')
    setPhase('done')
  }, [role])

  const startTour = useCallback(() => {
    setStepIndex(0)
    setPhase('touring')
  }, [])

  const skipWelcome = useCallback(() => {
    if (role) localStorage.setItem(STORAGE_KEY(role), '1')
    setPhase('done')
  }, [role])

  const next = useCallback(() => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1)
    } else {
      finishTour()
    }
  }, [stepIndex, steps.length, finishTour])

  const prev = useCallback(() => {
    if (stepIndex > 0) setStepIndex((i) => i - 1)
  }, [stepIndex])

  // Keyboard navigation
  useEffect(() => {
    if (phase !== 'touring') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finishTour()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, next, prev, finishTour])

  if (!role || steps.length === 0) return null

  // ── Welcome Modal ──────────────────────────────────────────────────────────
  if (phase === 'welcome') {
    const firstStep = steps[0]
    const roleLabel: Record<TourRole, string> = {
      planner: 'Event Planner',
      coordinator: 'Coordinator',
      client: 'Client',
      vendor: 'Vendor',
      super_admin: 'Admin',
    }
    const features = {
      planner: ['Create & Manage Events', 'Track Financials', 'Client Portals'],
      coordinator: ['Assigned Projects', 'Task Board', 'Live Board'],
      client: ['Event Progress', 'Payment Timeline', 'Real-time Updates'],
      vendor: ['Booking Overview', 'Contract Status', 'Payment Tracking'],
      super_admin: ['Platform Analytics', 'Feedback Review', 'User Management'],
    }
    return (
      <div className={styles.welcomeOverlay}>
        <div className={styles.welcomeCard} role="dialog" aria-modal="true" aria-label="Welcome">
          <div className={styles.welcomeEmojiWrap}>
            <span className={styles.welcomeEmoji}>🎉</span>
          </div>
          <div className={styles.welcomeSubtitle}>{roleLabel[role!]} Dashboard</div>
          <h2 className={styles.welcomeTitle}>{firstStep.title}</h2>
          <p className={styles.welcomeBody}>{firstStep.body}</p>
          <div className={styles.welcomeFeatures}>
            {(features[role!] ?? []).map((f) => (
              <span key={f} className={styles.welcomeFeaturePill}>
                <span className={styles.welcomeFeatureDot} />
                {f}
              </span>
            ))}
          </div>
          <div className={styles.welcomeActions}>
            <button className={`${styles.welcomeBtn} ${styles.welcomeBtnPrimary}`} onClick={startTour}>
              Start the Tour →
            </button>
            <button className={`${styles.welcomeBtn} ${styles.welcomeBtnGhost}`} onClick={skipWelcome}>
              I'll explore on my own
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Floating help button (post-tour) ──────────────────────────────────────
  if (phase === 'done' || phase === 'idle') {
    const alreadyDone = role && localStorage.getItem(STORAGE_KEY(role))
    if (!alreadyDone) return null
    return (
      <button
        className={styles.helpBtn}
        onClick={() => { setStepIndex(0); setPhase('touring') }}
        aria-label="Restart tour"
        title="App Tour"
      >
        <HelpCircle size={20} />
      </button>
    )
  }

  // ── Tour Spotlight ─────────────────────────────────────────────────────────
  if (phase !== 'touring') return null
  if (!currentStep) return null

  // Skip the first step (already shown in welcome modal)
  const displaySteps = steps.slice(1)
  const displayIndex = stepIndex - 1
  const displayStep = displaySteps[displayIndex]

  // If we're still on step 0 (shouldn't happen after welcome), skip to 1
  if (stepIndex === 0) {
    setStepIndex(1)
    return null
  }

  if (!displayStep) {
    finishTour()
    return null
  }

  const pos = computeTooltipPosition(rect, displayStep.placement, vw, vh)

  // Spotlight panels (top, bottom, left, right of the highlight rect)
  const panels = rect
    ? [
        // Top panel
        { top: 0, left: 0, right: 0, height: rect.top },
        // Bottom panel
        { top: rect.bottom, left: 0, right: 0, bottom: 0 },
        // Left panel
        { top: rect.top, left: 0, width: rect.left, height: rect.height },
        // Right panel
        { top: rect.top, left: rect.right, right: 0, height: rect.height },
      ]
    : [{ top: 0, left: 0, right: 0, bottom: 0 }]

  const isLast = stepIndex === steps.length - 1

  return (
    <>
      {/* Spotlight panels */}
      {panels.map((p, i) => (
        <div key={i} className={styles.spotPanel} style={{ ...p } as React.CSSProperties} onClick={finishTour} />
      ))}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className={styles.tooltip}
        style={{ top: pos.top, left: pos.left }}
        role="dialog"
        aria-label={`Tour step ${displayIndex + 1}`}
      >
        {/* Arrow */}
        {rect && (
          <div
            className={`${styles.tooltipArrow} ${
              displayStep.placement === 'bottom' ? styles.tooltipArrowBottom :
              displayStep.placement === 'top' ? styles.tooltipArrowTop :
              displayStep.placement === 'right' ? styles.tooltipArrowRight :
              styles.tooltipArrowLeft
            }`}
          />
        )}

        <div className={styles.tooltipStep}>
          Step {displayIndex + 1} of {displaySteps.length}
        </div>
        <h3 className={styles.tooltipTitle}>{displayStep.title}</h3>
        <p className={styles.tooltipBody}>{displayStep.body}</p>

        <div className={styles.tooltipFooter}>
          {/* Progress dots */}
          <div className={styles.dots}>
            {displaySteps.map((_, i) => (
              <div
                key={i}
                className={`${styles.dot} ${i === displayIndex ? styles.dotActive : ''}`}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button className={styles.skipBtn} onClick={finishTour}>
              {isLast ? '' : 'Skip'}
            </button>
            <div className={styles.navBtns}>
              {displayIndex > 0 && (
                <button className={`${styles.navBtn} ${styles.navBtnSecondary}`} onClick={prev}>
                  Back
                </button>
              )}
              <button className={`${styles.navBtn} ${styles.navBtnPrimary}`} onClick={next}>
                {isLast ? 'Done 🎉' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
