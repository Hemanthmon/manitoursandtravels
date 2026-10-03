declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string
      AUTH_SECRET: string
      CLOUDINARY_CLOUD_NAME: string
      CLOUDINARY_API_KEY: string
      CLOUDINARY_API_SECRET: string
      NEXT_PUBLIC_SERVER_URL: string
      VERCEL_PROJECT_PRODUCTION_URL: string
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: string
      TURNSTILE_SECRET_KEY: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
