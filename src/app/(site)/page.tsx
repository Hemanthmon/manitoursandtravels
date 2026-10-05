import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import {
  ArrowRight,
  Baby,
  Car,
  CheckCircle2,
  Clock,
  IndianRupee,
  Plane,
  MapPin,
  Mountain,
  Phone,
  Shield,
} from 'lucide-react'

import { BookingWidget } from '@/components/site/BookingWidget'
import { CountUp } from '@/components/site/CountUp'
import { CallbackForm } from '@/components/site/CallbackForm'
import { PackageCard, toPackageCardData } from '@/components/site/PackageCard'
import { FaqAccordion } from '@/components/site/FaqAccordion'
import { HeroSkyline } from '@/components/site/HeroSkyline'
import { Reveal } from '@/components/site/Reveal'
import { Tilt3D } from '@/components/site/Tilt3D'
import { HomeStatIcon } from '@/components/site/HomeStatIcon'
import { getCachedSiteSettings } from '@/lib/getSiteSettings'
import { homeStatNumber, resolveHomeStats } from '@/lib/homeStats'
import { prisma } from '@/lib/prisma'
import { buildTelLink, buildWhatsAppLink, whatsappMessages } from '@/lib/whatsapp'
import { cn } from '@/utilities/ui'
import { WhatsAppIcon } from '@/components/site/WhatsAppIcon'

export const metadata: Metadata = {
  title: 'Mani Tours and Travels — Your Trusted Family Travel Partner',
  description:
    'Airport pickup & drop, local city rides, safe school transport and tour packages to Coorg, Wayanad, Tirupati & Ooty. Verified drivers, GPS-tracked rides, 24×7.',
}

type ServiceCard = {
  icon: typeof Car
  tag: string
  title: string
  desc: string
  image: string
  imagePosition: string
  // Tile size in the bento grid (desktop).
  layout: string
  cta?: { label: string; message: string }
  href?: string
}

// Photos: Pexels (free for commercial use) + our school photo. Stored in public/images.
const services: ServiceCard[] = [
  {
    icon: Plane,
    tag: '24×7',
    title: 'Airport Pickup & Drop',
    layout: 'lg:col-span-2 lg:row-span-2',
    desc: 'Flight tracked in real time, meet-and-greet at arrivals, and a fare agreed before you travel — for any flight, any hour.',
    image: '/images/blr-airport-t2.webp',
    imagePosition: 'object-[center_40%]',
    cta: { label: 'Book this ride', message: whatsappMessages.service('an Airport Pickup/Drop') },
  },
  {
    icon: Car,
    tag: 'Everyday',
    title: 'Local City Rides',
    layout: 'lg:col-span-1',
    desc: 'Office commutes, hospital visits, shopping runs or a night out — dependable drivers who know the city’s roads and shortcuts.',
    image: '/images/blr-vidhana-soudha.webp',
    imagePosition: 'object-[center_45%]',
    cta: { label: 'Book this ride', message: whatsappMessages.service('a Local City Ride') },
  },
  {
    icon: Baby,
    tag: 'Monthly Plan',
    title: 'School Transport',
    layout: 'lg:col-span-1',
    desc: 'Police-verified drivers, an attendant on board, live trip sharing, and the same driver every day for your child’s routine.',
    image: '/images/school-students-uniform.webp',
    imagePosition: 'object-[center_30%]',
    href: '#school',
  },
  {
    icon: Mountain,
    tag: 'Door to Door',
    title: 'Tour Packages',
    layout: 'lg:col-span-2',
    desc: 'Planned weekend and holiday trips with a driver who doubles up as your local guide along the way.',
    image: '/images/service-tours.webp',
    imagePosition: 'object-center',
    href: '#packages',
  },
]

