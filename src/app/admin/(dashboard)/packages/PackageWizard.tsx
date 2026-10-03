'use client'

import { Check, ChevronLeft, ChevronRight, Minus, Plus, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getCardGradient } from '@/lib/cardGradients'
import { formatDuration, formatPriceFrom } from '@/lib/format'
import { mealValues, priceUnitValues, slugify } from '@/lib/validations/package'
import { cn } from '@/utilities/ui'

import { addCategoryAction, addDestinationAction, savePackageAction } from './actions'
import { ImageUploadButton } from './ImageUploadButton'

// Step-by-step package editor. The mobile app's editor follows the same five
// steps and sends the same JSON, so both admins stay in sync.

type Meal = (typeof mealValues)[number]
type PriceUnit = (typeof priceUnitValues)[number]
type Option = { id: number; name: string }
type Day = { title: string; description: string; meals: Meal[]; overnightAt: string }

export type PackageEditorInitial = {
  title: string
  slug: string
  destinationId: number
  categoryIds: number[]
  imageUrl: string | null
  summary: string
  description: string | null
  durationDays: number
  durationNights: number
  priceFrom: number
  priceUnit: PriceUnit
  bestSeason: string | null
  highlights: string[]
  inclusions: string[]
  exclusions: string[]
  itinerary: { title: string; description: string | null; meals: Meal[]; overnightAt: string | null }[]
  featured: boolean
  published: boolean
  metaTitle: string | null
  metaDescription: string | null
}

type FormState = {
  title: string
  slug: string
  destinationId: number | null
  categoryIds: number[]
  imageUrl: string
  summary: string
  description: string
  durationDays: number
  durationNights: number
  priceFrom: string
  priceUnit: PriceUnit
  bestSeason: string
  highlights: string[]
  inclusions: string[]
  exclusions: string[]
  itinerary: Day[]
  featured: boolean
  published: boolean
  metaTitle: string
  metaDescription: string
}

const STEPS = [
  { title: 'Basics', hint: 'Name, place and photo' },
  { title: 'Trip & price', hint: 'Duration, price, summary' },
  { title: 'Itinerary', hint: 'Day-by-day plan' },
  { title: "What's included", hint: 'Highlights & inclusions' },
  { title: 'Review', hint: 'Check and publish' },
] as const

// Which step each server field lives on, to jump back to the first error.
const FIELD_STEP: Record<string, number> = {
  title: 0, destinationId: 0, categoryIds: 0, imageUrl: 0,
  durationDays: 1, durationNights: 1, priceFrom: 1, priceUnit: 1, bestSeason: 1, summary: 1, description: 1,
  itinerary: 2,
  highlights: 3, inclusions: 3, exclusions: 3,
  slug: 4, metaTitle: 4, metaDescription: 4, featured: 4, published: 4,
}

const PRICE_UNIT_LABEL: Record<PriceUnit, string> = {
  PER_PERSON: 'Per person',
  PER_GROUP: 'Per group',
  PER_VEHICLE: 'Per vehicle',
}
const MEAL_LABEL: Record<Meal, string> = { BREAKFAST: 'Breakfast', LUNCH: 'Lunch', DINNER: 'Dinner' }
const SEASON_SUGGESTIONS = ['All year', 'October – March', 'September – May', 'June – September (monsoon)']
const HIGHLIGHT_SUGGESTIONS = ['Door-to-door pickup & drop', 'Experienced local driver', 'Flexible stops on the way']
const INCLUSION_SUGGESTIONS = [
  'AC vehicle with driver',
  'Fuel & toll charges',
  'Driver allowance',
  'Parking charges',
  'Hotel stay',
  'Breakfast',
  'Sightseeing as per itinerary',
]
const EXCLUSION_SUGGESTIONS = [
  'Entry tickets & activities',
  'Meals not mentioned',
  'Personal expenses',
  'Guide charges',
  'Anything not listed in inclusions',
]

const emptyDay = (): Day => ({ title: '', description: '', meals: [], overnightAt: '' })

