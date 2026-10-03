import { NextResponse } from 'next/server'

import { apiError, readJson, withMobileAuth } from '@/lib/api/mobile'
import { newTaxonomySchema } from '@/lib/validations/package'
import { findOrCreateDestination } from '@/server/admin/packages'

// "+ Add new destination" in the app's package editor. Returns the existing
// destination if one with that name already exists.
export const POST = withMobileAuth(async (request) => {
  const parsed = newTaxonomySchema.safeParse(await readJson(request))
  if (!parsed.success) return apiError(422, parsed.error.issues[0]?.message ?? 'Invalid name')

  const destination = await findOrCreateDestination(parsed.data.name)
  return NextResponse.json({ id: destination.id, name: destination.name }, { status: 201 })
})
