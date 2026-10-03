import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useEffect, useRef, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { FieldErrors } from '@/api/client'
import { useAddCategory, useAddDestination, useLookups } from '@/api/hooks'
import type { Meal, PackageDetail, PackageInput, PriceUnit } from '@/api/types'
import { formatDuration, formatPrice, priceUnitLabels, slugify } from '@/lib/format'
import { colors, font, radius, spacing } from '@/lib/theme'

import { ImageUploadField } from './ImageUploadField'
import { Button, Card, Chip, ErrorView, Field, FieldLabel, LoadingView } from './ui'

// Step-by-step package editor. Same five steps and same JSON as the web
// admin's editor (src/app/admin/(dashboard)/packages/PackageWizard.tsx).

type Day = { title: string; description: string; meals: Meal[]; overnightAt: string }

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

const STEPS = ['Basics', 'Trip & price', 'Itinerary', "What's included", 'Review'] as const

const FIELD_STEP: Record<string, number> = {
  title: 0, destinationId: 0, categoryIds: 0, imageUrl: 0,
  durationDays: 1, durationNights: 1, priceFrom: 1, priceUnit: 1, bestSeason: 1, summary: 1, description: 1,
  itinerary: 2,
  highlights: 3, inclusions: 3, exclusions: 3,
  slug: 4, metaTitle: 4, metaDescription: 4, featured: 4, published: 4,
}

const MEALS: Meal[] = ['BREAKFAST', 'LUNCH', 'DINNER']
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

