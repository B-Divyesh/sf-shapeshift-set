# Verify ordering five creatures on a daily board — PASS

**Verdict: PASS — accept the reviewed implementation.**

- Work order: `shapeshift-set-verify-7`
- Runtime implementation reviewed: `08d18d967b84f9ba9b71549f4e069dff608e1824`
- Claim-test repair: `8a861ded577d60d01def314aa6f584b9f67203d4`
- Documentation/evidence commit: `b404f3cb270d1e04a8fcb09418004b0bd822f129`
- Live URL: <https://shapeshift-set.sociobot.in>
- Verified: 2026-09-06 UTC
- Findings: 0 (P0: 0, P1: 0, P2: 0, P3: 0)
- Untested public claims: 0

## Job, audience, and first action

The job is to order five creatures on a shared daily spatial board. It is for daily puzzle players who want one finite challenge. The first action is **Try it with sample data**; it opens a complete sample board.

Fresh, unscrolled 1440×900 desktop and 390×844 phone contexts showed that job, the audience sentence, the action and its outcome, all three plain facts, and the playable board. The board was on the first screen, not behind a menu. Both contexts had zero horizontal overflow. Evidence: `.factory/verification-7-evidence/first-desktop.png` and `first-phone.png`.

## Declared claims and clean checks

From this clean checkout, `npm ci` installed 22 packages with no reported vulnerabilities. I then ran every exact command in `.factory/claims.json` individually, in manifest order. All 22 passed. The manifest has one unique test tag for each public claim.

| Claim | Result |
| --- | --- |
| `daily-end` | PASS |
| `board-size` | PASS |
| `unique-perfect` | PASS |
| `restart` | PASS |
| `local-progress` | PASS |
| `demo-isolation` | PASS |
| `offline-reload` | PASS |
| `piece-settle-duration` | PASS |
| `frame-rate` | PASS |
| `keyboard-controls` | PASS |
| `all-inputs` | PASS |
| `undo-last-piece` | PASS |
| `copy-result` | PASS |
| `session-length` | PASS |
| `persistence-recovery` | PASS |
| `same-origin` | PASS |
| `no-analytics` | PASS |
| `no-leaderboard` | PASS |
| `mutation-scoring` | PASS |
| `score-tiers` | PASS |
| `utc-daily` | PASS |
| `free-no-upsells` | PASS |

`npm test` passed all 32 tests. `npm run lint` passed. `npm run build` passed and produced `dist/`. The built JavaScript is 24.59 kB raw / 9.03 kB gzip and CSS is 16.86 kB raw / 4.63 kB gzip, within the stated budgets.

The landing page, demo, privacy page, terms, README, catalog description, and metadata were checked against the claims manifest. No unlisted public functional, privacy, input, offline, result, or measured claim was found.

## Live game runs

The desktop run entered `/demo` through the first-screen action. It showed the persistent **Demo — sample board, nothing is saved** label, the realistic August 14, 2026 sample, five creatures, and Board ID `989809312`.

Invalid no-selection, open-ground, wrong-shape, and wrong-orientation actions each showed a specific recovery instruction and left the game playable. The reverse order reached the actual 1/5 **Try again (0–2)** end screen with five itemized results. Reset and replay returned the board to 0/5 with no trail. The perfect order reached the actual 5/5 **Perfect (5)** end screen with five successful itemized results. Copy result contained `5/5 · Radiant` and Board ID `989809312`. Undo returned the latest creature, score, and trail entry.

The advertised keyboard path used 1–5, Q/E, F, arrows, Space, and Enter to reach 5/5. A fresh iPhone-sized touch run reached the same 5/5 end screen. Evidence: `loss-desktop.png`, `win-desktop.png`, `win-keyboard.png`, and `win-phone.png` in `.factory/verification-7-evidence/`.

