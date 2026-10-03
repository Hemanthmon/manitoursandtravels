import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
import { redirects } from './redirects'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000'

const nextConfig: NextConfig = {
  // Lets a production build run alongside `next dev` (NEXT_DIST_DIR=.next-build).
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    localPatterns: [
      {
        pathname: '/logo.png',
      },
      {
        pathname: '/logo-icon.png',
      },
      {
        // Site photos stored in public/images (e.g. the school transport card).
        pathname: '/images/**',
      },
    ],
    qualities: [75, 100],
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', '') as 'http' | 'https',
        }
      }),
      {
        // Cloudinary — package images uploaded via the web admin and mobile app.
        hostname: 'res.cloudinary.com',
        protocol: 'https' as const,
        pathname: `/${process.env.CLOUDINARY_CLOUD_NAME || 'e1u3lx04'}/**`,
      },
      {
        // UploadThing — older package images uploaded before the Cloudinary switch.
        hostname: '*.ufs.sh',
        protocol: 'https' as const,
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default nextConfig
