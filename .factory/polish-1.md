# Polish round 1

Candidate repaired from `b1349b734edabe67b9f5d8f6f2e689486c41ef31` using
`.factory/review-1.md` and the earlier verification records. All findings are
closed below. Local screenshots and URL verifier reports live in
`.factory/polish-evidence/`.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | `dailyOrder()` walks all 120 deterministic dependency permutations; the arrows and gold starting marker now follow that date-specific order. | `@claim:unique-perfect`; `npm test` (28 passed) |
| F-1-2 | `/demo` and `?demo=1` create only in-memory state; the claim seeds real storage and a cookie, plays/resets demo, and proves they are unchanged after leaving. | `@claim:demo-isolation` |
| F-1-3 | Added no-analytics and no-leaderboard claims/tests; retained privacy copy is now covered. | `@claim:no-analytics`, `@claim:no-leaderboard`, `@claim:same-origin` |
| F-1-4 | Registered the arrow rule and added a two-sided observable test for target absent/present score trail outcomes. | `@claim:mutation-scoring` |
| F-1-5 | Replaced opaque tier wording with Try again (0–2), Close (3–4), and Perfect (5); the result keeps all five itemized outcomes. | `@claim:score-tiers` |
| F-1-6 | Kept “Opens a complete sample board.” visible beneath the primary action at 390 px. | mobile opening-viewport test; `local-home/screenshot-mobile.png` |
| F-1-7 | Turn controls retain result names on mobile; tray and empty-habitat accessible names now name the select/place result. | keyboard/touch tests; Playwright Axe test |
| F-1-8 | Replaced visitor-facing Seed and mutation-score labels with Board ID and Changed neighbors, and gave score labels their numeric meaning. | `@claim:score-tiers`; `local-demo/screenshot-desktop.png` |
| F-1-9 | README consistently says a creature changes a neighboring creature. | README review; `@claim:mutation-scoring` |
| F-1-10 | Corrected home, OG, and Twitter title to “Shapeshift Set — order five creatures daily.” | route metadata/Axe test; `local-home/verify.json` |
| F-1-11 | Removed the decorative moon-garden caption; the useful generated-art disclosure remains in the footer. | `local-home/screenshot-desktop.png` |
| F-1-12 | Rewrote README privacy/offline text in player language. | README review; `@claim:same-origin`, `@claim:offline-reload` |
| F-1-13 | Added apple-touch, Open Graph, Twitter metadata, and the shared footer note to the real static 404. | 404 routing/metadata/Axe test; local `curl` returned 404 |
| P1: full suite | Stabilized the service-worker offline claim in its dedicated contexts; all 28 unit/browser/claim/a11y/mobile tests pass together. | `npm test` — 28 passed in 32.9 s |
| P1: first screen | Kept the live playable board inside the desktop and 390 px opening viewport. | opening viewport test; `local-home/screenshot-desktop.png` |
| P1: mobile targets | Demo-banner actions and navigation targets have 44 px minimum hit areas. | mobile layout/200% text test |
| P1: coverage | Added all missing claims and removed no promised behavior from claim ownership. | `.factory/claims.json`; all `@claim:*` tests pass |

## Local URL checks

- `/`: [`local-home/verify.json`](polish-evidence/local-home/verify.json) reports title, `lang=en`, one h1, one main, no missing image alt text, no console errors.
- `/demo`: [`local-demo/verify.json`](polish-evidence/local-demo/verify.json) reports the same checks, including the demo title.
- `/missing-page`: the static server returned HTTP 404; the browser suite verifies its real 404 response before and after service-worker control.
- Integrated Playwright Axe scans passed with no serious or critical findings for `/`, `/demo`, `/privacy`, `/terms`, and `/missing-page`. The standalone Axe CLI could not locate Chrome in this container; the Playwright integration uses the installed browser.

## Production re-check

Deployed to <https://shapeshift-set.sociobot.in> on September 2, 2026. Cold
URL verification passed for [home](polish-evidence/live-home/verify.json) and
[demo](polish-evidence/live-demo/verify.json): correct titles, language, one
h1/main, image alt coverage, and no console errors. A live scripted demo run
reached “You changed 5 of 5,” captured at
`polish-evidence/live-demo/live-end-screen.png`, then replay reset to 0/5; a
cold `?demo=1` visit showed the demo banner. Live Playwright Axe checks passed
for `/`, `/demo`, `/privacy`, `/terms`, and `/missing-page`; the last route
returned HTTP 404.
