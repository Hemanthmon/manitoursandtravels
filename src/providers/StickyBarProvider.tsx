'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type StickyBarContextValue = {
  whatsappMessage: string | null
  setWhatsappMessage: (message: string | null) => void
}

const StickyBarContext = createContext<StickyBarContextValue | null>(null)

export const StickyBarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [whatsappMessage, setWhatsappMessage] = useState<string | null>(null)

  const value = useMemo(() => ({ whatsappMessage, setWhatsappMessage }), [whatsappMessage])

  return <StickyBarContext.Provider value={value}>{children}</StickyBarContext.Provider>
}

export function useStickyBar() {
  const ctx = useContext(StickyBarContext)
  if (!ctx) throw new Error('useStickyBar must be used within a StickyBarProvider')
  return ctx
}

/**
 * Render this once from a page/section to override the sticky WhatsApp message
 * for as long as that page is mounted (e.g. a package detail page pre-filling
 * "Hi, I'm interested in the {package} package"). Resets automatically on unmount.
 */
export const StickyBarWhatsappMessage: React.FC<{ message: string }> = ({ message }) => {
  const { setWhatsappMessage } = useStickyBar()

  useEffect(() => {
    setWhatsappMessage(message)
    return () => setWhatsappMessage(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message])

  return null
}
