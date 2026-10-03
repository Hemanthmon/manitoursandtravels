import { NextResponse } from 'next/server'

import { withMobileAuth } from '@/lib/api/mobile'
import { mealValues, priceUnitValues } from '@/lib/validations/package'
import { enquiryStatusValues } from '@/server/admin/crm'
import { getPackageLookups } from '@/server/admin/packages'

// Reference data the app needs to render forms and filters.
export const GET = withMobileAuth(async () => {
  const { destinations, categories } = await getPackageLookups()

  return NextResponse.json({
    destinations: destinations.map(({ id, name }) => ({ id, name })),
    categories: categories.map(({ id, title }) => ({ id, title })),
    priceUnits: priceUnitValues,
    meals: mealValues,
    enquiryStatuses: enquiryStatusValues,
  })
})
