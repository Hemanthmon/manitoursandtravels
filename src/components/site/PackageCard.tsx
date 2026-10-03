import Link from 'next/link'
import React from 'react'
import { Compass } from 'lucide-react'

import { Media } from '@/components/Media'
import { getCardGradient } from '@/lib/cardGradients'
import { formatDuration, formatPriceFrom } from '@/lib/format'

export type PackageCardData = {
  id: number
  slug: string
  title: string
  imageUrl: string | null
  destinationName: string | null
  destinationSlug: string | null
  categoryTitle: string | null
  durationDays: number | null
  durationNights: number | null
  priceFrom: number | null
  priceUnit: string | null
}

// Maps a Prisma package (with destination + categories) to card props.
export function toPackageCardData(pkg: {
  id: number
  slug: string
  title: string
  imageUrl: string | null
  durationDays: number
  durationNights: number
  priceFrom: number
  priceUnit: string
  destination: { name: string; slug: string }
  categories: { title: string }[]
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

export const PackageCard: React.FC<{ pkg: PackageCardData; backQuery?: string }> = ({
  pkg,
  backQuery,
}) => {
  const hasImage = Boolean(pkg.imageUrl)
  const duration = formatDuration(pkg.durationDays, pkg.durationNights)
  const price = formatPriceFrom(pkg.priceFrom, pkg.priceUnit)
  const href = backQuery
    ? `/packages/${pkg.slug}?from=${encodeURIComponent(backQuery)}`
    : `/packages/${pkg.slug}`

  return (
    <Link
      className="group relative isolate flex h-[340px] flex-col justify-end overflow-hidden rounded-[20px] p-[22px] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_28px_50px_-22px_rgba(0,0,0,0.65)]"
      href={href}
      style={
        !hasImage
          ? { background: getCardGradient(pkg.destinationSlug || pkg.slug || pkg.title) }
          : undefined
      }
    >
      {hasImage && pkg.imageUrl && (
        <Media
          fill
          imgClassName="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          resource={{ url: pkg.imageUrl }}
          size="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      )}
      <div className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(8,20,38,0)_30%,rgba(8,20,38,0.92)_100%)]" />

      <div className="relative z-[2] mb-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.14] text-gold-300 backdrop-blur-[6px]">
        <Compass className="h-[22px] w-[22px] transition-transform duration-500 group-hover:rotate-[135deg]" />
      </div>

      <div className="relative z-[2]">
        {pkg.categoryTitle && (
          <span className="mb-2 inline-block rounded-full bg-emerald-100 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[.05em] text-emerald-600">
            {pkg.categoryTitle}
          </span>
        )}
        <h3 className="text-paper mb-1 text-[1.3rem]">{pkg.title}</h3>
        <p className="mb-1 text-[0.85rem] text-ivory/70">
          {pkg.destinationName}
          {duration ? ` · ${duration}` : ''}
        </p>
        <div className="mb-3.5 text-[0.95rem] font-bold text-gold-300">{price}</div>
        <span className="inline-flex items-center gap-1.5 text-[0.86rem] font-bold text-gold-300">
          Plan this trip{' '}
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">→</span>
        </span>
      </div>
    </Link>
  )
}
