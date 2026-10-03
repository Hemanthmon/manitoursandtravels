import { NextResponse } from 'next/server'

import type { AdminUser } from '@/lib/auth/credentials'
import { getMobileAdmin } from '@/lib/auth/mobileToken'

export type FieldErrors = Record<string, string[] | undefined>

export function apiError(status: number, message: string, errors?: FieldErrors) {
  return NextResponse.json({ error: message, ...(errors ? { errors } : {}) }, { status })
}

type RouteContext<P> = { params: Promise<P> }

// Wraps a /api/mobile route handler: rejects requests without a valid admin
// bearer token and turns unexpected errors into a JSON 500 instead of HTML.
export function withMobileAuth<P = Record<string, never>>(
  handler: (request: Request, ctx: { admin: AdminUser; params: P }) => Promise<Response>,
) {
  return async (request: Request, context: RouteContext<P>) => {
    const route = `${request.method} ${new URL(request.url).pathname}`
    const admin = await getMobileAdmin(request)
    if (!admin) {
      const hasToken = request.headers.get('authorization')?.startsWith('Bearer ')
      console.warn(`[api/mobile] 401 ${route}: ${hasToken ? 'token invalid or expired' : 'no token sent'}`)
      return apiError(401, 'Your session has expired. Please log in again.')
    }

    try {
      return await handler(request, { admin, params: await context.params })
    } catch (error) {
      console.error(`[api/mobile] 500 ${route}`, error)
      return apiError(500, 'Something went wrong. Please try again.')
    }
  }
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export function parseId(value: string): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

// Cursor pagination params shared by list endpoints: ?cursor=<lastId>&limit=<n>
export function getPagination(request: Request, defaultLimit = 20) {
  const { searchParams } = new URL(request.url)
  const cursor = parseId(searchParams.get('cursor') ?? '') ?? undefined
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || defaultLimit, 1), 50)
  return { cursor, limit, searchParams }
}

// Prisma fetches limit + 1 rows; the extra row only signals that another page exists.
export function toPage<T extends { id: number }>(rows: T[], limit: number) {
  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  return { items, nextCursor: hasMore ? items[items.length - 1]!.id : null }
}
