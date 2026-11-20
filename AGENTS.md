# RigSetGo – Supplier Admin Portal (clickable working design)

A complete, clickable working design of the **Supplier Admin** portal for RigSetGo, the Atlanta construction equipment rental marketplace. It is a front-end only app with sample data: no backend, no API keys, no environment variables. It opens directly in Figma Make.

- **User:** Mark Rivera, Supplier Admin (owner) of Atlanta Heavy Rentals LLC. Full access to every section.
- **Source of truth:** RigSetGo BRD v1.1 (with client comments), the approved user flow "01 · Supplier Admin" in FigJam, and the approved navy dashboard and onboarding designs in Figma.
- **Demo date:** Friday, November 20, 2026 (`TODAY` in `src/data/seed.ts`).

## Demo sign-in

1. Any email and any password on the sign-in screen.
2. Security code **482193**. Three wrong codes lock the account (unlock screen with an "unlock link" demo button).
3. A short 4-step welcome tour opens after the first sign-in (re-open it from the profile menu).
4. **Reset demo data** is in the profile menu (top right). Demo changes are kept in `sessionStorage`.

## Tech

- React 19 + Vite + TypeScript, `HashRouter`. Entry: `index.html` → `src/main.tsx` → `src/App.tsx`.
- Icons: `@tabler/icons-react`. Font: `@fontsource/plus-jakarta-sans` (400/500/600/700).
- Plain CSS design tokens and all component styles in `src/styles/app.css` (no Tailwind).
- Images in `public/images`, referenced with relative paths (`images/excavator-sunset.jpg`).
- `npm install` then `npm run dev`. `npm run build` type-checks and builds.

## Structure

```
src/
  main.tsx, App.tsx          routes (HashRouter)
  styles/app.css             design tokens + every component style
  data/types.ts              data model
  data/seed.ts               all sample data, TODAY, FEE_RATE (12%), required documents per category
  data/utils.ts              money/date helpers, availability checks, fleet stats, earnings
  store/store.tsx            app state + auth in sessionStorage, update() with history/notification/toast, resetDemo()
  components/Layout.tsx      sidebar, header (search, notifications, profile menu), footer, help, welcome tour
  components/ui.tsx          Modal, ConfirmDialog, ReasonDialog (reason required), Badge, Tabs, Pills, Toggle, Field, Empty, Stars, SecurityCodeDialog
  components/charts.tsx      LineChart, MiniLine, Donut, Bars, RouteMap (live route with moving truck)
  pages/Auth.tsx             sign in, security code, locked, supplier sign-up (8 steps)
  pages/Dashboard.tsx        live dashboard
  pages/Storefront.tsx       public page + edit
  pages/Equipment.tsx        list, detail (units, pricing, documents, bookings), add/edit wizard with listing checks
  pages/Pricing.tsx          price table + PricingModal
  pages/Calendar.tsx         unit calendar + BlockModal
  pages/Quotes.tsx           quote requests list + detail + send quote
  pages/Bookings.tsx         bookings list + detail
  pages/Deliveries.tsx       deliveries list, live tracking, TicketModal (delivery/return ticket)
  pages/Compliance.tsx       documents + UploadDocModal
  pages/Reviews.tsx          reviews + report
  pages/Support.tsx          cases list, new case, case thread
  pages/Earnings.tsx         earnings, payouts, by-booking breakdown
  pages/Team.tsx             members, invite, ready-made (locked) roles, custom roles
  pages/Settings.tsx         business profile, payout account, notifications, security, history
```

## Design system

- Primary navy `#003778`, white surfaces, page background `#F3F6FA`, lines `#E3E9F1`.
- Orange `#F7941D` (from the logo) is an accent only: badges, alerts, stars, highlights.
- Status colours: green `#12A150` (good / done), orange (waiting / needs action), red `#D92D20` (problem / blocked).
- Plus Jakarta Sans. Body 15 px, titles 22–34 px. Calm, plain wording for users aged 60+.
- Cards 22 px radius, buttons 12 px radius. Real equipment photos from the approved Figma file.

## Routes and every flow

