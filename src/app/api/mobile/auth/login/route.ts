import { NextResponse } from 'next/server'

import { apiError, readJson } from '@/lib/api/mobile'
import { verifyAdminCredentials } from '@/lib/auth/credentials'
import { issueMobileToken, MOBILE_TOKEN_MAX_AGE } from '@/lib/auth/mobileToken'

// Best-effort brute-force guard. It's per server instance (in-memory), so on
// serverless it slows attackers down rather than hard-blocking them.
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 10
const failedAttempts = new Map<string, { count: number; resetAt: number }>()

function clientKey(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

function isLimited(key: string) {
  const entry = failedAttempts.get(key)
  if (!entry || entry.resetAt < Date.now()) return false
  return entry.count >= MAX_ATTEMPTS
}

function recordFailure(key: string) {
  const entry = failedAttempts.get(key)
  if (!entry || entry.resetAt < Date.now()) {
    failedAttempts.set(key, { count: 1, resetAt: Date.now() + WINDOW_MS })
  } else {
    entry.count += 1
  }
}

export async function POST(request: Request) {
  const key = clientKey(request)
  if (isLimited(key)) {
    return apiError(429, 'Too many failed attempts. Please wait 15 minutes and try again.')
  }

  const body = (await readJson(request)) as { email?: unknown; password?: unknown } | null
  const user = await verifyAdminCredentials(body?.email, body?.password)

  if (!user) {
    recordFailure(key)
    return apiError(401, 'Invalid email or password.')
  }

  failedAttempts.delete(key)
  const token = await issueMobileToken(user)

  return NextResponse.json({
    token,
    expiresAt: new Date(Date.now() + MOBILE_TOKEN_MAX_AGE * 1000).toISOString(),
    user,
  })
}
