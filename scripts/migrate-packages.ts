import 'dotenv/config'

import { prisma } from '../src/lib/prisma'

// One-off Phase 4 migration: carries the 4 real published packages (and Coorg's
// itinerary + the one review) straight out of the live Payload site into Prisma,
// so the public pages have real content to verify against instead of starting
// from zero. Source data pulled from the live /api/packages, /api/reviews REST
// endpoints on 2026-08-01. Safe to re-run — everything upserts by slug.
// The 4 empty draft packages in Payload (ids 5-8, no title/content) were not
// migrated — there was nothing in them to carry over.

const priceUnitMap: Record<string, 'PER_PERSON' | 'PER_GROUP' | 'PER_VEHICLE'> = {
  'per-person': 'PER_PERSON',
  'per-group': 'PER_GROUP',
  'per-vehicle': 'PER_VEHICLE',
}

const mealMap: Record<string, 'BREAKFAST' | 'LUNCH' | 'DINNER'> = {
  breakfast: 'BREAKFAST',
  lunch: 'LUNCH',
  dinner: 'DINNER',
}

const packages = [
  {
    slug: 'coorg-getaway',
    title: 'Coorg Getaway',
    destinationSlug: 'coorg',
    categorySlugs: ['hill-station', 'family'],
    summary: 'The classic 2-3 day family getaway through coffee estates and waterfalls.',
    durationDays: 3,
    durationNights: 2,
    priceFrom: 3999,
    priceUnit: 'per-person',
    featured: true,
    highlights: ['Abbey Falls & coffee plantation walk', "Raja's Seat sunset point"],
    inclusions: ['AC vehicle with driver', 'Fuel & toll charges', 'Hotel pickup & drop'],
    exclusions: ['Entry tickets & activities', 'Meals'],
    itineraryDays: [
      {
        dayNumber: 1,
        title: 'Arrival in Coorg & Abbey Falls',
        description:
          'Pick up from Bengaluru early morning, arrive Coorg by afternoon, visit Abbey Falls and check in.',
        meals: ['breakfast'],
        overnightAt: 'Coorg',
      },
      {
        dayNumber: 2,
        title: "Coffee Estate & Raja's Seat",
        description:
          'Full day covering a coffee plantation tour, Namdroling Monastery and sunset at Raja\'s Seat.',
        meals: ['breakfast', 'lunch', 'dinner'],
        overnightAt: 'Coorg',
      },
      {
        dayNumber: 3,
        title: 'Return to Bengaluru',
        description: 'Leisurely breakfast, check out and drive back to Bengaluru by evening.',
        meals: ['breakfast'],
        overnightAt: null,
      },
    ],
  },
  {
    slug: 'wayanad-monsoon-escape',
    title: 'Wayanad Monsoon Escape',
    destinationSlug: 'wayanad',
    categorySlugs: ['hill-station'],
    summary: 'Rainforests, wildlife trails and cool green hills — a 2-day monsoon escape.',
    durationDays: 2,
    durationNights: 1,
    priceFrom: 2999,
    priceUnit: 'per-person',
    featured: false,
    highlights: [],
    inclusions: ['AC vehicle with driver', 'Fuel & toll charges'],
    exclusions: ['Entry tickets & activities', 'Meals'],
    itineraryDays: [],
  },
  {
    slug: 'tirupati-darshan-trip',
    title: 'Tirupati Darshan Trip',
    destinationSlug: 'tirupati',
    categorySlugs: ['pilgrimage'],
    summary: 'A comfortable, well-timed pilgrimage day trip.',
    durationDays: 1,
    durationNights: 0,
    priceFrom: 1999,
    priceUnit: 'per-vehicle',
    featured: false,
    highlights: [],
    inclusions: ['AC vehicle with driver', 'Fuel & toll charges'],
    exclusions: ['Darshan tickets', 'Meals'],
    itineraryDays: [],
  },
  {
    slug: 'ooty-hills-family-trip',
    title: 'Ooty Hills Family Trip',
    destinationSlug: 'ooty',
    categorySlugs: ['hill-station', 'family'],
    summary: 'Tea gardens, toy-train views and hill-station charm for the whole family.',
    durationDays: 3,
    durationNights: 2,
    priceFrom: 4499,
    priceUnit: 'per-person',
    featured: false,
    highlights: [],
    inclusions: ['AC vehicle with driver', 'Fuel & toll charges', 'Hotel pickup & drop'],
    exclusions: ['Entry tickets & activities', 'Meals'],
    itineraryDays: [],
  },
]

const reviews = [
  {
    packageSlug: 'coorg-getaway',
    name: 'Priya M.',
    location: 'Indiranagar, Family Trip',
    rating: 5,
    text: 'Booked the Coorg package for my in-laws — the driver knew every viewpoint and waited patiently at each stop.',
    relatedService: 'TOUR_PACKAGE' as const,
    featured: true,
  },
]

async function main() {
  for (const pkg of packages) {
    const destination = await prisma.destination.findUniqueOrThrow({
      where: { slug: pkg.destinationSlug },
    })
    const categories = await prisma.category.findMany({
      where: { slug: { in: pkg.categorySlugs } },
    })

    const created = await prisma.package.upsert({
      where: { slug: pkg.slug },
      create: {
        slug: pkg.slug,
        title: pkg.title,
        destinationId: destination.id,
        categories: { connect: categories.map((c) => ({ id: c.id })) },
        summary: pkg.summary,
        durationDays: pkg.durationDays,
        durationNights: pkg.durationNights,
        priceFrom: pkg.priceFrom,
        priceUnit: priceUnitMap[pkg.priceUnit],
        featured: pkg.featured,
        published: true,
        highlights: pkg.highlights,
        inclusions: pkg.inclusions,
        exclusions: pkg.exclusions,
      },
      update: {
        title: pkg.title,
        destinationId: destination.id,
        categories: { set: categories.map((c) => ({ id: c.id })) },
        summary: pkg.summary,
        durationDays: pkg.durationDays,
        durationNights: pkg.durationNights,
        priceFrom: pkg.priceFrom,
        priceUnit: priceUnitMap[pkg.priceUnit],
        featured: pkg.featured,
        published: true,
        highlights: pkg.highlights,
        inclusions: pkg.inclusions,
        exclusions: pkg.exclusions,
      },
    })

    if (pkg.itineraryDays.length > 0) {
      await prisma.itineraryDay.deleteMany({ where: { packageId: created.id } })
      await prisma.itineraryDay.createMany({
        data: pkg.itineraryDays.map((day) => ({
          packageId: created.id,
          dayNumber: day.dayNumber,
          title: day.title,
          description: day.description,
          meals: day.meals.map((m) => mealMap[m]),
          overnightAt: day.overnightAt,
        })),
      })
    }

    console.log(`Package ready: ${created.title} (${created.slug})`)
  }

  for (const review of reviews) {
    const pkg = await prisma.package.findUniqueOrThrow({ where: { slug: review.packageSlug } })
    const existing = await prisma.review.findFirst({
      where: { relatedPackageId: pkg.id, name: review.name, text: review.text },
    })
    if (!existing) {
      await prisma.review.create({
        data: {
          name: review.name,
          location: review.location,
          rating: review.rating,
          text: review.text,
          relatedService: review.relatedService,
          relatedPackageId: pkg.id,
          featured: review.featured,
          publishedAt: new Date(),
        },
      })
      console.log(`Review created for ${pkg.title}`)
    }
  }

  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
