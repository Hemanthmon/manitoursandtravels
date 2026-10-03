import { NextResponse } from 'next/server'

import { apiError, parseId, withMobileAuth } from '@/lib/api/mobile'
import { markEnquiryContacted } from '@/server/admin/crm'

// The app calls this when an admin taps "Call" on an enquiry.
export const POST = withMobileAuth<{ id: string }>(async (_request, { params }) => {
  const id = parseId(params.id)
  const enquiry = id ? await markEnquiryContacted(id) : null
  if (!enquiry) return apiError(404, 'This enquiry no longer exists.')

  return NextResponse.json(enquiry)
})
