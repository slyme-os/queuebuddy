# QueueBuddy – Bengaluru

Book a verified **Queue Buddy** to hold your place in line at RTO, Sub-Registrar, Passport Seva Kendra and BBMP offices in Bengaluru. Track the queue live and arrive only when your turn is near.

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase · Razorpay · MapLibre · PWA

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

No environment variables are needed. Without Supabase keys the app runs in **demo mode**: every flow works in the browser, data is kept in `localStorage`, and a demo bar at the top lets you switch between Customer / Buddy / Admin and reset data. Open two tabs to see buddy updates appear live in the customer's tab.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint (next/core-web-vitals) |
| `npm run typecheck` | TypeScript check |

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new). The framework is detected automatically.
3. Deploy. It works immediately in demo mode.

For production, add these environment variables in Vercel (see `.env.example`) and set `NEXT_PUBLIC_DEMO_MODE=false`:

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth & data |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only: DPDP account deletion (`/api/account/delete`) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Real checkout (`/api/payments/order`, `/api/payments/verify`) |
| `RAZORPAY_WEBHOOK_SECRET` | Signed webhook at `/api/webhooks/razorpay` |
| `NEXT_PUBLIC_MAP_PROVIDER`, `NEXT_PUBLIC_MAP_KEY` | Optional MapTiler style (default: free CARTO dark tiles) |

Without real Razorpay keys, payment is simulated. The webhook rejects all requests until a real secret is set.

## Portals

| Route | Who | Sign-in |
| --- | --- | --- |
| `/` | Everyone | Public landing, office directory, live crowd data |
| `/app` | Customers | Google, email + password, or magic link (`/login`) |
| `/buddy` | Queue Buddies | Phone OTP (`/buddy/login`, demo code `123456`); apply at `/buddy/apply` |
| `/admin` | Staff | Email + password + TOTP 2FA (`/admin/login`) |
| `/account` | Any signed-in user | Profile, preferences, data export, account deletion |

**Admin clearance** is enforced in the UI and by Supabase row-level security:

| Sub-role | Can do |
| --- | --- |
| `super_admin` | Everything, plus staff invites |
| `ops` | Dispatch, reassign buddies, verify buddies |
| `support` | Disputes & refunds; read-only dispatch/buddies |
| `content` | Offices, services, fees, document checklists |

## Features

- **Office directory:** search by office, area or service, type filters, dark map with live markers, office timings and holiday info, "Notify me" for coming-soon offices.
- **Honest crowd data:** live buddy reports, then visitor reports, then historical patterns. Visitors can submit "I'm here" reports.
- **Booking wizard:** holiday-aware dates, validated contact details, language matching (primary + backup), transparent fees (government fee shown separately), Razorpay checkout.
- **Live tracking:** progress timeline, token and people-ahead, a "head to office now" alert, call/WhatsApp your buddy, cancel with refund, report a problem, rate the buddy.
- **Document checklist:** per service, with progress ring, printable view, and evening reminders. No documents are ever uploaded.
- **Buddy cockpit:** accept jobs, location check-in, one-tap queue updates, summon the customer, hand over the spot, UPI payout.
- **Admin desk:** KPIs, dispatch, KYC verification, content management, disputes/refunds, launch demand, staff invites.
- **Bilingual:** English / ಕನ್ನಡ toggle.
- **PWA:** installable, with offline shell and push notification handler.

## Supabase setup

1. Run the SQL in `supabase/migrations/` in order (including `20261020000000_security_hardening.sql`, which fixes recursive RLS policies), then optionally `supabase/seed.sql` and `supabase/cron_jobs.sql`.
2. **Auth → Providers:** enable Email, Google (add `https://<project>.supabase.co/auth/v1/callback` as the redirect URI in Google Cloud) and Phone (Twilio/MessageBird).
3. **Auth → URL configuration:** add your Vercel domain to the redirect URLs.
4. **Auth → MFA:** enable TOTP. Staff must enrol a factor before they can sign in to `/admin`.
5. New sign-ups get the `customer` role automatically. Promote staff in `public.user_roles`.

## Project structure

```
src/
  app/                 routes (/, /app, /login, /buddy, /admin, /account, api/*)
  components/
    ui/                Modal, Toast, primitives (Alert, Stat, Toggle, …)
    layout/            Navbar, BottomNav, DemoBar, Footer, ServiceWorker
    offices/ map/      directory, office detail, crowd status, MapLibre map
    booking/           wizard, live tracker, checklist, my bookings
    buddy/ admin/      portals
  context/             AuthContext (Supabase or demo), AppContext (state + cross-tab sync)
  lib/                 config, utils, i18n, seed data, razorpay client
supabase/              migrations, seed, cron, edge function
```

> Office timings, fees and checklists are sample data for demonstration. Always confirm them at the office.
