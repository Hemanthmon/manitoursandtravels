import { getPackageLookups } from '@/server/admin/packages'

import { PackageWizard } from '../PackageWizard'

export default async function NewPackagePage() {
  const { destinations, categories } = await getPackageLookups()

  return (
    <div className="px-8 py-12">
      <h1 className="font-head text-2xl font-bold text-navy-900">New package</h1>
      <p className="mb-8 mt-1 text-muted-brand">Five quick steps. You can go back to any step before publishing.</p>
      <PackageWizard
        categories={categories.map(({ id, title }) => ({ id, name: title }))}
        destinations={destinations.map(({ id, name }) => ({ id, name }))}
      />
    </div>
  )
}
