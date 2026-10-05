import { NextResponse } from 'next/server'

import { apiError, readJson, withMobileAuth } from '@/lib/api/mobile'
import { getHomeStats, saveHomeStats } from '@/server/admin/homeStats'

// The home page's 4 proof numbers ("42,000+ Rides completed").
export const GET = withMobileAuth(async () => NextResponse.json({ stats: await getHomeStats() }))

export const PUT = withMobileAuth(async (request) => {
  const result = await saveHomeStats(await readJson(request))
  if (!result.ok) return apiError(422, result.error, result.errors)

  return NextResponse.json({ stats: result.stats })
})
