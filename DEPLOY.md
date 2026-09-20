# Deploying Money Tracker

This app is a static single-page app (Vite build output) that talks
directly to Firebase (Auth + Firestore) from the browser — there's no
server to run. Any static host works. Firebase Hosting is the path of
least setup since it's the same project as Auth/Firestore already.

Make sure `.env` is filled in locally first (see the main [README](./README.md#2-configure-the-app)) — `npm run build` bakes those `VITE_FIREBASE_*` values into the build.

## Option A — Firebase Hosting (recommended)

The repo already includes `firebase.json` (hosting + rules config) and
`.firebaserc` (pointing at the `money-tracker-42cd5` project), so this is
just:

1. **Install the Firebase CLI** (one-time, if you don't have it):
   ```bash
   npm install -g firebase-tools
   ```

2. **Log in** (opens a browser to authenticate with the Google account that owns the Firebase project):
   ```bash
   firebase login
   ```

3. **Build the app:**
   ```bash
   npm run build
   ```
   This type-checks and outputs the production build to `dist/`.

4. **Deploy hosting and the Firestore security rules together:**
   ```bash
   firebase deploy --only hosting,firestore:rules
   ```
   (Just `firebase deploy --only hosting` for hosting alone, e.g. on
   repeat deploys where the rules haven't changed.)

5. The CLI prints your live URL — something like
   `https://money-tracker-42cd5.web.app`. Firebase Hosting serves it over
   HTTPS on a global CDN automatically.

**Custom domain (optional):** Firebase console → **Hosting** → **Add custom
domain**, then follow the DNS verification steps it gives you.

**Redeploying:** repeat steps 3–4 any time you have new changes.

**Automating it (optional):** `firebase init hosting:github` sets up a
GitHub Actions workflow that builds and deploys on every push to `main`
(and preview-deploys on pull requests). It'll ask you to authorize a
service account and store it as a repo secret — safe to run from this
repo since `firebase.json`/`.firebaserc` are already in place.

## Option B — Vercel

1. [Import the repo](https://vercel.com/new) in the Vercel dashboard (or `npx vercel` from this directory).
2. Framework preset: **Vite** (auto-detected).
3. **Environment variables** — add each of these in the project's Settings → Environment Variables (Vercel builds in the cloud, so it needs them there, not just in your local `.env`):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Deploy. Vercel runs `npm run build` and serves `dist/` automatically, with SPA routing handled out of the box.

## Option C — Netlify

1. [Import the repo](https://app.netlify.com/start) in the Netlify dashboard (or `npx netlify deploy` from this directory).
2. Build command: `npm run build`. Publish directory: `dist`.
3. Add the same six `VITE_FIREBASE_*` environment variables as above, under Site settings → Environment variables.
4. Add a `public/_redirects` file with `/*  /index.html  200` so client-side routing works on refresh/deep links (Firebase Hosting and Vercel handle this automatically via `firebase.json`'s rewrite rule and Vercel's Vite preset respectively; Netlify needs it spelled out).

## After deploying, on any host

- **Authorized domains:** Firebase Auth only allows sign-in from domains you've approved. Go to Firebase console → **Authentication → Settings → Authorized domains** and add your deployed domain (Firebase Hosting's `*.web.app`/`*.firebaseapp.com` domains are added automatically; a custom domain or Vercel/Netlify domain needs adding manually) — otherwise sign-in will fail with an `auth/unauthorized-domain` error.
- **Install it as an app:** open the deployed URL on a phone and use the browser's "Add to Home Screen" (iOS Safari) or "Install app" (Android Chrome) — see the main README.
