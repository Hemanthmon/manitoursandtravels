import 'dotenv/config'

import { prisma } from '../src/lib/prisma'

// One-off Phase 3 bootstrap: the new Package admin form needs at least one
// Destination and Category to choose from. Full Package content migration
// is Phase 4's job — this only copies the small reference tables (4
// destinations, 3 categories) straight from the live Payload site so the
// admin isn't blocked on empty dropdowns.
const destinations = [
  {
    slug: 'coorg',
    name: 'Coorg',
    summary: 'Misty coffee estates, waterfalls & a slower pace.',
    region: 'Karnataka',
    bestTimeToVisit: 'October to March',
  },
  {
    slug: 'wayanad',
    name: 'Wayanad',
    summary: 'Rainforests, wildlife trails and cool green hills.',
    region: 'Kerala',
    bestTimeToVisit: 'October to May',
  },
  {
    slug: 'tirupati',
    name: 'Tirupati',
    summary: 'A comfortable, well-timed pilgrimage.',
    region: 'Andhra Pradesh',
    bestTimeToVisit: 'Year-round',
  },
  {
    slug: 'ooty',
    name: 'Ooty',
    summary: 'Tea gardens, toy-train views and hill-station charm.',
    region: 'Tamil Nadu',
    bestTimeToVisit: 'September to May',
  },
]

const categories = [
  { slug: 'hill-station', title: 'Hill Station', description: 'Cool climate, green hills.' },
  { slug: 'pilgrimage', title: 'Pilgrimage', description: 'Temple & darshan trips.' },
  { slug: 'family', title: 'Family', description: 'Easy-going trips for all ages.' },
]

async function main() {
  for (const destination of destinations) {
    await prisma.destination.upsert({
      where: { slug: destination.slug },
      create: destination,
      update: destination,
    })
  }

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: category,
      update: category,
    })
  }

  console.log(`Seeded ${destinations.length} destinations and ${categories.length} categories.`)
  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
