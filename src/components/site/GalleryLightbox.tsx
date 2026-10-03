'use client'

import React, { useState } from 'react'

import { Media } from '@/components/Media'
import { enterFullscreen, PhotoViewer } from '@/components/site/PhotoViewer'

export type GalleryImageData = {
  id: number
  imageUrl: string
  caption: string | null
}

export const GalleryLightbox: React.FC<{ images: GalleryImageData[] }> = ({ images }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (images.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => {
              enterFullscreen()
              setOpenIndex(i)
            }}
            className="relative aspect-[4/3] overflow-hidden rounded-xl"
            aria-label={`Open image ${i + 1} of ${images.length}`}
          >
            <Media
              resource={{ url: img.imageUrl, alt: img.caption ?? undefined }}
              fill
              imgClassName="h-full w-full object-cover transition-transform hover:scale-105"
              size="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </button>
        ))}
      </div>

      <PhotoViewer
        index={openIndex}
        onIndexChange={setOpenIndex}
        photos={images.map((img) => ({ url: img.imageUrl, caption: img.caption }))}
      />
    </>
  )
}
