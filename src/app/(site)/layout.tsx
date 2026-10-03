import type { Metadata } from 'next'

import { Fraunces, Inter } from 'next/font/google'
import React from 'react'

import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { FloatingWhatsapp } from '@/components/site/FloatingWhatsapp'
import { MobileStickyBar } from '@/components/site/MobileStickyBar'
import { StickyBarProvider } from '@/providers/StickyBarProvider'
import { getCachedSiteSettings } from '@/lib/getSiteSettings'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-head',
  weight: ['500', '600', '700', '900'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const siteSettings = await getCachedSiteSettings()

  return (
    <html className={`${fraunces.variable} ${inter.variable}`} lang="en">
      <head>
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <StickyBarProvider>
          <Header siteSettings={siteSettings} />
          {children}
          <Footer siteSettings={siteSettings} />
          <MobileStickyBar siteSettings={siteSettings} />
          <FloatingWhatsapp siteSettings={siteSettings} />
        </StickyBarProvider>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  title: {
    default: 'Mani Tours and Travels — Trusted Family Travel Partner',
    template: '%s | Mani Tours and Travels',
  },
  openGraph: mergeOpenGraph(),
}