function fromPackage(pkg?: PackageDetail): FormState {
  return {
    title: pkg?.title ?? '',
    slug: pkg?.slug ?? '',
    destinationId: pkg?.destinationId ?? null,
    categoryIds: pkg?.categories.map((category) => category.id) ?? [],
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
    itinerary: (pkg?.itineraryDays ?? []).map((day) => ({
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
    if (form.priceFrom.trim() === '') errors.priceFrom = 'Enter the starting price'
    if (!form.summary.trim()) errors.summary = 'Add a one-line summary for the package card'
  }
  return errors
}

function toInput(form: FormState, published: boolean): PackageInput {
  return {
    slug: form.slug,
    title: form.title,
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
  }
}

export function PackageForm({
  initial,
  onSubmit,
  submitting,
  serverErrors,
  formError,
  footer,
}: {
  initial?: PackageDetail
  onSubmit: (input: PackageInput) => void
  submitting: boolean
  serverErrors?: FieldErrors
  formError?: string
  footer?: React.ReactNode
}) {
  const insets = useSafeAreaInsets()
  const lookups = useLookups()
  const addDestination = useAddDestination()
  const addCategory = useAddCategory()
  const scrollRef = useRef<ScrollView>(null)
  const isEdit = Boolean(initial)

  const [form, setForm] = useState<FormState>(() => fromPackage(initial))
  const [step, setStep] = useState(0)
  const [furthest, setFurthest] = useState(isEdit ? STEPS.length - 1 : 0)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Server-side validation errors: show them and jump to the step that has one.
  useEffect(() => {
    if (!serverErrors) return
    const mapped = Object.fromEntries(
      Object.entries(serverErrors).map(([key, messages]) => [key, messages?.[0] ?? 'Check this field']),
    )
    if (!Object.keys(mapped).length) return
    setErrors(mapped)
    setStep(Math.min(...Object.keys(mapped).map((key) => FIELD_STEP[key] ?? 4)))
  }, [serverErrors])

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
    scrollRef.current?.scrollTo({ y: 0, animated: false })
  }

  function save(published: boolean) {
    const blocking = [0, 1].map((s) => stepErrors(s, form)).find((e) => Object.keys(e).length)
    if (blocking) {
      setErrors(blocking)
      setStep(FIELD_STEP[Object.keys(blocking)[0]!] ?? 0)
      return
    }
    onSubmit(toInput(form, published))
  }

  if (lookups.isLoading) return <LoadingView />
  if (lookups.error || !lookups.data) {
    return <ErrorView message={lookups.error?.message ?? 'Could not load form data.'} onRetry={lookups.refetch} />
  }
  const { destinations, categories, priceUnits } = lookups.data
  const destinationName = destinations.find((d) => d.id === form.destinationId)?.name ?? null
  const isLast = step === STEPS.length - 1

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      {/* Progress: tap a reached step to jump to it */}
      <View style={styles.progress}>
        <View style={styles.progressBars}>
          {STEPS.map((label, index) => (
            <Pressable
              accessibilityLabel={`Step ${index + 1}: ${label}`}
              disabled={index > furthest}
              hitSlop={8}
              key={label}
              onPress={() => goTo(index)}
              style={[
                styles.progressBar,
                index < step && { backgroundColor: colors.success },
                index === step && { backgroundColor: colors.gold500 },
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressText}>
          Step {step + 1} of {STEPS.length} · <Text style={{ color: colors.text }}>{STEPS[step]}</Text>
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" ref={scrollRef}>
        {formError ? (
          <View style={styles.formError}>
            <Text style={{ color: colors.danger }}>{formError}</Text>
          </View>
        ) : null}

        {step === 0 && (
          <Card style={styles.section}>
            <Field
              error={errors.title}
              label="Package name"
              onChangeText={(v) => set('title', v)}
              placeholder="e.g. Coorg Weekend Getaway"
              value={form.title}
            />
            <ChipPicker
              addLabel="Add destination"
              adding={addDestination.isPending}
              error={errors.destinationId}
              hint="Where does this trip go?"
              label="Destination"
              onAdd={async (name) => {
                const created = await addDestination.mutateAsync(name)
                set('destinationId', created.id)
              }}
              onToggle={(id) => set('destinationId', id)}
              options={destinations.map(({ id, name }) => ({ id, name }))}
              selected={form.destinationId ? [form.destinationId] : []}
            />
            <ChipPicker
              addLabel="Add category"
              adding={addCategory.isPending}
              error={errors.categoryIds}
              hint="Optional. Pick all that fit."
              label="Categories"
              onAdd={async (name) => {
                const created = await addCategory.mutateAsync(name)
                setForm((prev) =>
                  prev.categoryIds.includes(created.id) ? prev : { ...prev, categoryIds: [...prev.categoryIds, created.id] },
                )
              }}
              onToggle={(id) =>
                set(
                  'categoryIds',
                  form.categoryIds.includes(id) ? form.categoryIds.filter((c) => c !== id) : [...form.categoryIds, id],
                )
              }
              options={categories.map(({ id, title }) => ({ id, name: title }))}
              selected={form.categoryIds}
            />
            <ImageUploadField error={errors.imageUrl} onChange={(url) => set('imageUrl', url)} value={form.imageUrl} />
          </Card>
        )}

        {step === 1 && (
          <Card style={styles.section}>
            <View style={styles.row}>
              <View style={{ flex: 1, gap: spacing.sm }}>
                <FieldLabel error={errors.durationDays} label="Days" />
                <NumberStepper min={1} onChange={(v) => set('durationDays', v)} value={form.durationDays} />
              </View>
              <View style={{ flex: 1, gap: spacing.sm }}>
                <FieldLabel error={errors.durationNights} label="Nights" />
                <NumberStepper min={0} onChange={(v) => set('durationNights', v)} value={form.durationNights} />
              </View>
            </View>
            <Field
              error={errors.priceFrom}
              keyboardType="number-pad"
              label="Starting price (₹)"
              onChangeText={(v) => set('priceFrom', v.replace(/[^\d]/g, ''))}
              placeholder="e.g. 3999"
              value={form.priceFrom}
            />
            <View style={{ gap: spacing.sm }}>
              <FieldLabel error={errors.priceUnit} label="Price is" />
              <View style={styles.chips}>
                {priceUnits.map((unit) => (
                  <Chip key={unit} label={priceUnitLabels[unit]} onPress={() => set('priceUnit', unit)} selected={form.priceUnit === unit} />
                ))}
              </View>
            </View>
            <View style={{ gap: spacing.sm }}>
              <Field
                error={errors.bestSeason}
                label="Best season (optional)"
                onChangeText={(v) => set('bestSeason', v)}
                placeholder="e.g. October – March"
                value={form.bestSeason}
              />
              <View style={styles.chips}>
                {SEASON_SUGGESTIONS.map((season) => (
                  <Chip key={season} label={season} onPress={() => set('bestSeason', season)} selected={form.bestSeason === season} />
                ))}
              </View>
            </View>
            <Field
              error={errors.summary}
              hint="One or two lines shown on the package card."
              label="Short summary"
              maxLength={500}
              multiline
              onChangeText={(v) => set('summary', v)}
              value={form.summary}
            />
            <Field
              error={errors.description}
              label="Full description (optional)"
              multiline
              onChangeText={(v) => set('description', v)}
              value={form.description}
            />
          </Card>
        )}

        {step === 2 && (
          <View style={{ gap: spacing.md }}>
            {errors.itinerary ? <Text style={styles.errorText}>{errors.itinerary}</Text> : null}
            <Text style={font.small}>One card per day. Leave a day blank to skip it. You can skip this step entirely.</Text>
            {form.itinerary.map((day, index) => (
              <DayCard
                day={day}
                index={index}
                key={index}
                onChange={(next) => set('itinerary', form.itinerary.map((d, i) => (i === index ? next : d)))}
                onRemove={() => set('itinerary', form.itinerary.filter((_, i) => i !== index))}
              />
            ))}
            <Pressable onPress={() => set('itinerary', [...form.itinerary, emptyDay()])} style={styles.addDay}>
              <Ionicons color={colors.navy700} name="add" size={18} />
              <Text style={styles.addDayText}>Add day {form.itinerary.length + 1}</Text>
            </Pressable>
          </View>
        )}

        {step === 3 && (
          <Card style={styles.section}>
            <ListEditor
              error={errors.highlights}
              hint="What makes this trip special?"
              items={form.highlights}
              label="Highlights"
              onChange={(items) => set('highlights', items)}
              placeholder="e.g. Sunrise at Raja's Seat"
              suggestions={HIGHLIGHT_SUGGESTIONS}
              tone={colors.warningSoft}
            />
            <ListEditor
              error={errors.inclusions}
              hint="What's covered in the price?"
              items={form.inclusions}
              label="Included"
              onChange={(items) => set('inclusions', items)}
              placeholder="e.g. AC vehicle with driver"
              suggestions={INCLUSION_SUGGESTIONS}
              tone={colors.successSoft}
            />
            <ListEditor
              error={errors.exclusions}
              hint="What will the customer pay for separately?"
              items={form.exclusions}
              label="Not included"
              onChange={(items) => set('exclusions', items)}
              placeholder="e.g. Entry tickets"
              suggestions={EXCLUSION_SUGGESTIONS}
              tone={colors.ivoryDim}
            />
          </Card>
        )}

        {step === 4 && (
          <View style={{ gap: spacing.lg }}>
            <View style={styles.preview}>
              {form.imageUrl ? (
                <Image contentFit="cover" source={{ uri: form.imageUrl }} style={StyleSheet.absoluteFill} />
              ) : null}
              <View style={styles.previewShade} />
              <Text style={styles.previewTitle}>{form.title || 'Package name'}</Text>
              <Text style={styles.previewMeta}>
                {[destinationName, formatDuration(form.durationDays, form.durationNights)].filter(Boolean).join(' · ')}
              </Text>
              <Text style={styles.previewPrice}>{formatPrice(Number(form.priceFrom) || 0, form.priceUnit)}</Text>
            </View>

            <Card style={{ gap: spacing.sm }}>
              <ReviewRow label="Categories" value={categories.filter((c) => form.categoryIds.includes(c.id)).map((c) => c.title).join(', ') || '—'} />
              <ReviewRow label="Itinerary" value={`${cleanItinerary(form.itinerary).length} day(s) planned`} />
              <ReviewRow label="Highlights" value={String(form.highlights.length)} />
              <ReviewRow label="Included" value={String(form.inclusions.length)} />
              <ReviewRow label="Not included" value={String(form.exclusions.length)} />
            </Card>

            <Card style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={font.label}>Feature on the home page</Text>
                <Text style={font.small}>Featured packages are shown first.</Text>
              </View>
              <Switch
                onValueChange={(v) => set('featured', v)}
                thumbColor={form.featured ? colors.gold500 : '#f4f3f4'}
                trackColor={{ false: colors.border, true: colors.navy700 }}
                value={form.featured}
              />
            </Card>

            <AdvancedSection errors={errors} form={form} set={set} />
          </View>
        )}

        {footer}
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        {step > 0 ? (
          <Button icon="chevron-back" onPress={() => goTo(step - 1)} style={{ flex: 1 }} title="Back" variant="secondary" />
        ) : null}
        {!isLast ? (
          <Button
            onPress={() => goTo(step + 1)}
            style={{ flex: 2 }}
            title={`Next: ${STEPS[step + 1]}`}
            variant={isEdit ? 'secondary' : 'primary'}
          />
        ) : null}
        {isLast || isEdit ? (
          <View style={[styles.saveButtons, isLast && { flex: 2 }]}>
            {isLast ? (
              <Button
                disabled={submitting}
                onPress={() => save(false)}
                style={{ flex: 1 }}
                title={isEdit && form.published ? 'Unpublish' : 'Draft'}
                variant="secondary"
              />
            ) : null}
            <Button
              icon="checkmark"
              loading={submitting}
              onPress={() => save(isLast ? true : form.published)}
              style={{ flex: 1 }}
              title={isEdit ? 'Save' : 'Publish'}
            />
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  )
}

// ---------- Building blocks ----------

function ChipPicker({
  label,
  hint,
  error,
  options,
  selected,
  onToggle,
  onAdd,
  addLabel,
  adding,
}: {
  label: string
  hint: string
  error?: string
  options: { id: number; name: string }[]
  selected: number[]
  onToggle: (id: number) => void
  onAdd: (name: string) => Promise<void>
  addLabel: string
  adding: boolean
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [addError, setAddError] = useState<string | null>(null)

  const submit = async () => {
    const trimmed = name.trim()
    if (trimmed.length < 2) return setAddError('Type at least 2 letters')
    try {
      await onAdd(trimmed)
      setName('')
      setAddError(null)
      setOpen(false)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Could not add it')
    }
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <FieldLabel error={error} label={label} />
      <Text style={font.small}>{hint}</Text>
      <View style={styles.chips}>
        {options.map((option) => (
          <Chip key={option.id} label={option.name} onPress={() => onToggle(option.id)} selected={selected.includes(option.id)} />
        ))}
        {!open ? (
          <Pressable onPress={() => setOpen(true)} style={styles.addChip}>
            <Ionicons color={colors.gold600} name="add" size={16} />
            <Text style={styles.addChipText}>{addLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {open ? (
        <View style={styles.inlineAdd}>
          <TextInput
            autoFocus
            onChangeText={setName}
            onSubmitEditing={submit}
            placeholder="Type a name, e.g. Mysore"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            style={styles.inlineInput}
            value={name}
          />
          <Button loading={adding} onPress={submit} style={{ paddingHorizontal: spacing.lg }} title="Add" />
          <Pressable accessibilityLabel="Cancel" hitSlop={8} onPress={() => setOpen(false)}>
            <Ionicons color={colors.textMuted} name="close" size={22} />
          </Pressable>
        </View>
      ) : null}
      {addError ? <Text style={styles.errorText}>{addError}</Text> : null}
    </View>
  )
}

function NumberStepper({ value, onChange, min }: { value: number; onChange: (v: number) => void; min: number }) {
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityLabel="Decrease"
        disabled={value <= min}
        hitSlop={6}
        onPress={() => onChange(Math.max(min, value - 1))}
        style={[styles.stepperButton, value <= min && { opacity: 0.3 }]}
      >
        <Ionicons color={colors.navy800} name="remove" size={20} />
      </Pressable>
      <Text style={styles.stepperValue}>{value}</Text>
      <Pressable accessibilityLabel="Increase" hitSlop={6} onPress={() => onChange(Math.min(60, value + 1))} style={styles.stepperButton}>
        <Ionicons color={colors.navy800} name="add" size={20} />
      </Pressable>
    </View>
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
    <Card style={{ gap: spacing.md }}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayBadge}>Day {index + 1}</Text>
        <Pressable accessibilityLabel={`Remove day ${index + 1}`} hitSlop={10} onPress={onRemove}>
          <Ionicons color={colors.textMuted} name="trash-outline" size={20} />
        </Pressable>
      </View>
      <Field
        label="Title"
        onChangeText={(v) => onChange({ ...day, title: v })}
        placeholder={index === 0 ? 'e.g. Bengaluru → Coorg, Abbey Falls' : 'Title for this day'}
        value={day.title}
      />
      <Field
        label="What happens (optional)"
        multiline
        onChangeText={(v) => onChange({ ...day, description: v })}
        value={day.description}
      />
      <View style={styles.chips}>
        {MEALS.map((meal) => (
          <Chip
            key={meal}
            label={MEAL_LABEL[meal]}
            onPress={() =>
              onChange({
                ...day,
                meals: day.meals.includes(meal) ? day.meals.filter((m) => m !== meal) : [...day.meals, meal],
              })
            }
            selected={day.meals.includes(meal)}
          />
        ))}
      </View>
      <Field
        label="Overnight stay (optional)"
        onChangeText={(v) => onChange({ ...day, overnightAt: v })}
        placeholder="e.g. Madikeri"
        value={day.overnightAt}
      />
    </Card>
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
  tone: string
  error?: string
}) {
  const [draft, setDraft] = useState('')
  const add = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed || items.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return
    onChange([...items, trimmed])
  }
  const unused = suggestions.filter((s) => !items.some((item) => item.toLowerCase() === s.toLowerCase()))

  return (
    <View style={{ gap: spacing.sm }}>
      <FieldLabel error={error} label={label} />
      <Text style={font.small}>{hint}</Text>
      {items.map((item, index) => (
        <View key={item} style={[styles.listItem, { backgroundColor: tone }]}>
          <Text style={styles.listItemText}>{item}</Text>
          <Pressable accessibilityLabel={`Remove ${item}`} hitSlop={10} onPress={() => onChange(items.filter((_, i) => i !== index))}>
            <Ionicons color={colors.textMuted} name="close" size={18} />
          </Pressable>
        </View>
      ))}
      <View style={styles.inlineAdd}>
        <TextInput
          onChangeText={setDraft}
          onSubmitEditing={() => {
            add(draft)
            setDraft('')
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          returnKeyType="done"
          style={styles.inlineInput}
          value={draft}
        />
        <Button
          icon="add"
          onPress={() => {
            add(draft)
            setDraft('')
          }}
          style={{ paddingHorizontal: spacing.lg }}
          title="Add"
          variant="secondary"
        />
      </View>
      {unused.length ? (
        <View style={styles.chips}>
          {unused.map((suggestion) => (
            <Pressable key={suggestion} onPress={() => add(suggestion)} style={styles.suggestion}>
              <Text style={styles.suggestionText}>+ {suggestion}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}

function AdvancedSection({
  form,
  set,
  errors,
}: {
  form: FormState
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void
  errors: Record<string, string>
}) {
  const [open, setOpen] = useState(Boolean(errors.slug || errors.metaTitle || errors.metaDescription))

  return (
    <Card style={{ gap: spacing.lg }}>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={font.label}>Advanced (optional)</Text>
          <Text style={font.small}>Web address & Google text. Filled in automatically if left empty.</Text>
        </View>
        <Ionicons color={colors.textMuted} name={open ? 'chevron-up' : 'chevron-down'} size={20} />
      </Pressable>
      {open ? (
        <>
          <Field
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.slug}
            hint="/packages/your-address"
            label="Web address"
            onChangeText={(v) => set('slug', slugify(v))}
            placeholder={slugify(form.title) || 'coorg-weekend-getaway'}
            value={form.slug}
          />
          <Field error={errors.metaTitle} label="Google title" onChangeText={(v) => set('metaTitle', v)} value={form.metaTitle} />
          <Field
            error={errors.metaDescription}
            label="Google description"
            multiline
            onChangeText={(v) => set('metaDescription', v)}
            value={form.metaDescription}
          />
        </>
      ) : null}
    </Card>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  progress: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm, backgroundColor: colors.background },
  progressBars: { flexDirection: 'row', gap: 6 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.border },
  progressText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg, width: '100%', maxWidth: 720, alignSelf: 'center' },
  section: { gap: spacing.xl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  formError: { backgroundColor: colors.dangerSoft, padding: spacing.md, borderRadius: radius.md },
  errorText: { color: colors.danger, fontSize: 13 },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.gold500,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  addChipText: { color: colors.gold600, fontWeight: '600', fontSize: 14 },
  inlineAdd: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inlineInput: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  stepperButton: { padding: spacing.md },
  stepperValue: { fontSize: 20, fontWeight: '700', color: colors.text },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayBadge: {
    backgroundColor: colors.navy900,
    color: colors.gold300,
    fontWeight: '700',
    fontSize: 13,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  addDay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
  },
  addDayText: { color: colors.navy700, fontWeight: '600', fontSize: 15 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  listItemText: { flex: 1, fontSize: 14, color: colors.text },
  suggestion: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  suggestionText: { fontSize: 13, color: colors.navy700 },
  preview: {
    height: 220,
    borderRadius: radius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: spacing.lg,
    backgroundColor: colors.navy700,
  },
  previewShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8,20,38,0.45)' },
  previewTitle: { fontSize: 20, fontWeight: '700', color: colors.ivory },
  previewMeta: { fontSize: 13, color: 'rgba(251,249,244,0.8)', marginTop: 2 },
  previewPrice: { fontSize: 15, fontWeight: '700', color: colors.gold300, marginTop: 4 },
  reviewRow: { flexDirection: 'row', gap: spacing.md },
  reviewLabel: { width: 100, fontSize: 14, color: colors.textMuted },
  reviewValue: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  bottomBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  saveButtons: { flex: 1, flexDirection: 'row', gap: spacing.sm },
})
