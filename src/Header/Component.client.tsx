'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { ChevronLeft, Menu, Phone, X } from 'lucide-react'

import type { SiteSettings } from '@/lib/getSiteSettings'
import { buildTelLink, buildWhatsAppLink, whatsappMessages } from '@/lib/whatsapp'
import { cn } from '@/utilities/ui'
import { WhatsAppIcon } from '@/components/site/WhatsAppIcon'

interface HeaderClientProps {
  siteSettings: SiteSettings | null
}

// Every tab is a same-page anchor on the homepage. The leading "/" means it works
// as a normal navigation + native hash-scroll from any other page (e.g. /packages),
// and as a same-page smooth scroll (global scroll-behavior: smooth) when already home.
// Order matches the actual top-to-bottom section order on the page.
const NAV_ITEMS = [
  { label: 'Home', href: '/#enquiry-form' },
  { label: 'Services', href: '/#services' },
  { label: 'Packages', href: '/#packages' },
  { label: 'About', href: '/#about' },
  { label: 'Contact', href: '/#contact' },
] as const

const BrandMark: React.FC<{ dark?: boolean; compact?: boolean; onClick?: () => void }> = ({
  dark,
  compact,
  onClick,
}) => (
  <Link
    href="/"
    onClick={onClick}
    className="group flex items-center gap-2.5 rounded-md transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
  >
    <Image
      src="/logo-icon.png"
      alt=""
      width={64}
      height={27}
      priority
      className={compact ? 'h-9 w-auto' : 'h-10 w-auto md:h-11'}
    />
    <span className="flex flex-col leading-none">
      <span
        className={cn(
          'font-head text-[1.55rem] font-black italic tracking-normal md:text-[1.75rem]',
          dark ? 'text-paper' : 'text-navy-900',
        )}
      >
        MANI
      </span>
      <span
        className={cn(
          'mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.18em] transition-colors duration-200 sm:text-[10px] sm:tracking-[0.25em]',
          dark
            ? 'text-gold-300 group-hover:text-gold-200'
            : 'text-gold-600 group-hover:text-gold-500',
        )}
      >
        Tours and Travels
      </span>
    </span>
  </Link>
)

