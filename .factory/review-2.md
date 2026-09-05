# Review 2 — Order five creatures on a daily board — FAIL

**Verdict: FAIL — 4 findings remain, including 1 untested public claim.**

- Work order: `shapeshift-set-review-2`
- Implementation candidate: `13798bda2c3d332c1a9051ae5145ff87e2223716`
- Test-only commit: `76b1867a1929e48512aa7b57e22cd9edb9cd3657`
- Documentation base reviewed: `2acb9ba2f5466edb37e78a933544d02c796cd40e`
- Live URL: <https://shapeshift-set.sociobot.in>
- Reviewed: September 5, 2026 UTC
- Findings: 4 (P0: 0, P1: 3, P2: 1, P3: 0)
- Untested public claims: 1

## Job, audience, and first action

The job is to place five creatures in the right order on a shared daily board.
The audience is daily puzzle players who want a finite spatial challenge. The
first action is **Try it with sample data**. The next line says it opens a
complete sample board.

Fresh, unscrolled 1440×900 and 390×844 browser contexts showed that text, all
three plain facts, and the game itself. The board began at 316.45 px on desktop
and 573.16 px on phone. Neither viewport overflowed. The page uses plain words
and the first heading names the job.

## Findings

### P1 — The game is clipped and cannot be completed with a pointer at a 900 px viewport

At 900×900, the document is 981 px wide while the viewport is 900 px. The body
uses `overflow-x: clip`, and an attempted horizontal scroll remains at zero.
The Crook control starts at x=929.13 px and ends at x=980.72 px, so the whole
control is outside the visible and scrollable area. Crown and the right-side
turn and reset controls are also clipped. A pointer or touch player cannot
select all five creatures and finish the board at this common small-laptop or
tablet width.

The same breakpoint fault produced 92 px of hidden overflow at 881 px and 10 px
at 1024 px. Widths at or below 880 px switch to the working stacked layout;
1280 px and 1440 px also pass. The failure begins when the two-column opening
returns while `.game-layout` still requires two minimum-width columns.

Evidence: `.factory/review-2-evidence/live-900-clipped.png` and
`.factory/review-2-evidence/strict-responsive-focus.json`.

### P1 — Demo banner actions have no visible keyboard focus indicator

Keyboard focus reaches **Reset demo** and **Start for real**, but both controls
use the global 3 px lichen outline on the same lichen banner. The computed
outline and banner are both `rgb(185, 214, 107)`, a 1:1 contrast ratio. The
links are already underlined before focus, so focus creates no other visible
change. This fails the required 3:1 focus-indicator contrast and leaves a
keyboard user unable to see which demo action is active.

Evidence: `.factory/review-2-evidence/focus-reset-demo.png` and the
`demoBannerFocus` record in `strict-responsive-focus.json`.

### P1 — The public 6×6 board claim is not declared or tested

The first-screen label and page description promise a shared 6×6 board.
`.factory/claims.json` has no 6×6 claim, and no tagged test asserts 36 cells or
six rows and columns. The live board is currently 6×6, but an ad hoc observation
does not satisfy the claims contract. Add the dimension to a declared claim and
assert it in that claim's sandbox test, or remove the public number.

This is the review's one untested public claim.

### P2 — Board touch targets fall below 44 px at supported responsive widths

All 36 board cells measure 39.05×39.05 px at a 320 px phone width. They measure
41.03×41.03 px at 881, 900, 1024, and 1100 px. The 360 px, 390 px, 600–800 px,
1280 px, and 1440 px samples pass. This violates the stated 44×44 px target
minimum even where the complete board remains visible.

Evidence: the viewport matrix in
`.factory/review-2-evidence/strict-responsive-focus.json`.

## Declared claims and clean checkout

A separate clean clone of documentation base `2acb9ba` was installed with
`npm ci`. Every exact command in `.factory/claims.json` then passed
independently:

| Claims | Result |
| --- | --- |
| `daily-end`, `unique-perfect`, `restart`, `local-progress`, `demo-isolation`, `offline-reload`, `piece-settle-duration` | PASS |
| `frame-rate`, `keyboard-controls`, `all-inputs`, `undo-last-piece`, `copy-result`, `session-length`, `persistence-recovery` | PASS |
| `same-origin`, `no-analytics`, `no-leaderboard`, `mutation-scoring`, `score-tiers`, `utc-daily`, `free-no-upsells` | PASS |

All 21 manifest IDs are unique, each appears on exactly one tagged test, and
there are no undeclared claim tags. The unlisted 6×6 statement above means the
claims gate still fails despite all declared commands passing.

The clean aggregate gates passed:

```text
npm test       PASS — 29/29
npm run lint   PASS
npm run build  PASS — dist/
```

The build produced 24.59 kB JavaScript (9.03 kB gzip) and 16.65 kB CSS
(4.59 kB gzip).

## Live game and demo evidence

The one-click action opened `/demo` with Board ID `989809312`, five named
creatures, the August 14, 2026 sample, and the persistent label “Demo — sample
board, nothing is saved.”

- Reset demo restored 0/5, an empty result list, and all five pieces.
- The reverse order reached 1/5, **Try again (0–2)**, and five itemized results.
- A mixed order reached the 3/5 **Close (3–4)** boundary.
- Mote → Nook → Crown → Crook → Wing reached 5/5, **Perfect (5)**, and five
  successful results.
- Play this board again cleared the completed loss before the perfect run.
- Copy result put the score, result, and Board ID on the clipboard.
- A separate keyboard-only run used number keys, Q/E, F, arrows, Tab, Space,
  and Enter to reach the perfect end screen.
