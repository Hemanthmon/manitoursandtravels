import { decode, encode } from 'next-auth/jwt'

import { prisma } from '@/lib/prisma'

import type { AdminUser } from './credentials'

// Mobile admin tokens are Auth.js JWTs (same format, same AUTH_SECRET) but with
// their own salt, so a web session cookie can't be replayed as a bearer token
// and vice versa.
const MOBILE_TOKEN_SALT = 'mani-admin-mobile-token'
export const MOBILE_TOKEN_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set.')
  return secret
}

export async function issueMobileToken(user: AdminUser) {
  return encode({
    token: { sub: String(user.id), email: user.email, name: user.name },
    secret: getSecret(),
    salt: MOBILE_TOKEN_SALT,
    maxAge: MOBILE_TOKEN_MAX_AGE,
  })
}

// Returns the admin behind a "Bearer <token>" header, or null. The user row is
// re-checked on every request so deleting an admin revokes their app access.
export async function getMobileAdmin(request: Request): Promise<AdminUser | null> {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null

  let payload
  try {
    payload = await decode({
      token: header.slice('Bearer '.length).trim(),
      secret: getSecret(),
      salt: MOBILE_TOKEN_SALT,
    })
  } catch {
    return null
  }

  const userId = Number(payload?.sub)
  if (!Number.isInteger(userId)) return null

  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  })
}