function fromInitial(pkg?: PackageEditorInitial): FormState {
  return {
    title: pkg?.title ?? '',
    slug: pkg?.slug ?? '',
    destinationId: pkg?.destinationId ?? null,
    categoryIds: pkg?.categoryIds ?? [],
    imageUrl: pkg?.imageUrl ?? '',
    summary: pkg?.summary ?? '',
    description: pkg?.description ?? '',
    durationDays: pkg?.durationDays ?? 2,
    durationNights: pkg?.durationNights ?? 1,
    priceFrom: pkg ? String(pkg.priceFrom) : '',
    priceUnit: pkg?.priceUnit ?? 'PER_PERSON',
    bestSeason: pkg?.bestSeason ?? '',
    highlights: pkg?.highlights ?? [],
    inclusions: pkg?.inclusions ?? [],
    exclusions: pkg?.exclusions ?? [],
    itinerary: (pkg?.itinerary ?? []).map((day) => ({
      title: day.title,
      description: day.description ?? '',
      meals: day.meals,
      overnightAt: day.overnightAt ?? '',
    })),
    featured: pkg?.featured ?? false,
    published: pkg?.published ?? false,
    metaTitle: pkg?.metaTitle ?? '',
    metaDescription: pkg?.metaDescription ?? '',
  }
}

// Blank days are dropped; a day with notes but no title becomes "Day N".
function cleanItinerary(days: Day[]) {
  return days
    .map((day, index) => ({ ...day, title: day.title.trim() || (day.description.trim() ? `Day ${index + 1}` : '') }))
    .filter((day) => day.title)
}

function stepErrors(step: number, form: FormState): Record<string, string> {
  const errors: Record<string, string> = {}
  if (step === 0) {
    if (!form.title.trim()) errors.title = 'Give the package a name'
    if (!form.destinationId) errors.destinationId = 'Choose a destination (or add a new one)'
  }
  if (step === 1) {
    if (form.durationDays < 1) errors.durationDays = 'At least 1 day'
    if (form.priceFrom.trim() === '' || Number.isNaN(Number(form.priceFrom))) errors.priceFrom = 'Enter the starting price'
    if (!form.summary.trim()) errors.summary = 'Add a one-line summary for the package card'
  }
  return errors
}

