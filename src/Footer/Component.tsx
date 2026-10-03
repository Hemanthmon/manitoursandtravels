import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Mail, MapPin, Phone } from 'lucide-react'

import type { SiteSettings } from '@/lib/getSiteSettings'
import { WhatsAppIcon } from '@/components/site/WhatsAppIcon'

import { buildTelLink, buildWhatsAppLink, whatsappMessages } from '@/lib/whatsapp'

export async function Footer({ siteSettings }: { siteSettings: SiteSettings | null }) {
  const phone = siteSettings?.phone || ''
  const whatsapp = siteSettings?.whatsapp || ''
  const email = siteSettings?.email || ''
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto bg-navy-950 py-16 pb-6 text-ivory/75">
      <div className="container">
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-11 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
          <div>
            <Link
              href="/"
              className="group inline-flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.03]"
            >
              <Image src="/logo-icon.png" alt="" width={64} height={27} className="h-11 w-auto" />
              <span className="flex flex-col leading-none">
                <span className="font-head text-[1.55rem] font-black italic tracking-normal text-paper">MANI</span>
                <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-300 transition-colors duration-200 group-hover:text-gold-200">
                  Tours and Travels
                </span>
              </span>
            </Link>
            <p className="mt-2 text-[0.82rem] font-medium italic text-gold-300/80">
              Your journey, planned like family.
            </p>
            <p className="mt-3.5 max-w-[280px] text-[0.9rem] text-ivory/60">
              Your family-first travel partner for airport transfers, city rides, school transport
              and tour packages — safe hands, every mile.
            </p>
          </div>

          <div>
            <h5 className="mb-4.5 text-[0.85rem] uppercase tracking-[.06em] text-paper">Services</h5>
            <ul className="flex flex-col gap-2.5 text-[0.9rem]">
              <li>
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a href="/#services" className="hover:text-gold-300">
                  Airport Pickup &amp; Drop
                </a>
              </li>
              <li>
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a href="/#services" className="hover:text-gold-300">
                  Local City Rides
                </a>
              </li>
              <li>
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a href="/#services" className="hover:text-gold-300">
                  School Transport
                </a>
              </li>
              <li>
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a href="/#packages" className="hover:text-gold-300">
                  Tour Packages
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="mb-4.5 text-[0.85rem] uppercase tracking-[.06em] text-paper">Company</h5>
            <ul className="flex flex-col gap-2.5 text-[0.9rem]">
              <li>
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a href="/#about" className="hover:text-gold-300">
                  About Us
                </a>
              </li>
              <li>
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a href="/#contact" className="hover:text-gold-300">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="mb-4.5 text-[0.85rem] uppercase tracking-[.06em] text-paper">Get in Touch</h5>
            <ul className="flex flex-col gap-2.5 text-[0.9rem]">
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-300" />
                <a href={buildTelLink(phone)}>{phone || 'Add phone in Site Settings'}</a>
              </li>
              <li className="flex items-start gap-2.5">
                <WhatsAppIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-300" />
                <a
                  href={buildWhatsAppLink(whatsapp, whatsappMessages.general())}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chat on WhatsApp
                </a>
              </li>
              {email && (
                <li className="flex items-start gap-2.5">
                  <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-300" />
                  <a href={`mailto:${email}`}>{email}</a>
                </li>
              )}
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-300" />
                <span>Local city rides + outstation tour packages</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-2.5 pt-6 text-[0.82rem] text-ivory/45">
          <span>© {year} Mani Tours and Travels. All rights reserved.</span>
          <span>Made with care.</span>
        </div>
      </div>
    </footer>
  )
}
