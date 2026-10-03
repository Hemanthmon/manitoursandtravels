'use client'

import React, { useEffect, useRef, useState } from 'react'

// Counts from 0 to `value` once, when it scrolls into view ("42,000").
// Reduced-motion visitors (and no-JS renders) just see the final number.
export const CountUp: React.FC<{ value: number; durationMs?: number }> = ({ value, durationMs = 1600 }) => {
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(value)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return

    setShown(0)
    let frame = 0
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / durationMs)
          setShown(Math.round(value * (1 - Math.pow(1 - t, 3)))) // ease-out
          if (t < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [value, durationMs])

  return (
    <span className="tabular-nums" ref={ref}>
      {shown.toLocaleString('en-IN')}
    </span>
  )
}
