'use client'

import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'

import { getImageUploadSignatureAction } from './actions'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // Cloudinary free plan's per-image limit

type CloudinaryUploadResponse = {
  public_id: string
  version: number
  error?: { message: string }
}

// Uploads straight from the browser to Cloudinary using a server-signed request,
// then hands back an optimised (f_auto,q_auto) delivery URL.
export function ImageUploadButton({ onUploaded }: { onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return setError('Please choose an image file.')
    if (file.size > MAX_FILE_SIZE) return setError('Image is larger than 10 MB.')

    setError(null)
    setUploading(true)
    try {
      const { cloudName, apiKey, signature, folder, timestamp, transformation } =
        await getImageUploadSignatureAction()

      const body = new FormData()
      body.append('file', file)
      body.append('api_key', apiKey)
      body.append('signature', signature)
      body.append('folder', folder)
      body.append('timestamp', String(timestamp))
      body.append('transformation', transformation)

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body,
      })
      const result = (await response.json()) as CloudinaryUploadResponse
      if (!response.ok || result.error) throw new Error(result.error?.message ?? 'Upload failed')

      onUploaded(
        `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/v${result.version}/${result.public_id}`,
      )
    } catch (err) {
      setError(err instanceof Error ? `Upload failed: ${err.message}` : 'Upload failed.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleFile(file)
        }}
        ref={inputRef}
        type="file"
      />
      <Button disabled={uploading} onClick={() => inputRef.current?.click()} type="button" variant="outline">
        {uploading ? 'Uploading…' : 'Upload image'}
      </Button>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  )
}
