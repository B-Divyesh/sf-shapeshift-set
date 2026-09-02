# Shapeshift Set repair handoff

## Release repair

This repair addresses every release blocker in independent verification report
`a37cfde877214d07755c393b7181239997923690` for candidate
`071f7ddff392dfd57131f3d1f49e968a7bf1a166`.

- The service worker is now generated at build time with a revisioned precache
  manifest containing that build's `index.html`, hashed JS, hashed CSS, routes,
  and required images. It cannot activate until the complete first-load shell
  is cached. The offline claim test uses a dedicated context, confirms service
  worker control and cached current modules, then opens `/demo` offline.
- The board moved into the opening composition beside the introduction on
  desktop and directly after compact first-screen copy on mobile. At 1440×900
  it measured y=316.45–629.53. At 390×844 `/demo` measured
  y=467.67–777.77; the real board uses the same 310px square and also fits.
- Header navigation, demo controls, and footer links now have at least 44×44
  CSS-pixel hit areas. The mobile browser test measures each visible target.
- The unsupported 3–5 minute promise was removed. Two registered, observable
  claims now cover the 220ms placement settle duration and the 60fps
  fixed-timestep target. The game loop clamps long frames and pauses simulation
  while the page is hidden.

## Run and deploy

```sh
npm ci
npm test
npm run build
/opt/fleet/lib/deploy-static.sh shapeshift-set dist
```

The static deployment root is `dist/`; `dist/index.html` and the generated
`dist/sw.js` are required. The demo entry is `/demo` and uses the fixed August
14, 2026 sample in memory only.

## Verification evidence

- Clean `npm ci`: passed, 22 packages installed, 0 vulnerabilities.
- `npm test`: passed, 15/15 Playwright tests. This includes every command in
  `.factory/claims.json`, keyboard completion, privacy request checking, axe
  checks for home/demo/privacy/terms/404, desktop opening-board geometry, and
  390px board/target geometry.
- `npm run build`: passed. Current production bundle: 23.28 kB JS / 8.67 kB
  gzip; 16.10 kB CSS / 4.47 kB gzip; generated `sw.js`: 1.40 kB.
- `/opt/fleet/lib/verify-url.sh` on a local production preview of `/demo`:
  HTTP 200, title `Demo — Shapeshift Set`, `lang=en`, one `<h1>`, `<main>`,
  zero missing `alt` attributes, zero unlabeled buttons, and no console errors.
- Offline claim test passed from a clean, dedicated browser context after the
  first `/demo` visit. Its current generated cache contains the exact hashed
  JS and CSS that the page loaded before offline reload.
- Production deploy `d3114667-b951-4bf3-b200-f767478b277e` succeeded to
  `https://shapeshift-set.sociobot.in`. Live verification returned HTTP 200,
  zero console errors, valid title/lang/main/alt/button checks, and a live
  offline `/demo` reopen. The deployed `index.html`, `sw.js`, and hashed JS
  each byte-match the local `dist` artifact. Live response headers include the
  same-origin CSP, `frame-ancestors 'none'`, `nosniff`, strict-origin referrer
  policy, restrictive permissions policy, and HSTS.

## Product and privacy status

The product remains a static, one-player browser game with no account,
analytics, payment, backend, or third-party runtime resource. Real daily
progress uses only `localStorage`; `/demo` is memory-only and does not read or
write real progress. No AI or online multiplayer feature is required by the
researched brief.

## Known gaps

- The brief's aggregate 40% completion measure still needs privacy-preserving
  product telemetry if product policy later permits it. This release intentionally
  collects no identity or analytics data.
- Daily variety remains eight deterministic transforms of one solver-verified
  layout. More solver-verified layouts are the next content expansion.
