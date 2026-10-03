'use client'

import React, { useEffect, useRef, useState } from 'react'

import { cn } from '@/utilities/ui'

// Hidden-state transform for each entrance style; all settle to no transform.
const HIDDEN = {
  up: 'translate-y-6',
  scale: 'scale-95 translate-y-3',
  left: '-translate-x-8',
  right: 'translate-x-8',
} as const

// Fades children in as they scroll into view. `delay` (ms) staggers items in
// a grid: pass index * 80 or so.
export const Reveal: React.FC<{
  children: React.ReactNode
  className?: string
  delay?: number
  variant?: keyof typeof HIDDEN
}> = ({ children, className, delay = 0, variant = 'up' }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (!('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        visible ? 'translate-x-0 translate-y-0 scale-100 opacity-100' : cn('opacity-0', HIDDEN[variant]),
        className,
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
