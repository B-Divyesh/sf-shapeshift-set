# Review 6 — Order five creatures on a daily board — PASS

**Verdict: PASS — zero findings of every severity and zero untested public claims.**

- Work order: `shapeshift-set-review-6`
- Runtime implementation reviewed: `08d18d967b84f9ba9b71549f4e069dff608e1824`
- Documentation/report base: `f5ae6a28b03bd97ceb1260cc51b1152293d324ca`
- Live URL: <https://shapeshift-set.sociobot.in>
- Reviewed: 2026-09-06 UTC
- Findings: 0 (P0: 0, P1: 0, P2: 0, P3: 0)
- Untested public claims: 0

## Job, audience, and first action

The job is to order five creatures on a shared daily spatial board. It is for
daily puzzle players who want one finite challenge. The first action is **Try
it with sample data**; it opens a complete sample board.

I opened new live 1440×900 desktop and 390×844 phone contexts without
scrolling. Both showed that information, the action outcome, three plain
facts, and the playable board. Neither had horizontal overflow. This is a
game-first screen, not a menu wall.

## Clean checkout and claims

`npm ci` installed the documented 22 packages with no reported
vulnerabilities. I ran every exact command declared by `.factory/claims.json`
separately, then ran the aggregate gates. All passed.

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

`npm test` passed all 32 tests. `npm run lint` passed. `npm run build` passed
and created `dist/`. Build output is 24.59 kB JavaScript raw / 9.03 kB gzip
and 16.86 kB CSS raw / 4.63 kB gzip. I matched every 14 served product file
from that fresh build against production by SHA-256; all matched. The only
non-public build file is deployment configuration.

The landing page, demo, privacy, terms, README, catalog text, metadata, and
copy audit were compared with the claims manifest. Each public functional,
privacy, offline, input, result, count, and performance promise has a matching
declared test. No unlisted, false, incomplete, or untested public claim was
found.

## Fresh live game evidence

Entering `/demo` through the first-screen action showed the persistent
**Demo — sample board, nothing is saved** label, the August 14, 2026 sample,
five creatures, and Board ID `989809312`.

The reverse placement order reached the actual 1/5 **Try again (0–2)** end
screen with five itemized results. Reset restored 0/5 and an empty trail. The
perfect order reached the actual 5/5 **Perfect (5)** end screen with five
successful results. Copy result contained `5/5 · Radiant` and the Board ID.
Replay and undo each restored the stated state.

No-selection, open-ground, wrong-shape, and wrong-orientation actions gave
specific recovery text and left the board playable. A keyboard-only run used
number keys, Q/E, F, arrows, Space, and Enter to reach 5/5. A fresh iPhone
touch run also reached 5/5 without overflow. The advertised daily and isolated
demo modes were exercised; there are no advertised settings, sound,
multiplayer, account, payment, or backend modes.

The fresh isolation run seeded a valid sample-date real run, current-day real
run, cookie, localStorage sentinel, and OPFS sentinel. Demo play and Reset
demo changed none of them, made no real-progress read, and created no IndexedDB
database. Start for real then read only the current-day real key. This is the
specific coverage omitted in Review 5 and is now present in the declared claim
test.

The complete desktop request log contained only same-origin GET requests with
no body, console error, or page error. At 4× CPU throttling, 180 frames measured
60.00 fps and the fixed simulation measured 60.34 Hz.

## Accessibility, routes, privacy, and offline use

Fresh Axe integration scans found no violations on `/`, `/demo`, `/privacy`,
`/terms`, or the designed missing route. The reset dialog contained focus and
returned it on Escape. Reduced motion computed to `0.00001s`. The suite covers
the repaired responsive matrix and 200% text reflow; current tests passed.

`verify-url.sh` passed fresh live home and demo checks. Both had a route title,
`lang=en`, one h1, a main landmark, complete image alt text, labeled buttons,
and no console errors. `/`, `/demo`, `/privacy`, and `/terms` returned 200 with
route-specific titles. `/missing-review-6` returned the expected HTTP 404 and
the designed page. The 404 is deliberate and not a defect.

In a separate warmed browser context, `/demo` reopened offline and showed its
board. Production sends HSTS, `nosniff`, a restrictive same-origin CSP with
`frame-ancestors 'none'`, strict referrer policy, and a restrictive permissions
policy.

The authoritative QA-report path named in the work order was not present in
this container despite a `/work` search. I did not treat the unavailable file
as evidence; this independent review reproduced the required product checks.

## Earlier findings and current disposition

| Earlier finding | Current disposition and proof |
| --- | --- |
| Verification 1: aggregate offline failure | Closed. The isolated exact claim, 32-test suite, and fresh live offline reopen pass. |
| Verification 1: game not on first screen | Closed. Fresh desktop and phone contexts show the board before scrolling. |
| Verification 1: small demo/navigation targets | Closed. The responsive/target tests pass. |
| Verification 1: missing frame/duration coverage and incomplete claims | Closed. The 60 Hz and 220 ms claims are declared and pass; all 22 claims have exact commands. |
| Verification 2: standalone offline failure and silent storage failure | Closed. `offline-reload` and `persistence-recovery` pass. |
| Verification 2: undo, copy, input, and session coverage | Closed. Their individual claim commands and fresh keyboard/touch/end runs pass. |
| Verification 2: hidden first-screen facts, unknown-route 200, skip/reflow | Closed. Fresh first-screen, real HTTP 404, and responsive/reflow tests pass. |
| Review 1 F-1-1: repeated perfect order | Closed. `unique-perfect` enumerates 120 orders over 48 dates and passes. |
| Review 1 F-1-2: demo privacy coverage | Closed. The exact test now covers valid sample-date/current-day keys, cookie, IndexedDB, OPFS, reads, reset, and exit. |
| Review 1 F-1-3: analytics and leaderboard promises | Closed. `same-origin`, `no-analytics`, `no-leaderboard`, and fresh request evidence pass. |
| Review 1 F-1-4 and F-1-5: scoring and tier promises | Closed. `mutation-scoring` and `score-tiers` pass, including 1/5, 3/5, and 5/5 itemized outcomes. |
| Review 1 F-1-6 through F-1-13: phone action result, control labels, terminology, README wording, title, decorative copy, privacy wording, and 404 structure | Closed. Current first-screen, accessible-name, copy, metadata, privacy, and designed-404 checks pass. |
| Verification 4: WCAG 2.5.3 label-in-name | Closed. The regression test and fresh Axe scans pass. |
| Review 2: 881–1024 px clipping, demo focus, missing 6×6 claim, and sub-44 px cells | Closed. The responsive/focus tests pass, `board-size` asserts 6×6/36 targets, and current target checks pass. |
| Review 3, Review 4, Verification 3, Verification 5, and Verification 6 | No open finding remained; their relevant paths were re-exercised above. |
| Review 5: demo-isolation claim missed sample-date key, OPFS, and read detection | Closed by the current exact claim and fresh live isolation run. |
| Verification 7 | Reported zero findings; this review independently reproduced its core claims, live runs, routes, privacy, offline, accessibility, and parity evidence. |

## Scope

This is a static local-first one-player browser game. It has no backend,
tenant, database, health endpoint, rate limit, 429/Retry-After behavior,
account, payment, multiplayer, CLI, desktop artifact, or library package.
Backend isolation, persistence restart, allowance, and consumer-install checks
do not apply. The brief's aggregate completion target would require analytics;
the game intentionally sends none and makes no public completion-rate claim.

**PASS — zero findings of every severity and zero untested public claims.**