Daily play and the isolated sample are the advertised modes. There are no advertised settings, sound, multiplayer, account, payment, or backend features. The live game has a measured 60 fps target: at 4× CPU throttling it measured 60.00 fps and a 60.34 Hz fixed step.

## Demo, privacy, accessibility, routes, and offline use

The fresh demo-isolation run seeded valid sample-date and current-day real runs, a cookie, localStorage sentinel, and an OPFS sentinel. While the sample was active and after Reset demo, all values were unchanged, IndexedDB remained empty, and the read detector recorded no real-progress read. Start for real then read only the separate current-day key. This closes the prior Review 5 coverage finding with live evidence.

The recorded complete run made only same-origin GET requests, with no request bodies, console errors, page errors, analytics, account, payment, or leaderboard output. The host sends HSTS, `nosniff`, a same-origin CSP including `frame-ancestors 'none'`, strict referrer policy, and a restrictive permissions policy.

Fresh Axe integration scans of `/`, `/demo`, `/privacy`, `/terms`, and the designed missing route found zero violations. The reset dialog contained focus and returned it after Escape. Reduced motion computed to `0.00001s`. At 200% text size on a 390 px viewport there was no overflow, visible controls remained available, and the smallest board cell was 52.17 px.

`verify-url.sh` passed live `/` and `/demo`: each had its title, `lang=en`, one h1, a main landmark, complete image alt text, labeled buttons, and no console errors. `/`, `/demo`, `/privacy`, and `/terms` returned 200 with route-specific titles. `/missing-page-verification-7` returned the expected HTTP 404 with its own title, h1, main, footer, and return action. All seven visible internal and factory links returned 200. The expected HTTP 404 is not a defect.

A fresh service-worker context reopened `/demo` offline after its online visit. Lighthouse 13.4.1 mobile `/demo` scored Performance 98, Accessibility 100, Best Practices 100, and SEO 100; FCP was 1.0 s, LCP 1.1 s, TBT 150 ms, CLS 0, and transfer 37 KiB. The report is `.factory/verification-7-evidence/lighthouse-mobile.json`.

## Live parity and earlier findings

The fresh `dist/` rebuild byte-matched all 13 deployed public product files; `staticwebapp.config.json` is deployment configuration and is intentionally not served as a public file. The core hashes are `087ec156…d63974e` for HTML, `63e4e7f4…606554f9` for JavaScript, and `54856cb7…09fa5483` for CSS. The last runtime change is `08d18d9`; later commits are test, documentation, or evidence only, so the implementation and documentation SHAs are recorded separately.

| Earlier finding group | Current disposition |
| --- | --- |
| Verification 1 and 2: offline, first screen, targets/reflow, recovery, 404, and missing claim coverage | Closed. Exact claims, live first-screen, recovery, offline, 200% text, target, and HTTP 404 checks pass. |
| Review 1: unique order, demo privacy, analytics/leaderboard, scoring/tier coverage, copy, labels, terminology, titles, privacy, and 404 | Closed. The 22 claims and fresh live flows prove these outcomes. |
| Verification 4: WCAG label in name | Closed. Fresh Axe scans have no violation. |
| Review 2: breakpoint clipping, demo focus, board-size coverage, and board target size | Closed. Fresh desktop/phone, focus, board-size, and 52.17 px reflow checks pass. |
| Review 5: demo test omitted sample-date key, OPFS, and read detection | Closed. The current exact claim and the fresh live isolation run prove valid keys, OPFS, cookies, IndexedDB, reset, and exit. |

## Scope

This is a static local-first, one-player browser game. It has no backend, tenant, database, health endpoint, rate limit, 429/Retry-After behavior, account, payment, multiplayer, CLI, desktop artifact, or library package. Backend isolation, restart persistence, live allowances, and consumer-install checks do not apply. The brief's aggregate 40% completion measure requires usage analytics; the product intentionally sends none, and it is not a public claim.

**PASS — zero findings and zero untested public claims.**