const schoolPhotos = [
  {
    src: '/images/school-students-city.webp',
    alt: 'Happy city school students in uniform with ties and ID cards',
    position: 'object-[center_40%]',
  },
  {
    src: '/images/school-students-uniform.webp',
    alt: 'Three smiling students in school uniform with ties',
    position: 'object-[center_30%]',
  },
  {
    src: '/images/school-kids-backpacks.webp',
    alt: 'Smiling boy and girl in school uniform with backpacks holding hands',
    position: 'object-[center_35%]',
  },
  {
    src: '/images/school-walk-city.webp',
    alt: 'Children with school bags holding hands while crossing a city street',
    position: 'object-[center_45%]',
  },
]

const whyUs = [
  {
    icon: Shield,
    title: 'Verified & Background-Checked Drivers',
    desc: 'Every driver is police-verified and trained before they take their first passenger.',
  },
  {
    icon: MapPin,
    title: 'GPS-Tracked Every Ride',
    desc: 'Live location on every trip — school runs, airport rides, or a tour package.',
  },
  {
    icon: Car,
    title: 'Sanitised, Well-Maintained Fleet',
    desc: 'Vehicles inspected and cleaned on a fixed schedule, not just when it’s convenient.',
  },
  {
    icon: IndianRupee,
    title: 'Transparent, No-Surprise Fares',
    desc: 'Your fare is confirmed on call or WhatsApp before the ride starts — no surge, ever.',
  },
  {
    icon: Clock,
    title: '24×7 Support, Every Day',
    desc: 'Early flight or a late-night emergency — someone always picks up.',
  },
  {
    icon: Baby,
    title: 'Child-Safety First',
    desc: 'Attendants, verified drivers and consistent routes built specifically for school transport.',
  },
]

const faqs = [
  {
    question: 'How much advance notice do you need for an airport pickup?',
    answer:
      'For most bookings, 2-3 hours’ notice is enough. For early morning flights or peak travel dates, we recommend booking the evening before so we can plan your driver in advance.',
  },
  {
    question: 'Do you provide attendants and child seats for school transport?',
    answer:
      'Yes — every school vehicle carries a trained attendant, and child seats/booster seats are available on request when you set up the monthly plan.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'Cash, UPI (GPay/PhonePe/Paytm) and cards are all accepted. School transport plans can be paid monthly in advance.',
  },
  {
    question: 'Can I customize a tour package?',
    answer:
      'Absolutely — tell us your dates, number of travellers and the places you want to cover, and we’ll put together a day-by-day plan and fare over a quick call.',
  },
  {
    question: 'Is there a cancellation charge?',
    answer:
      'Cancellations made well ahead of the trip are free. Last-minute cancellations closer to pickup time may attract a small charge, which we’ll always confirm with you upfront.',
  },
  {
    question: 'Do you operate outside the city?',
    answer:
      'Yes — beyond local city rides and airport transfers, we run outstation tour packages to Coorg, Wayanad, Tirupati and Ooty.',
  },
]

// Published packages for the home page, featured first. Shares the
// 'packages-listing' tag, so admin saves (web or app) refresh it immediately.
const getHomePackages = unstable_cache(
  async () =>
    prisma.package.findMany({
      where: { published: true },
      include: { destination: true, categories: true },
      orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
      take: 8,
    }),
  ['home-packages'],
  { revalidate: 300, tags: ['packages-listing'] },
)