export function PackageWizard({
  packageId,
  initial,
  destinations: initialDestinations,
  categories: initialCategories,
}: {
  packageId?: number
  initial?: PackageEditorInitial
  destinations: Option[]
  categories: Option[]
}) {
  const router = useRouter()
  const isEdit = packageId !== undefined
  const [form, setForm] = useState<FormState>(() => fromInitial(initial))
  const [step, setStep] = useState(0)
  const [furthest, setFurthest] = useState(isEdit ? STEPS.length - 1 : 0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [destinations, setDestinations] = useState(initialDestinations)
  const [categories, setCategories] = useState(initialCategories)
  const [saving, startSaving] = useTransition()

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function goTo(target: number) {
    // Moving forward validates the steps in between; moving back never does.
    for (let s = step; s < target; s++) {
      const found = stepErrors(s, form)
      if (Object.keys(found).length) {
        setErrors(found)
        setStep(s)
        return
      }
    }
    // Pre-fill one card per day the first time the itinerary step opens.
    if (target === 2 && form.itinerary.length < form.durationDays) {
      set('itinerary', [
        ...form.itinerary,
        ...Array.from({ length: form.durationDays - form.itinerary.length }, emptyDay),
      ])
    }
    setErrors({})
    setStep(target)
    setFurthest((f) => Math.max(f, target))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function save(published: boolean) {
    setFormError(null)
    startSaving(async () => {
      const result = await savePackageAction(packageId, {
        title: form.title,
        slug: form.slug,
        destinationId: form.destinationId ?? 0,
        categoryIds: form.categoryIds,
        imageUrl: form.imageUrl,
        summary: form.summary,
        description: form.description,
        durationDays: form.durationDays,
        durationNights: form.durationNights,
        priceFrom: Number(form.priceFrom),
        priceUnit: form.priceUnit,
        bestSeason: form.bestSeason,
        highlights: form.highlights,
        inclusions: form.inclusions,
        exclusions: form.exclusions,
        itinerary: cleanItinerary(form.itinerary),
        featured: form.featured,
        published,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
      })
      if (result.ok) {
        router.push('/admin/packages')
        router.refresh()
        return
      }
      const fieldErrors = Object.fromEntries(
        Object.entries(result.errors).map(([key, messages]) => [key, messages?.[0] ?? 'Check this field']),
      )
      setErrors(fieldErrors)
      setFormError('Some details need fixing. We took you to the step with the problem.')
      const firstStep = Math.min(...Object.keys(fieldErrors).map((key) => FIELD_STEP[key] ?? 4))
      setStep(firstStep)
    })
  }

  const destinationName = destinations.find((d) => d.id === form.destinationId)?.name ?? null

  return (
    <div className="max-w-3xl">
      {/* Progress */}
      <ol className="mb-8 grid grid-cols-5 gap-2">
        {STEPS.map((s, index) => {
          const done = index < step
          const current = index === step
          const reachable = index <= furthest
          return (
            <li key={s.title}>
              <button
                className={cn(
                  'flex w-full flex-col items-start gap-2 rounded-xl border p-3 text-left transition',
                  current ? 'border-gold-500 bg-gold-500/10' : 'border-border bg-card',
                  reachable ? 'hover:border-gold-500' : 'cursor-not-allowed opacity-50',
                )}
                disabled={!reachable}
                onClick={() => goTo(index)}
                type="button"
              >
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                    done ? 'bg-emerald-600 text-white' : current ? 'bg-gold-500 text-navy-950' : 'bg-ivory-dim text-muted-brand',
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className="text-sm font-semibold text-navy-900">{s.title}</span>
                <span className="hidden text-xs text-muted-brand md:block">{s.hint}</span>
              </button>
            </li>
          )
        })}
      </ol>

      {formError && (
        <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {formError}
        </p>
      )}

      <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <h2 className="font-head text-xl font-bold text-navy-900">
          Step {step + 1}: {STEPS[step].title}
        </h2>
        <p className="mb-6 mt-1 text-sm text-muted-brand">{STEPS[step].hint}</p>

        {step === 0 && (
          <div className="space-y-6">
            <Field error={errors.title} label="Package name">
              <Input
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Coorg Weekend Getaway"
                value={form.title}
              />
            </Field>

            <Field error={errors.destinationId} label="Destination" hint="Where does this trip go?">
              <ChipPicker
                addLabel="Add new destination"
                onAdd={async (name) => {
                  const result = await addDestinationAction({ name })
                  if (!result.ok) return result.error
                  setDestinations((list) =>
                    list.some((d) => d.id === result.item.id)
                      ? list
                      : [...list, result.item].sort((a, b) => a.name.localeCompare(b.name)),
                  )
                  set('destinationId', result.item.id)
                  return null
                }}
                onToggle={(id) => set('destinationId', id)}
                options={destinations}
                selected={form.destinationId ? [form.destinationId] : []}
              />
            </Field>

            <Field error={errors.categoryIds} label="Categories" hint="Optional. Pick all that fit.">
              <ChipPicker
                addLabel="Add new category"
                onAdd={async (name) => {
                  const result = await addCategoryAction({ name })
                  if (!result.ok) return result.error
                  setCategories((list) =>
                    list.some((c) => c.id === result.item.id)
                      ? list
                      : [...list, result.item].sort((a, b) => a.name.localeCompare(b.name)),
                  )
                  if (!form.categoryIds.includes(result.item.id)) set('categoryIds', [...form.categoryIds, result.item.id])
                  return null
                }}
                onToggle={(id) =>
                  set(
                    'categoryIds',
                    form.categoryIds.includes(id) ? form.categoryIds.filter((c) => c !== id) : [...form.categoryIds, id],
                  )
                }
                options={categories}
                selected={form.categoryIds}
              />
            </Field>

            <Field error={errors.imageUrl} label="Cover photo" hint="Shown on the package card and at the top of the page.">
              <div className="flex flex-wrap items-center gap-4">
                {form.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="h-28 w-48 rounded-xl object-cover" src={form.imageUrl} />
                ) : (
                  <div className="flex h-28 w-48 items-center justify-center rounded-xl border border-dashed border-border bg-ivory-dim text-xs text-muted-brand">
                    No photo yet
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <ImageUploadButton onUploaded={(url) => set('imageUrl', url)} />
                  {form.imageUrl && (
                    <button className="text-left text-sm text-destructive hover:underline" onClick={() => set('imageUrl', '')} type="button">
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field error={errors.durationDays} label="Days">
                <NumberStepper min={1} onChange={(v) => set('durationDays', v)} value={form.durationDays} />
              </Field>
              <Field error={errors.durationNights} label="Nights">
                <NumberStepper min={0} onChange={(v) => set('durationNights', v)} value={form.durationNights} />
              </Field>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field error={errors.priceFrom} label="Starting price (₹)">
                <Input
                  inputMode="numeric"
                  onChange={(e) => set('priceFrom', e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="e.g. 3999"
                  value={form.priceFrom}
                />
              </Field>
              <Field error={errors.priceUnit} label="Price is">
                <div className="flex flex-wrap gap-2">
                  {priceUnitValues.map((unit) => (
                    <Chip key={unit} label={PRICE_UNIT_LABEL[unit]} onClick={() => set('priceUnit', unit)} selected={form.priceUnit === unit} />
                  ))}
                </div>
              </Field>
            </div>

            <Field error={errors.bestSeason} label="Best season" hint="Optional">
              <Input onChange={(e) => set('bestSeason', e.target.value)} placeholder="e.g. October – March" value={form.bestSeason} />
              <div className="mt-2 flex flex-wrap gap-2">
                {SEASON_SUGGESTIONS.map((season) => (
                  <Chip key={season} label={season} onClick={() => set('bestSeason', season)} selected={form.bestSeason === season} small />
                ))}
              </div>
            </Field>

            <Field error={errors.summary} label="Short summary" hint="One or two lines shown on the package card.">
              <Textarea
                maxLength={500}
                onChange={(e) => set('summary', e.target.value)}
                placeholder="e.g. Misty coffee estates, waterfalls and a slower pace: the classic family getaway."
                rows={2}
                value={form.summary}
              />
            </Field>

            <Field error={errors.description} label="Full description" hint="Optional. Shown on the package page.">
              <Textarea onChange={(e) => set('description', e.target.value)} rows={5} value={form.description} />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {errors.itinerary && <p className="text-sm text-destructive">{errors.itinerary}</p>}
            <p className="text-sm text-muted-brand">
              One card per day. Leave a day blank to skip it. You can skip this step entirely.
            </p>
            {form.itinerary.map((day, index) => (
              <DayCard
                day={day}
                index={index}
                key={index}
                onChange={(next) => set('itinerary', form.itinerary.map((d, i) => (i === index ? next : d)))}
                onRemove={() => set('itinerary', form.itinerary.filter((_, i) => i !== index))}
              />
            ))}
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-4 text-sm font-semibold text-navy-700 transition hover:border-gold-500 hover:text-gold-600"
              onClick={() => set('itinerary', [...form.itinerary, emptyDay()])}
              type="button"
            >
              <Plus className="h-4 w-4" /> Add day {form.itinerary.length + 1}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <ListEditor
              error={errors.highlights}
              hint="What makes this trip special?"
              items={form.highlights}
              label="Highlights"
              onChange={(items) => set('highlights', items)}
              placeholder="e.g. Sunrise at Raja's Seat"
              suggestions={HIGHLIGHT_SUGGESTIONS}
              tone="gold"
            />
            <ListEditor
              error={errors.inclusions}
              hint="What's covered in the price?"
              items={form.inclusions}
              label="Included"
              onChange={(items) => set('inclusions', items)}
              placeholder="e.g. AC vehicle with driver"
              suggestions={INCLUSION_SUGGESTIONS}
              tone="green"
            />
            <ListEditor
              error={errors.exclusions}
              hint="What will the customer pay for separately?"
              items={form.exclusions}
              label="Not included"
              onChange={(items) => set('exclusions', items)}
              placeholder="e.g. Entry tickets"
              suggestions={EXCLUSION_SUGGESTIONS}
              tone="muted"
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-[260px_1fr]">
              <PreviewCard
                destination={destinationName}
                form={form}
              />
              <dl className="grid content-start gap-3 text-sm">
                <ReviewRow label="Destination" value={destinationName ?? '—'} />
                <ReviewRow
                  label="Categories"
                  value={categories.filter((c) => form.categoryIds.includes(c.id)).map((c) => c.name).join(', ') || '—'}
                />
                <ReviewRow label="Duration" value={formatDuration(form.durationDays, form.durationNights) || '—'} />
                <ReviewRow label="Price" value={formatPriceFrom(Number(form.priceFrom) || 0, form.priceUnit.toLowerCase().replace('_', '-')) || '—'} />
                <ReviewRow label="Itinerary" value={`${cleanItinerary(form.itinerary).length} day(s) planned`} />
                <ReviewRow
                  label="Lists"
                  value={`${form.highlights.length} highlights · ${form.inclusions.length} included · ${form.exclusions.length} not included`}
                />
              </dl>
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border p-4">
              <span>
                <span className="block font-semibold text-navy-900">Feature on the home page</span>
                <span className="text-sm text-muted-brand">Featured packages are shown first.</span>
              </span>
              <input checked={form.featured} className="h-5 w-5 accent-[var(--gold-500)]" onChange={(e) => set('featured', e.target.checked)} type="checkbox" />
            </label>

            <details className="rounded-xl border border-border p-4" open={Boolean(errors.slug || errors.metaTitle || errors.metaDescription)}>
              <summary className="cursor-pointer font-semibold text-navy-900">Advanced (optional): web address & Google text</summary>
              <div className="mt-4 space-y-4">
                <Field error={errors.slug} hint="Leave empty to create it from the package name." label="Web address">
                  <div className="flex items-center gap-2 text-sm text-muted-brand">
                    <span className="shrink-0">/packages/</span>
                    <Input
                      onChange={(e) => set('slug', slugify(e.target.value))}
                      placeholder={slugify(form.title) || 'coorg-weekend-getaway'}
                      value={form.slug}
                    />
                  </div>
                </Field>
                <Field error={errors.metaTitle} hint="Leave empty to use the package name." label="Google title">
                  <Input onChange={(e) => set('metaTitle', e.target.value)} value={form.metaTitle} />
                </Field>
                <Field error={errors.metaDescription} hint="Leave empty to use the summary." label="Google description">
                  <Textarea onChange={(e) => set('metaDescription', e.target.value)} rows={2} value={form.metaDescription} />
                </Field>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-navy-700 transition hover:bg-ivory-dim disabled:invisible"
          disabled={step === 0}
          onClick={() => goTo(step - 1)}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex flex-wrap gap-3">
          {(isEdit || step === STEPS.length - 1) && (
            <button
              className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-navy-900 transition hover:border-navy-700 disabled:opacity-60"
              disabled={saving}
              onClick={() => {
                const blocking = [0, 1].map((s) => stepErrors(s, form)).find((e) => Object.keys(e).length)
                if (blocking) {
                  setErrors(blocking)
                  setStep(FIELD_STEP[Object.keys(blocking)[0]!] ?? 0)
                  return
                }
                save(false)
              }}
              type="button"
            >
              {saving ? 'Saving…' : isEdit && form.published ? 'Save & unpublish' : 'Save as draft'}
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-ivory transition hover:bg-navy-700"
              onClick={() => goTo(step + 1)}
              type="button"
            >
              Next: {STEPS[step + 1]!.title} <ChevronRight className="h-4 w-4" />
            </button>
          ) : null}
          {(isEdit || step === STEPS.length - 1) && (
            <button
              className="rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
              disabled={saving}
              onClick={() => {
                const blocking = [0, 1].map((s) => stepErrors(s, form)).find((e) => Object.keys(e).length)
                if (blocking) {
                  setErrors(blocking)
                  setStep(FIELD_STEP[Object.keys(blocking)[0]!] ?? 0)
                  return
                }
                save(true)
              }}
              type="button"
            >
              {saving ? 'Saving…' : isEdit && form.published ? 'Save changes' : 'Publish'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------- Small building blocks ----------

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-navy-900">{label}</p>
      {hint && <p className="mb-2 text-xs text-muted-brand">{hint}</p>}
      {children}
      {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
    </div>
  )
}

function Chip({
  label,
  selected,
  onClick,
  small,
}: {
  label: string
  selected: boolean
  onClick: () => void
  small?: boolean
}) {
  return (
    <button
      aria-pressed={selected}
      className={cn(
        'rounded-full border font-medium transition',
        small ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm',
        selected
          ? 'border-navy-900 bg-navy-900 text-ivory'
          : 'border-border bg-card text-navy-800 hover:border-navy-700',
      )}
      onClick={onClick}
      type="button"
    >
      {selected && !small && <Check className="-ml-1 mr-1 inline h-3.5 w-3.5" />}
      {label}
    </button>
  )
}

// Pick from existing options, or type a new one which is created right away.
function ChipPicker({
  options,
  selected,
  onToggle,
  onAdd,
  addLabel,
}: {
  options: Option[]
  selected: number[]
  onToggle: (id: number) => void
  onAdd: (name: string) => Promise<string | null>
  addLabel: string
}) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const submit = () =>
    startTransition(async () => {
      const trimmed = name.trim()
      if (trimmed.length < 2) return setError('Type at least 2 letters')
      const failure = await onAdd(trimmed)
      if (failure) return setError(failure)
      setName('')
      setError(null)
      setAdding(false)
    })

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip key={option.id} label={option.name} onClick={() => onToggle(option.id)} selected={selected.includes(option.id)} />
        ))}
        {!adding && (
          <button
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-gold-500 px-4 py-2 text-sm font-semibold text-gold-600 transition hover:bg-gold-500/10"
            onClick={() => setAdding(true)}
            type="button"
          >
            <Plus className="h-3.5 w-3.5" /> {addLabel}
          </button>
        )}
      </div>
      {adding && (
        <div className="mt-3 flex max-w-md items-center gap-2">
          <Input
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submit()
              }
              if (e.key === 'Escape') setAdding(false)
            }}
            placeholder="Type a name, e.g. Mysore"
            value={name}
          />
          <button
            className="shrink-0 rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-ivory disabled:opacity-60"
            disabled={pending}
            onClick={submit}
            type="button"
          >
            {pending ? 'Adding…' : 'Add'}
          </button>
          <button aria-label="Cancel" className="shrink-0 p-2 text-muted-brand" onClick={() => setAdding(false)} type="button">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
    </div>
  )
}

function NumberStepper({ value, onChange, min }: { value: number; onChange: (v: number) => void; min: number }) {
  return (
    <div className="inline-flex items-center rounded-xl border border-border bg-card">
      <button
        aria-label="Decrease"
        className="p-3 text-navy-800 disabled:opacity-30"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        type="button"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-12 text-center text-lg font-bold text-navy-900">{value}</span>
      <button aria-label="Increase" className="p-3 text-navy-800" onClick={() => onChange(Math.min(60, value + 1))} type="button">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

function DayCard({
  day,
  index,
  onChange,
  onRemove,
}: {
  day: Day
  index: number
  onChange: (day: Day) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-xl border border-border bg-ivory/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-navy-900 px-3 py-1 text-xs font-bold text-gold-300">Day {index + 1}</span>
        <button aria-label={`Remove day ${index + 1}`} className="p-1 text-muted-brand hover:text-destructive" onClick={onRemove} type="button">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3">
        <Input
          onChange={(e) => onChange({ ...day, title: e.target.value })}
          placeholder={index === 0 ? 'e.g. Bengaluru → Coorg, check-in & Abbey Falls' : 'Title for this day'}
          value={day.title}
        />
        <Textarea
          onChange={(e) => onChange({ ...day, description: e.target.value })}
          placeholder="What happens this day? (optional)"
          rows={2}
          value={day.description}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-brand">Meals:</span>
          {mealValues.map((meal) => (
            <Chip
              key={meal}
              label={MEAL_LABEL[meal]}
              onClick={() =>
                onChange({
                  ...day,
                  meals: day.meals.includes(meal) ? day.meals.filter((m) => m !== meal) : [...day.meals, meal],
                })
              }
              selected={day.meals.includes(meal)}
              small
            />
          ))}
        </div>
        <Input
          onChange={(e) => onChange({ ...day, overnightAt: e.target.value })}
          placeholder="Overnight stay (optional), e.g. Madikeri"
          value={day.overnightAt}
        />
      </div>
    </div>
  )
}

function ListEditor({
  label,
  hint,
  items,
  onChange,
  placeholder,
  suggestions,
  tone,
  error,
}: {
  label: string
  hint: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
  suggestions: string[]
  tone: 'gold' | 'green' | 'muted'
  error?: string
}) {
  const [draft, setDraft] = useState('')
  const add = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed || items.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return
    onChange([...items, trimmed])
  }
  const unused = suggestions.filter((s) => !items.some((item) => item.toLowerCase() === s.toLowerCase()))
  const itemTone = {
    gold: 'border-gold-500/40 bg-gold-500/10',
    green: 'border-emerald-200 bg-emerald-50',
    muted: 'border-border bg-ivory-dim',
  }[tone]

  return (
    <Field error={error} hint={hint} label={label}>
      {items.length > 0 && (
        <ul className="mb-3 space-y-2">
          {items.map((item, index) => (
            <li className={cn('flex items-center justify-between gap-3 rounded-full border px-4 py-2 text-sm', itemTone)} key={item}>
              <span className="text-navy-900">{item}</span>
              <button
                aria-label={`Remove ${item}`}
                className="text-muted-brand hover:text-destructive"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add(draft)
              setDraft('')
            }
          }}
          placeholder={placeholder}
          value={draft}
        />
        <button
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-navy-900 px-4 text-sm font-semibold text-ivory"
          onClick={() => {
            add(draft)
            setDraft('')
          }}
          type="button"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      {unused.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-brand">Quick add:</span>
          {unused.map((suggestion) => (
            <button
              className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-navy-700 transition hover:border-gold-500 hover:text-gold-600"
              key={suggestion}
              onClick={() => add(suggestion)}
              type="button"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      )}
    </Field>
  )
}

function PreviewCard({ form, destination }: { form: FormState; destination: string | null }) {
  return (
    <div
      className="relative isolate flex h-[300px] flex-col justify-end overflow-hidden rounded-[20px] p-5 text-ivory"
      style={form.imageUrl ? undefined : { background: getCardGradient(destination || form.title || 'x') }}
    >
      {form.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" src={form.imageUrl} />
      )}
      <div className="absolute inset-0 -z-[5] bg-[linear-gradient(180deg,rgba(8,20,38,0)_30%,rgba(8,20,38,0.92)_100%)]" />
      <p className="font-head text-lg font-bold">{form.title || 'Package name'}</p>
      <p className="text-xs text-ivory/75">
        {[destination, formatDuration(form.durationDays, form.durationNights)].filter(Boolean).join(' · ')}
      </p>
      <p className="mt-1 text-sm font-bold text-gold-300">
        {formatPriceFrom(Number(form.priceFrom) || 0, form.priceUnit.toLowerCase().replace('_', '-'))}
      </p>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 border-b border-border pb-2 last:border-0">
      <dt className="w-24 shrink-0 text-muted-brand">{label}</dt>
      <dd className="font-medium text-navy-900">{value}</dd>
    </div>
  )
}
