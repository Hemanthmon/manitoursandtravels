import { NextResponse } from 'next/server'
import { z } from 'zod'

import { apiError, readJson, withMobileAuth } from '@/lib/api/mobile'
import { prisma } from '@/lib/prisma'

// Expo push tokens look like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx].
const bodySchema = z.object({
  token: z.string().regex(/^Expo(nent)?PushToken\[[\w-]+\]$/, 'Not an Expo push token'),
})

// Register this phone for new-lead notifications. Upsert, because the same
// phone may sign in as a different admin later.
export const POST = withMobileAuth(async (request, { admin }) => {
  const parsed = bodySchema.safeParse(await readJson(request))
  if (!parsed.success) return apiError(422, 'Invalid push token.')

  const { token } = parsed.data
  await prisma.pushToken.upsert({
    where: { token },
    create: { token, userId: admin.id },
    update: { userId: admin.id },
  })
  return NextResponse.json({ ok: true }, { status: 201 })
})

// Called on sign-out so a signed-out phone stops receiving lead alerts.
export const DELETE = withMobileAuth(async (request) => {
  const parsed = bodySchema.safeParse(await readJson(request))
  if (!parsed.success) return apiError(422, 'Invalid push token.')

  await prisma.pushToken.deleteMany({ where: { token: parsed.data.token } })
  return NextResponse.json({ ok: true })
})
