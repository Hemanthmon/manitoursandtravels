import { NextResponse } from 'next/server'

import { apiError, readJson, withMobileAuth } from '@/lib/api/mobile'
import { listPackages, savePackage } from '@/server/admin/packages'

export const GET = withMobileAuth(async () => NextResponse.json({ items: await listPackages() }))

export const POST = withMobileAuth(async (request) => {
  const result = await savePackage(undefined, await readJson(request))
  if (!result.ok) return apiError(422, 'Please fix the highlighted fields.', result.errors)

  return NextResponse.json({ id: result.id }, { status: 201 })
})
