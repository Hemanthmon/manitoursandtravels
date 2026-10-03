import { revalidatePath, revalidateTag } from 'next/cache'

import { Prisma, prisma } from '@/lib/prisma'
import { packageSchema, slugify } from '@/lib/validations/package'

// Shared package business logic for the web admin (server actions) and the
// mobile admin API (/api/mobile/packages). Keep rules here, not in callers.

export type SavePackageResult =
  | { ok: true; id: number }
  | { ok: false; errors: Record<string, string[] | undefined> }

// Bust the public listing (path + cache tag) and every package detail page.
// The '[slug]' pattern revalidates all params for that route, so a rename
// doesn't need the old slug looked up first.
function revalidatePackagePaths() {
  revalidatePath('/admin/packages')
  revalidatePath('/')
  revalidatePath('/packages')
  revalidateTag('packages-listing')
  revalidatePath('/packages/[slug]', 'page')
}

export async function listPackages() {
  return prisma.package.findMany({
    include: {
      destination: { select: { id: true, name: true } },
      _count: { select: { itineraryDays: true } },
    },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
  })
}

export async function getPackage(id: number) {
  return prisma.package.findUnique({
    where: { id },
    include: {
      destination: { select: { id: true, name: true } },
      categories: { select: { id: true, title: true } },
      itineraryDays: {
        orderBy: { dayNumber: 'asc' },
        select: { dayNumber: true, title: true, description: true, meals: true, overnightAt: true },
      },
    },
  })
}

export async function getPackageLookups() {
  const [destinations, categories] = await Promise.all([
    prisma.destination.findMany({ orderBy: { name: 'asc' } }),
    prisma.category.findMany({ orderBy: { title: 'asc' } }),
  ])
  return { destinations, categories }
}

// "coorg-getaway", or "coorg-getaway-2" if that's taken by another package.
async function uniquePackageSlug(title: string, excludeId?: number) {
  const base = slugify(title) || 'package'
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`
    const clash = await prisma.package.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    })
    if (!clash) return candidate
  }
}

// `input` is the raw, unvalidated JSON payload from either admin.
export async function savePackage(id: number | undefined, input: unknown): Promise<SavePackageResult> {
  const parsed = packageSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors }
  }

  const { categoryIds, itinerary, slug: requestedSlug, ...data } = parsed.data

  // Editing keeps the existing web address unless the admin changed it, so
  // links already shared on WhatsApp/Google keep working after a rename.
  let slug = requestedSlug
  if (!slug && id) {
    slug = (await prisma.package.findUnique({ where: { id }, select: { slug: true } }))?.slug
  }
  if (!slug) slug = await uniquePackageSlug(data.title, id)

  const days = itinerary.map((day, index) => ({
    dayNumber: index + 1,
    title: day.title,
    description: day.description || null,
    meals: day.meals,
    overnightAt: day.overnightAt || null,
  }))

  try {
    const saved = await prisma.$transaction(async (tx) => {
      const pkg = id
        ? await tx.package.update({
            where: { id },
            data: { ...data, slug, categories: { set: categoryIds.map((categoryId) => ({ id: categoryId })) } },
          })
        : await tx.package.create({
            data: { ...data, slug, categories: { connect: categoryIds.map((categoryId) => ({ id: categoryId })) } },
          })

      // The editor always sends the whole itinerary, so replace it wholesale.
      await tx.itineraryDay.deleteMany({ where: { packageId: pkg.id } })
      if (days.length) {
        await tx.itineraryDay.createMany({ data: days.map((day) => ({ ...day, packageId: pkg.id })) })
      }
      return pkg
    })

    revalidatePackagePaths()
    return { ok: true, id: saved.id }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, errors: { slug: ['That web address is already used by another package.'] } }
    }
    throw error
  }
}

export async function deletePackage(id: number) {
  await prisma.package.delete({ where: { id } })
  revalidatePackagePaths()
}

export async function setPackagePublished(id: number, published: boolean) {
  await prisma.package.update({ where: { id }, data: { published } })
  revalidatePackagePaths()
}

export function isRecordNotFound(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'
}

// ---------- Adding destinations / categories from the package editor ----------

function revalidateTaxonomy() {
  revalidateTag('destinations')
  revalidateTag('categories')
  revalidatePath('/packages')
}

// Returns the existing destination when the name (or its slug) already exists,
// so typing "coorg" again never creates a duplicate.
export async function findOrCreateDestination(name: string) {
  // Names with no a-z/0-9 (e.g. in Tamil script) still need a unique slug.
  const slug = slugify(name) || `destination-${Date.now()}`
  const existing = await prisma.destination.findFirst({
    where: { OR: [{ slug }, { name: { equals: name, mode: 'insensitive' } }] },
    select: { id: true, name: true },
  })
  if (existing) return existing

  const created = await prisma.destination.create({
    data: { name, slug, summary: '' },
    select: { id: true, name: true },
  })
  revalidateTaxonomy()
  return created
}

export async function findOrCreateCategory(title: string) {
  const slug = slugify(title) || `category-${Date.now()}`
  const existing = await prisma.category.findFirst({
    where: { OR: [{ slug }, { title: { equals: title, mode: 'insensitive' } }] },
    select: { id: true, title: true },
  })
  if (existing) return existing

  const created = await prisma.category.create({ data: { title, slug }, select: { id: true, title: true } })
  revalidateTaxonomy()
  return created
}
