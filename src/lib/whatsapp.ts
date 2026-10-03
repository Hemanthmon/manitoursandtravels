/**
 * Builds a wa.me deep link with a pre-filled, context-aware message.
 * `whatsappNumber` must be digits only (no `+`), e.g. "919999999999".
 */
export function buildWhatsAppLink(whatsappNumber: string, message: string): string {
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${whatsappNumber}?text=${encoded}`
}

export function buildTelLink(phone: string): string {
  return `tel:${phone}`
}

export const whatsappMessages = {
  general: () => 'Hi Mani Tours and Travels, I would like to know more about your services.',
  bookRide: () => 'Hi Mani Tours and Travels, I would like to book a ride.',
  service: (serviceName: string) => `Hi, I would like to book ${serviceName}.`,
  package: (packageTitle: string) => `Hi, I would like to plan the ${packageTitle} tour.`,
  packageInterest: (packageTitle: string) => `Hi, I'm interested in the ${packageTitle} package.`,
  schoolTransport: () => 'Hi, I would like to enquire about monthly School Transport.',
}
