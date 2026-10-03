import { prisma } from '@/lib/prisma'
import { bookingKindWhere } from '@/server/admin/crm'

import { AutoRefresh } from '../AutoRefresh'
import { CallButton } from './CallButton'

const formatWhen = (date: Date) =>
  date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    where: bookingKindWhere('booking'),
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="px-8 py-12">
      <AutoRefresh />
      <h1 className="font-head text-2xl font-bold text-navy-900">Bookings</h1>
      <p className="mt-1 text-muted-brand">
        Every &quot;Book Your Ride&quot; request from the website, newest first. Tap Call to dial
        the customer and mark them as called. Call-back requests are under Call-backs.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-brand">
            <tr>
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Pickup</th>
              <th className="px-4 py-3 font-medium">Drop</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Received</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr className="border-b border-border last:border-0" key={booking.id}>
                <td className="px-4 py-3 font-medium text-navy-900">{booking.service}</td>
                <td className="px-4 py-3 text-muted-brand">{booking.pickup || '—'}</td>
                <td className="px-4 py-3 text-muted-brand">{booking.drop || '—'}</td>
                <td className="px-4 py-3 text-muted-brand">{booking.date || '—'}</td>
                <td className="px-4 py-3 text-muted-brand">{booking.time || '—'}</td>
                <td className="px-4 py-3 text-muted-brand">{booking.name || '—'}</td>
                <td className="px-4 py-3 text-muted-brand">{booking.phone || '—'}</td>
                <td className="px-4 py-3 text-muted-brand">{formatWhen(booking.createdAt)}</td>
                <td className="px-4 py-3">
                  {booking.contactedAt ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Called {formatWhen(booking.contactedAt)}
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      New
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {booking.phone && <CallButton bookingId={booking.id} phone={booking.phone} />}
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-muted-brand" colSpan={10}>
                  No bookings yet. They&apos;ll show up here as soon as someone submits the
                  &quot;Book Your Ride&quot; form on the website.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
