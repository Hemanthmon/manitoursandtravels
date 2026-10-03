import { Calendar, Pencil, Plus, Star } from 'lucide-react'
import Link from 'next/link'

import { getCardGradient } from '@/lib/cardGradients'
import { formatDuration, formatPriceFrom } from '@/lib/format'
import { prisma } from '@/lib/prisma'

import { DeletePackageButton } from './DeletePackageButton'
import { PublishedToggle } from './PublishedToggle'

export default async function AdminPackagesPage() {
  const packages = await prisma.package.findMany({
    include: { destination: true, _count: { select: { itineraryDays: true } } },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
  })

  return (
    <div className="px-8 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-head text-2xl font-bold text-navy-900">Packages</h1>
          <p className="mt-1 text-muted-brand">
            {packages.length} package{packages.length === 1 ? '' : 's'} ·{' '}
            {packages.filter((pkg) => pkg.published).length} published
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-bold text-navy-950 transition hover:bg-gold-300"
          href="/admin/packages/new"
        >
          <Plus className="h-4 w-4" /> New package
        </Link>
      </div>

      {packages.length === 0 ? (
        <div className="mt-10 rounded-2xl border-2 border-dashed border-border p-12 text-center">
          <p className="font-semibold text-navy-900">No packages yet</p>
          <p className="mt-1 text-sm text-muted-brand">Create your first tour package in five quick steps.</p>
          <Link className="mt-4 inline-block font-semibold text-gold-600 underline" href="/admin/packages/new">
            Create a package
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {packages.map((pkg) => (
            <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm" key={pkg.id}>
              <Link
                className="relative isolate block h-44"
                href={`/admin/packages/${pkg.id}/edit`}
                style={pkg.imageUrl ? undefined : { background: getCardGradient(pkg.destination.slug || pkg.slug) }}
              >
                {pkg.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" src={pkg.imageUrl} />
                )}
                <div className="absolute inset-0 -z-[5] bg-[linear-gradient(180deg,rgba(8,20,38,0)_40%,rgba(8,20,38,0.75)_100%)]" />
                {pkg.featured && (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold-500 px-2.5 py-1 text-xs font-bold text-navy-950">
                    <Star className="h-3 w-3" /> Featured
                  </span>
                )}
                <span className="absolute bottom-3 left-4 text-sm font-semibold text-ivory">{pkg.destination.name}</span>
              </Link>

              <div className="flex flex-1 flex-col gap-1.5 p-4">
                <h2 className="font-head text-lg font-bold leading-snug text-navy-900">{pkg.title}</h2>
                <p className="text-sm font-semibold text-gold-600">
                  {formatPriceFrom(pkg.priceFrom, pkg.priceUnit.toLowerCase().replaceAll('_', '-'))}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-brand">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDuration(pkg.durationDays, pkg.durationNights)} ·{' '}
                  {pkg._count.itineraryDays ? `${pkg._count.itineraryDays}-day itinerary` : 'No itinerary yet'}
                </p>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
                  <PublishedToggle id={pkg.id} published={pkg.published} />
                  <div className="flex items-center gap-4 text-sm">
                    <Link
                      className="inline-flex items-center gap-1 font-semibold text-navy-700 hover:text-gold-600"
                      href={`/admin/packages/${pkg.id}/edit`}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                    <DeletePackageButton id={pkg.id} title={pkg.title} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
