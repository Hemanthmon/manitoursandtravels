import { router } from 'expo-router'

import { ApiError } from '@/api/client'
import { useSavePackage } from '@/api/hooks'
import { PackageForm } from '@/components/PackageForm'

export default function NewPackageScreen() {
  const save = useSavePackage()
  const error = save.error instanceof ApiError ? save.error : undefined

  return (
    <PackageForm
      formError={error?.message}
      onSubmit={(input) => save.mutate(input, { onSuccess: () => router.back() })}
      serverErrors={error?.fieldErrors}
      submitting={save.isPending}
    />
  )
}
