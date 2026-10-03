import { NextResponse } from 'next/server'

import { getPagination, toPage, withMobileAuth } from '@/lib/api/mobile'
import { enquiryStatusValues, listEnquiries } from '@/server/admin/crm'

// ?status=NEW|CONTACTED|QUOTED|BOOKED|LOST to filter; omit for all.
export const GET = withMobileAuth(async (request) => {
  const { cursor, limit, searchParams } = getPagination(request)
  const statusParam = searchParams.get('status')
  const status = enquiryStatusValues.find((value) => value === statusParam)

  return NextResponse.json(toPage(await listEnquiries({ cursor, limit, status }), limit))
})
