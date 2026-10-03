import { NextResponse } from 'next/server'

import { apiError, parseId, withMobileAuth } from '@/lib/api/mobile'
import { markBookingContacted } from '@/server/admin/crm'

// The app calls this when an admin taps "Call" on a booking.
export const POST = withMobileAuth<{ id: string }>(async (_request, { params }) => {
  const id = parseId(params.id)
  const booking = id ? await markBookingContacted(id) : null
  if (!booking) return apiError(404, 'This booking no longer exists.')

  return NextResponse.json(booking)
})
