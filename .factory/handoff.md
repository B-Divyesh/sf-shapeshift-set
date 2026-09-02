# Shapeshift Set handoff

## What shipped

- A complete 6×6 daily browser puzzle with five original polyomino creatures.
- Deterministic UTC seeds rotate and reflect the shared board and starting tray.
- A visible neighbor-mutation chain with one solver-proven perfect order.
- Three result tiers, an itemized score, undo, reset, replay, and result copying.
- Keyboard, pointer, and touch controls with 44 px targets and visible focus.
- Local daily progress recovery and an in-memory `/demo` sandbox.
- Offline reopen through a same-origin service worker.
- Home, demo, privacy, terms, SPA 404, sitemap, robots, social image, icons,
  security headers, and cache rules.
- Original surreal editorial moon-garden art with prompt provenance in
  `assets/src/` and visual tokens in `.factory/design.md`.

## Run and deploy

```sh
npm ci
npm test
npm run build
```

The static deployment root is `dist/`. The required entry file is
`dist/index.html`. No environment variables, backend, account, or external
runtime service is required.

The verifier demo is `/demo`. It uses the August 14, 2026 board, seed
`989809312`, and memory-only state. Full details are in `.factory/demo.md`.

## Verification completed

- `npm test`: 12/12 passed on September 2, 2026.
- Ten documented claims passed from `.factory/claims.json`.
- The solver enumerated all 120 orders on four dated transforms and found one
  perfect order for each board.
- Chromium console check: no errors across home, demo, privacy, terms, and 404.
- axe: no serious or critical findings on all routes.
- 390×844 mobile check: no horizontal overflow; turn controls remain at least
  44 px high.
- Production bundle: 8.50 KB JavaScript gzip and 4.40 KB CSS gzip.
- Hero assets: 22 KB mobile WebP and 54 KB desktop WebP.
- Lighthouse mobile on local production preview: Performance 100,
  Accessibility 100, Best Practices 100, SEO 100.
- Lighthouse metrics: FCP 1.0 s, LCP 1.4 s, CLS 0, TBT 0 ms, interactive 1.4 s.
- Animation sampling at 390×844 with 4× CPU throttling: 60.5 fps average and
  16.7 ms p95 frame interval over 120 frames.
- `prefers-reduced-motion` removes settling and link animations.

## Known gaps

- The brief’s 40% completion measure needs live aggregate traffic. This v1
  intentionally sends no analytics or identity data, so the metric is not yet
  collected.
- Daily variety comes from eight rotations/reflections of one solver-proven
  spatial layout plus deterministic tray turns. This preserves the promised
  unique optimum but is a bounded v1 content set.

## Suggested next steps

- Add more solver-verified base layouts while preserving the same five rules.
- If product policy permits, add an anonymous aggregate completion counter to
  measure the brief’s success threshold without retaining identity data.
