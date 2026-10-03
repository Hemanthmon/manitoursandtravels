import { notFound } from 'next/navigation'

import { getPackage, getPackageLookups } from '@/server/admin/packages'

import { PackageWizard } from '../../PackageWizard'

export default async function EditPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const packageId = Number(id)
  if (!Number.isInteger(packageId)) notFound()

  const [pkg, { destinations, categories }] = await Promise.all([getPackage(packageId), getPackageLookups()])
  if (!pkg) notFound()

  return (
    <div className="px-8 py-12">
      <h1 className="font-head text-2xl font-bold text-navy-900">Edit: {pkg.title}</h1>
      <p className="mb-8 mt-1 text-muted-brand">Jump to any step, change what you need, then save.</p>
      <PackageWizard
        categories={categories.map(({ id, title }) => ({ id, name: title }))}
        destinations={destinations.map(({ id, name }) => ({ id, name }))}
        initial={{
          title: pkg.title,
          slug: pkg.slug,
          destinationId: pkg.destinationId,
          categoryIds: pkg.categories.map((category) => category.id),
          imageUrl: pkg.imageUrl,
          summary: pkg.summary,
          description: pkg.description,
          durationDays: pkg.durationDays,
          durationNights: pkg.durationNights,
          priceFrom: pkg.priceFrom,
          priceUnit: pkg.priceUnit,
          bestSeason: pkg.bestSeason,
          highlights: pkg.highlights,
          inclusions: pkg.inclusions,
          exclusions: pkg.exclusions,
          itinerary: pkg.itineraryDays,
          featured: pkg.featured,
          published: pkg.published,
          metaTitle: pkg.metaTitle,
          metaDescription: pkg.metaDescription,
        }}
        packageId={pkg.id}
      />
    </div>
  )
}
