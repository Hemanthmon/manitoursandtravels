import { getHomeStats } from '@/server/admin/homeStats'

import { HomeStatsForm } from './HomeStatsForm'

export default async function AdminWebsitePage() {
  const stats = await getHomeStats()

  return (
    <div className="max-w-4xl px-8 py-12">
      <h1 className="font-head text-2xl font-bold text-navy-900">Website stats</h1>
      <p className="mt-1 text-muted-brand">
        The 4 numbers in the &ldquo;Why families choose us&rdquo; section of the home page. Update them
        whenever they grow — the website changes as soon as you save.
      </p>
      <HomeStatsForm initial={stats} />
    </div>
  )
}
