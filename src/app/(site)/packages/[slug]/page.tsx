import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { Calendar, Clock, MapPin, Users, X } from 'lucide-react'

import { prisma } from '@/lib/prisma'
import { Media } from '@/components/Media'
import { CoverPhotoButton } from '@/components/site/CoverPhotoButton'
import { GalleryLightbox, type GalleryImageData } from '@/components/site/GalleryLightbox'
import { ItineraryAccordion, type ItineraryDayData } from '@/components/site/ItineraryAccordion'
import { PackageCard, type PackageCardData } from '@/components/site/PackageCard'
import { PackageEnquiryForm } from '@/components/site/PackageEnquiryForm'
import { Reveal } from '@/components/site/Reveal'
import { StickyBarWhatsappMessage } from '@/providers/StickyBarProvider'
import { formatDuration, formatPriceFrom } from '@/lib/format'
import { buildWhatsAppLink, whatsappMessages } from '@/lib/whatsapp'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL } from '@/utilities/getURL'
import { getCachedSiteSettings } from '@/lib/getSiteSettings'
import { getCardGradient } from '@/lib/cardGradients'
import { cn } from '@/utilities/ui'
import { WhatsAppIcon } from '@/components/site/WhatsAppIcon'

// On-demand only: the admin Server Actions call revalidatePath directly after
// every create/update/delete, so there's no need for a time-based window here.
export const revalidate = false

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const packages = await prisma.package.findMany({
    where: { published: true },
    select: { slug: true },
  })

  return packages.map((p) => ({ slug: p.slug }))
}

const getPackageBySlug = cache(async (slug: string) => {
  return prisma.package.findUnique({
    where: { slug, published: true },
    include: {
      destination: true,
      categories: true,
      itineraryDays: { orderBy: { dayNumber: 'asc' } },
      galleryImages: true,
    },
  })
})

