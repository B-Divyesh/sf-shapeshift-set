# Shapeshift Set repair handoff

## Repair completed

This repair fixes the release-blocking `@claim:offline-reload` failure in
candidate `d5625c97c7f93ed8772aa887c95df8209a18c46b`.

- The generated production service worker now treats every same-origin
  navigation as an SPA navigation. It returns the revisioned, precached
  `/index.html` app shell before attempting the network, so `/demo` does not
  depend on a separate cached route response when offline.
- The precache manifest now contains actual shell files and current hashed
  JS/CSS assets rather than depending on the host's navigation fallback to
  populate `/demo`, `/privacy`, and `/terms` cache entries.
- The offline claim uses its own `browser.newContext()` and closes only that
  context in `finally`. Before network access is disabled it waits for both an
  active registration and a controlling service worker, then verifies the
  current app shell and exactly loaded JS/CSS are cached.
- The regression deliberately asserts `/demo` has no route-specific cache
  entry. The subsequent offline `/demo` navigation still renders “Place five
  sample creatures in order,” proving it uses the app-shell fallback.

The product remains a static, free one-player browser game deployed from
`dist/`. It has no account, analytics, payment, backend, or third-party
runtime resource. Real progress is localStorage-only; `/demo` stays in memory.

## Run and deploy

```sh
npm ci
npm test
npm run build
/opt/fleet/lib/deploy-static.sh shapeshift-set dist
```

The demo is `/demo`, seeded with the fixed August 14, 2026 sample board.

## Verification evidence

- Clean `npm ci`: passed; 22 packages installed and npm reported 0
  vulnerabilities.
- Focused offline regression: `npm test -- --grep @claim:offline-reload`
  passed three consecutive clean build-and-test runs.
- Full `npm test`: passed 15/15 Playwright tests. This covers every registered
  claim, deterministic game core, end screen and restart, local persistence,
  demo isolation, offline reload, 220 ms settle motion, 60 Hz timing target,
  keyboard play, same-origin privacy, UTC daily seed behavior, no-up-sells,
  axe serious/critical scans across five routes, and 390 px mobile/desktop
  opening-board geometry.
- Exact production build, `npm run build`: passed. The artifact contains
  `dist/index.html`, `dist/sw.js`, 23.28 kB JS (8.67 kB gzip), and 16.10 kB CSS
  (4.47 kB gzip); both initial code bundles remain below the static-product
  budget.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/demo`: passed against a
  local production preview. It returned HTTP 200, `Demo — Shapeshift Set`,
  `lang=en`, one `<h1>`, `<main>`, zero missing image alt attributes, zero
  unlabeled buttons, and zero console errors. Playwright axe integration in
  the full suite found no serious or critical violations.

## Known gaps and next steps

- The brief's aggregate completion target is intentionally not measured:
  adding telemetry would conflict with the product's no-analytics privacy
  policy.
- Daily variety currently uses deterministic transforms of a solver-verified
  layout. Future content should add additional solver-verified layouts.
