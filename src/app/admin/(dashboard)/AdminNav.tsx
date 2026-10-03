'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/utilities/ui'

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/packages', label: 'Packages' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/callbacks', label: 'Call-backs' },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const isActive =
          link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href)

        return (
          <Link
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition',
              isActive
                ? 'bg-navy-800 text-gold-300'
                : 'text-ivory/70 hover:bg-navy-800 hover:text-ivory',
            )}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
