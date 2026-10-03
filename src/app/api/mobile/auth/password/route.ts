import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { apiError, readJson, withMobileAuth } from '@/lib/api/mobile'
import { verifyAdminCredentials } from '@/lib/auth/credentials'
import { prisma } from '@/lib/prisma'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(200),
})

// Profile screen: change password. Same login works on the website admin.
// Same bcrypt cost as scripts/create-admin.ts.
export const POST = withMobileAuth(async (request, { admin }) => {
  const parsed = passwordSchema.safeParse(await readJson(request))
  if (!parsed.success) return apiError(422, parsed.error.issues[0]?.message ?? 'Invalid password')

  const { currentPassword, newPassword } = parsed.data
  if (!(await verifyAdminCredentials(admin.email, currentPassword))) {
    return apiError(400, 'Your current password is incorrect.')
  }

  await prisma.user.update({
    where: { id: admin.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  })
  return NextResponse.json({ ok: true })
})
