# Shapeshift Set review 5 handoff

**Verdict: FAIL — 1 finding and 1 untested public claim.**

- Implementation candidate: `08d18d967b84f9ba9b71549f4e069dff608e1824`
- Test-only follow-up: `df4eff25078fcbdbecb04aafae3840edbfa5f872`
- Documentation base reviewed: `ccb4763e52211392212ed309885692e2b6976602`
- Review: `.factory/review-5.md`
- Evidence: `.factory/review-5-evidence/`
- Live URL: <https://shapeshift-set.sociobot.in>

## What was done

No product code was changed. The strict review covered fresh phone and desktop
first screens, the isolated sample, real-data sentinels, invalid actions, a
desktop loss, desktop and phone wins, keyboard-only play, replay, reset, undo,
daily persistence, failed-write recovery, route history, legal pages, the
designed 404, offline reload, service-worker update state, reduced motion,
200% text, responsive targets, focus, Axe, Lighthouse, request privacy, frame
timing, and deployment parity.

The live game behavior passed. The review fails because the registered
`demo-isolation` claim test does not cover the full public storage promise. It
does not seed the real sample-date key, inspect OPFS, or detect reads of real
progress during demo mode. This reopens Review 1 finding F-1-2.

## How it was verified

From a clean clone of `ccb4763`:

```sh
npm ci
npm test
npm run lint
npm run build
```

Results:

- `npm ci`: 22 packages; no vulnerabilities reported.
- `npm test`: 32/32 passed.
- Lint and build passed; `dist/` was produced.
- All 22 exact claim commands exited successfully.
- Claim integrity: 22 unique IDs and 22 one-to-one test tags.
- Claim review: 21 complete; `demo-isolation` incomplete.
- Build size: JS 24.59 kB raw / 9.03 kB gzip; CSS 16.86 kB raw /
  4.63 kB gzip.
- Desktop reached 1/5 Try again and 5/5 Perfect with five result items.
- Phone touch and keyboard-only runs each reached 5/5 Perfect.
- Live real progress survived reload; rejected writes warned and recovered.
- Offline reload, active current worker, routes, legal pages, and the real 404
  passed.
- Live Axe found zero violations across home, demo, privacy, terms, and 404.
- Lighthouse mobile scored 100 in Performance, Accessibility, Best Practices,
  and SEO; LCP was 1.20 s, TBT 73 ms, and CLS 0.
- The 4×-throttled phone sample measured 60.00 fps and 60.34 Hz fixed step.
- All 13 public product files byte-matched the rebuilt candidate.

Repeat the main live evidence with:

```sh
node .factory/review-5-evidence/live-review.mjs
node .factory/review-5-evidence/supplemental.mjs
```

## Required next step

Extend `@claim:demo-isolation` to seed a valid real sample-date run, detect
real-progress reads during demo mode, and create and compare an OPFS sentinel
when supported. Keep the existing localStorage, cookie, IndexedDB, reset, and
exit checks. Then run every exact claim command and a fresh live review before
declaring PASS.
