import { useQueryClient } from '@tanstack/react-query'
import * as SecureStore from 'expo-secure-store'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { api, setAuthToken, setUnauthorizedHandler, toApiError } from '@/api/client'
import type { AdminUser, LoginResponse } from '@/api/types'
import { unregisterPushNotifications } from '@/lib/notifications'

const TOKEN_KEY = 'mani-admin-token'
const USER_KEY = 'mani-admin-user'

type AuthState = {
  user: AdminUser | null
  isRestoring: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  // After the profile screen changes the name.
  updateUser: (user: AdminUser) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isRestoring, setIsRestoring] = useState(true)

  const signOut = useCallback(async () => {
    // Stop lead alerts to this phone (needs the token, so before clearing it).
    await unregisterPushNotifications()
    setAuthToken(null)
    setUser(null)
    queryClient.clear()
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ])
  }, [queryClient])

  // Restore a saved session on launch. The cached user lets the app open
  // offline; /auth/me then confirms the token is still valid.
  useEffect(() => {
    let cancelled = false

    async function restore() {
      try {
        const [token, cachedUser] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ])
        if (!token || cancelled) return

        setAuthToken(token)
        if (cachedUser) setUser(JSON.parse(cachedUser) as AdminUser)

        const { data } = await api.get<{ user: AdminUser }>('/auth/me')
        if (!cancelled) setUser(data.user)
      } catch (error) {
        // 401 is handled by the unauthorized handler; network errors keep the cached user.
        console.warn('Session restore:', toApiError(error).message)
      } finally {
        if (!cancelled) setIsRestoring(false)
      }
    }

    restore()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => void signOut())
    return () => setUnauthorizedHandler(null)
  }, [signOut])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', {
        email: email.trim(),
        password,
      })
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, data.token),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user)),
      ])
      setAuthToken(data.token)
      setUser(data.user)
    } catch (error) {
      throw toApiError(error)
    }
  }, [])

  const updateUser = useCallback((next: AdminUser) => {
    setUser(next)
    void SecureStore.setItemAsync(USER_KEY, JSON.stringify(next))
  }, [])

  const value = useMemo(
    () => ({ user, isRestoring, signIn, signOut, updateUser }),
    [user, isRestoring, signIn, signOut, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.')
  return context
}
