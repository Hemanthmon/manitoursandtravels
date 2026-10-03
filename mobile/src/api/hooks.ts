import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'

import { api, toApiError } from './client'
import type {
  AdminUser,
  Booking,
  DashboardStats,
  EnquiryDetail,
  EnquiryStatus,
  EnquirySummary,
  Lookups,
  PackageDetail,
  PackageInput,
  PackageSummary,
  Page,
} from './types'

// Lead lists re-poll on this interval while the app is open, so new bookings,
// call-backs and enquiries appear without pulling to refresh. (Push
// notifications also trigger an instant refresh in installed builds.)
const LIVE_REFRESH_MS = 15_000

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  lookups: ['lookups'] as const,
  packages: ['packages'] as const,
  package: (id: number) => ['packages', id] as const,
  bookings: ['bookings'] as const,
  callbacks: ['callbacks'] as const,
  enquiries: (status?: EnquiryStatus) => ['enquiries', status ?? 'ALL'] as const,
  enquiry: (id: number) => ['enquiry', id] as const,
}

async function get<T>(url: string, params?: Record<string, unknown>) {
  try {
    const { data } = await api.get<T>(url, { params })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

async function send<T>(method: 'post' | 'put' | 'patch' | 'delete', url: string, body?: unknown) {
  try {
    const { data } = await api.request<T>({ method, url, data: body })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

// ---------- Dashboard & lookups ----------

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => get<DashboardStats>('/dashboard'),
    refetchInterval: LIVE_REFRESH_MS,
  })
}

export function useLookups() {
  return useQuery({
    queryKey: queryKeys.lookups,
    queryFn: () => get<Lookups>('/lookups'),
    staleTime: 10 * 60 * 1000,
  })
}

// ---------- Packages ----------

export function usePackages() {
  return useQuery({
    queryKey: queryKeys.packages,
    queryFn: async () => (await get<{ items: PackageSummary[] }>('/packages')).items,
  })
}

export function usePackage(id: number) {
  return useQuery({
    queryKey: queryKeys.package(id),
    queryFn: () => get<PackageDetail>(`/packages/${id}`),
    enabled: Number.isInteger(id) && id > 0,
  })
}

function useInvalidatePackages() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.packages }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    ])
}

export function useSavePackage(id?: number) {
  const invalidate = useInvalidatePackages()
  return useMutation({
    mutationFn: (input: PackageInput) =>
      id
        ? send<{ id: number }>('put', `/packages/${id}`, input)
        : send<{ id: number }>('post', '/packages', input),
    onSuccess: invalidate,
  })
}

export function useDeletePackage() {
  const invalidate = useInvalidatePackages()
  return useMutation({
    mutationFn: (id: number) => send<void>('delete', `/packages/${id}`),
    onSuccess: invalidate,
  })
}

// Optimistic: the switch flips instantly and rolls back if the server refuses.
export function useTogglePublished() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidatePackages()

  return useMutation({
    mutationFn: ({ id, published }: { id: number; published: boolean }) =>
      send('patch', `/packages/${id}`, { published }),
    onMutate: async ({ id, published }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.packages })
      const previous = queryClient.getQueryData<PackageSummary[]>(queryKeys.packages)
      queryClient.setQueryData<PackageSummary[]>(queryKeys.packages, (list) =>
        list?.map((pkg) => (pkg.id === id ? { ...pkg, published } : pkg)),
      )
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.packages, context.previous)
    },
    onSettled: invalidate,
  })
}

// "+ Add new" in the package editor. The server returns the existing entry
// if that name is already there, so duplicates are never created.
export function useAddDestination() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => send<{ id: number; name: string }>('post', '/destinations', { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.lookups }),
  })
}

export function useAddCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => send<{ id: number; title: string }>('post', '/categories', { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.lookups }),
  })
}

// ---------- Bookings & enquiries (cursor-paginated) ----------

// kind 'callback' = "Prefer a call back?" requests; 'booking' = Book Your Ride.
export function useBookings(kind: 'booking' | 'callback' = 'booking') {
  return useInfiniteQuery({
    queryKey: kind === 'callback' ? queryKeys.callbacks : queryKeys.bookings,
    queryFn: ({ pageParam }) =>
      get<Page<Booking>>('/bookings', { cursor: pageParam, limit: 20, kind }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    refetchInterval: LIVE_REFRESH_MS,
  })
}

export function useEnquiries(status?: EnquiryStatus) {
  return useInfiniteQuery({
    queryKey: queryKeys.enquiries(status),
    queryFn: ({ pageParam }) =>
      get<Page<EnquirySummary>>('/enquiries', { cursor: pageParam, limit: 20, status }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    refetchInterval: LIVE_REFRESH_MS,
  })
}

export function useEnquiry(id: number) {
  return useQuery({
    queryKey: queryKeys.enquiry(id),
    queryFn: () => get<EnquiryDetail>(`/enquiries/${id}`),
    enabled: Number.isInteger(id) && id > 0,
  })
}

export function useUpdateEnquiry(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { status?: EnquiryStatus; notes?: string | null }) =>
      send('patch', `/enquiries/${id}`, input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.enquiry(id) }),
        queryClient.invalidateQueries({ queryKey: ['enquiries'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]),
  })
}

// Called when an admin taps Call: records the call time (and NEW -> CONTACTED
// for enquiries) so everyone can see who has already been called.
export function useMarkContacted(kind: 'bookings' | 'enquiries') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => send('post', `/${kind}/${id}/contacted`),
    onSuccess: (_data, id) =>
      Promise.all([
        ...(kind === 'bookings'
          ? [
              queryClient.invalidateQueries({ queryKey: queryKeys.bookings }),
              queryClient.invalidateQueries({ queryKey: queryKeys.callbacks }),
            ]
          : [queryClient.invalidateQueries({ queryKey: ['enquiries'] })]),
        kind === 'enquiries' && queryClient.invalidateQueries({ queryKey: queryKeys.enquiry(id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]),
  })
}

export function flattenPages<T>(data: InfiniteData<Page<T>> | undefined) {
  return data?.pages.flatMap((page) => page.items) ?? []
}

// ---------- Profile ----------

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (name: string) => send<{ user: AdminUser }>('patch', '/auth/me', { name }),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) => send('post', '/auth/password', input),
  })
}

// ---------- Uploads ----------

// Sent with axios (React Native's XMLHttpRequest), not fetch: Expo replaces the
// global fetch with expo/fetch, which rejects React Native's { uri, name, type }
// file parts with "Unsupported FormDataPart implementation".
export async function uploadImage(file: { uri: string; name: string; type: string }) {
  const form = new FormData()
  form.append('file', file as unknown as Blob)

  try {
    const { data } = await api.post<{ url: string }>('/uploads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // Hand the FormData to XMLHttpRequest untouched; axios's default transform
      // would try to serialise it and break the multipart body.
      transformRequest: (body) => body,
      timeout: 60000,
    })
    return data.url
  } catch (error) {
    throw toApiError(error)
  }
}
