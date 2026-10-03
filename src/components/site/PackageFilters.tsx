import Link from 'next/link'
import React from 'react'

export type DestinationOption = { id: number; slug: string; name: string }
export type CategoryOption = { id: number; slug: string; title: string }

const DURATION_OPTIONS = [
  { value: 'short', label: 'Up to 2 Days' },
  { value: 'medium', label: '3–4 Days' },
  { value: 'long', label: '5+ Days' },
]

const selectClass =
  'w-full rounded-full border-[1.5px] border-border bg-paper px-4 py-2.5 text-[0.9rem] text-ink focus:border-gold-500 focus-visible:outline-none'

export const PackageFilters: React.FC<{
  destinations: DestinationOption[]
  categories: CategoryOption[]
  activeDestination?: string
  activeCategory?: string
  activeDuration?: string
}> = ({ destinations, categories, activeDestination, activeCategory, activeDuration }) => {
  const hasActiveFilters = Boolean(activeDestination || activeCategory || activeDuration)

  return (
    <form
      method="get"
      className="mb-10 flex flex-wrap items-end gap-3 rounded-[18px] border border-border bg-paper p-4"
    >
      <div className="min-w-[9.5rem] flex-1">
        <label htmlFor="destination" className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[.05em] text-navy-700">
          Destination
        </label>
        <select id="destination" name="destination" defaultValue={activeDestination || ''} className={selectClass}>
          <option value="">All Destinations</option>
          {destinations.map((d) => (
            <option key={d.id} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[9.5rem] flex-1">
        <label htmlFor="category" className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[.05em] text-navy-700">
          Category
        </label>
        <select id="category" name="category" defaultValue={activeCategory || ''} className={selectClass}>
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[9.5rem] flex-1">
        <label htmlFor="duration" className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[.05em] text-navy-700">
          Duration
        </label>
        <select id="duration" name="duration" defaultValue={activeDuration || ''} className={selectClass}>
          <option value="">Any Duration</option>
          {DURATION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="rounded-full bg-gold-500 px-6 py-2.5 text-[0.9rem] font-bold text-navy-950 transition-colors hover:bg-gold-300"
      >
        Apply Filters
      </button>

      {hasActiveFilters && (
        <Link href="/packages" className="text-[0.86rem] font-semibold text-muted-brand underline underline-offset-2">
          Clear filters
        </Link>
      )}
    </form>
  )
}
