# Mani Admin (Android)

Expo + React Native admin app for Mani Tours and Travels. It talks to the
existing Next.js site through `/api/mobile/*`. It uses the same Prisma models,
the same Neon database and the same admin accounts as `/admin` on the website.

## How it fits together

```
mobile app ──Bearer token──▶ /api/mobile/*  (Next.js route handlers)
                                   │
web /admin (server actions) ───────┤
                                   ▼
                     src/server/admin/*  (shared business logic)
                                   ▼
                          Prisma → Neon (one database)
```

- **Login**: `POST /api/mobile/auth/login` checks the password with the same
  function the web login uses (`src/lib/auth/credentials.ts`). It returns an
  Auth.js JWT signed with `AUTH_SECRET`. The token uses a separate salt, so web
  cookies and app tokens can't be swapped for each other. Tokens last 30 days
  and are stored in Expo SecureStore (encrypted Android Keystore).
- **Packages** use the same zod schema and the same refresh of the public
  pages as the web admin, so changes show up on the website right away.
- **Image uploads** go to `POST /api/mobile/uploads`. The server forwards them
  to Cloudinary (`CLOUDINARY_*` env vars). The app resizes images to a maximum
  width of 1600 px and saves them as JPEG first, so they stay under the 4 MB
  limit. The web admin uploads to Cloudinary directly from the browser.
- **Notifications**: new bookings, call-back requests and package enquiries
  send a push notification to every signed-in admin phone (Expo push service).
  Tapping one opens the matching screen.
- **Call tracking**: tapping Call on a booking or enquiry records the time.
  Enquiries also move from New to Contacted.

| Endpoint | Methods |
|---|---|
| `/api/mobile/auth/login` | POST |
| `/api/mobile/auth/me` | GET |
| `/api/mobile/dashboard` | GET |
| `/api/mobile/lookups` | GET (destinations, categories, enums) |
| `/api/mobile/packages` | GET, POST |
| `/api/mobile/packages/:id` | GET, PUT, PATCH `{published}`, DELETE |
| `/api/mobile/bookings` | GET `?cursor=&limit=` |
| `/api/mobile/bookings/:id/contacted` | POST (marks as called) |
| `/api/mobile/enquiries` | GET `?status=&cursor=&limit=` |
| `/api/mobile/enquiries/:id` | GET, PATCH `{status?, notes?}` |
| `/api/mobile/enquiries/:id/contacted` | POST (marks as called) |
| `/api/mobile/push-tokens` | POST, DELETE `{token}` |
| `/api/mobile/uploads` | POST multipart `file` |

## Run on your phone (development)

1. Start the website from the repo root: `npm run dev`.
2. Find your PC's local network (LAN) IP address with `ipconfig`, for example
   `192.168.1.20`. Your phone and PC must be on the same Wi-Fi.
3. Create the app's env file:
   ```sh
   cd mobile
   cp .env.example .env   # set EXPO_PUBLIC_API_URL=http://192.168.1.20:3000
   ```
4. `npm start`, then scan the QR code with **Expo Go** on Android.

If the app says it can't reach the server, Windows Firewall is probably
blocking port 3000. Allow Node.js on private networks.

## Push notifications setup (one time)

Push notifications **do not work in Expo Go** (Expo removed this on Android).
Everything else does. To get notifications you need an installed build:

1. `npx eas-cli@latest login`, then in `mobile/` run `npx eas-cli@latest init`.
   This adds your EAS `projectId` to `app.json`.
2. Android pushes go through Firebase Cloud Messaging. Run
   `npx eas-cli@latest credentials`, choose Android, then Google Service
   Account / FCM V1, and follow the prompts. You'll need a free Firebase project.
3. Build and install the APK (below). Sign in, and allow notifications when asked.

## Build an installable APK

1. Deploy the website (for example to Vercel) so it has an `https://` URL.
   Release APKs block plain `http://` connections.
2. In `eas.json`, replace `https://REPLACE-WITH-YOUR-DOMAIN` with that URL.
3. Run:
   ```sh
   npx eas-cli@latest login
   npm run build:apk          # eas build -p android --profile preview
   ```
   EAS builds in the cloud and gives you a download link for the `.apk`.

For the Play Store, use `npx eas-cli@latest build -p android --profile production`,
which produces an `.aab`.

## Checks

```sh
npm run typecheck
npx expo-doctor
```
