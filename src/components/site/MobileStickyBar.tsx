import React from 'react'
import { Phone, Send } from 'lucide-react'

import type { SiteSettings } from '@/lib/getSiteSettings'
import { buildTelLink, whatsappMessages } from '@/lib/whatsapp'
import { StickyWhatsAppButton } from '@/components/site/StickyWhatsAppButton'

// Sticky mobile bottom bar — present on every page: Call / WhatsApp / Enquire.
export const MobileStickyBar: React.FC<{ siteSettings: SiteSettings | null }> = ({
  siteSettings,
}) => {
  const phone = siteSettings?.phone || ''
  const whatsapp = siteSettings?.whatsapp || ''

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[895] flex gap-2.5 border-t border-border bg-paper px-3.5 pt-2.5 shadow-[0_-8px_24px_rgba(8,20,38,0.12)] md:hidden"
      style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}
    >
      <a
        href={buildTelLink(phone)}
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-navy-900 px-3 py-3 text-[0.88rem] font-bold text-paper"
      >
        <Phone className="h-4 w-4" /> Call
      </a>
      <StickyWhatsAppButton whatsappNumber={whatsapp} defaultMessage={whatsappMessages.bookRide()} variant="bar" />
      <a
        href="#enquiry-form"
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 px-3 py-3 text-[0.88rem] font-bold text-paper"
      >
        <Send className="h-4 w-4" /> Enquire
      </a>
    </div>
  )
}
