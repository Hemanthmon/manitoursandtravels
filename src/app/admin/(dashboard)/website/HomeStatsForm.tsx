'use client'

import { Check, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'

import { HomeStatIcon, homeStatIconComponents } from '@/components/site/HomeStatIcon'
import { homeStatIcons, type HomeStat } from '@/lib/homeStats'
import { cn } from '@/utilities/ui'

import { saveHomeStatsAction } from './actions'

const inputClass =
  'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30'

export function HomeStatsForm({ initial }: { initial: HomeStat[] }) {
  const [stats, setStats] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({})
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [saving, startSaving] = useTransition()

  const update = (index: number, patch: Partial<HomeStat>) => {
    setStats((current) => current.map((stat, i) => (i === index ? { ...stat, ...patch } : stat)))
    setMessage(null)
  }

  const save = () =>
    startSaving(async () => {
      const result = await saveHomeStatsAction(stats)
      if (result.ok) {
        setStats(result.stats)
        setErrors({})
        setMessage({ ok: true, text: 'Saved. The home page now shows these numbers.' })
      } else {
        setErrors(result.errors ?? {})
        setMessage({ ok: false, text: result.error })
      }
    })

  return (
    <div className="mt-8">
      <div className="grid gap-5 md:grid-cols-2">
        {stats.map((stat, index) => {
          const error = (field: keyof HomeStat) => errors[`${index}.${field}`]?.[0]
          return (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm" key={index}>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-brand">Box {index + 1}</p>

              {/* What visitors will see */}
              <div className={cn('mt-3 flex items-center gap-4 rounded-xl bg-ivory p-4', !stat.value && 'opacity-50')}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-navy-900 text-gold-300">
                  <HomeStatIcon className="h-6 w-6" icon={stat.icon} />
                </span>
                <span>
                  <span className="block font-head text-2xl font-bold leading-none text-navy-900">
                    {stat.value || '—'}
                    {stat.value && stat.suffix ? <span className="text-gold-600">{stat.suffix}</span> : null}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-muted-brand">{stat.label || 'Label'}</span>
                </span>
              </div>
              {!stat.value && <p className="mt-2 text-xs text-muted-brand">Hidden on the website (no number).</p>}

              <div className="mt-4 grid grid-cols-[1fr_5rem] gap-3">
                <label className="block text-sm font-semibold">
                  Number
                  <input
                    className={cn(inputClass, 'mt-1')}
                    onChange={(e) => update(index, { value: e.target.value })}
                    placeholder="e.g. 42000 or 24×7"
                    value={stat.value}
                  />
                </label>
                <label className="block text-sm font-semibold">
                  After it
                  <input
                    className={cn(inputClass, 'mt-1')}
                    onChange={(e) => update(index, { suffix: e.target.value })}
                    placeholder="+"
                    value={stat.suffix}
                  />
                </label>
              </div>
              {(error('value') || error('suffix')) && (
                <p className="mt-1 text-xs text-red-600">{error('value') ?? error('suffix')}</p>
              )}

              <label className="mt-3 block text-sm font-semibold">
                Label
                <input
                  className={cn(inputClass, 'mt-1')}
                  onChange={(e) => update(index, { label: e.target.value })}
                  placeholder="e.g. Rides completed"
                  value={stat.label}
                />
              </label>
              {error('label') && <p className="mt-1 text-xs text-red-600">{error('label')}</p>}

              <p className="mt-3 text-sm font-semibold">Icon</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {homeStatIcons.map((key) => {
                  const Icon = homeStatIconComponents[key]
                  const selected = stat.icon === key
                  return (
                    <button
                      aria-label={key}
                      aria-pressed={selected}
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg border transition',
                        selected
                          ? 'border-navy-900 bg-navy-900 text-gold-300'
                          : 'border-border bg-white text-navy-700 hover:border-navy-700',
                      )}
                      key={key}
                      onClick={() => update(index, { icon: key })}
                      type="button"
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <p className="mt-5 text-sm text-muted-brand">
        Tip: type plain numbers like <strong>42000</strong> — the website adds the commas and counts up to it. Leave a
        number empty to hide that box.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
          disabled={saving}
          onClick={save}
          type="button"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save changes
        </button>
        {message && (
          <p className={cn('text-sm font-semibold', message.ok ? 'text-green-700' : 'text-red-600')}>{message.text}</p>
        )}
      </div>
    </div>
  )
}
