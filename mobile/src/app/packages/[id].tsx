import { Stack, router, useLocalSearchParams } from 'expo-router'
import { Alert } from 'react-native'

import { ApiError } from '@/api/client'
import { useDeletePackage, usePackage, useSavePackage } from '@/api/hooks'
import { PackageForm } from '@/components/PackageForm'
import { Button, ErrorView, LoadingView } from '@/components/ui'
import { spacing } from '@/lib/theme'

export default function EditPackageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const packageId = Number(id)
  const { data: pkg, error, isLoading, refetch } = usePackage(packageId)
  const save = useSavePackage(packageId)
  const remove = useDeletePackage()

  if (isLoading) return <LoadingView />
  if (error || !pkg) return <ErrorView message={error?.message ?? 'Package not found.'} onRetry={refetch} />

  const saveError = save.error instanceof ApiError ? save.error : undefined

  const confirmDelete = () =>
    Alert.alert(`Delete “${pkg.title}”?`, 'This removes it from the website. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          remove.mutate(pkg.id, {
            onSuccess: () => router.back(),
            onError: (err) => Alert.alert('Could not delete', err.message),
          }),
      },
    ])

  return (
    <>
      <Stack.Screen options={{ title: pkg.title }} />
      <PackageForm
        footer={
          <Button
            icon="trash-outline"
            loading={remove.isPending}
            onPress={confirmDelete}
            style={{ marginTop: spacing.sm }}
            title="Delete package"
            variant="danger"
          />
        }
        formError={saveError?.message}
        // Remount the form when fresh data arrives so it never shows stale values.
        initial={pkg}
        key={pkg.updatedAt}
        onSubmit={(input) => save.mutate(input, { onSuccess: () => router.back() })}
        serverErrors={saveError?.fieldErrors}
        submitting={save.isPending}
      />
    </>
  )
}
