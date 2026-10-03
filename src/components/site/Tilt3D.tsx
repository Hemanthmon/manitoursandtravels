'use client'

import React, { useCallback, useRef } from 'react'

import { cn } from '@/utilities/ui'

// A mouse-follow 3D tilt, used to give the hero booking card some depth.
// Reads/writes CSS custom properties instead of React state so the tilt
// updates every mousemove frame without a re-render.
export const Tilt3D: React.FC<{ children: React.ReactNode; className?: string; max?: number }> = ({
  children,
  className,
  max = 8,
}) => {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      el.style.setProperty('--tilt-x', `${(-y * max).toFixed(2)}deg`)
      el.style.setProperty('--tilt-y', `${(x * max).toFixed(2)}deg`)
    },
    [max],
  )

  const handleMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--tilt-x', '0deg')
    el.style.setProperty('--tilt-y', '0deg')
  }, [])

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ '--tilt-x': '0deg', '--tilt-y': '0deg' } as React.CSSProperties}
      className={cn(
        'motion-safe:[transform:perspective(1200px)_rotateX(var(--tilt-x))_rotateY(var(--tilt-y))] motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out',
        className,
      )}
    >
      {children}
    </div>
  )
}
