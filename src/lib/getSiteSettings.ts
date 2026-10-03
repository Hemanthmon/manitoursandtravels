import { unstable_cache } from 'next/cache'

import { prisma } from '@/lib/prisma'

import type { SiteSettings } from '../../generated/prisma/client'

export type { SiteSettings }

async function getSiteSettings() {
  return prisma.siteSettings.findUnique({ where: { id: 1 } })
}

export const getCachedSiteSettings = unstable_cache(getSiteSettings, ['site-settings'], {
  tags: ['site-settings'],
})
