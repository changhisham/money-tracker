# Money Tracker

A personal finance app: track income and expenses across multiple accounts,
set budgets, split bills with friends, and see it all on a live dashboard.
Data is stored in Firebase (Firestore) so it stays in sync across every
device you sign in on, and it's installable as a home-screen app (PWA) on
phones.

## Features

**Accounts & transactions**
- Multiple accounts (cash, bank, credit card, e-wallet), each with its own
  currency and starting balance, with live computed balances
- Attach a real bank/card/e-wallet logo to an account from a built-in
  directory of Malaysian banks, card networks and e-wallets (brand-colored
  monogram badges — see [Logos](#logos) below)
- Three transaction types: **expense**, **income**, and **transfer**
  between your own accounts
- Payee, category, note, and free-form tags per transaction
- Recurring transactions (weekly/monthly/yearly) with an optional end date —
  due occurrences are generated automatically, and upcoming ones surface on
  the dashboard with a one-tap "Log now"
- Exclude any transaction from budgets & reports while keeping it in your
  ledger and account balance (e.g. internal transfers, reimbursements)
- Search and filter by type, category, payee, note, or tag; CSV export

**Budgets**
- Per-period (week/month/year), per-currency budgets, overall or scoped to
  a single category, with progress bars and over-budget alerts

**Split bills**
- Split any expense equally or by custom amounts across people you add
- Track who owes you per currency, and mark individual shares as settled

**Dashboard & analytics**
- Account balances, budget-usage ring, "up next" recurring bills,
  income/expense/net stat cards with trend sparklines
- Category breakdown (donut chart), income-vs-expense trend chart, and
  period-over-period insights (spend change, top category, biggest expense)

**Everything else**
- Light/dark/system theme
- Desktop sidebar navigation, mobile bottom nav — fully responsive
- Editable profile (display name, avatar initial, member-since, quick stats)
- Password reset by email
- Installable as a home-screen app on iPhone/iPad/Android (PWA)

## Tech stack

Vite + React 19 + TypeScript, Tailwind CSS v4, Firebase (Auth + Firestore),
Recharts, `date-fns`, `vite-plugin-pwa`. Linted with `oxlint`.

## Project structure

```
src/
  components/   Reusable UI pieces (forms, charts, nav, dialogs, badges)
  screens/      Top-level views (Dashboard, Accounts, People, Settings)
  hooks/        Firestore-backed data hooks (useTransactions, useAccounts, …)
  context/      Auth and theme providers
  utils/        Pure logic (date ranges, summaries, recurrence, splits, CSV)
  types.ts      Shared TypeScript types and constants
firestore.rules Security rules (each user can only read/write their own data)
firebase.json   Firebase Hosting + Firestore config
```

## Logos

The app ships a small curated directory of Malaysian banks, card networks
and e-wallets (`src/utils/institutions.ts`) for tagging accounts. Since the
project doesn't have rights to redistribute the real trademarked logo
artwork, each institution renders as a brand-colored monogram badge instead
of an actual logo image.

## Getting started

### 1. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) and create a new project (or reuse one).
2. Open **Build → Authentication → Get started**, and enable the **Email/Password** sign-in method.
3. Open **Build → Firestore Database → Create database**. Start in **production mode**.
4. In **Project settings → General → Your apps**, click the **Web (`</>`)** icon to register a new web app. Copy the `firebaseConfig` values shown.
5. Open **Firestore Database → Rules**, paste the contents of [`firestore.rules`](./firestore.rules), then **Publish**. This ensures each signed-in user can only read/write their own data.

### 2. Configure the app

```bash
cp .env.example .env
```

Fill in `.env` with the values from step 4 above (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc.).

### 3. Run it

```bash
npm install
npm run dev
```

Open the printed local URL and sign up with an email/password — this is
just for you, it's what keeps your data synced across devices.

### 4. Use it like an app on your phone

- **iPhone/iPad (Safari):** open the deployed URL → tap the Share icon → **Add to Home Screen**.
- **Android (Chrome):** open the deployed URL → menu (⋮) → **Add to Home screen** / **Install app**.

To use it on your phone before deploying, run `npm run dev -- --host` and
visit your computer's local IP from your phone while on the same Wi-Fi.

## Deploying

The project is pre-configured for **Firebase Hosting** (same project as
Auth/Firestore, so it's the least setup). See
[DEPLOY.md](./DEPLOY.md) for full step-by-step instructions, including
alternatives (Vercel, Netlify) if you'd rather use those.

Quick version:

```bash
npm install -g firebase-tools   # one-time
firebase login
npm run build
firebase deploy --only hosting,firestore:rules
```

## Data model

```
users/{uid}/accounts/{accountId}     { name, type, currency, startingBalance, institutionId? }
users/{uid}/transactions/{txId}      { type, amount, currency, accountId, toAccountId?, category?,
                                        payee?, tags?, note, date, recurrence?, recurringGroupId?,
                                        recurrenceEnd?, excluded?, splitWith? }
users/{uid}/budgets/{period_currency[_category]}  { period, currency, amount, category? }
users/{uid}/people/{personId}        { name }
users/{uid}/meta/preferences         { displayName?, defaultCurrency?, customExpenseCategories?, customIncomeCategories? }
```

## Available scripts

| Command           | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`       | Start the local dev server           |
| `npm run build`     | Type-check and build for production  |
| `npm run preview`   | Preview the production build locally |
| `npm run lint`      | Run oxlint                           |
