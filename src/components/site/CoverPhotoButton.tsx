'use client'

import { Expand } from 'lucide-react'
import React, { useState } from 'react'

import { enterFullscreen, PhotoViewer, type ViewerPhoto } from '@/components/site/PhotoViewer'

// "View photos" on a package page's cover: opens the cover + gallery full screen.
export const CoverPhotoButton: React.FC<{ photos: ViewerPhoto[] }> = ({ photos }) => {
  const [index, setIndex] = useState<number | null>(null)
  if (photos.length === 0) return null

  return (
    <>
      <button
        className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-4 py-2 text-[0.85rem] font-semibold text-ivory backdrop-blur-[6px] transition-colors hover:bg-black/50"
        onClick={() => {
          enterFullscreen()
          setIndex(0)
        }}
        type="button"
      >
        <Expand className="h-4 w-4" />
        {photos.length > 1 ? `View ${photos.length} photos` : 'View full screen'}
      </button>
      <PhotoViewer index={index} onIndexChange={setIndex} photos={photos} />
    </>
  )
}
