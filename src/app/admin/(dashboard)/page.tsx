import Link from 'next/link'

import { prisma } from '@/lib/prisma'
import { bookingKindWhere } from '@/server/admin/crm'

import { AutoRefresh } from './AutoRefresh'

export default async function AdminDashboardPage() {
  const [packageCount, publishedCount, bookingCount, pendingCallbackCount] = await Promise.all([
    prisma.package.count(),
    prisma.package.count({ where: { published: true } }),
    prisma.booking.count({ where: bookingKindWhere('booking') }),
    prisma.booking.count({ where: { ...bookingKindWhere('callback'), contactedAt: null } }),
  ])

  return (
    <div className="mx-auto max-w-3xl px-8 py-12">
      <AutoRefresh />
      <h1 className="font-head text-2xl font-bold text-navy-900">Dashboard</h1>
      <p className="mt-1 text-muted-brand">Overview of your travel packages, bookings and call-back requests.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-brand">Packages</p>
          <p className="mt-1 text-3xl font-bold text-navy-900">{packageCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-brand">Published</p>
          <p className="mt-1 text-3xl font-bold text-navy-900">{publishedCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-brand">Bookings</p>
          <p className="mt-1 text-3xl font-bold text-navy-900">{bookingCount}</p>
        </div>
        <Link
          className="rounded-xl border border-border bg-card p-5 transition hover:border-gold-500"
          href="/admin/callbacks"
        >
          <p className="text-sm text-muted-brand">Call-backs waiting</p>
          <p className="mt-1 text-3xl font-bold text-navy-900">{pendingCallbackCount}</p>
        </Link>
      </div>

      <Link
        className="mt-8 inline-block rounded-lg bg-gold-500 px-4 py-2.5 font-semibold text-navy-950 transition hover:bg-gold-300"
        href="/admin/packages"
      >
        Manage packages
      </Link>
    </div>
  )
}
