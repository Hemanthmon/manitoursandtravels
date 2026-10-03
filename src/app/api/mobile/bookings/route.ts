import { NextResponse } from 'next/server'

import { getPagination, toPage, withMobileAuth } from '@/lib/api/mobile'
import { bookingKinds, listBookings, type BookingKind } from '@/server/admin/crm'

export const GET = withMobileAuth(async (request) => {
  const { cursor, limit, searchParams } = getPagination(request)
  // ?kind=callback lists call-back requests; anything else lists ride bookings.
  const kindParam = searchParams.get('kind') as BookingKind
  const kind = bookingKinds.includes(kindParam) ? kindParam : 'booking'
  return NextResponse.json(toPage(await listBookings({ cursor, limit, kind }), limit))
})
