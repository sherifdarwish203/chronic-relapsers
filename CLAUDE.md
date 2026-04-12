# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**رحلة التعافي (Recovery Journey)** — a bilingual (Arabic-primary, RTL) web app for a relapse-prevention group at a psychiatric/addiction recovery centre in Alexandria, Egypt. Patients map abstinence/relapse timelines and identify triggers; facilitators get a clinical dashboard with aggregate analytics, CSV export, and PDF summaries.

## Development Commands

All commands run from the **repo root** (npm workspaces).

```bash
# Start backend (ts-node-dev, auto-restarts on change)
npm run dev:server

# Start frontend (Vite, port 5173)
npm run dev:client

# Database (Homebrew PostgreSQL — Docker not used locally)
npm run db:migrate   # applies server/src/db/schema.sql
npm run db:seed      # seeds dr.sherif + patients A001, B002

# Type-check client only (no build)
npm run typecheck --workspace=client
```

PostgreSQL runs via Homebrew (`brew services start postgresql@16`). The local `DATABASE_URL` uses the OS username with no password: `postgres://sherifdarwish@localhost:5432/recovery_db`.

## Environment

Copy `.env.example` → `.env` at repo root. All server entry points load it via:
```ts
dotenv.config({ path: path.resolve(__dirname, '../../.env') })  // server/src/index.ts
dotenv.config({ path: path.resolve(__dirname, '../../../.env') }) // server/src/db/*.ts
```
Never use `dotenv/config` (no path argument) — `.env` is at the repo root, not inside `server/`.

## Architecture

### Monorepo Layout
```
/client    React 18 + Vite 5 + TypeScript + Tailwind CSS v3
/server    Node.js + Express + TypeScript
.env       Single env file at repo root (loaded by both workspaces)
```

### API Proxy
Vite proxies `/api/*` → `http://localhost:3000` in dev. The Axios client in `client/src/api/client.ts` uses `baseURL: /api/v1` — never hardcode `localhost:3000` in frontend code.

### Authentication
Two roles, separate localStorage keys:
- **Patient**: `patient_token` — JWT `{ patient_id, code, role:"patient" }`, 30d expiry. Patients authenticate with code + first name; the code must be pre-created by a facilitator — patients cannot self-register.
- **Facilitator**: `facilitator_token` — JWT `{ facilitator_id, role:"facilitator" }`, 8h expiry. bcrypt password.

Route guards: `PatientGuard` (redirects to `/start`) and `FacilitatorGuard` (redirects to `/dashboard/login`) in `client/src/App.tsx`.

Server middleware: `requirePatient` / `requireFacilitator` in `server/src/middleware/auth.ts`.

### Patient Code Generation
Facilitators create patients via `POST /api/v1/facilitators/patients`. The server generates a unique code: one uppercase letter + 6 digits (e.g. `K482951`). The facilitator gives the code to the patient on paper. `POST /patients/login` will 404 if the code doesn't exist — there is no patient self-creation path.

### Data Model
```
patients → periods (1:many) → events (1:many per relapse period)
```
- `periods.type`: `'abstinent' | 'relapse' | 'reduced'`
- `periods.substances`: `TEXT[]` — which substances were involved; only meaningful for `relapse` and `reduced` periods, empty array for `abstinent`
- `patients.substances`: `TEXT[]` — overall substance profile for the patient (set by facilitator via Edit modal)
- `events.classification`: `'i'` (internal) | `'x'` (external) | `'b'` (both)
- `events.saw_it_coming`: `'y'` | `'p'` (partial) | `'n'`
- `duration_months` is calculated server-side; `end_month/end_year` are NULL for ongoing periods
- All period/event CASCADE-deletes from patient

### Frontend State
`usePatient` hook (`client/src/hooks/usePatient.ts`) is the single source of truth for patient + periods + events. Pages pass this hook's return value down — no global state library. Periods are kept sorted by date in the hook's `addPeriod`.

### Page Routes
| Route | Page | Guard |
|-------|------|-------|
| `/` | Landing | None |
| `/start` | PatientStart | None |
| `/timeline` | Timeline | Patient |
| `/timeline/events/:period_id` | EventMapping | Patient |
| `/summary` | Summary | Patient |
| `/dashboard/login` | FacilitatorLogin | None |
| `/dashboard` | Dashboard | Facilitator |
| `/dashboard/patients/:id` | PatientDetail | Facilitator |

### Backend Routes
```
POST   /api/v1/patients/login                    (rate-limited: 10/min; code must exist)
GET    /api/v1/patients/me
PATCH  /api/v1/patients/me
POST   /api/v1/periods                           (accepts substances[])
PATCH  /api/v1/periods/:id                       (accepts substances[])
DELETE /api/v1/periods/:id
POST   /api/v1/periods/:period_id/events
DELETE /api/v1/events/:id
POST   /api/v1/facilitators/login
POST   /api/v1/facilitators/patients             (generates code + creates patient record)
GET    /api/v1/facilitators/patients
PATCH  /api/v1/facilitators/patients/:id         (update name + substances)
GET    /api/v1/facilitators/patients/:id
GET    /api/v1/facilitators/aggregate
GET    /api/v1/facilitators/export/csv
GET    /api/v1/facilitators/patients/:id/pdf
```

## CSS / Styling Rules

**Critical:** Tailwind config MUST be `tailwind.config.js` (plain JavaScript), NOT `.ts`. PostCSS loads it via sucrase which fails on TypeScript `import type` syntax.

- Never use `@apply` with Tailwind utilities — use plain CSS properties in `index.css` instead
- Custom colours for non-Tailwind contexts are hardcoded as hex: primary green `#16A34A`, error red `#DC2626`, amber `#FCD34D`/`#B45309`
- All CSS classes (`.btn-primary`, `.btn-secondary`, `.btn-danger`, `.pill`, `.pill-selected-*`, `.card`, `.input-base`) are defined in `client/src/index.css`
- Available pill colour schemes in `TriggerTags`: `green | amber | blue | red`
- UI is RTL (`direction: rtl` on body); back-button chevrons must NOT use `rotate-180` — the SVG path already points right which is correct for RTL
- Arabic fonts: Cairo + Tajawal loaded from Google Fonts in `index.html`

## Seed / Test Credentials

- Facilitator: `dr.sherif` / `Recovery2024!`
- Patient A001: أحمد (كحول، أفيونات) — 3 periods with 1 event
- Patient B002: سارة (بنزوديازيبينات) — 3 periods with 1 event
