import type { Metadata } from 'next'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import type { Prisma } from '../../../../generated/prisma/client'

import { prisma } from '@/lib/prisma'
import { PackageCard, toPackageCardData, type PackageCardData } from '@/components/site/PackageCard'
import { PackageFilters } from '@/components/site/PackageFilters'
import { PackagesHero, type HeroSlide } from '@/components/site/PackagesHero'
import { Reveal } from '@/components/site/Reveal'
import { getCachedSiteSettings } from '@/lib/getSiteSettings'
import { buildWhatsAppLink } from '@/lib/whatsapp'

export const metadata: Metadata = {
  title: 'Tour Packages',
  description:
    'Fixed door-to-door tour packages to Coorg, Wayanad, Tirupati, Ooty and more — vehicle, driver and itinerary sorted before you leave home.',
}

type PackagesPageProps = {
  searchParams: Promise<{
    destination?: string
    category?: string
    duration?: string
  }>
}

const DURATION_RANGES: Record<string, Prisma.PackageWhereInput> = {
  short: { durationDays: { lte: 2 } },
  medium: { durationDays: { gte: 3, lte: 4 } },
  long: { durationDays: { gte: 5 } },
}

// Destinations/categories barely ever change — cache for 5 min. Admin saves
// also bust this tag directly via revalidateTag, so edits show up instantly.
const getFilterOptions = unstable_cache(
  async () => {
    const [destinations, categories] = await Promise.all([
      prisma.destination.findMany({ orderBy: { name: 'asc' } }),
      prisma.category.findMany({ orderBy: { title: 'asc' } }),
    ])
    return { destinations, categories }
  },
  ['packages-filter-options'],
  { revalidate: 300, tags: ['destinations', 'categories'] },
)

// Cache the filtered package list itself — keyed by the exact filter combo, so
// repeat visits with the same filters are served from cache instead of hitting
// Neon again. Admin package saves bust the 'packages-listing' tag directly.
const getFilteredPackages = unstable_cache(
  async (destination?: string, category?: string, duration?: string) => {
    const where: Prisma.PackageWhereInput = { published: true }
    if (destination) where.destination = { slug: destination }
    if (category) where.categories = { some: { slug: category } }
    if (duration && DURATION_RANGES[duration]) Object.assign(where, DURATION_RANGES[duration])

    return prisma.package.findMany({
      where,
      include: { destination: true, categories: true },
      take: 60,
      orderBy: [{ featured: 'desc' }, { title: 'asc' }],
    })
  },
  ['packages-listing'],
  { revalidate: 60, tags: ['packages-listing'] },
)

// Hero slideshow: cover photos of published packages, featured first. Shares
// the 'packages-listing' tag, so admin saves refresh it immediately.
const getHeroSlides = unstable_cache(
  async (): Promise<HeroSlide[]> => {
    const rows = await prisma.package.findMany({
      where: { published: true, imageUrl: { not: null } },
      select: { imageUrl: true, title: true, slug: true, destination: { select: { name: true } } },
      orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
      take: 5,
    })
    return rows
      .filter((row) => row.imageUrl)
      .map((row) => ({ imageUrl: row.imageUrl!, title: row.title, slug: row.slug, destination: row.destination.name }))
  },
  ['packages-hero-slides'],
  { revalidate: 300, tags: ['packages-listing'] },
)

export default async function PackagesPage({ searchParams }: PackagesPageProps) {
  const { destination, category, duration } = await searchParams

  const [{ destinations, categories }, packages, heroSlides, siteSettings] = await Promise.all([
    getFilterOptions(),
    getFilteredPackages(destination, category, duration),
    getHeroSlides(),
    getCachedSiteSettings(),
  ])

  const hasFilters = Boolean(destination || category || duration)
  const backQueryParams = new URLSearchParams()
  if (destination) backQueryParams.set('destination', destination)
  if (category) backQueryParams.set('category', category)
  if (duration) backQueryParams.set('duration', duration)
  const backQuery = backQueryParams.toString()

  const cards: PackageCardData[] = packages.map(toPackageCardData)

  return (
    <>
      <PackagesHero
        slides={heroSlides}
        whatsappHref={buildWhatsAppLink(
          siteSettings?.whatsapp || '',
          'Hi Mani Tours and Travels, I would like to plan a custom trip.',
        )}
      />

      <section className="py-16 md:py-[72px]" id="all-packages">
        <div className="container">
          <PackageFilters
            destinations={destinations}
            categories={categories}
            activeDestination={destination}
            activeCategory={category}
            activeDuration={duration}
          />

          {cards.length === 0 ? (
            <div className="rounded-[18px] border border-border bg-paper px-6 py-16 text-center">
              <p className="mb-3 text-[1.1rem] font-semibold text-navy-900">
                {hasFilters
                  ? 'No packages match those filters.'
                  : 'No packages published yet — check back soon.'}
              </p>
              {hasFilters && (
                <Link href="/packages" className="font-bold text-gold-600 underline underline-offset-2">
                  Reset filters
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((pkg, index) => (
                <Reveal delay={(index % 4) * 90} key={pkg.id} variant="scale">
                  <PackageCard pkg={pkg} backQuery={backQuery} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