| Route | Screen | What works |
|---|---|---|
| `#/login` | Sign in | Email + password, forgot password (sends link), link to sign-up |
| `#/login/code` | Security code | 482193 signs in; wrong code counts down; 3 wrong codes lock |
| `#/login/locked` | Account locked | Email unlock link → unlock (demo) → sign in again |
| `#/signup` | Supplier sign-up | 0 Welcome (choose "I rent out equipment") → 1 Account (validation, password strength, terms) → 2 Verify email (resend timer, change email) → 3 Business details (service areas, hours, delivery/pickup) → 4 Documents (upload, remove) → 5 Payout account (Stripe, PayPal or Square on the provider's page) → 6 Review and submit (edit any step) → 7 Under review: demo **Approve** (→ verified → dashboard + tour) or **Ask for more info** (→ back to documents with the reason) |
| `#/` | Dashboard | Live delivery (tabs, progress, map), alerts (expired/expiring documents, extensions, extra charges, quotes, failed payouts), booking details (switch booking), fleet utilization, bookings trend (7/30 days), earnings (month switch), booking status, rental days booked, quote requests, add equipment |
| `#/storefront` | Storefront | Live preview; edit about, areas, hours, delivery/pickup, policies; business name/phone/email changes wait for a RigSetGo check (demo approve) |
| `#/equipment` | Equipment list | Filter by status and category, search, add equipment |
| `#/equipment/:id` | Equipment detail | Change status (Published, Unavailable, Maintenance, Retired with reason), publish checks, delete draft, units (add, edit, remove unless booked, open unit calendar), pricing, documents (upload/replace), bookings; "bookings paused" banner when a document is expired |
| `#/equipment/new`, `#/equipment/:id/edit` | Add / edit wizard | Basics + photo → details → units → price + booking mode → documents for the category → listing checks → save as draft or publish |
| `#/pricing` | Pricing | Daily, weekly, 4-week, min days, hours, overtime, delivery fee, deposit, weekends, instant booking; validation; saved in history; recent price changes |
| `#/calendar` | Calendar | Per equipment + unit month view; bookings, maintenance, outside rentals; block dates (cannot block booked or already-blocked days); remove block; click a booking to open it |
| `#/quotes`, `#/quotes/:id` | Quote requests | Tabs; unit availability check; send itemized quote with valid-until date; decline with reason; change or withdraw quote; demo "contractor accepts and pays" creates a confirmed booking and a delivery job |
| `#/bookings`, `#/bookings/:id` | Bookings | Tabs incl. "Needs action", search; detail: demo bank confirms payment, accept/decline extension (availability checked), approve/drop extra charge, cancel with reason (refund), plan delivery, record yard handover/return, report breakdown (repair or swap unit, opens a support case), schedule pickup, complete rental (deposit returned); money split (fee, your share, deposit kept separate); history |
| `#/deliveries`, `#/deliveries/:id` | Deliveries & tracking | Today/upcoming/needs driver/completed; assign driver; start trip; live map moves while open; running late (notifies contractor); delivery/return ticket with photos, condition, fuel, meter, machine-ID check and signature; return damage creates an extra charge for review |
| `#/compliance` | Compliance | Status counts, filters, upload/replace with expiry date, demo RigSetGo accept/reject (reason), expired documents pause bookings until accepted |
| `#/reviews` | Reviews | Rating summary, filters, report a review (reason required), demo RigSetGo keep/remove |
| `#/support`, `#/support/:id` | Support cases | Open a case on a booking, reply with files, resolve/reopen |
| `#/earnings` | Earnings & payouts | KPIs, monthly chart, payouts (details, statements), failed payout → send again, by-booking breakdown |
| `#/team` | Team & roles | Invite (ready-made or custom role), change role, switch off with reason, reactivate, remove; ready-made roles are locked; custom roles = sidebar sections on/off; duplicate a ready-made role |
| `#/settings` | Business settings | Profile, payout account (change bank needs security code 482193), notifications (email, SMS consent, in-app, quiet hours, topics), security (password, sign out other devices), full history |

Everything connects: actions update lists, dashboard numbers, sidebar badges, notifications and the History tab.

## Decisions still to confirm with the client

- Payout release rule (when suppliers are paid) — shown as "the agreed payout rule".
- Document list per equipment type — sample list in `REQUIRED_DOCS` (Nick to provide).
- GPS method for live tracking (driver phone vs machine trackers) — simulated in the demo.
- Whether suppliers can reply publicly to reviews (not included).
