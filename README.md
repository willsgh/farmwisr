# FarmWisr

FarmWisr is an open-source farm management app for farmers, on Android phones and in the web browser. Farmers record every activity from land preparation to harvest, and FarmWisr turns those records into cost, yield and profit per field and season.

- **Launch market:** Ghana, then other African countries
- **Farmers:** smallholders and mid-sized commercial farms
- **Scope (v1):** crops only, including a multi-year view for tree crops such as cocoa
- **Language:** English

## Licence

FarmWisr is free software, licensed under the [GNU Affero General Public License v3.0](LICENSE).

## Project layout

| Path | What it is |
| --- | --- |
| `apps/mobile` | The FarmWisr app: one Expo (React Native) codebase for Android, iOS and the web |
| `packages/core` | Shared farm logic in TypeScript: season stages, area units, money, season cost summaries |
| `supabase/migrations` | Database schema (Postgres + PostGIS) with row-level security per farm |
| `supabase/tests` | Database checks run in CI |

## Offline use

The app works without a signal. Every record is saved on the device first (`apps/mobile/src/lib/offline.ts`) and queued; the queue is sent to Supabase in order whenever the device is online (on a 30-second timer, when the app comes to the foreground, and when the browser reports it is back online), then the device's copy is refreshed from the server. A bar at the bottom of the screen shows how many changes are waiting.

## Field mapping

A field's boundary can be walked (tap "Mark corner" at each corner; the phone's GPS records it) or drawn by tapping corners on a satellite map. The area is calculated on the device and saved as the field's area. The boundary is stored as GeoJSON in `fields.boundary_geojson`, and the database derives the PostGIS `fields.boundary` from it. Maps use MapLibre (MapLibre Native on phones, MapLibre GL JS on the web). Satellite tiles default to Esri World Imagery for development; set `EXPO_PUBLIC_MAP_TILES_URL` for production.

## Getting started

Requires Node.js 22.

```bash
npm install
npm test                 # unit tests
npm run typecheck
npm run lint

cd apps/mobile
cp .env.example .env.local   # add your Supabase URL and anon key
npx expo start               # press w for web
npx expo run:android         # phones need a development build, since maps use native code (not Expo Go)
```

Sign-in is by phone number with an SMS code. In your Supabase project, turn on the Phone provider under Authentication and connect an SMS provider (for example Twilio). While developing, you can add test phone numbers with fixed codes there instead of sending real SMS.

To set up the database, create a Supabase project and apply `supabase/migrations` with the [Supabase CLI](https://supabase.com/docs/guides/cli) (`supabase link` then `supabase db push`).
