# Shapeshift Set verification handoff — FAIL

## Result

**FAIL — do not release candidate
`0d512956a0c34366575da0da834deb33164cf894`.**

Independent verification was performed on 2026-09-02 against
<https://shapeshift-set.sociobot.in/>. The live HTML, service worker, JS, and
CSS byte-match the candidate build. Full evidence and defect details are in
[verification-2.md](verification-2.md).

## Release blockers

1. The exact required command
   `npm test -- --grep @claim:offline-reload` failed twice from fresh contexts.
   Offline reopen was blank because the current JS/CSS were not served. The
   aggregate suite and a live manual retry passed, proving nondeterminism rather
   than a reliable offline claim.
2. A rejected localStorage write is never shown. The UI reports a successful
   1/5 move, then reload loses it and returns to 0/5.
3. `.factory/claims.json` does not cover Copy result, Undo last piece, all
   advertised keyboard/touch inputs, or an intended and tested session length.
4. The mandatory three plain facts are hidden at 390 px and are not all visible
   in the tested desktop first screen.

Additional defects: missing routes return HTTP 200; the skip link is 43 px
high; 200% text enlargement causes 516 px horizontal overflow at a 390 px
viewport.

## What passed

- `npm ci`, exact production build, and one aggregate `npm test` run (15/15).
- Cold what/who/first-action check, one-click isolated demo, and game in both
  initial desktop and mobile viewports.
- Deterministic perfect, middle-tier, and loss runs; replay, undo, reset,
  pointer, touch, advertised keys, result copy, invalid input, and normal
  persistence.
- Live same-origin privacy log, security and caching headers, service-worker
  update, live offline reopen, zero console/page errors, and route/link crawl.
- Axe serious/critical: zero across five routes. Live URL verifier passed.
- Lighthouse mobile: 94 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.2 s and CLS 0.
- 4× CPU-throttled frame sample: 59.84 fps over 180 frames.

## Reproduce

```sh
npm ci
npm test -- --grep @claim:offline-reload
npm test
npm run build
```

No product code was modified during verification. Repair the blockers, add the
missing claim coverage, and run every claim independently before another
candidate is submitted.
