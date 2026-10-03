import { NextResponse } from 'next/server'
import { z } from 'zod'

import { apiError, parseId, readJson, withMobileAuth } from '@/lib/api/mobile'
import {
  deletePackage,
  getPackage,
  isRecordNotFound,
  savePackage,
  setPackagePublished,
} from '@/server/admin/packages'

type Params = { id: string }

const NOT_FOUND = 'This package no longer exists.'

export const GET = withMobileAuth<Params>(async (_request, { params }) => {
  const id = parseId(params.id)
  const pkg = id ? await getPackage(id) : null
  if (!pkg) return apiError(404, NOT_FOUND)

  return NextResponse.json(pkg)
})

// Full update — same validation as the web admin form.
export const PUT = withMobileAuth<Params>(async (request, { params }) => {
  const id = parseId(params.id)
  if (!id) return apiError(404, NOT_FOUND)

  try {
    const result = await savePackage(id, await readJson(request))
    if (!result.ok) return apiError(422, 'Please fix the highlighted fields.', result.errors)
    return NextResponse.json({ id: result.id })
  } catch (error) {
    if (isRecordNotFound(error)) return apiError(404, NOT_FOUND)
    throw error
  }
})

const patchSchema = z.object({ published: z.boolean() })

// Quick publish/unpublish toggle from the list screen.
export const PATCH = withMobileAuth<Params>(async (request, { params }) => {
  const id = parseId(params.id)
  if (!id) return apiError(404, NOT_FOUND)

  const parsed = patchSchema.safeParse(await readJson(request))
  if (!parsed.success) return apiError(422, 'Expected { published: boolean }.')

  try {
    await setPackagePublished(id, parsed.data.published)
    return NextResponse.json({ id, published: parsed.data.published })
  } catch (error) {
    if (isRecordNotFound(error)) return apiError(404, NOT_FOUND)
    throw error
  }
})

export const DELETE = withMobileAuth<Params>(async (_request, { params }) => {
  const id = parseId(params.id)
  if (!id) return apiError(404, NOT_FOUND)

  try {
    await deletePackage(id)
    return new Response(null, { status: 204 })
  } catch (error) {
    if (isRecordNotFound(error)) return apiError(404, NOT_FOUND)
    throw error
  }
})
