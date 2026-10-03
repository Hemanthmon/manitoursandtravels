import { prisma } from '@/lib/prisma'
import { bookingKindWhere } from '@/server/admin/crm'

import { AutoRefresh } from '../AutoRefresh'
import { CallButton } from '../bookings/CallButton'

const formatWhen = (date: Date) =>
  date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })

export default async function AdminCallbacksPage() {
  const callbacks = await prisma.booking.findMany({
    where: bookingKindWhere('callback'),
    // Not-yet-called first, then newest.
    orderBy: [{ contactedAt: { sort: 'asc', nulls: 'first' } }, { createdAt: 'desc' }],
  })

  return (
    <div className="px-8 py-12">
      <AutoRefresh />
      <h1 className="font-head text-2xl font-bold text-navy-900">Call-backs</h1>
      <p className="mt-1 text-muted-brand">
        People who asked to be called back from the website. Not-yet-called requests are listed
        first. Tap Call to dial and mark them as called.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-brand">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Message</th>
              <th className="px-4 py-3 font-medium">Received</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {callbacks.map((callback) => (
              <tr className="border-b border-border last:border-0" key={callback.id}>
                <td className="px-4 py-3 font-medium text-navy-900">{callback.name || '—'}</td>
                <td className="px-4 py-3 text-muted-brand">{callback.phone || '—'}</td>
                <td className="max-w-sm whitespace-pre-line px-4 py-3 text-muted-brand">
                  {callback.message || '—'}
                </td>
                <td className="px-4 py-3 text-muted-brand">{formatWhen(callback.createdAt)}</td>
                <td className="px-4 py-3">
                  {callback.contactedAt ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Called {formatWhen(callback.contactedAt)}
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      Waiting
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {callback.phone && <CallButton bookingId={callback.id} phone={callback.phone} />}
                </td>
              </tr>
            ))}
            {callbacks.length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-muted-brand" colSpan={6}>
                  No call-back requests yet. They&apos;ll show up here when someone uses
                  &quot;Prefer a call back?&quot; on the website.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