export const HeaderClient: React.FC<HeaderClientProps> = ({ siteSettings }) => {
  const pathname = usePathname()
  const isHome = pathname === '/'
  // Start transparent on pages with a full-bleed hero (home, detail pages) to avoid a solid flash.
  const [isScrolled, setIsScrolled] = useState(!isHome && pathname.split('/').filter(Boolean).length < 2)
  const [mobileOpen, setMobileOpen] = useState(false)

  const phone = siteSettings?.phone || ''

  // Detail pages (e.g. /packages/[slug]) are two segments deep under the site
  // group. The full nav doesn't fit their purpose: a single "Back" plus the
  // logo, floating transparently over the page's full-height photo hero.
  const segments = pathname.split('/').filter(Boolean)
  const isDetailPage = segments.length >= 2
  const parentPath = `/${segments.slice(0, -1).join('/')}`

  // Back to /packages keeps the visitor's filters when they came from a filtered
  // listing. Read from document.referrer on the client so the page itself never
  // reads searchParams (which would make it render per request).
  const [backHref, setBackHref] = useState(parentPath)
  useEffect(() => {
    setBackHref(parentPath)
    if (parentPath !== '/packages') return
    try {
      const ref = new URL(document.referrer)
      if (ref.origin === window.location.origin && ref.pathname === '/packages' && ref.search) {
        setBackHref(`/packages${ref.search}`)
      }
    } catch {
      // No or malformed referrer: keep the plain listing link.
    }
  }, [parentPath])

  // Transparent over the hero on the homepage and detail pages, solid once
  // scrolled past it; every other page starts solid.
  const transparentUntil = isHome ? 420 : isDetailPage ? 80 : null
  useEffect(() => {
    if (transparentUntil === null) {
      setIsScrolled(true)
      return
    }
    const handleScroll = () => setIsScrolled(window.scrollY > transparentUntil)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [transparentUntil])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  useEffect(() => {
    if (!mobileOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  // Close the mobile panel on route change.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const dark = !isScrolled

  if (isDetailPage) {
    // Fixed (not sticky) so the photo hero runs full-height behind it.
    return (
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-[1000] motion-safe:transition-colors motion-safe:duration-300',
          dark
            ? 'border-b border-transparent bg-[linear-gradient(180deg,rgba(8,20,38,0.55),rgba(8,20,38,0))]'
            : 'border-b border-border bg-ivory/90 shadow-sm backdrop-blur-[10px] backdrop-saturate-[160%]',
        )}
      >
        <div className="mx-auto flex max-w-[73.75rem] items-center gap-4 px-6 py-3.5">
          <Link
            href={backHref}
            className={cn(
              'flex items-center gap-1.5 rounded-md text-[0.95rem] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2',
              dark ? 'text-paper/90 hover:text-paper' : 'text-navy-800 hover:text-navy-900',
            )}
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </Link>
          <div className={cn('h-5 w-px', dark ? 'bg-white/30' : 'bg-border')} />
          <BrandMark compact dark={dark} />
        </div>
      </header>
    )
  }

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-[1000] motion-safe:transition-colors motion-safe:duration-300',
          dark
            ? 'border-b border-transparent bg-transparent'
            : 'border-b border-border bg-ivory/90 shadow-sm backdrop-blur-[10px] backdrop-saturate-[160%]',
        )}
      >
        <div className="mx-auto flex max-w-[73.75rem] items-center px-6 py-3.5">
          <BrandMark dark={dark} />

          {/* Fixed gap from the logo, independent of how wide the right-side content
              (phone number, CTA) ends up — that content is pushed right via ml-auto below,
              so it can never squeeze this gap. */}
          <nav aria-label="Main" className="ml-10 hidden lg:block xl:ml-14">
            <ul className="flex items-center gap-7">
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className={cn(
                      'text-[0.95rem] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 rounded-md',
                      dark ? 'text-ivory/90 hover:text-paper' : 'text-navy-800 hover:text-navy-900',
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <a
              href={buildTelLink(phone)}
              className={cn(
                'hidden items-center gap-2 text-[0.92rem] font-bold md:flex',
                dark ? 'text-ivory/90' : 'text-navy-800',
              )}
            >
              <Phone className="h-4 w-4 text-gold-500" />
              {phone}
            </a>
            {/* Plain anchor, not next/link — same-page hash target, see NAV_ITEMS comment above. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/#contact"
              className="hidden items-center justify-center rounded-full bg-gold-500 px-5 py-2.5 text-[0.9rem] font-bold text-navy-950 shadow-[0_10px_26px_-8px_rgba(212,165,55,0.55)] transition-all hover:-translate-y-0.5 hover:bg-gold-300 sm:inline-flex"
            >
              Enquire Now
            </a>
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
              className={cn(
                'flex items-center justify-center rounded-md p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 lg:hidden',
                dark ? 'text-paper' : 'text-navy-900',
              )}
            >
              <Menu className="h-[26px] w-[26px]" />
            </button>
          </div>
        </div>
      </header>

      <MobileNavPanel open={mobileOpen} onClose={() => setMobileOpen(false)} siteSettings={siteSettings} />
    </>
  )
}

const MobileNavPanel: React.FC<{
  open: boolean
  onClose: () => void
  siteSettings: SiteSettings | null
}> = ({ open, onClose, siteSettings }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) closeButtonRef.current?.focus()
  }, [open])

  const phone = siteSettings?.phone || ''
  const whatsapp = siteSettings?.whatsapp || ''

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className={cn(
        'fixed inset-0 z-[1100] flex flex-col overflow-y-auto bg-navy-950 px-7 py-6 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(.77,0,.18,1)] lg:hidden',
        open ? 'translate-x-0' : 'pointer-events-none translate-x-full',
      )}
    >
      <div className="mb-8 flex items-center justify-between">
        <BrandMark dark onClick={onClose} />
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="flex min-h-11 min-w-11 items-center justify-center text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
        >
          <X className="h-[26px] w-[26px]" />
        </button>
      </div>

      <nav aria-label="Mobile" className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            onClick={onClose}
            className="flex min-h-11 items-center border-b border-white/10 py-3 font-head text-[1.35rem] font-semibold text-ivory"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3 pt-8">
        {siteSettings?.address && <p className="text-[0.85rem] text-ivory/60">{siteSettings.address}</p>}
        <a
          href={buildTelLink(phone)}
          className="flex min-h-11 items-center justify-center gap-2.5 rounded-full bg-gold-500 px-7 py-4 font-bold text-navy-950"
        >
          <Phone className="h-5 w-5" /> Call {phone}
        </a>
        <a
          href={buildWhatsAppLink(whatsapp, whatsappMessages.general())}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center justify-center gap-2.5 rounded-full border-[1.5px] border-white/50 px-7 py-4 font-bold text-paper"
        >
          <WhatsAppIcon className="h-5 w-5" /> WhatsApp Us
        </a>
      </div>
    </div>
  )
}
