'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/utilities/ui'

export type FaqItem = {
  question: string
  answer: string
}

export const FaqAccordion: React.FC<{ items: FaqItem[] }> = ({ items }) => {
  const [openIndex, setOpenIndex] = useState<number>(0)

  return (
    <div className="mx-auto max-w-[47.5rem]">
      {items.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div key={item.question} className="border-b border-border">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-5 py-[22px] text-left font-bold text-[1.02rem] text-navy-900"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
            >
              {item.question}
              <ChevronDown
                className={cn(
                  'h-5 w-5 flex-shrink-0 text-gold-600 transition-transform duration-250',
                  isOpen && 'rotate-180',
                )}
              />
            </button>
            <div
              className={cn(
                'overflow-hidden transition-[max-height] duration-300 ease-in-out',
                isOpen ? 'max-h-60' : 'max-h-0',
              )}
            >
              <p className="max-w-[40rem] pb-[22px] text-[0.94rem] text-muted-brand">
                {item.answer}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
