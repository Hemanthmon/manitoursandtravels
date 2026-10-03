'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/utilities/ui'

export type ItineraryDayData = {
  id: number
  dayNumber: number
  title: string
  description: string | null
  meals: string[]
  overnightAt: string | null
}

const MEAL_LABEL: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
}

export const ItineraryAccordion: React.FC<{ days: ItineraryDayData[] }> = ({ days }) => {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div className="flex flex-col gap-3">
      {days.map((day, i) => {
        const isOpen = openIndex === i
        return (
          <div key={day.id} className="overflow-hidden rounded-2xl border border-border bg-paper">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
            >
              <span className="flex items-center gap-4">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-navy-900 font-head text-[0.95rem] font-bold text-gold-300">
                  {day.dayNumber}
                </span>
                <h3 className="text-[1.05rem] text-navy-900">{day.title}</h3>
              </span>
              <ChevronDown
                className={cn('h-5 w-5 flex-shrink-0 text-gold-600 transition-transform duration-250', isOpen && 'rotate-180')}
              />
            </button>
            <div className={cn('overflow-hidden transition-[max-height] duration-300 ease-in-out', isOpen ? 'max-h-96' : 'max-h-0')}>
              <div className="px-5 pb-5 pl-[76px]">
                {day.description && <p className="text-[0.94rem] text-muted-brand">{day.description}</p>}
                {Array.isArray(day.meals) && day.meals.length > 0 && (
                  <p className="mt-2 text-[0.82rem] font-semibold text-emerald-600">
                    Meals: {day.meals.map((m) => MEAL_LABEL[m] ?? m).join(', ')}
                  </p>
                )}
                {day.overnightAt && (
                  <p className="mt-1 text-[0.82rem] text-muted-brand">Overnight at: {day.overnightAt}</p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
