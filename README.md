# Nairobi Eats: restaurant discovery platform

Discovery and information only. No reservations, ordering, payments or delivery.

## Setup

1. `npm install`
2. `cp .env.example .env.local` and fill in values (at minimum DATABASE_URL, DIRECT_URL, JWT_SECRET, JWT_REFRESH_SECRET)
3. `npx prisma generate`
4. `npx prisma migrate dev --name phase2_schema`
5. `npm run db:seed`
6. `npm run dev`, then open /api/health to confirm the database connection

## Demo accounts (sample data, created by the seed)

| Role | Email | Password |
|---|---|---|
| Customer | customer@example.com | Demo@12345 |
| Owner | owner@example.com | Demo@12345 |
| Admin | admin@example.com | Demo@12345 |

Override the password with SEED_PASSWORD. The seed refuses to run when NODE_ENV=production
unless ALLOW_DEMO_SEED=true. Delete the demo accounts before a real launch.

## Phases

- Phase 1: setup and architecture (done)
- Phase 2: database schema and seed data (done)
- Phase 3: authentication (done)
- Phase 4: public homepage (done)

## Authentication (Phase 3)

- Pages: /login, /register, /forgot-password, /reset-password, /verify-email
- API: /api/auth/{register,login,refresh,logout,me,verify-email,resend-verification,forgot-password,reset-password}
- Access token: 15 minutes. Refresh token: 30 days, rotated on every use, reuse revokes the session.
- Both are httpOnly cookies. `proxy.js` guards /account, /favorites, /owner, /admin.
- Without RESEND_API_KEY and RESEND_FROM_EMAIL, emails are printed in the terminal running `npm run dev`.
- Self-registration always creates a CUSTOMER. Owner and admin roles come from an admin (Phases 15 and 16).

## Homepage and search URLs (Phase 4)

The homepage and quick filters send people to `/explore` with these parameters (Phase 5 reads them):
`q`, `cuisine`, `area`, `vibe`, `price` (BUDGET, MODERATE, MID_RANGE, PREMIUM, LUXURY), `rating` (minimum), `open=1`,
plus `sort` (trending, newest, rating) and `featured=1`.

Not on the homepage yet: Popular Near You (Phase 6, needs location), Recently Viewed (Phase 10), AI recommendations (Phase 13).
