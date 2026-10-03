import { NextResponse } from 'next/server'

import { apiError, withMobileAuth } from '@/lib/api/mobile'
import { uploadImage } from '@/lib/cloudinary'

// The app resizes photos to <=1600px JPEG before posting, so they stay well
// under this limit (and under Vercel's ~4.5 MB request body cap). The server
// forwards them to Cloudinary; the web admin uploads to Cloudinary directly.
const MAX_FILE_SIZE = 4 * 1024 * 1024
const TAG = '[api/mobile/uploads]'

export const POST = withMobileAuth(async (request, { admin }) => {
  const startedAt = Date.now()
  console.info(
    `${TAG} 1/4 request from ${admin.email}: content-type=${request.headers.get('content-type')} ` +
      `content-length=${request.headers.get('content-length') ?? 'unknown'}`,
  )

  let formData: FormData
  try {
    formData = await request.formData()
  } catch (error) {
    console.error(`${TAG} FAILED reading multipart body`, error)
    return apiError(400, 'Expected a multipart upload with a "file" field.')
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    console.error(`${TAG} FAILED no "file" field. Fields received: ${[...formData.keys()].join(', ') || 'none'}`)
    return apiError(400, 'No image was attached.')
  }
  console.info(`${TAG} 2/4 got file ${file.name} (${file.type || 'no type'}, ${Math.round(file.size / 1024)} KB)`)

  if (!file.type.startsWith('image/')) {
    console.error(`${TAG} FAILED not an image: type="${file.type}"`)
    return apiError(415, 'Only image files can be uploaded.')
  }
  if (file.size > MAX_FILE_SIZE) {
    console.error(`${TAG} FAILED too large: ${Math.round(file.size / 1024)} KB`)
    return apiError(413, 'Image is larger than 4 MB.')
  }

  try {
    console.info(`${TAG} 3/4 sending to Cloudinary…`)
    const url = await uploadImage(file)
    console.info(`${TAG} 4/4 done in ${Date.now() - startedAt} ms: ${url}`)
    return NextResponse.json({ url }, { status: 201 })
  } catch (error) {
    console.error(`${TAG} FAILED at Cloudinary after ${Date.now() - startedAt} ms`, error)
    // In development, show Cloudinary's actual reason in the app to make
    // problems easy to diagnose; production keeps the generic message.
    const reason = error instanceof Error ? error.message : (error as { message?: string })?.message
    return apiError(
      502,
      process.env.NODE_ENV !== 'production' && reason ? `Upload failed: ${reason}` : 'Upload failed. Please try again.',
    )
  }
})
