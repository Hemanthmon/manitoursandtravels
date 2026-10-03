import { NextResponse } from 'next/server'

import { apiError, readJson, withMobileAuth } from '@/lib/api/mobile'
import { newTaxonomySchema } from '@/lib/validations/package'
import { findOrCreateCategory } from '@/server/admin/packages'

// "+ Add new category" in the app's package editor. Returns the existing
// category if one with that name already exists.
export const POST = withMobileAuth(async (request) => {
  const parsed = newTaxonomySchema.safeParse(await readJson(request))
  if (!parsed.success) return apiError(422, parsed.error.issues[0]?.message ?? 'Invalid name')

  const category = await findOrCreateCategory(parsed.data.name)
  return NextResponse.json({ id: category.id, title: category.title }, { status: 201 })
})
