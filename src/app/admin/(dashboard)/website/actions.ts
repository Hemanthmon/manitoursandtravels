'use server'

import { redirect } from 'next/navigation'

import { auth } from '@/auth'
import { saveHomeStats, type SaveHomeStatsResult } from '@/server/admin/homeStats'

// Server actions are public POST endpoints, so check the session here too.
export async function saveHomeStatsAction(input: unknown): Promise<SaveHomeStatsResult> {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')
  return saveHomeStats(input)
}
