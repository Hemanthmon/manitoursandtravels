import React from 'react'

import type { SiteSettings } from '@/lib/getSiteSettings'

import { HeaderClient } from './Component.client'

export async function Header({ siteSettings }: { siteSettings: SiteSettings | null }) {
  return <HeaderClient siteSettings={siteSettings} />
}
