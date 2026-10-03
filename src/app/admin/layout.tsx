import type { Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import React from 'react'

import '../(site)/globals.css'

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

export const metadata: Metadata = {
  title: 'Admin | Mani Tours and Travels',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${fraunces.variable} ${inter.variable}`} lang="en">
      <body className="bg-navy-950 text-ivory min-h-screen">{children}</body>
    </html>
  )
}
