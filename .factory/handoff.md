# Shapeshift Set repair handoff — PASS

## Release

- Repair commits: `99974a3`, `0246f6e`, and `d9aaaf8` on `main`.
- Pushed: `origin/main` at `d9aaaf8`.
- Production URL: <https://shapeshift-set.sociobot.in/>.
- Static deployment: Azure Static Web Apps `sf-shapeshift-set`, deployment ID
  `6cd9e96a-408d-4006-92f7-0e4a423bbe30`.
- Live identity: SHA-256 matches the built `index.html`, `sw.js`, current
  hashed JS, and current hashed CSS.

## Repairs made

1. Service-worker install now fetches and stores the exact current hashed JS
   and CSS before activation. The offline regression uses two fresh browser
   contexts, waits for control and cache contents, performs an online reload,
   then performs the actual offline reload.
2. Persistence now happens before the next game UI is rendered. A rejected
   `localStorage.setItem` visibly says that the run will not survive reload;
   the regression throws `QuotaExceededError`, checks the message, then checks
   the fresh board after reload.
3. Registered and tested result copy, undo, the complete advertised keyboard
   grammar, pointer/touch controls, and the five-placement session length.
4. Kept the three plain facts visible in both desktop and 390 px first
   screens. The skip link is at least 44 px tall, and a 200% text-size test
   covers `/`, `/demo`, `/privacy`, and `/terms` without horizontal overflow.
5. Replaced broad SPA navigation fallback with explicit valid routes and a
   real response override for 404. The worker also sends unknown navigations
   to the host, preserving an HTTP 404 after it controls a page.
6. Added a production-like local static server for consumer checks, a full
   static 404 page, and a `lint` script.

## Verification

- `npm ci`: passed; 22 packages installed, 0 audit vulnerabilities.
- `npm test`: passed 23/23 in 26.0 seconds.
- `npm run lint`: passed (`tsc --noEmit`).
- `npm run build`: passed; `dist/` contains a 23.31 kB JS bundle (8.69 kB
  gzip), 16.63 kB CSS (4.59 kB gzip), and a 2.47 kB service worker.
- All 17 documented claim commands were run independently after the final
  repair: `daily-end`, `unique-perfect`, `restart`, `local-progress`,
  `demo-isolation`, `offline-reload`, `piece-settle-duration`, `frame-rate`,
  `keyboard-controls`, `all-inputs`, `undo-last-piece`, `copy-result`,
  `session-length`, `persistence-recovery`, `same-origin`, `utc-daily`, and
  `free-no-upsells` all passed.
- Local production-host checks: correct 404 status, controlled-worker 404,
  opening desktop and 390 px facts/board, 44 px targets, 200% reflow, and
  Playwright Axe serious/critical checks all passed.
- Live `/opt/fleet/lib/verify-url.sh` on `/demo`: HTTP 200, title, `lang=en`,
  one h1, main landmark, no missing image alt text, no unlabeled buttons, and
  no console errors; 568 ms recorded load.
- Live Axe: 0 serious/critical violations on `/`, `/demo`, `/privacy`,
  `/terms`, and `/missing-page`; the last route returns HTTP 404.
- Live privacy check: two fresh demo runs requested only
  `https://shapeshift-set.sociobot.in`.
- Live offline/update check: two fresh contexts awaited worker control and the
  exact current shell cache, then reloaded `/demo` offline with the h1 and
  board visible. A controlled `/missing-page` request returned HTTP 404.
- Live responsive frame sample at 390 px with 4× CPU throttling: 60.35 fps,
  16.57 ms mean, 16.70 ms p95 across 180 frames. Reduced motion computed
  transition and animation durations of `0.00001s`.
- Live response policy: same-origin CSP with `frame-ancestors 'none'`, HSTS,
  `nosniff`, strict-origin referrer policy, permissions policy, and 30-second
  HTML revalidation are present.
- Lighthouse 13.4.1 local mobile `/demo`: Performance 97, Accessibility 100,
  Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.3 s, CLS 0, 63 KiB transfer.

## Run and deploy

```sh
npm ci
npm test
npm run lint
npm run build
/opt/fleet/lib/deploy-static.sh shapeshift-set dist
```

## Known gaps

None. This is a static, local-first one-player game; payment, account,
backend API, rate-limit, and identity-provider checks do not apply.
