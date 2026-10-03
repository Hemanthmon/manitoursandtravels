import bcrypt from 'bcryptjs'

import { prisma } from '@/lib/prisma'

export type AdminUser = { id: number; email: string; name: string | null }

// Single source of truth for admin email/password checks — used by both the
// Auth.js Credentials provider (web admin) and the mobile login endpoint.
export async function verifyAdminCredentials(
  email: unknown,
  password: unknown,
): Promise<AdminUser | null> {
  if (typeof email !== 'string' || typeof password !== 'string') return null

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null

  const isValidPassword = await bcrypt.compare(password, user.passwordHash)
  if (!isValidPassword) return null

  return { id: user.id, email: user.email, name: user.name }
}
