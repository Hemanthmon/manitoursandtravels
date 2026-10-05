import { revalidatePath, revalidateTag } from 'next/cache'

import { homeStatsSchema, resolveHomeStats, type HomeStat } from '@/lib/homeStats'
import { prisma } from '@/lib/prisma'

// Shared by the web admin (Website Stats page) and /api/mobile/home-stats.

export type SaveHomeStatsResult =
  | { ok: true; stats: HomeStat[] }
  | { ok: false; error: string; errors?: Record<string, string[] | undefined> }

export async function getHomeStats() {
  return resolveHomeStats(await prisma.siteSettings.findUnique({ where: { id: 1 } }))
}

// `input` is the raw, unvalidated JSON payload from either admin.
export async function saveHomeStats(input: unknown): Promise<SaveHomeStatsResult> {
  const parsed = homeStatsSchema.safeParse(input)
  if (!parsed.success) {
    // Keyed "<slot>.<field>" (e.g. "1.label") so each admin can show the
    // message under the right box.
    const errors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      ;(errors[key] ??= []).push(issue.message)
    }
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the numbers.', errors }
  }

  const exists = await prisma.siteSettings.findUnique({ where: { id: 1 }, select: { id: true } })
  if (!exists) return { ok: false, error: 'Site settings have not been set up yet.' }

  await prisma.siteSettings.update({ where: { id: 1 }, data: { homeStats: parsed.data } })
  revalidateTag('site-settings')
  revalidatePath('/')
  return { ok: true, stats: parsed.data }
}
