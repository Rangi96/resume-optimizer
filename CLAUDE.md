# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server on port 5173. Proxies `/api/*` to the deployed Vercel backend at `resume-optimizer-sepia.vercel.app` (see [vite.config.js](vite.config.js)), so the frontend hits production serverless functions during local dev unless you run `vercel dev` instead.
- `npm run build` — Production build to `dist/` with manual chunks (`vendor`, `icons`, `parser`) and terser minification.
- `npm run preview` — Serve the built `dist/` on port 4173.
- `npm run lint` — ESLint over `src/**/*.{js,jsx}`. Flat config in [eslint.config.js](eslint.config.js); uppercase-prefixed unused vars are allowed.
- `npm run format` — Prettier write across `src/`.

There is no test runner configured. Node 18.x or 20.x is required.

## Architecture

This is a Vite + React 18 SPA with Vercel serverless functions for the backend. The frontend is deployed as static assets; `api/*.js` files are deployed as individual serverless functions (`maxDuration: 30s`, region `iad1`, see [vercel.json](vercel.json)).

### Frontend layout
- [src/main.jsx](src/main.jsx) → [src/App.jsx](src/App.jsx): `BrowserRouter` with four routes — `/` (LandingPage), `/app` (MainApp, wrapped in `ProtectedRoute`), `/privacy`, `/terms`. Footer renders only on `/app`.
- [src/AuthContext.jsx](src/AuthContext.jsx): single source of truth for the authenticated user. On `onAuthStateChanged`, it **awaits** `initializeUserDocument` (creating the Firestore user doc on first login, including a referral code), then reads `paymentStatus` from Firestore and merges it into the user object as `user.paymentStatus`. Components must read `paymentStatus` from this merged user, not from raw Firebase auth.
- [src/pages/MainApp.jsx](src/pages/MainApp.jsx): the bulk of the UI — a 3-phase flow (`upload` → `optimize` → `format`) for uploading a resume (DOCX via `mammoth`, PDF via the `/api/extract-pdf` function), running optimization, and rendering a styled export. This file is ~2000 lines and holds most product logic.
- i18n: [src/i18n/config.js](src/i18n/config.js) loads JSON namespaces (`common`, `templates`, `legal`, `errors`, `auth`) from [public/locales/{en,es}/](public/locales). Language is detected from `localStorage` key `preferredLanguage`, then `navigator`. The `language` is also passed into the AI optimize/gaps endpoints to control response language.

### Storage adapter pattern
[src/storageAdapter.js](src/storageAdapter.js) exposes a single `storageAdapter` chosen by the `VITE_STORAGE_PROVIDER` env var (`localStorage` for dev, `firestore` for production). It implements `getOptimizationData`, `recordOptimization`, `initializeUserDocument`, and `processReferral`. [src/optimizationManager.js](src/optimizationManager.js) wraps the adapter and adds:
- Tier limits (`OPTIMIZATION_LIMITS`): `premium_10` ($9, 10 optimizations / 400k tokens) and `premium_20` ($16, 20 / 1M tokens). Free/`unpaid` users are blocked from optimizing.
- Referral bonus credits: when a user exhausts their tier, `recordOptimization` consumes a `referral.bonusCredits` slot atomically before falling back.
- A dev-mode bypass: `VITE_DEV_MODE=true` returns unlimited access without touching storage.

Firestore writes use atomic `increment()` to avoid race conditions; Firestore is the production source of truth and `localStorage` is browser-only/dev.

### Backend (`api/`)
All endpoints export a default `handler(req, res)` (Vercel serverless signature). Each AI endpoint (`optimize`, `gaps`, `suggestions`, `generate-bullet`, `extract-pdf`) implements its own in-memory IP rate limit (10 req/min, 20 for `create-checkout`) and input size validation, then calls `https://api.anthropic.com/v1/messages` with `process.env.ANTHROPIC_API_KEY` (model: `claude-sonnet-4-20250514`, 30s `AbortController` timeout). Token usage is read from `data.usage` and returned to the client as `tokensUsed`, which the frontend then passes to `recordOptimization` for quota accounting.

Stripe flow: [api/create-checkout.js](api/create-checkout.js) creates a Checkout Session for `plan_10_exports` ($9) or `plan_20_exports` ($16); [api/webhook.js](api/webhook.js) verifies the signature, looks up the price via `STRIPE_PRICE_ID_10` / `STRIPE_PRICE_ID_20`, and updates the user's `paymentStatus` in Firestore using `firebase-admin` (server-side credentials). The webhook **must not** have body parsing enabled — `config.api.bodyParser = false` is set so signature verification works on the raw body.

[api/process-referral.js](api/process-referral.js) is called from the frontend during user initialization (it needs admin-level Firestore writes, hence the server hop). [api/check-user.js](api/check-user.js) looks up users by email via `firebase-admin`.

### Environment split
Frontend env vars are prefixed `VITE_*` (Firebase web config, `VITE_API_URL`, `VITE_STORAGE_PROVIDER`, `VITE_DEV_MODE`). Server-only secrets (`ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_*`, `FIREBASE_PROJECT_ID`/`CLIENT_EMAIL`/`PRIVATE_KEY` for admin SDK) live only in Vercel env vars and are never exposed to the bundle. See [.env.example](.env.example).

### Routing/SPA on Vercel
[vercel.json](vercel.json) rewrites `/api/*` to functions and everything else to `/index.html` for client-side routing. Security headers (HSTS, X-Frame-Options DENY, etc.) are set there too.