export default async function HomePage() {
  const [siteSettings, homePackages] = await Promise.all([getCachedSiteSettings(), getHomePackages()])
  const packageCards = homePackages.map(toPackageCardData)
  const phone = siteSettings?.phone || ''
  const whatsapp = siteSettings?.whatsapp || ''
  // Proof numbers, edited from Website Stats in either admin. Empty ones are skipped.
  const proofStats = resolveHomeStats(siteSettings).filter((stat) => stat.value)

  return (
    <>
      {/* ============ HERO ============ */}
      <section id="enquiry-form" className="relative -mt-[73px] overflow-hidden bg-[radial-gradient(120%_140%_at_85%_-10%,var(--navy-700)_0%,var(--navy-900)_45%,var(--navy-950)_100%)] flex min-h-[100svh] items-center pb-10 pt-[112px] text-ivory lg:pb-12 [@media(max-height:720px)]:pb-5 [@media(max-height:720px)]:pt-[96px]">
        {/* Drawn panorama: hills + road, city skyline, airport with a plane taking off. */}
        <HeroSkyline className="pointer-events-none absolute inset-x-0 bottom-0 h-[clamp(220px,28vw,420px)] w-full motion-safe:animate-[hero-rise_1.2s_ease-out_both]" />
        <div className="relative z-[3] mx-auto grid w-full max-w-[73.75rem] gap-10 px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <h1 className="text-paper text-[clamp(2.1rem,1.4rem+3vw,3.4rem)] tracking-[-0.01em] [@media(max-height:720px)]:text-[clamp(2rem,1.3rem+2.6vw,2.9rem)] motion-safe:animate-[hero-rise_0.8s_cubic-bezier(.2,.7,.2,1)_both]">
              Every ride, planned like it&apos;s <em className="font-head italic text-gold-300">our own family</em> in the car.
            </h1>
            <p className="mt-5 max-w-[540px] text-[1.14rem] text-ivory/80 motion-safe:animate-[hero-rise_0.8s_cubic-bezier(.2,.7,.2,1)_both]" style={{ animationDelay: '120ms' }}>
              Airport transfers, daily city rides, safe school transport, and door-to-door tour
              packages — one call or WhatsApp message away, any hour of the day.
            </p>
            <div className="mt-8 flex flex-wrap gap-3.5 motion-safe:animate-[hero-rise_0.8s_cubic-bezier(.2,.7,.2,1)_both]" style={{ animationDelay: '240ms' }}>
              <a
                href={buildTelLink(phone)}
                className="inline-flex items-center justify-center gap-2.5 btn-shine rounded-full bg-gold-500 px-7 py-4 font-bold text-navy-950 shadow-[0_10px_26px_-8px_rgba(212,165,55,0.55)] transition-all hover:-translate-y-0.5 hover:bg-gold-300"
              >
                <Phone className="h-5 w-5" /> Call Now
              </a>
              <a
                href={buildWhatsAppLink(whatsapp, whatsappMessages.bookRide())}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 rounded-full border-[1.5px] border-white/50 px-7 py-4 font-bold text-paper transition-all hover:-translate-y-0.5 hover:bg-white/[0.12]"
              >
                <WhatsAppIcon className="h-5 w-5" /> WhatsApp Us
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                { icon: CheckCircle2, label: 'Verified Drivers' },
                { icon: MapPin, label: 'GPS-Tracked Rides' },
                { icon: Clock, label: '24×7 Availability' },
                { icon: Baby, label: 'Child-Safety Certified' },
                { icon: IndianRupee, label: 'No Surge Pricing' },
              ].map(({ icon: Icon, label }, index) => (
                <div
                  key={label}
                  className={cn(
                    'flex items-center gap-2 rounded-full border border-white/[0.14] bg-navy-950/60 px-3.5 py-2.5 text-[0.82rem] font-semibold text-ivory/90 backdrop-blur-[2px] transition-colors hover:border-gold-500/60 hover:bg-white/[0.1] motion-safe:animate-[hero-rise_0.8s_cubic-bezier(.2,.7,.2,1)_both]',
                    index > 2 && 'hidden sm:flex',
                  )}
                  style={{ animationDelay: `${380 + index * 70}ms` }}
                >
                  <Icon className="h-[15px] w-[15px] flex-shrink-0 text-gold-300" /> {label}
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative motion-safe:animate-[hero-slide-in_0.9s_cubic-bezier(.2,.7,.2,1)_both]"
            style={{ animationDelay: '200ms' }}
          >
            {/* Soft gold glow behind the booking card */}
            <div className="pointer-events-none absolute -inset-10 -z-0 rounded-full bg-[radial-gradient(closest-side,rgba(212,165,55,0.28),transparent)] blur-2xl motion-safe:animate-[glow-pulse_6s_ease-in-out_infinite]" />
            <Tilt3D className="relative z-[1] transform-3d">
              <BookingWidget />
            </Tilt3D>
          </div>
        </div>
      </section>

      {/* ============ SERVICES (bento) ============ */}
      <section id="services" className="py-16 md:py-[88px]">
        <div className="container">
          <Reveal className="mb-10 flex flex-col gap-5 md:mb-12 md:flex-row md:items-end md:justify-between">
            <div className="max-w-[38rem]">
              <div className="mb-3.5 inline-flex items-center gap-2 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-gold-600 before:block before:h-0.5 before:w-[22px] before:rounded-full before:bg-gold-500">
                What We Do
              </div>
              <h2 className="text-[clamp(1.7rem,1.2rem+2vw,2.6rem)] leading-[1.12]">
                Every kind of trip. <span className="italic text-gold-600">One number</span> to remember.
              </h2>
            </div>
            <p className="max-w-[26rem] text-[1rem] text-muted-brand">
              From a 5 AM flight to a school morning or a weekend in the hills, our fleet and drivers are
              built around getting your family there safely.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:auto-rows-[250px] lg:grid-cols-4">
            {services.map((svc, index) => {
              const big = index === 0
              const href = svc.cta ? buildWhatsAppLink(whatsapp, svc.cta.message) : svc.href
              return (
                <Reveal className={cn('min-h-[280px] lg:min-h-0', svc.layout)} delay={index * 90} key={svc.title} variant="scale">
                  <a
                    className="group relative isolate flex h-full flex-col justify-end overflow-hidden rounded-[24px] p-6 text-ivory shadow-[0_24px_48px_-28px_rgba(8,20,38,0.55)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_34px_60px_-28px_rgba(8,20,38,0.7)] md:p-7"
                    href={href}
                    {...(svc.cta ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
                  >
                    <Image
                      alt=""
                      className={cn('-z-20 object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110', svc.imagePosition)}
                      fill
                      sizes={big ? '(max-width: 1024px) 100vw, 50vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'}
                      src={svc.image}
                    />
                    <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(8,20,38,0.05)_0%,rgba(8,20,38,0.35)_45%,rgba(8,20,38,0.92)_100%)] transition-opacity duration-500 group-hover:opacity-95" />

                    <div className="absolute left-5 right-5 top-5 flex items-start justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/20 bg-white/15 text-gold-300 backdrop-blur-md transition-all duration-300 group-hover:rotate-[-8deg] group-hover:bg-gold-500 group-hover:text-navy-950">
                        <svc.icon className="h-[22px] w-[22px]" />
                      </span>
                      <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[.08em] text-ivory backdrop-blur-md">
                        {svc.tag}
                      </span>
                    </div>

                    <h3 className={cn('text-paper', big ? 'text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)]' : 'text-[1.3rem]')}>{svc.title}</h3>
                    <p
                      className={cn(
                        'mt-2 text-ivory/80',
                        big ? 'max-w-[30rem] text-[1rem]' : 'line-clamp-2 text-[0.9rem]',
                      )}
                    >
                      {svc.desc}
                    </p>
                    <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[0.85rem] font-bold text-ivory backdrop-blur-md transition-all duration-300 group-hover:bg-gold-500 group-hover:text-navy-950">
                      {svc.cta ? 'Book this ride' : svc.href === '#school' ? 'See how it works' : 'Explore packages'}
                      <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </span>
                  </a>
                </Reveal>
              )
            })}
          </div>

        </div>
      </section>

      {/* ============ TOURS ============ */}
      <section id="packages" className="bg-navy-950 py-16 text-ivory md:py-[88px]">
        <div className="container">
          <Reveal className="mx-auto mb-[52px] max-w-[40rem] text-center">
            <div className="mb-3.5 inline-flex items-center gap-2 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-gold-300 before:block before:h-0.5 before:w-[22px] before:rounded-full before:bg-gold-500">
              Tour Packages
            </div>
            <h2 className="text-paper text-[clamp(1.7rem,1.2rem+2vw,2.6rem)]">
              Get out of the city, without the stress of the drive.
            </h2>
            <p className="mt-3.5 text-[1.05rem] text-ivory/65">
              Every tour is a fixed door-to-door package — vehicle, driver and itinerary sorted
              before you leave home.
            </p>
          </Reveal>

          {packageCards.length > 0 ? (
            <div className="flex items-end gap-4">
              {/* Flex + fixed widths (not grid) so a short row stays centred. */}
              <div className="flex flex-1 flex-wrap justify-center gap-5">
                {packageCards.map((pkg, index) => (
                  <Reveal
                    className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]"
                    delay={index * 100}
                    key={pkg.id}
                    variant="scale"
                  >
                    <PackageCard pkg={pkg} />
                  </Reveal>
                ))}
              </div>
              {/* Small "more" arrow level with the last row (340px cards); phones use the button below. */}
              <Link
                aria-label="Show all packages"
                className="mb-[148px] hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-white/40 text-gold-300 transition-all hover:translate-x-1 hover:border-gold-300 hover:bg-white/[0.08] lg:flex"
                href="/packages"
                title="Show all packages"
              >
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          ) : (
            <p className="text-center text-ivory/65">
              New tour packages are coming soon. Call us to plan a custom trip.
            </p>
          )}

          <div className="mt-10 text-center">
            <Link
              href="/packages"
              className="inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-white/50 px-7 py-3.5 font-bold text-paper transition-all hover:-translate-y-0.5 hover:bg-white/[0.12]"
            >
              View all packages
            </Link>
          </div>
        </div>
      </section>

      {/* ============ WHY US ============ */}
      <section id="about" className="py-16 md:py-[88px]">
        <div className="container">
          <Reveal className="mx-auto mb-[52px] max-w-[40rem] text-center">
            <div className="mb-3.5 inline-flex items-center gap-2 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-gold-600 before:block before:h-0.5 before:w-[22px] before:rounded-full before:bg-gold-500">
              Why Families Choose Us
            </div>
            <h2 className="text-[clamp(1.7rem,1.2rem+2vw,2.6rem)]">
              Trust isn&apos;t a tagline here — it&apos;s the entire product.
            </h2>
            <p className="mt-3.5 text-[1.05rem] text-muted-brand">
              We built this company around the one question every parent and professional asks
              before getting into a car: is this ride actually safe?
            </p>
          </Reveal>
          {/* Proof numbers from Website Stats (web admin / app) */}
      <div className="mb-14 grid grid-cols-2 overflow-hidden rounded-[22px] border border-border bg-paper shadow-[0_30px_60px_-30px_rgba(8,20,38,0.35)] lg:grid-cols-4">
        {proofStats.map((stat, index) => (
          <Reveal className="h-full" delay={index * 90} key={index}>
            <div
              className={cn(
                'group flex h-full items-center gap-4 p-5 md:p-7',
                index % 2 === 1 && 'border-l border-border',
                index > 1 && 'border-t border-border lg:border-t-0',
                index === 2 && 'lg:border-l',
              )}
            >
              <span className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-[14px] bg-navy-900 text-gold-300 transition-all duration-300 group-hover:-rotate-6 group-hover:bg-gold-500 group-hover:text-navy-950 sm:flex">
                <HomeStatIcon className="h-6 w-6" icon={stat.icon} />
              </span>
              <span>
                <span className="block font-head text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-bold leading-none text-navy-900">
                  {homeStatNumber(stat.value) !== null ? <CountUp value={homeStatNumber(stat.value)!} /> : stat.value}
                  {stat.suffix ? <span className="text-gold-600">{stat.suffix}</span> : null}
                </span>
                <span className="mt-1.5 block text-[0.82rem] font-semibold text-muted-brand md:text-[0.88rem]">{stat.label}</span>
              </span>
            </div>
          </Reveal>
        ))}
      </div>
          <div className="grid grid-cols-1 gap-6.5 sm:grid-cols-2 lg:grid-cols-3">
            {whyUs.map((item, index) => (
              <Reveal delay={(index % 3) * 100} key={item.title}>
                <div className="group flex gap-4 rounded-2xl p-5.5 transition-all duration-300 hover:-translate-y-1 hover:bg-ivory-dim">
                  <div className="flex h-[50px] w-[50px] flex-shrink-0 items-center justify-center rounded-[13px] border-[1.5px] border-border bg-paper text-navy-800 transition-all duration-300 group-hover:-rotate-6 group-hover:border-navy-900 group-hover:bg-navy-900 group-hover:text-gold-300">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="mb-1.5 text-[1.05rem] text-navy-900">{item.title}</h4>
                    <p className="text-[0.9rem] text-muted-brand">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SCHOOL TRANSPORT SPOTLIGHT ============ */}
      <section id="school" className="border-y border-border bg-[linear-gradient(180deg,var(--emerald-100)_0%,var(--ivory)_100%)] py-16 md:py-[88px]">
        <div className="container">
          <div className="grid grid-cols-1 items-center gap-13 lg:grid-cols-2">
            <Reveal>
              <div className="mb-3.5 inline-flex items-center gap-2 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-gold-600 before:block before:h-0.5 before:w-[22px] before:rounded-full before:bg-gold-500">
                School Transport
              </div>
              <h2 className="text-[clamp(1.6rem,1.2rem+1.6vw,2.3rem)]">
                Built for the one ride you can&apos;t afford to get wrong.
              </h2>
              <ul className="mt-6.5 flex flex-col gap-4">
                {[
                  'Police-verified drivers, exclusively assigned for school routes',
                  'Trained attendant on board for pickup & drop',
                  'Live GPS trip-sharing link sent to parents',
                  'Same driver, same vehicle, same time — every single day',
                  'Simple monthly plans, no daily booking hassle',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3 text-[0.96rem]">
                    <span className="mt-0.5 flex h-6.5 w-6.5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                <a
                  href={buildWhatsAppLink(whatsapp, whatsappMessages.schoolTransport())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 rounded-full bg-navy-900 px-7 py-4 font-bold text-paper transition-all hover:-translate-y-0.5 hover:bg-navy-700"
                >
                  Enquire on WhatsApp
                </a>
              </div>
            </Reveal>
            <Reveal>
              <div className="group relative isolate flex min-h-[420px] flex-col justify-end overflow-hidden rounded-[22px] bg-navy-950 p-9 text-ivory shadow-[0_24px_50px_-24px_rgba(8,20,38,0.5)]">
                {/* Four city school photos rotating (Unsplash + Pexels, free for commercial use). */}
                {schoolPhotos.map((photo, index) => (
                  <Image
                    alt={photo.alt}
                    className={cn(
                      '-z-20 object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105',
                      photo.position,
                      // The first photo stays underneath; the rest fade in on top in turn.
                      index > 0 && 'opacity-0 motion-safe:animate-[slideshow4_24s_ease-in-out_infinite_both]',
                    )}
                    fill
                    key={photo.src}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    src={photo.src}
                    style={index > 0 ? { animationDelay: `${index * 6}s` } : undefined}
                  />
                ))}
                {/* Faces stay bright up top; the quote sits on a dark fade at the bottom. */}
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(8,20,38,0)_30%,rgba(8,20,38,0.55)_58%,rgba(8,20,38,0.94)_100%)]" />
                <blockquote className="relative z-[2] font-head text-[1.4rem] italic leading-[1.5] text-paper">
                  &quot;Your child&apos;s safety is not a feature to us — it&apos;s the whole
                  business.&quot;
                </blockquote>
                <div className="relative z-[2] mt-4.5 text-[0.86rem] font-bold text-gold-300">
                  — The Mani Tours and Travels Promise
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="py-16 md:py-[88px]">
        <div className="container">
          <Reveal className="mx-auto mb-[52px] max-w-[40rem] text-center">
            <div className="mb-3.5 inline-flex items-center gap-2 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-gold-600 before:block before:h-0.5 before:w-[22px] before:rounded-full before:bg-gold-500">
              How Booking Works
            </div>
            <h2 className="text-[clamp(1.7rem,1.2rem+2vw,2.6rem)]">Three steps. No app to download.</h2>
          </Reveal>
          <div className="relative grid grid-cols-1 gap-7.5 md:grid-cols-3">
            <div className="absolute left-[16.6667%] right-[16.6667%] top-8 hidden border-t-2 border-dashed border-border md:block" />
            {[
              { num: 1, title: 'Tell us your trip', desc: 'Call, WhatsApp, or use the booking form above with your pickup, date and service.' },
              { num: 2, title: 'We confirm instantly', desc: 'Driver, vehicle and fare confirmed on the same chat — usually in minutes.' },
              { num: 3, title: 'Track & arrive relaxed', desc: 'Follow your ride live on GPS and reach your flight, office or hill station on time.' },
            ].map((step, index) => (
              <Reveal delay={index * 150} key={step.num}>
                <div className="group relative px-3.5 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-navy-900 font-head text-[1.5rem] font-bold text-gold-300 shadow-[0_12px_26px_-10px_rgba(15,37,68,0.45)] transition-all duration-300 group-hover:scale-110 group-hover:bg-gold-500 group-hover:text-navy-950">
                    {step.num}
                  </div>
                  <h4 className="mb-2 text-[1.1rem]">{step.title}</h4>
                  <p className="mx-auto max-w-[16.25rem] text-[0.92rem] text-muted-brand">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      {/* ============ FAQ ============ */}
      <section id="faq" className="bg-ivory-dim py-16 md:py-[88px]">
        <div className="container">
          <Reveal className="mx-auto mb-[52px] max-w-[40rem] text-center">
            <div className="mb-3.5 inline-flex items-center gap-2 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-gold-600 before:block before:h-0.5 before:w-[22px] before:rounded-full before:bg-gold-500">
              Questions
            </div>
            <h2 className="text-[clamp(1.7rem,1.2rem+2vw,2.6rem)]">Frequently asked questions</h2>
          </Reveal>
          <Reveal>
            <FaqAccordion items={faqs} />
          </Reveal>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section id="contact" className="relative overflow-hidden bg-[linear-gradient(120deg,var(--navy-800),var(--navy-950))] py-16 text-ivory md:py-[88px]">
        <div className="container relative z-[2] grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal className="text-center lg:text-left" variant="left">
            <h2 className="text-paper text-[clamp(1.8rem,1.3rem+2vw,2.7rem)]">Ready when you are.</h2>
            <p className="mx-auto mb-8 mt-4 max-w-[32.5rem] lg:mx-0 text-[1.05rem] text-ivory/75">
              One call or message sets up your ride, your school route, or your next family trip.
            </p>
            <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
              <a
                href={buildTelLink(phone)}
                className="inline-flex items-center justify-center gap-2.5 btn-shine rounded-full bg-gold-500 px-7 py-4 font-bold text-navy-950 shadow-[0_10px_26px_-8px_rgba(212,165,55,0.55)] transition-all hover:-translate-y-0.5 hover:bg-gold-300"
              >
                <Phone className="h-5 w-5" /> Call Now
              </a>
              <a
                href={buildWhatsAppLink(whatsapp, whatsappMessages.bookRide())}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 rounded-full border-[1.5px] border-white/50 px-7 py-4 font-bold text-paper transition-all hover:-translate-y-0.5 hover:bg-white/[0.12]"
              >
                <WhatsAppIcon className="h-5 w-5" /> WhatsApp Us
              </a>
            </div>
            <div className="mt-6.5 font-head text-[1.6rem] font-bold tracking-[.02em] text-gold-300">
              {phone || 'Add phone in Site Settings'}
            </div>
          </Reveal>
          <Reveal delay={150} variant="right">
            <CallbackForm />
          </Reveal>
        </div>
      </section>
    </>
  )
}
