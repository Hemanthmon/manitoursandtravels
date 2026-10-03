import { NextResponse } from 'next/server'
import { z } from 'zod'

import { apiError, readJson, withMobileAuth } from '@/lib/api/mobile'
import { prisma } from '@/lib/prisma'

export const GET = withMobileAuth(async (_request, { admin }) => NextResponse.json({ user: admin }))

const profileSchema = z.object({ name: z.string().trim().min(1, 'Enter your name').max(80) })

// Profile screen: update the display name shown in both admins.
export const PATCH = withMobileAuth(async (request, { admin }) => {
  const parsed = profileSchema.safeParse(await readJson(request))
  if (!parsed.success) return apiError(422, parsed.error.issues[0]?.message ?? 'Invalid name')

  const user = await prisma.user.update({
    where: { id: admin.id },
    data: { name: parsed.data.name },
    select: { id: true, email: true, name: true },
  })
  return NextResponse.json({ user })
})
