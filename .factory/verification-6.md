# Independent verification 6 — PASS

**Verdict: PASS — accept the reviewed implementation.**

- Work order: `shapeshift-set-verify-6`
- Implementation candidate: `08d18d967b84f9ba9b71549f4e069dff608e1824`
- Documentation/evidence base: `1b2b702ef3f200c61ab73fe825bff10743f6ea1a`
- Final prior handoff commit: `a5ec3c808643f06c725d00dabc2c7d159010e149`
- Live URL: <https://shapeshift-set.sociobot.in>
- Verified: 2026-09-05 UTC
- Findings: 0 (P0: 0, P1: 0, P2: 0, P3: 0)
- Untested public claims: 0

## Job, audience, and first action

The job is a short shared daily spatial puzzle. It is for daily puzzle players
who want a finite challenge. The first action is **Try it with sample data**;
it opens a complete sample board.

Fresh unscrolled desktop (1440×900) and phone (390×844) contexts showed the
headline, audience sentence, primary action, action result, three facts, and a
visible playable board. The phone had zero horizontal overflow. The game is on
the first screen, not behind a menu.

## Clean checkout and claims

From the documented setup, `npm ci` completed with 22 packages and no reported
vulnerabilities. `npm test` passed all 32 tests, `npm run lint` passed, and
`npm run build` passed and produced `dist/`. The built JavaScript is 24.59 kB
raw / 9.03 kB gzip; CSS is 16.86 kB raw / 4.63 kB gzip.

Every exact command declared in `.factory/claims.json` was run independently.
The manifest has 22 IDs and the test source has exactly one matching tag per
ID. All commands passed.

| Claim | Result | Observable check |
| --- | --- | --- |
| `daily-end` | PASS | Five sample placements reached the scored end screen. |
| `board-size` | PASS | Sample board rendered 6 rows, 6 columns, and 36 targets. |
| `unique-perfect` | PASS | 120 orders across 48 UTC dates gave one perfect order and different consecutive answers. |
| `restart` | PASS | Replay restored zero score and an empty trail. |
| `local-progress` | PASS | A real move survived reload. |
| `demo-isolation` | PASS | Seeded real storage and cookie were unchanged through demo, reset, and exit. |
| `offline-reload` | PASS | A fresh warmed context reopened `/demo` offline. |
| `piece-settle-duration` | PASS | Placed piece animation was 220 ms. |
| `frame-rate` | PASS | Fixed-step timing remained within the 55–65 Hz assertion around its 60 Hz target. |
| `keyboard-controls` | PASS | Number, Q/E, F, arrows, and Space selected, changed, moved, and placed. |
| `all-inputs` | PASS | Pointer and touch selected, turned, and placed a piece. |
| `undo-last-piece` | PASS | Undo returned the piece, score, and trail entry. |
| `copy-result` | PASS | Clipboard text included score, result, and Board ID. |
| `session-length` | PASS | Four placements did not end the run; five did. |
| `persistence-recovery` | PASS | A rejected storage write warned that the run would not survive reload. |
| `same-origin` | PASS | Demo runtime requests stayed on the product origin. |
| `no-analytics` | PASS | A complete run and replay sent no analytics request or payload. |
| `no-leaderboard` | PASS | Completed flow exposed no leaderboard control or output. |
| `mutation-scoring` | PASS | Target-first scored; dependent-first did not. |
| `score-tiers` | PASS | 1/5, 3/5, and 5/5 showed the stated tier and five trail entries. |
| `utc-daily` | PASS | Same date matched; next UTC date changed board seed/geometry. |
| `free-no-upsells` | PASS | Complete flow exposed no account, ad, booster, or payment control. |

The page, README, privacy page, demo documentation, and catalog description
were cross-checked against the claims manifest. All functional, privacy,
offline, input, count, and result promises have a declared test. No unlisted
public claim was found.

## Live game exercise

A fresh production desktop run entered `/demo` from the first-screen action.
The persistent banner read **Demo — sample board, nothing is saved**. An
invalid empty-board click gave recovery feedback. The reverse order reached
the real 1/5 **Try again (0–2)** end screen with five itemized results.
**Reset demo** restored 0/5 and an empty trail. The perfect order then reached
5/5 **Perfect (5)** with five successful results. Leaving through **Start for
real** preserved the seeded real local storage and cookie.

A separate fresh keyboard run used the advertised keys and reached 5/5
Perfect. A fresh iPhone-sized touch context selected, turned, and placed Mote
for 1/5. The live production run had no console or page errors and its request
log contained only `https://shapeshift-set.sociobot.in`.

The deterministic run covers the actual challenge, invalid recovery, loss,
restart/reset, and perfect end state. Daily play and isolated demo are the two
advertised modes. There are no advertised settings, sound, multiplayer,
account, payment, or backend features.