const getReviewsForPackage = cache(async (packageId: number) => {
  return prisma.review.findMany({
    where: { relatedPackageId: packageId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
})

const getRelatedPackages = cache(
  async (packageId: number, destinationId: number, categoryIds: number[]) => {
    return prisma.package.findMany({
      where: {
        published: true,
        id: { not: packageId },
        OR: [
          { destinationId },
          ...(categoryIds.length > 0 ? [{ categories: { some: { id: { in: categoryIds } } } }] : []),
        ],
      },
      include: { destination: true, categories: true },
      take: 3,
      orderBy: { featured: 'desc' },
    })
  },
)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const pkg = await getPackageBySlug(slug)
  if (!pkg) return {}

  const title = pkg.metaTitle ? `${pkg.metaTitle} | Mani Tours and Travels` : `${pkg.title} | Mani Tours and Travels`
  const description = pkg.metaDescription || pkg.summary

  return {
    description,
    openGraph: mergeOpenGraph({
      description,
      images: pkg.imageUrl ? [{ url: pkg.imageUrl }] : undefined,
      title,
      url: `/packages/${pkg.slug}`,
    }),
    title,
  }
}

function toPackageCardData(pkg: {
  id: number
  slug: string
  title: string
  imageUrl: string | null
  destination: { name: string; slug: string }
  categories: { title: string }[]
  durationDays: number
  durationNights: number
  priceFrom: number
  priceUnit: string
}): PackageCardData {
  return {
    id: pkg.id,
    slug: pkg.slug,
    title: pkg.title,
    imageUrl: pkg.imageUrl,
    destinationName: pkg.destination.name,
    destinationSlug: pkg.destination.slug,
    categoryTitle: pkg.categories[0]?.title ?? null,
    durationDays: pkg.durationDays,
    durationNights: pkg.durationNights,
    priceFrom: pkg.priceFrom,
    priceUnit: pkg.priceUnit.toLowerCase().replaceAll('_', '-'),
  }
}

export default async function PackageDetailPage({ params }: Props) {
  const { slug } = await params
  const pkg = await getPackageBySlug(slug)

  if (!pkg) notFound()

  const siteSettings = await getCachedSiteSettings()
  const whatsapp = siteSettings?.whatsapp || ''

  const itineraryDays: ItineraryDayData[] = pkg.itineraryDays.map((day) => ({
    id: day.id,
    dayNumber: day.dayNumber,
    title: day.title,
    description: day.description,
    meals: day.meals.map((m) => m.toLowerCase()),
    overnightAt: day.overnightAt,
  }))
  const galleryImages: GalleryImageData[] = pkg.galleryImages.map((img) => ({
    id: img.id,
    imageUrl: img.imageUrl,
    caption: img.caption,
  }))
  const inclusions = pkg.inclusions.map((text) => ({ text }))
  const exclusions = pkg.exclusions.map((text) => ({ text }))

  const categoryIds = pkg.categories.map((c) => c.id)
  const [reviews, relatedPackagesRaw] = await Promise.all([
    getReviewsForPackage(pkg.id),
    getRelatedPackages(pkg.id, pkg.destinationId, categoryIds),
  ])
  const relatedPackages = relatedPackagesRaw.map(toPackageCardData)

  const duration = formatDuration(pkg.durationDays, pkg.durationNights)
  const priceUnit = pkg.priceUnit.toLowerCase().replaceAll('_', '-')
  const price = formatPriceFrom(pkg.priceFrom, priceUnit)

  const baseUrl = getServerSideURL()
  const pageUrl = `${baseUrl}/packages/${pkg.slug}`
  const heroImageUrl = pkg.imageUrl || undefined

  const avgRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length : null

  const touristTripJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: pkg.title,
    description: pkg.summary,
    ...(heroImageUrl ? { image: heroImageUrl } : {}),
    ...(pkg.categories.length > 0 ? { touristType: pkg.categories.map((c) => c.title) } : {}),
    ...(itineraryDays.length > 0
      ? {
          itinerary: {
            '@type': 'ItemList',
            itemListElement: itineraryDays.map((day) => ({
              '@type': 'ListItem',
              position: day.dayNumber,
              item: {
                '@type': 'TouristAttraction',
                name: day.title,
                description: day.description || undefined,
              },
            })),
          },
        }
      : {}),
  }

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: pkg.title,
    description: pkg.summary,
    ...(heroImageUrl ? { image: heroImageUrl } : {}),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: pkg.priceFrom,
      availability: 'https://schema.org/InStock',
      url: pageUrl,
    },
    ...(reviews.length > 0 && avgRating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: avgRating.toFixed(1),
            reviewCount: reviews.length,
          },
          review: reviews.map((r) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: r.name },
            reviewRating: { '@type': 'Rating', ratingValue: r.rating },
            reviewBody: r.text,
          })),
        }
      : {}),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Packages', item: `${baseUrl}/packages` },
      { '@type': 'ListItem', position: 3, name: pkg.title, item: pageUrl },
    ],
  }

  return (
    <>
      <StickyBarWhatsappMessage message={whatsappMessages.packageInterest(pkg.title)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(touristTripJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* ============ HERO ============ */}
      {/* With a cover photo: full-screen photo hero. Without one: a shorter branded
          header (destination gradient + large watermark) instead of an empty dark screen. */}
      <section
        className={cn(
          'relative isolate flex items-end overflow-hidden bg-navy-950 text-ivory',
          pkg.imageUrl ? 'min-h-screen' : 'min-h-[68vh] pt-32',
        )}
        style={pkg.imageUrl ? undefined : { background: getCardGradient(pkg.destination?.slug || pkg.slug) }}
      >
        {!pkg.imageUrl && (
          <>
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,rgba(212,165,55,0.22),transparent_45%)]" />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-4 top-24 -z-10 select-none font-head text-[clamp(5rem,16vw,13rem)] font-black italic leading-none text-white/[0.07]"
            >
              {pkg.destination?.name ?? pkg.title}
            </span>
          </>
        )}
        {pkg.imageUrl && (
          <Media
            resource={{ url: pkg.imageUrl }}
            fill
            priority
            imgClassName="absolute inset-0 -z-10 h-full w-full object-cover motion-safe:animate-[kenburns_14s_ease-out_both]"
            size="100vw"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,20,38,0.35)_0%,rgba(8,20,38,0.92)_100%)]" />

        {/* Below the floating header, top-right: open the cover + gallery full screen. */}
        {pkg.imageUrl && (
          <div className="container absolute inset-x-0 top-[88px] z-[2] flex justify-end">
            <CoverPhotoButton
              photos={[
                { url: pkg.imageUrl, caption: pkg.title },
                ...galleryImages.map((img) => ({ url: img.imageUrl, caption: img.caption })),
              ]}
            />
          </div>
        )}

        <div className="container relative z-[2] pb-10 motion-safe:animate-[hero-rise_0.9s_cubic-bezier(.2,.7,.2,1)_both]">
          <div className="mb-3 flex flex-wrap gap-2">
            {pkg.destination && (
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.78rem] font-semibold text-ivory/90">
                {pkg.destination.name}
              </span>
            )}
            {duration && (
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.78rem] font-semibold text-ivory/90">
                {duration}
              </span>
            )}
            {pkg.categories.map((c) => (
              <span
                key={c.id}
                className="rounded-full bg-emerald-100 px-3 py-1 text-[0.78rem] font-bold text-emerald-600"
              >
                {c.title}
              </span>
            ))}
          </div>

          <h1 className="text-paper max-w-[45rem] text-[clamp(2rem,1.4rem+2.6vw,3.2rem)]">{pkg.title}</h1>
          {price && <div className="mt-3 text-[1.2rem] font-bold text-gold-300">{price}</div>}

          <div className="mt-6 flex flex-wrap gap-3.5">
            <a
              href="#enquiry-form"
              className="btn-shine inline-flex items-center justify-center gap-2.5 rounded-full bg-gold-500 px-7 py-4 font-bold text-navy-950 shadow-[0_10px_26px_-8px_rgba(212,165,55,0.55)] transition-all hover:-translate-y-0.5 hover:bg-gold-300"
            >
              Enquire Now
            </a>
            <a
              href={buildWhatsAppLink(whatsapp, whatsappMessages.packageInterest(pkg.title))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 rounded-full border-[1.5px] border-white/50 px-7 py-4 font-bold text-paper transition-all hover:-translate-y-0.5 hover:bg-white/[0.12]"
            >
              <WhatsAppIcon className="h-5 w-5" /> WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ============ OVERVIEW ============ */}
      <section className="py-14 md:py-[72px]">
        <div className="container">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
            <Reveal>
              <h2 className="mb-4 text-[1.6rem]">Overview</h2>
              <p className="text-[1.02rem] leading-relaxed text-muted-brand">{pkg.summary}</p>
            </Reveal>
            <Reveal>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Clock, label: 'Duration', value: duration || '—' },
                  { icon: Calendar, label: 'Best Season', value: pkg.destination?.bestTimeToVisit || 'Year-round' },
                  {
                    icon: Users,
                    label: 'Ideal For',
                    value: pkg.categories.length > 0 ? pkg.categories.map((c) => c.title).join(', ') : 'Families & Groups',
                  },
                  { icon: MapPin, label: 'Starting Point', value: 'Door-to-Door Pickup' },
                ].map((fact, index) => (
                  <Reveal delay={index * 90} key={fact.label} variant="scale">
                  <div className="group h-full rounded-2xl border border-border bg-paper p-4 transition-all duration-300 hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-[0_16px_30px_-18px_rgba(8,20,38,0.35)]">
                    <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-[11px] bg-navy-900 text-gold-300 transition-all duration-300 group-hover:-rotate-6 group-hover:bg-gold-500 group-hover:text-navy-950">
                      <fact.icon className="h-5 w-5" />
                    </div>
                    <div className="text-[0.72rem] font-bold uppercase tracking-[.05em] text-muted-brand">
                      {fact.label}
                    </div>
                    <div className="mt-0.5 text-[0.92rem] font-semibold text-navy-900">{fact.value}</div>
                  </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ ITINERARY ============ */}
      {itineraryDays.length > 0 && (
        <section className="bg-ivory-dim py-14 md:py-[72px]">
          <div className="container">
            <Reveal>
              <h2 className="mb-7 text-[1.6rem]">Day-by-Day Itinerary</h2>
            </Reveal>
            <Reveal>
              <ItineraryAccordion days={itineraryDays} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ============ INCLUSIONS / EXCLUSIONS ============ */}
      {(inclusions.length > 0 || exclusions.length > 0) && (
        <section className="py-14 md:py-[72px]">
          <div className="container">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {inclusions.length > 0 && (
                <Reveal>
                  <h2 className="mb-4 text-[1.3rem]">What&apos;s Included</h2>
                  <ul className="flex flex-col gap-2.5">
                    {inclusions.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2.5 rounded-full border border-emerald-600/25 bg-emerald-100 px-4 py-2.5 text-[0.9rem] font-semibold text-navy-900"
                      >
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3}>
                            <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}
              {exclusions.length > 0 && (
                <Reveal>
                  <h2 className="mb-4 text-[1.3rem]">Not Included</h2>
                  <ul className="flex flex-col gap-2.5">
                    {exclusions.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2.5 rounded-full border border-border bg-ivory-dim px-4 py-2.5 text-[0.9rem] font-semibold text-muted-brand"
                      >
                        <X className="h-5 w-5 flex-shrink-0" />
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ============ GALLERY ============ */}
      {galleryImages.length > 0 && (
        <section className="bg-ivory-dim py-14 md:py-[72px]">
          <div className="container">
            <Reveal>
              <h2 className="mb-7 text-[1.6rem]">Gallery</h2>
            </Reveal>
            <Reveal>
              <GalleryLightbox images={galleryImages} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ============ REVIEWS ============ */}
      {reviews.length > 0 && (
        <section className="py-14 md:py-[72px]">
          <div className="container">
            <Reveal>
              <h2 className="mb-7 text-[1.6rem]">What Travellers Say</h2>
            </Reveal>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <Reveal key={review.id}>
                  <div className="h-full rounded-2xl border border-border bg-paper p-6">
                    <div className="mb-3 text-[0.95rem] font-bold text-gold-500">
                      {'★'.repeat(review.rating)}
                      {'☆'.repeat(Math.max(0, 5 - review.rating))}
                    </div>
                    <p className="mb-4 text-[0.94rem] text-ink">&quot;{review.text}&quot;</p>
                    <strong className="block text-[0.9rem] text-navy-900">{review.name}</strong>
                    {review.location && <span className="text-[0.8rem] text-muted-brand">{review.location}</span>}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ ENQUIRY FORM ============ */}
      <section id="enquiry-form" className="bg-navy-950 py-14 text-ivory md:py-[72px]">
        <div className="container">
          <div className="mx-auto max-w-[40rem]">
            <Reveal className="mb-8 text-center">
              <h2 className="text-paper text-[1.7rem]">
                {/* Avoid "Family Trip Trip" when the title already ends in "trip". */}
                Plan the {pkg.title}
                {/\btrip$/i.test(pkg.title.trim()) ? '' : ' Trip'}
              </h2>
              <p className="mt-2 text-[1rem] text-ivory/70">
                Tell us a few details and we&apos;ll call or WhatsApp you to confirm the fare and dates.
              </p>
            </Reveal>
            <Reveal>
              <PackageEnquiryForm packageId={pkg.id} packageTitle={pkg.title} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ RELATED PACKAGES ============ */}
      {relatedPackages.length > 0 && (
        <section className="py-14 md:py-[72px]">
          <div className="container">
            <Reveal>
              <h2 className="mb-7 text-[1.6rem]">You Might Also Like</h2>
            </Reveal>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPackages.map((related) => (
                <Reveal key={related.id}>
                  <PackageCard pkg={related} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
