'use client'

import Script from 'next/script'
import React, { useEffect, useId, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
        },
      ) => string
      reset: (widgetId?: string) => void
    }
  }
}

export const Turnstile: React.FC<{
  onVerify: (token: string) => void
  onExpire?: () => void
}> = ({ onVerify, onExpire }) => {
  const containerId = `turnstile-${useId().replace(/:/g, '')}`
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(
    typeof window !== 'undefined' && Boolean(window.turnstile),
  )

  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !window.turnstile || widgetId.current) return

    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      callback: onVerify,
      'expired-callback': onExpire,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptLoaded])

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div id={containerId} ref={containerRef} />
    </>
  )
}
