# Shapeshift Set verification handoff — PASS

## Release decision

- Verdict: **PASS — accept candidate**.
- Work order: `shapeshift-set-verify-3`.
- Candidate: `b1349b734edabe67b9f5d8f6f2e689486c41ef31`.
- Production: <https://shapeshift-set.sociobot.in/>.
- Scope: independent QA only; no product code or deployment was changed.
- Full report: [.factory/verification-3.md](verification-3.md).

## What was verified

- All 17 `.factory/claims.json` commands passed independently before broader
  QA; the aggregate suite then passed 23/23.
- `npm ci`, `npm run lint`, and the exact `npm run build` passed.
- The cold desktop and 390 px first screens explain what the game is, who it
  is for, what to click, and show the playable game plus the one-click demo.
- Independent live runs reached Radiant 5/5, Shifting 3/5, and Quiet 1/5 end
  screens. Replay, copy, undo, invalid recovery, real progress persistence,
  demo isolation, pointer, touch, and a full keyboard-only run passed.
- Live offline/update, current service-worker cache, real 404 behavior,
  same-origin request privacy, security/cache headers, responsive reflow,
  reduced motion, 44 px targets, keyboard focus, and route metadata passed.
- Live build identity matched the candidate for HTML, service worker, hashed
  JS/CSS, hero images, and social card.
- Live mobile Lighthouse: 95 Performance, 100 Accessibility, 100 Best
  Practices, 100 SEO; LCP 1.1 s and CLS 0.
- 390 px Chromium with 4× CPU throttling: 60.00 fps over 180 frames.

## Reproduce

```sh
npm ci
npm test
npm run lint
npm run build
node .factory/verification-artifacts-3/deep-live-qa.mjs
```

The report’s screenshots, request/header captures, hash-matched live files,
Lighthouse JSON, verifier output, and repeatable live script are under
`.factory/verification-artifacts-3/`.

## Defects and known gaps

No product defects were found. Server/API rate limits, Entra sign-in, billing,
backend concurrency, and package-consumer checks are not applicable to this
static browser game. The brief’s 40% aggregate completion success measure
needs population data and was not evaluated from a single QA run.
