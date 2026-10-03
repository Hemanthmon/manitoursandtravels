import { NextResponse } from 'next/server'

import { apiError, parseId, readJson, withMobileAuth } from '@/lib/api/mobile'
import { enquiryUpdateSchema, getEnquiry, updateEnquiry } from '@/server/admin/crm'
import { isRecordNotFound } from '@/server/admin/packages'

type Params = { id: string }

const NOT_FOUND = 'This enquiry no longer exists.'

export const GET = withMobileAuth<Params>(async (_request, { params }) => {
  const id = parseId(params.id)
  const enquiry = id ? await getEnquiry(id) : null
  if (!enquiry) return apiError(404, NOT_FOUND)

  return NextResponse.json(enquiry)
})

// Update pipeline status and/or internal notes.
export const PATCH = withMobileAuth<Params>(async (request, { params }) => {
  const id = parseId(params.id)
  if (!id) return apiError(404, NOT_FOUND)

  const parsed = enquiryUpdateSchema.safeParse(await readJson(request))
  if (!parsed.success) {
    return apiError(422, 'Invalid update.', parsed.error.flatten().fieldErrors)
  }

  try {
    return NextResponse.json(await updateEnquiry(id, parsed.data))
  } catch (error) {
    if (isRecordNotFound(error)) return apiError(404, NOT_FOUND)
    throw error
  }
})
