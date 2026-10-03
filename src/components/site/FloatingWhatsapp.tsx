import React from 'react'

import type { SiteSettings } from '@/lib/getSiteSettings'
import { whatsappMessages } from '@/lib/whatsapp'
import { StickyWhatsAppButton } from '@/components/site/StickyWhatsAppButton'

// Desktop-persistent floating WhatsApp button (the mobile sticky bar covers small screens).
export const FloatingWhatsapp: React.FC<{ siteSettings: SiteSettings | null }> = ({
  siteSettings,
}) => {
  const whatsapp = siteSettings?.whatsapp || ''

  return (
    <StickyWhatsAppButton whatsappNumber={whatsapp} defaultMessage={whatsappMessages.general()} variant="fab" />
  )
}