- A fresh 390 px touch context selected, turned, and placed Mote.
- No-selection, open-ground, wrong-shape, wrong-orientation, occupied-habitat,
  and undo recovery paths all returned useful instructions and stayed playable.
- Real daily progress used only `shapeshift-set:daily:2026-09-05`, survived a
  reload, and opened a focus-managed reset confirmation.

The demo test began with two real-storage sentinels and a cookie. Demo play,
Reset demo, a loss, replay, a win, and Start for real left them byte-for-byte
unchanged and created no IndexedDB database. The complete run made five GET
requests, all to the product origin, with no analytics payload, console error,
or page error.

Screenshots and structured results are in `.factory/review-2-evidence/`.

## Routes, offline behavior, accessibility, and performance

- `/`, `/demo`, `/privacy`, and `/terms` returned 200. `/missing-page`
  deliberately returned 404 and showed the designed page with a return link.
- Every route had its own title, `lang=en`, one h1, one main landmark,
  descriptions, canonicals, social metadata, complete alt coverage, and zero
  Axe violations. The experimental label-in-name rule found zero violations.
- Internal links returned 200, and the external Param Factory link returned
  200. Back navigation restored the prior scroll position and focused the h1.
- At 390 px, all 56 links and buttons met 44×44 px and 200% text caused no
  overflow. Reduced-motion durations were 0.00001 seconds. The wider and 320 px
  exceptions are recorded as findings above.
- `verify-url.sh` passed `/` and `/demo` with no console errors.
- A fresh service worker updated, controlled the page, held the exact current
  JS and CSS, reopened `/demo` offline, and preserved the real 404 response.
- Fixed-step timing measured 59.98 Hz over one second. At 4× CPU slowdown, 180
  rendered frames measured 60.00 fps with a 16.70 ms p95 interval.
- Lighthouse 13.4.1 mobile `/demo`: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; FCP 0.90 s, LCP 1.20 s, CLS 0, TBT 48 ms, and 37,755
  transferred bytes. Manual checks found the focus issue Lighthouse missed.
- HTTPS sent HSTS, `nosniff`, strict-origin referrer policy, a restrictive
  permissions policy, and a same-origin CSP with `frame-ancestors 'none'`.

Thirteen served files, including HTML, JS, CSS, service worker, 404 page,
metadata files, icons, and all production images, byte-matched the clean
`dist/` build. Later commits after implementation `13798bd` contain only a test
change and reports, so the live product matches the last implementation
candidate.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Verification 1: aggregate offline failure | Closed. The exact claim, aggregate suite, and live offline reopen pass. |
| Verification 1: game below the first viewport | Closed at 1440×900 and 390×844. |
| Verification 1: demo/nav targets below 44 px | Closed for those controls at 390 px. The new board-cell finding covers other widths. |
| Verification 1: missing duration and frame-rate coverage | Closed by the 220 ms and 60 fps claim tests. |
| Verification 2: standalone offline failure | Closed by the clean exact command and fresh live worker context. |
| Verification 2: silent storage-write failure | Closed by `persistence-recovery` in the clean suite. |
| Verification 2: copy, undo, input, and session coverage | Closed by their four claim commands and live keyboard/touch runs. |
| Verification 2: three hidden first-screen facts | Closed at the required desktop and phone sizes. |
| Verification 2: unknown route returned 200 | Closed. The host and controlled worker both return 404. |
| Verification 2: skip-link size and 200% reflow | Closed at 390 px. The new target-size finding is about board cells at other widths. |
| Review 1 F-1-1: repeated perfect order | Closed. Forty-eight dates and all 120 orders pass; the code advances through all 120 daily orders. |
| Review 1 F-1-2: demo privacy under-tested | Closed by seeded storage, cookie, IndexedDB, reset, and exit checks. |
| Review 1 F-1-3: analytics and leaderboard claims | Closed by their declared full-flow tests and live request log. |
| Review 1 F-1-4: mutation rule unregistered | Closed by `mutation-scoring`. |
| Review 1 F-1-5: tiers and itemized results unregistered | Closed by 1/5, 3/5, and 5/5 claim and live runs. |
| Review 1 F-1-6: phone hid the sample outcome | Closed. The outcome is visible beside the phone action. |
| Review 1 F-1-7: controls did not name results | Closed in current visible and accessible labels. |
| Review 1 F-1-8: unexplained result terms | Closed with Board ID, changed neighbors, and numbered result labels. |
| Review 1 F-1-9: README said tile instead of creature | Closed. README consistently says creature. |
| Review 1 F-1-10: incorrect home title | Closed. The title says “order five creatures daily.” |
| Review 1 F-1-11: decorative caption | Closed. The caption is removed. |
| Review 1 F-1-12: privacy jargon | Closed. The current text says no code or files load from other sites. |
| Review 1 F-1-13: incomplete 404 metadata/footer | Closed. The static 404 has the shared metadata and footer details. |
| Verification 3 | It reported no defect; its gameplay, privacy, route, and performance paths still pass at its tested sizes. |
| Verification 4: eight WCAG 2.5.3 label-in-name failures | Closed by the updated labels, local regression, and live experimental Axe scan. |

## Not applicable

This is a static, local-first, one-player browser game. It has no backend,
tenant, account, payment, health endpoint, rate limit, multiplayer room, CLI,
library package, sound setting, or advertised mode beyond daily play and the
isolated demo. Backend persistence, restart, 429/Retry-After, multiplayer, and
consumer-package checks do not apply. A model-assisted feature would not
improve this deterministic spatial puzzle, so there is no missed AI step.

The brief's aggregate 40% completion measure cannot be checked without player
analytics, which the product intentionally does not collect.
