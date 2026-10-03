'use server'

import { redirect } from 'next/navigation'

import { auth } from '@/auth'
import { signBrowserUpload } from '@/lib/cloudinary'
import { newTaxonomySchema } from '@/lib/validations/package'
import {
  deletePackage,
  findOrCreateCategory,
  findOrCreateDestination,
  savePackage,
  setPackagePublished,
  type SavePackageResult,
} from '@/server/admin/packages'

// Server actions are public POST endpoints, so each one checks the session
// itself rather than relying only on the /admin middleware.
async function requireAdmin() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')
}

// Called by the step-by-step package editor with the same JSON shape the
// mobile app sends. Returns field errors instead of throwing, so the editor
// can jump back to the step that needs fixing.
export async function savePackageAction(id: number | undefined, input: unknown): Promise<SavePackageResult> {
  await requireAdmin()
  return savePackage(id, input)
}

export async function addDestinationAction(input: unknown) {
  await requireAdmin()
  const parsed = newTaxonomySchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Invalid name' }
  return { ok: true as const, item: await findOrCreateDestination(parsed.data.name) }
}

export async function addCategoryAction(input: unknown) {
  await requireAdmin()
  const parsed = newTaxonomySchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Invalid name' }
  const category = await findOrCreateCategory(parsed.data.name)
  return { ok: true as const, item: { id: category.id, name: category.title } }
}

export async function deletePackageAction(id: number) {
  await requireAdmin()
  await deletePackage(id)
}

export async function togglePublishedAction(id: number, published: boolean) {
  await requireAdmin()
  await setPackagePublished(id, published)
}

// Short-lived signature so the browser can upload a package image straight to
// Cloudinary without ever seeing the API secret.
export async function getImageUploadSignatureAction() {
  await requireAdmin()
  return signBrowserUpload()
}
