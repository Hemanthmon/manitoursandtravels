'use client'

import React from 'react'

import { WhatsAppIcon } from '@/components/site/WhatsAppIcon'
import { useStickyBar } from '@/providers/StickyBarProvider'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { cn } from '@/utilities/ui'

export const StickyWhatsAppButton: React.FC<{
  whatsappNumber: string
  defaultMessage: string
  variant: 'bar' | 'fab'
}> = ({ whatsappNumber, defaultMessage, variant }) => {
  const { whatsappMessage } = useStickyBar()
  const href = buildWhatsAppLink(whatsappNumber, whatsappMessage || defaultMessage)

  if (variant === 'fab') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-[26px] right-[26px] z-[900] hidden h-[60px] w-[60px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_14px_30px_-8px_rgba(37,211,102,0.6)] motion-safe:animate-[pulse-wa_2.6s_ease-in-out_infinite] md:flex"
      >
        <WhatsAppIcon className="h-[32px] w-[32px]" />
      </a>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-3 py-3 text-[0.88rem] font-bold text-white',
      )}
    >
      <WhatsAppIcon className="h-[18px] w-[18px]" /> WhatsApp
    </a>
  )
}
