'use client'

import Image from 'next/image'
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/utilities/ui'

export type ViewerPhoto = { url: string; caption?: string | null }

// Call from the click that opens the viewer: browsers only allow full screen
// in direct response to a user gesture. Falls back silently (e.g. iPhone
// Safari), where the viewer still covers the whole window.
export function enterFullscreen() {
  if (document.fullscreenEnabled && !document.fullscreenElement) {
    void document.documentElement.requestFullscreen().catch(() => {})
  }
}

// Full-screen photo viewer shared by the packages hero, the package page cover
// photo and the package gallery. Arrows / swipe to browse, Esc to close, and a
// button for the browser's true full-screen mode.
export const PhotoViewer: React.FC<{
  photos: ViewerPhoto[]
  index: number | null
  onIndexChange: (index: number | null) => void
}> = ({ photos, index, onIndexChange }) => {
  const touchStartX = useRef<number | null>(null)
  // Set when our own "exit full screen" button is used, so leaving full screen
  // that way keeps the viewer open.
  const keepOpenOnExit = useRef(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const open = index !== null && photos.length > 0
  const count = photos.length

  const close = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    onIndexChange(null)
  }, [onIndexChange])
  const step = useCallback(
    (delta: number) => onIndexChange(index === null ? null : (index + delta + count) % count),
    [index, count, onIndexChange],
  )

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    // In true full screen the browser consumes the first Esc to leave full
    // screen, so our keydown never fires. Treat that exit as "close".
    const onFullscreenChange = () => {
      const fs = Boolean(document.fullscreenElement)
      setIsFullscreen(fs)
      if (!fs) {
        if (keepOpenOnExit.current) keepOpenOnExit.current = false
        else onIndexChange(null)
      }
    }
    setIsFullscreen(Boolean(document.fullscreenElement))
    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.body.style.overflow = ''
    }
  }, [open, close, step, onIndexChange])

  if (!open) return null
  const photo = photos[index]!
  const canFullscreen = typeof document !== 'undefined' && document.fullscreenEnabled

  return createPortal(
    <div
      aria-label="Photo viewer"
      aria-modal="true"
      className="fixed inset-0 z-[2000] flex flex-col bg-[#050c18]/[0.97] text-ivory motion-safe:animate-[hero-rise_0.3s_ease-out_both]"
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return
        const dx = e.changedTouches[0]!.clientX - touchStartX.current
        touchStartX.current = null
        if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1)
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]!.clientX
      }}
      role="dialog"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold tabular-nums">
          {index + 1} / {count}
        </span>
        <div className="flex items-center gap-2">
          {canFullscreen && (
            <button
              aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
              className="rounded-full p-2.5 transition-colors hover:bg-white/10"
              onClick={() =>
                {
                  if (document.fullscreenElement) {
                    keepOpenOnExit.current = true
                    void document.exitFullscreen().catch(() => {})
                  } else {
                    enterFullscreen()
                  }
                }
              }
              type="button"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
          )}
          <button aria-label="Close" className="rounded-full p-2.5 transition-colors hover:bg-white/10" onClick={close} type="button">
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Photo */}
      <div className="relative flex-1" onClick={close}>
        <div className="absolute inset-2 sm:inset-x-20 sm:inset-y-2" onClick={(e) => e.stopPropagation()}>
          <Image
            alt={photo.caption ?? ''}
            className="object-contain motion-safe:animate-[hero-rise_0.35s_ease-out_both]"
            fill
            key={photo.url}
            priority
            sizes="100vw"
            src={photo.url}
          />
        </div>
        {count > 1 && (
          <>
            <button
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 backdrop-blur transition-colors hover:bg-white/20 sm:block"
              onClick={(e) => {
                e.stopPropagation()
                step(-1)
              }}
              type="button"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
            <button
              aria-label="Next photo"
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 backdrop-blur transition-colors hover:bg-white/20 sm:block"
              onClick={(e) => {
                e.stopPropagation()
                step(1)
              }}
              type="button"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          </>
        )}
      </div>

      {/* Caption + thumbnails */}
      <div className="px-4 pb-4 pt-2 text-center sm:px-6">
        {photo.caption && <p className="mb-3 text-[0.95rem] font-semibold">{photo.caption}</p>}
        {count > 1 && (
          <div className="mx-auto flex max-w-full justify-center gap-2 overflow-x-auto pb-1">
            {photos.map((p, i) => (
              <button
                aria-label={`Show photo ${i + 1}`}
                className={cn(
                  'relative h-12 w-[72px] flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                  i === index ? 'border-gold-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-90',
                )}
                key={`${p.url}-${i}`}
                onClick={() => onIndexChange(i)}
                type="button"
              >
                <Image alt="" className="object-cover" fill sizes="72px" src={p.url} />
              </button>
            ))}
          </div>
        )}
        {count > 1 && <p className="mt-2 text-xs text-ivory/50 sm:hidden">Swipe to see more</p>}
      </div>
    </div>,
    document.body,
  )
}
