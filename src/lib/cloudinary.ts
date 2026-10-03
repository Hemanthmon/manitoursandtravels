import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary'

// Package images live in Cloudinary. Configured from CLOUDINARY_CLOUD_NAME,
// CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET; the secret never leaves the server.

const FOLDER = 'mani-tours/packages'
// Store at most 2000px wide. Cloudinary applies this on upload, so huge phone
// photos don't eat storage; delivery adds f_auto/q_auto on top.
const INCOMING_TRANSFORMATION = 'c_limit,w_2000'

function configure() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.')
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
    // Keep stored URLs clean (no ?_a=... SDK analytics suffix).
    analytics: false,
  })
  return { cloudName: CLOUDINARY_CLOUD_NAME, apiKey: CLOUDINARY_API_KEY, apiSecret: CLOUDINARY_API_SECRET }
}

// Delivery URL with automatic format (WebP/AVIF) and quality for the stored image.
export function deliveryUrl(upload: Pick<UploadApiResponse, 'public_id' | 'version'>) {
  configure()
  return cloudinary.url(upload.public_id, {
    version: upload.version,
    fetch_format: 'auto',
    quality: 'auto',
  })
}

// Signature for a direct browser -> Cloudinary upload (web admin). Uploading
// straight from the browser avoids the ~4.5 MB request limit on Vercel functions.
// Every signed param must be sent unchanged with the upload, or Cloudinary rejects it.
export function signBrowserUpload() {
  const { cloudName, apiKey, apiSecret } = configure()
  const params = {
    folder: FOLDER,
    timestamp: Math.round(Date.now() / 1000),
    transformation: INCOMING_TRANSFORMATION,
  }
  const signature = cloudinary.utils.api_sign_request(params, apiSecret)
  return { cloudName, apiKey, signature, ...params }
}

// Server-side upload (mobile app -> /api/mobile/uploads -> Cloudinary).
export async function uploadImage(file: File): Promise<string> {
  configure()
  const buffer = Buffer.from(await file.arrayBuffer())

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        // The SDK reads a plain string here as a *named* transformation, so pass
        // the same resize as an object.
        { folder: FOLDER, resource_type: 'image', transformation: [{ crop: 'limit', width: 2000 }] },
        (error, response) => (error || !response ? reject(error ?? new Error('Empty upload response')) : resolve(response)),
      )
      .end(buffer)
  })

  return deliveryUrl(result)
}