## Accessibility, routes, privacy, offline, and deployment

- Fresh live Axe scans of `/`, `/demo`, `/privacy`, `/terms`, and the designed
  `/missing-page` 404 found zero serious or critical violations.
- `verify-url.sh` passed live `/` and `/demo`: both have a title, `lang=en`,
  one h1, a main landmark, complete image alt coverage, labeled buttons, and
  no console errors. The 404 is deliberately HTTP 404 and has its own title,
  h1, main, return action, metadata, and shared footer.
- The demo reset and Start-for-real actions showed keyboard-visible 3 px focus
  outlines with at least 3:1 contrast; the measured banner-action contrast is
  10.86:1. The label-in-name regression and live Axe scan pass.
- Live widths 320, 881, 900, 1024, 1100, 1279, and 1280 px had no horizontal
  overflow; controls were reachable and all 36 cells were at least 44 px.
  The smallest recorded board target was 45.31 px. Local tests also passed
  200% text reflow and reduced-motion behavior.
- A fresh service-worker context warmed online then reopened `/demo` offline.
  `/`, `/demo`, `/privacy`, and `/terms` returned 200. `/missing-page`
  returned the expected 404.
- Live headers provide HSTS, `nosniff`, strict-origin referrer policy, a
  same-origin CSP including `frame-ancestors 'none'`, and restrictive
  permissions policy. No third-party runtime resource was requested.
- Locally rebuilt `dist/index.html`, `assets/index-BkbLntcz.js`, and
  `assets/index-CMGtcJXn.css` byte-match live production. SHA-256 values are
  respectively `087ec156…d63974e`, `63e4e7f4…606554f9`, and
  `54856cb7…09fa5483`.

Independent live captures and machine-readable checks are in
`.factory/repair-5-evidence/`; this verification refreshed the desktop loss,
perfect, keyboard, and verify-url evidence there. The existing live browser
check records the responsive, focus, reset, keyboard, touch, offline, route,
and isolation paths. The prior Lighthouse mobile result is 100 performance,
100 accessibility, 100 best practices, and 100 SEO.

## Earlier findings disposition

| Earlier finding | Current disposition and proof |
| --- | --- |
| Verification 1: offline claim, game-first first screen, target size, claims coverage | Closed. Isolated offline claim, first-screen checks, 44 px matrix, and 22-claim manifest all pass. |
| Verification 2: clean offline, storage-write recovery, missing session/input coverage, first facts, 404, reflow | Closed. Current claims exercise each behavior; live 404/reflow/first-screen checks pass. |
| Review 1 F-1-1 | Closed. `unique-perfect` enumerates all orders for 48 dates and rejects repeated consecutive answers. |
| Review 1 F-1-2 | Closed. `demo-isolation` seeds storage/cookie, checks IndexedDB, resets, and exits without changing real data. |
| Review 1 F-1-3 | Closed. `no-analytics`, `no-leaderboard`, `same-origin`, and `free-no-upsells` pass; live request log is same-origin only. |
| Review 1 F-1-4 | Closed. `mutation-scoring` proves the target-first rule and resulting score/trail. |
| Review 1 F-1-5 | Closed. `score-tiers` reaches 1, 3, and 5 with five itemized results. |
| Review 1 F-1-6 | Closed. Phone capture shows the sample outcome beside the first action. |
| Review 1 F-1-7 | Closed. Visible control labels are included in accessible names; label-in-name regression passes. |
| Review 1 F-1-8 and F-1-9 | Closed. Current game and README consistently use Board ID, changed neighbors, and creature. |
| Review 1 F-1-10 through F-1-13 | Closed. Plain title/privacy wording, no decorative caption, and complete 404 metadata/footer are live. |
| Verification 4 WCAG 2.5.3 | Closed. Current local regression and fresh live Axe report zero label-in-name violation. |
| Review 2 clipped controls at 881–1024 px | Closed. Live responsive matrix through the repaired 1279 px breakpoint passes. |
| Review 2 demo focus contrast | Closed. Keyboard focus is visible and measured at 10.86:1. |
| Review 2 untested 6×6 claim | Closed. `board-size` is declared and independently passes its 36-target check. |
| Review 2 sub-44 px board cells | Closed. Current matrix minimum is 45.31 px. |

## Not applicable

This is a static local-first, one-player browser game. It has no backend,
tenant, health endpoint, rate limit, account, payment, shared persistence,
multiplayer, CLI, desktop artifact, or library package. Backend isolation,
restart, live allowance, 429/Retry-After, and consumer-install checks do not
apply. The brief's aggregate 40% completion measure is intentionally not
measured because the product sends no analytics.
