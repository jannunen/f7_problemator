module.exports = {
  globDirectory: 'www/',
  // index.html is deliberately NOT globbed here — see the runtimeCaching
  // entry below for why.
  //
  // The entry bundle (assets/index.<hash>.js) is ~4.3 MB, over workbox's
  // default 2 MB maximumFileSizeToCacheInBytes, so it is silently excluded
  // from the precache. If index.html were precached alongside it, the
  // service worker would serve that precached HTML on every visit
  // (precaching maps "/" to a cached index.html by default) while the
  // bundle it references keeps changing every deploy — the HTML is
  // effectively pinned forever, pointing at whatever bundle existed at
  // precache time. That combination is exactly what left every user on a
  // stale build with no new deploy ever taking effect
  // (fix/service-worker-serves-stale-app).
  //
  // The fix is not to raise the size cap and precache the ~4.3 MB bundle
  // too (that would make the precache ~6 MB, a real cost on a phone, and
  // the same trap returns the day the bundle crosses whatever cap is set).
  // Instead, index.html is never precached, so it can never disagree with
  // the bundle it points at: navigations always ask the network first (see
  // runtimeCaching), so they always get current HTML referencing whatever
  // bundle the server actually has.
  globPatterns: ['**/*.{woff,woff2,js,css,png,jpg,svg}'],
  /* pass array of globs to exclude from caching */
  globIgnores: [],
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
  swDest: 'www/service-worker.js',
  // Navigations (loading the page itself) go to the network first, so a
  // deploy takes effect on the very next visit. Only when there is no
  // network at all — opening the app offline — does this fall back to
  // whatever page was last served successfully. maxEntries: 1 because this
  // is a single-page app: every route is client-side, so there is only ever
  // one navigable document worth keeping.
  //
  // scripts/verify-precache-consistency.mjs (run at the end of `npm run
  // build`) asserts index.html and its entry bundle can never disagree —
  // whether that means both are precached or, as here, neither is.
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        networkTimeoutSeconds: 3,
        cacheableResponse: { statuses: [0, 200] },
        expiration: { maxEntries: 1 },
      },
    },
  ],
};
