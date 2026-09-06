# Shapeshift Set repair 6 handoff

**Verdict: PASS — the Review 5 finding is closed.**

- Live URL: <https://shapeshift-set.sociobot.in>
- Runtime implementation SHA: `08d18d967b84f9ba9b71549f4e069dff608e1824`
- Repair and verification SHA: `8a861ded577d60d01def314aa6f584b9f67203d4`
- Documentation and evidence base: `628045bef1b9c46881b9ca2005669921d040aabb`
- Review base: `884c51507e3ee0907dcca7a5ba34acf20abd44e0`
- Evidence: `.factory/repair-6-evidence/`
- Verified: September 6, 2026 UTC

## What changed

The `@claim:demo-isolation` test now proves the complete public promise. It
seeds valid real runs under the sample-date and current-day product keys, plus
the existing generic sentinels and cookie. It records product-key reads while
the demo is active. It also creates and compares an OPFS sentinel when OPFS is
available, retains the IndexedDB check, plays and resets the sample, and checks
all sentinels again after exit.

The detector proves its own operation: it sees no real-progress read during
demo play, then sees exactly the current-day read after **Start for real**.
That separately stored run appears with one result item only after demo mode
has ended. `.factory/claims.json` and `.factory/demo.md` now describe the full
sandbox.

No runtime product code changed. The existing live behavior already honored
the boundary. The verified bundle was still deployed again as requested.

## Clean checkout verification

A fresh clone of pushed commit `8a861de` used Node.js 22.23.2 and npm 10.9.8.

- `npm ci`: passed; 22 packages installed and no vulnerabilities reported.
- All 22 exact commands in `.factory/claims.json`: passed independently.
- Claim integrity: 22 unique IDs, 22 unique commands, and one matching test tag
  per ID, with no missing, duplicate, or extra tags.
- `npm test`: passed, 32/32.
- `npm run lint`: passed.
- `npm run build`: passed and produced `dist/`.
- JavaScript: 24.59 kB raw / 9.03 kB gzip.
- CSS: 16.86 kB raw / 4.63 kB gzip.

The repaired isolation command passed both alone and in the aggregate suite:

```sh
npm test -- --grep @claim:demo-isolation
npm test
```

## Deployment and live verification

The product was deployed to the existing `sf-shapeshift-set` Static Web App in
`centralus`. Deployment `5bfef955-b465-45d9-b527-ee37745322c5` succeeded, the
custom domain remained ready, and HTTPS returned 200. All 13 public runtime
files byte-match the local `dist/` build. The unchanged runtime remains the
implementation at `08d18d9`; `8a861de` changes tests and documentation only.

Fresh 1440×900 desktop and 390×844 phone contexts showed the job, audience,
**Try it with sample data**, its outcome, all three facts, and the game before
scrolling. Both had zero horizontal overflow. The sample kept its persistent
label, August 14, 2026 date, and Board ID `989809312`.

Fresh live runs covered pointer, touch, and keyboard controls. The reverse
order reached the real 1/5 **Try again (0–2)** result with five items. Replay
restored 0/5. The perfect order reached 5/5 **Perfect (5)** with five successful
items on desktop, phone, and keyboard. Copy result included the score, result,
and Board ID. Invalid selection, open ground, wrong shape, wrong orientation,
undo, reset, replay, rejected storage, and reload recovery remained usable.

The fresh live isolation run found OPFS available. During sample play and
reset, the valid sample-date key, current-day run, generic storage sentinels,
cookie, and OPFS file were unchanged; IndexedDB stayed empty; and recorded
real-progress reads were empty. After **Start for real**, the stored daily run
loaded and the detector recorded only `shapeshift-set:daily:2026-09-06`.

## Accessibility, routes, privacy, offline use, and performance

- Playwright Axe found zero violations on `/`, `/demo`, `/privacy`, `/terms`,
  and the designed HTTP 404 route.
- `verify-url.sh` passed `/` and `/demo`: correct title and language, one h1,
  one main, alt coverage, labeled buttons, and no console errors.
- The reset dialog contained focus and returned it after Escape. At 200% text,
  the phone retained the board and controls without overflow.
- Reduced-motion animation and transition durations were `0.00001s`.
- All crawled internal links and the Param Factory link returned success.
- A warmed fresh context reopened and displayed `/demo` offline.
- The full recorded game flow made only same-origin GET requests without
  bodies. It produced no console or page errors.
- At 4× CPU throttling, 180 frames measured 60.00 fps, 16.67 ms mean, 16.70 ms
  p95, and a 60.34 Hz fixed step.
- Lighthouse mobile `/demo`: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; FCP 0.90 s, LCP 1.20 s, TBT 49 ms, CLS 0, and
  37.8 kB transferred.
- HTTPS sends HSTS, `nosniff`, strict-origin referrer policy, a same-origin CSP
  with `frame-ancestors 'none'`, and a restrictive permissions policy.

The first Lighthouse browser process crashed before measurement. A clean
rerun with Chromium's low-shared-memory flag completed with the scores above.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Verification 1: aggregate offline failure, game absent from the first viewport, small targets, and missing timing coverage | Closed. The full suite, isolated offline context, fresh opening captures, target checks, and measured timing pass. |
| Verification 2: standalone offline failure, silent storage failure, incomplete input/undo/copy/session coverage, hidden facts, false 404, skip target, and 200% reflow | Closed. Each outcome has passing regression and fresh live evidence. |
| Review 1 F-1-1: repeated daily perfect order | Closed. The claim enumerates all 120 orders across 48 dates and rejects consecutive repeats. |
| Review 1 F-1-2: incomplete demo isolation | Closed by the valid sample-date/current-day runs, read detector, OPFS sentinel, cookie, localStorage, IndexedDB, reset, and exit checks. |
| Review 1 F-1-3 through F-1-5: analytics, leaderboard, scoring, and tier claims | Closed. Their exact registered commands pass and the live loss/win flows were repeated. |
| Review 1 F-1-6 through F-1-13: mobile action result, control names, unclear terms, README wording, title, decorative copy, privacy wording, and 404 metadata/footer | Closed. Current copy, metadata, responsive checks, route scan, and Axe checks pass. |
| Verification 4: WCAG 2.5.3 label-in-name failures | Closed. The dedicated regression and fresh Axe scans pass. |
| Review 2: clipped controls, invisible demo focus, untested 6×6 claim, and small board targets | Closed. The responsive matrix, focus regression, and board-size claim pass; live phone use completed a perfect run. |
| Verification 3, Verification 5, Verification 6, Review 3, and Review 4 | They had no open defect. Their game, privacy, accessibility, route, offline, and performance paths remain green. |
| Review 5: real sample-date key, OPFS, and read detection missing from the isolation claim | Closed by `@claim:demo-isolation` and repeated live evidence. |

## Known limits

No product defect remains. This is a free static one-player game with no
backend, account, billing, multiplayer, sound, or advertised settings. Backend
restart, tenant, health, 429, payment, and multiplayer checks do not apply.

The brief's 40% aggregate completion measure still requires player analytics.
The product intentionally sends none, so that external measure is unavailable
and is not a public claim. No AI feature would improve this deterministic
daily puzzle.
