# Problemator mobile: back on the App Store and Play Store

**Status:** approved in outline, not yet planned
**Date:** 2026-08-19
**Target release:** 1.5.0

This is **sub-project 1 of 2**. It ships a submittable native app on both
stores with no new features. Push notifications are sub-project 2 (1.6.0),
deliberately after the pipeline is proven.

## Why

The app is a Framework7 PWA served from `pwa.problemator.fi`. It was in a store
once and the build lapsed. The goal is a listing on both stores again, without
giving up the web app and without a rewrite.

## Why not React Native or Flutter

Rewriting 18,541 lines across 103 components would take months and buy nothing
this app needs. Its native requirements are: a camera for QR scanning, and
later push. Everything else is a normal web app.

Framework7 exists to be shipped this way — it is a mobile UI framework designed
for a WebView shell. The cost of using it has already been paid; a rewrite
would discard that and re-earn it.

**Capacitor wraps the existing build.** `npm run build` emits `www/`, which is
already the PWA deploy directory and becomes Capacitor's `webDir` unchanged.
Web, iOS and Android are then the same bytes and cannot drift.

## What is NOT a problem, contrary to first impressions

An early read of `.env.production` suggested a blocker:
`VITE_REDIRECT_URI=https://pwa.problemator.fi/`. An https redirect cannot work
for native auth, which normally forces a custom URL scheme or App Links.

Both halves of that turned out to be wrong:

- **Auth is OTP, not redirect-based.** `/auth/otp/request` → `/auth/otp/verify`
  → a JWT in `localStorage`. There is no Auth0 SDK, no `redirect_uri`, no
  browser round-trip. It works identically inside a WebView.
- **`VITE_REDIRECT_URI` is misnamed.** Its only use is Framework7's
  `browser-history-root` in `app.vue`. It has nothing to do with auth.

So there is no custom-scheme work, no App Link verification, and no Associated
Domains entitlement. This is the single largest simplification in the project
and it is worth stating plainly, because the variable's name implies otherwise
and the next person to read it will assume the same thing.

## Scope

1. **Add Capacitor** with `webDir: 'www'` and appId `fi.problemator.app`.
2. **Generate the iOS and Android projects.**
3. **Branch the handful of behaviours that must differ on native** (below).
4. **Store assets and compliance** — icons, splash, iOS privacy manifest, Play
   data-safety declaration, age ratings.
5. **Get a build onto TestFlight and Play internal testing.** Not public
   release — that is a decision for after the builds are seen on a device.

### Not in scope

Push notifications. No new features. No visual redesign. No changes to the
Vuex store, the API layer, or the backend.

## The platform-difference surface

This is deliberately enumerated rather than described, because the honest
argument for Capacitor is that the list is short. If it grows during
implementation, that is a signal worth reporting, not absorbing.

**One module, `src/js/platform.js`**, exposing `isNative`, `isIOS`, `isAndroid`
from Capacitor. Everything below branches on it.

| Where | Web today | Native must |
|---|---|---|
| `app.vue` `browser-history` | `true`, rooted at `pwa.problemator.fi` | **off** — Capacitor serves from `capacitor://localhost` (iOS) and `https://localhost` (Android), so pushing state against a mismatched root misbehaves |
| "Update now" button | `window.location.reload()` | open the store listing — a reload never updates a shipped binary |
| Android hardware back | n/a | must pop the Framework7 router, not exit the app |
| Status bar / safe areas | n/a | notch and home-indicator insets |
| Service worker | generated, never registered | nothing to do — see below |

**Correction to an earlier draft of this spec.** It claimed a stale Workbox
precache would serve an old app inside a new binary, and called that the
likeliest source of post-release confusion. That risk does not exist: `npm run
build` runs `workbox generateSW` and emits `www/service-worker.js`, but nothing
in the codebase ever calls `navigator.serviceWorker.register`. The file is
built and deployed on every release and has never been active.

So there is no native guard to write. Two consequences worth recording
separately, neither in scope here:

- the PWA has **no offline caching**, despite shipping a service worker
- `doReloadApp` in `LeftSidepanel.vue` carefully unregisters service workers
  and clears caches that were never created

## Versioning and release

Already built and in place (`scripts/release.sh`, `src/js/version.js`):

- `package.json` version is the only number anyone edits
- the store build number derives from it — `1.5.0` → `10500`
- the backend's `APP_VERSION` is written by key, so the in-app update banner
  compares against the real latest version
- the script already runs `npx cap sync` when `ios/` or `android/` exist, and
  skips it when they do not

**The web app keeps releasing on its own schedule.** `./scripts/release.sh`
deploys the PWA immediately and leaves the native build staged. Store
submission is a separate, deliberate act. This is the property that matters
most given the maintainer's stated frustration with store review: web is never
blocked on Apple.

## Store compliance

The parts that fail submissions, rather than the parts that fail to compile.

- **Guideline 4.2, "minimum functionality".** Apple rejects apps that are a
  repackaged website. Framework7 already looks and behaves native, which is
  most of the defence. Using genuine device capability — the camera for QR
  scanning is already there — is the rest.
- **iOS privacy manifest** (`PrivacyInfo.xcprivacy`), required since iOS 17.
  This app's declarable use is the camera, plus `localStorage` for the session
  token.
- **Play data safety form** — must match what the app actually collects: email
  for the OTP login, climbing ticks, and nothing else.
- **Permission strings.** iOS requires a human `NSCameraUsageDescription`.
  "Scan the QR code on a problem's tag to open it" is the truthful one.
- **Age rating** on both stores.

## Verification

I cannot run a simulator, sign a build, or submit to a store, and I will not
claim otherwise. What I can verify: the projects generate, `npx cap sync`
succeeds, the web build still passes lint, tests and build, and the branching
logic is unit-tested.

Everything else is a device check by the maintainer, and gets a written
checklist the same way the dashboard work did:

- the app launches and reaches the login screen
- OTP login completes and the session survives a cold start
- QR scanning opens the camera and resolves a problem — twice in a row, since
  that was a live bug fixed in 1.4.1
- Android hardware back navigates rather than exiting
- no white bar under the notch or over the home indicator
- the update banner does not appear when the app is current

## Open questions

1. **Which Apple team and Google account own the listing?** Both accounts
   exist. The bundle id `fi.problemator.app` must be registered under the right
   team before signing.
2. **Store listing copy and screenshots.** Needed for submission, and not
   something to invent — the wording is the gym's voice, not mine.
3. **Does the production backend share `/var/sites/problemator_backend/.env`?**
   That file has `PWA_URL=https://localhost:3000`, which reads as a development
   environment. The update banner only works for real users if whatever serves
   `api3.problemator.fi` also gets `APP_VERSION`.

## Success criteria

- `ios/` and `android/` generate, and `npx cap sync` succeeds from a clean build
- the five platform differences above each branch on `platform.js`, with tests
  for the pure logic
- `npm run lint`, `npm test` and `npm run build` all still pass
- a build is on TestFlight and on Play internal testing
- the web app still deploys from the same artifact, unchanged
