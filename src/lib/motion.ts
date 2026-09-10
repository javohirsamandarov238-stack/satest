import { useEffect, useRef, useState } from 'react'

const reduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Counts up to a value once on mount. Statistics settle into place rather
 * than snapping, which reads as considered instead of flashy.
 */
export function useCountUp(target: number, duration = 620): number {
  const [value, setValue] = useState(() => (reduced() ? target : 0))
  const frame = useRef<number>()

  useEffect(() => {
    if (reduced() || target === 0) {
      setValue(target)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // ease-out cubic: quick to arrive, gentle to settle
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * eased))
      if (t < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [target, duration])

  return value
}

/** Staggered entrance delay, in ms, for the nth item in a list. */
export const stagger = (i: number, step = 34, cap = 8) =>
  `${Math.min(i, cap) * step}ms`
