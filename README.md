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

## Getting started

Requires Node.js 22.

```bash
npm install
npm test                 # unit tests
npm run typecheck
npm run lint

cd apps/mobile
cp .env.example .env.local   # add your Supabase URL and anon key
npx expo start               # press a for Android, w for web
```

To set up the database, create a Supabase project and apply `supabase/migrations` with the [Supabase CLI](https://supabase.com/docs/guides/cli) (`supabase link` then `supabase db push`).
