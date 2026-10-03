'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Expand } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import { enterFullscreen, PhotoViewer } from '@/components/site/PhotoViewer'
import { WhatsAppIcon } from '@/components/site/WhatsAppIcon'
import { cn } from '@/utilities/ui'

export type HeroSlide = { imageUrl: string; title: string; slug: string; destination: string }

const SLIDE_MS = 6500

// Full-bleed photo hero for /packages: cross-fades through real package cover
// photos (from the database) with a slow zoom, text overlaid on the left.
export const PackagesHero: React.FC<{ slides: HeroSlide[]; whatsappHref: string }> = ({ slides, whatsappHref }) => {
  const [active, setActive] = useState(0)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  // Restarts whenever the slide changes (auto or via a dot), so a manual pick
  // still gets the full time on screen. Stops while the full-screen viewer is open.
  useEffect(() => {
    if (slides.length < 2 || viewerIndex !== null) return
    const timer = window.setTimeout(() => setActive((i) => (i + 1) % slides.length), SLIDE_MS)
    return () => window.clearTimeout(timer)
  }, [active, slides.length, viewerIndex])

  const current = slides[active]

  return (
    <section
      className="relative isolate flex min-h-[calc(100svh-4.5rem)] items-center overflow-hidden bg-[radial-gradient(120%_140%_at_85%_-10%,var(--navy-700)_0%,var(--navy-900)_45%,var(--navy-950)_100%)] text-ivory"
    >
      {slides.map((slide, index) => (
        <div
          aria-hidden={index !== active}
          className={cn(
            'absolute inset-0 -z-20 transition-opacity duration-[1200ms] ease-in-out',
            index === active ? 'opacity-100' : 'opacity-0',
          )}
          key={slide.slug}
        >
          <Image
            alt=""
            // Re-keying restarts the slow zoom each time a slide comes back.
            className={cn('object-cover', index === active && 'motion-safe:animate-[kenburns_9s_ease-out_both]')}
            fill
            key={index === active ? `${slide.slug}-on-${active}` : slide.slug}
            priority={index === 0}
            sizes="100vw"
            src={slide.imageUrl}
          />
        </div>
      ))}

      {/* Darker on the left where the text sits, photo shows through on the right. */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,20,38,0.88)_0%,rgba(8,20,38,0.6)_45%,rgba(8,20,38,0.15)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-[linear-gradient(0deg,rgba(8,20,38,0.6),transparent)]" />

      <div className="container py-16">
        <div className="max-w-[36rem] motion-safe:animate-[hero-rise_0.9s_cubic-bezier(.2,.7,.2,1)_both]">
          <div className="mb-4 inline-flex items-center gap-2 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-gold-300 before:block before:h-0.5 before:w-[22px] before:rounded-full before:bg-gold-500">
            Tour Packages
          </div>
          <h1 className="text-paper text-[clamp(2rem,1.3rem+2.6vw,3.3rem)] leading-[1.08]">
            Fixed door-to-door tours, planned before you leave home.
          </h1>
          <p className="mt-4 max-w-[30rem] text-[1.08rem] text-ivory/80">
            Vehicle, driver and itinerary sorted in advance. Pick a trip below, or tell us where you want to go.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <a
              className="btn-shine inline-flex items-center justify-center gap-2 rounded-full bg-gold-500 px-7 py-3.5 font-bold text-navy-950 shadow-[0_10px_26px_-8px_rgba(212,165,55,0.55)] transition-all hover:-translate-y-0.5 hover:bg-gold-300"
              href="#all-packages"
            >
              Browse packages
            </a>
            <a
              className="inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-white/60 bg-white/[0.06] px-7 py-3.5 font-bold text-paper backdrop-blur-[4px] transition-all hover:-translate-y-0.5 hover:bg-white/[0.15]"
              href={whatsappHref}
              rel="noopener noreferrer"
              target="_blank"
            >
              <WhatsAppIcon className="h-5 w-5" /> Plan a custom trip
            </a>
          </div>
        </div>
      </div>

      {/* Which package is on screen + slide dots */}
      {current && (
        <div className="absolute inset-x-0 bottom-5">
          <div className="container flex items-center justify-between gap-4">
            <Link
              className="group inline-flex min-w-0 items-center gap-1.5 rounded-full bg-black/25 px-3.5 py-1.5 text-[0.82rem] font-semibold text-ivory/90 backdrop-blur-[6px] transition-colors hover:bg-black/40"
              href={`/packages/${current.slug}`}
            >
              <span className="truncate">
                {/* "Jaipur · Jaipur" reads oddly when the title is just the place name. */}
                {current.title.toLowerCase() === current.destination.toLowerCase()
                  ? current.title
                  : `${current.destination} · ${current.title}`}
              </span>
              <ChevronRight className="h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <div className="flex flex-shrink-0 items-center gap-4">
            <button
              className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3.5 py-1.5 text-[0.82rem] font-semibold text-ivory/90 backdrop-blur-[6px] transition-colors hover:bg-black/40"
              onClick={() => {
                enterFullscreen()
                setViewerIndex(active)
              }}
              type="button"
            >
              <Expand className="h-4 w-4" /> <span className="hidden sm:inline">View full screen</span>
            </button>
            {slides.length > 1 && (
              <div className="flex flex-shrink-0 gap-2">
                {slides.map((slide, index) => (
                  <button
                    aria-label={`Show ${slide.title}`}
                    className={cn(
                      'h-2 rounded-full transition-all duration-300',
                      index === active ? 'w-7 bg-gold-500' : 'w-2 bg-white/50 hover:bg-white/80',
                    )}
                    key={slide.slug}
                    onClick={() => setActive(index)}
                    type="button"
                  />
                ))}
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      <PhotoViewer
        index={viewerIndex}
        onIndexChange={setViewerIndex}
        photos={slides.map((slide) => ({
          url: slide.imageUrl,
          caption: slide.title.toLowerCase() === slide.destination.toLowerCase() ? slide.title : `${slide.title} · ${slide.destination}`,
        }))}
      />
    </section>
  )
}
