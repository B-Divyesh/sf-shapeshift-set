# Review 3 — Order five creatures on a daily board

**Verdict: PASS — zero findings and zero untested public claims.**

- Work order: `shapeshift-set-review-3`
- Implementation candidate: `08d18d967b84f9ba9b71549f4e069dff608e1824`
- Later test-only commit: `df4eff25078fcbdbecb04aafae3840edbfa5f872`
- Documentation base reviewed: `144c2d068dd7f844a5d8e993be82e587727b1491`
- Live URL: <https://shapeshift-set.sociobot.in>
- Reviewed: September 5, 2026 UTC
- Findings: 0 (P0: 0, P1: 0, P2: 0, P3: 0)
- Untested public claims: 0

No product code was changed during this review.

## Job, audience, and first action

The job is to order five creatures on a shared daily spatial board. The
audience is daily puzzle players who want a finite challenge. The first action
is **Try it with sample data**, which opens a complete sample board.

Fresh, unscrolled 1440×900 desktop and 390×844 phone contexts showed the job,
audience sentence, action, action result, three plain facts, and the playable
board. The phone had no horizontal overflow. The game is on the first screen.

Evidence: `review-3-evidence/first-desktop.png`, `first-phone.png`, and
`live-review.json`.

## Clean checkout and declared claims

A clean clone of `144c2d0` was installed from the documented setup. `npm ci`
installed 22 packages and reported no vulnerabilities. The following passed:

- `npm test`: 32/32 Playwright tests.
- `npm run lint`: TypeScript check passed.
- `npm run build`: produced `dist/`.
- JavaScript: 24.59 kB raw / 9.03 kB gzip.
- CSS: 16.86 kB raw / 4.63 kB gzip.

Every exact command in `.factory/claims.json` was then run separately. The
manifest has 22 unique IDs and the test source has exactly one matching tag
for every ID, with no missing or extra tag.

| Claim | Result | Observable result |
| --- | --- | --- |
| `daily-end` | PASS | Five placements reached a scored end screen. |
| `board-size` | PASS | The board had six rows, six columns, and 36 targets. |
| `unique-perfect` | PASS | All 120 orders across 48 dates gave one perfect answer and no repeated consecutive answer. |
| `restart` | PASS | Replay restored 0/5 and an empty trail. |
| `local-progress` | PASS | A real move survived reload. |
| `demo-isolation` | PASS | Seeded real storage, cookies, and IndexedDB stayed separate from demo play. |
| `offline-reload` | PASS | Two isolated warmed contexts reopened `/demo` offline. |
| `piece-settle-duration` | PASS | Enabled motion used the stated 220 ms duration. |
| `frame-rate` | PASS | Fixed-step timing stayed within the 55–65 Hz assertion around 60 Hz. |
| `keyboard-controls` | PASS | Number, Q/E, F, arrows, and Space selected, turned, moved, and placed. |
| `all-inputs` | PASS | Pointer and touch both selected, turned, and placed. |
| `undo-last-piece` | PASS | Undo restored the piece and removed its score and trail entry. |
| `copy-result` | PASS | Clipboard output included score, result, and Board ID. |
| `session-length` | PASS | Four placements did not end the board; five did. |
| `persistence-recovery` | PASS | A rejected storage write produced the stated reload warning. |
| `same-origin` | PASS | Runtime requests stayed on the product origin. |
| `no-analytics` | PASS | A complete run and replay sent no analytics payload. |
| `no-leaderboard` | PASS | The finished game exposed no leaderboard control or result. |
| `mutation-scoring` | PASS | A target placed first scored; a missing target did not. |
| `score-tiers` | PASS | Scores 1, 3, and 5 showed the stated tier and five result items. |
| `utc-daily` | PASS | The same date matched and the next UTC date changed the board. |
| `free-no-upsells` | PASS | The complete flow had no account, ad, booster, or payment control. |

The live page, README, legal pages, demo documentation, catalog description,
and metadata were cross-checked against the manifest. No functional, privacy,
offline, input, count, timing, or scope promise lacks a claim test.

## Fresh live game run

The fresh desktop context entered `/demo` through the one-click action. The
banner remained visible and read **Demo — sample board, nothing is saved**.
The run checked these invalid and recovery states:

- No selected creature gave a clear selection instruction.
- Open ground gave a dotted-habitat instruction.
- A creature with the wrong orientation gave rotate-or-flip guidance.
- The wrong habitat gave matching-shape guidance.
- A filled habitat was disabled against another placement.
- Undo, Reset demo, and Play this board again each restored the expected state.

Wing → Crook → Crown → Nook → Mote reached the actual 1/5 **Try again
(0–2)** end screen with five result items. Reset demo restored an empty 0/5
board. Mote → Nook → Crown → Crook → Wing then reached the actual 5/5
**Perfect (5)** end screen with five successful items.

The seeded `shapeshift-set:daily:sentinel` real-progress key, a second storage
sentinel, and a cookie were unchanged after play, reset, and **Start for real**.
The complete recorded browser flow used only same-origin GET requests and had
no console or page errors.

A separate keyboard-only run used number selection, Q/E, F, arrows, Space,
and Enter and reached 5/5 Perfect. A fresh touch phone selected, turned, and
placed Mote for 1/5. These runs cover entry, active play, a loss, a perfect
win, restart, keyboard, pointer, and touch.

Evidence: `review-3-evidence/loss-desktop.png`, `win-desktop.png`,
`keyboard-win.png`, `live-review.json`, and `live-review.mjs`.

Daily play and the isolated sample are the two advertised modes. The product
does not advertise multiplayer, sound, adjustable settings, accounts, or paid
features.

## Accessibility, routes, offline use, and performance

- Fresh Playwright Axe scans on `/`, `/demo`, `/privacy`, `/terms`, and the
  designed missing route found no violations.
- `/opt/fleet/lib/verify-url.sh` passed live `/` and `/demo`: titles, `lang=en`,
  one h1, main landmark, alt coverage, labeled buttons, and no console errors.
- The demo actions showed a 3 px visible keyboard outline. The focused outline
  and banner colors have 10.86:1 contrast.
- Reduced motion lowered animation and transition duration to 0.00001 seconds.
- At 200% text size, the phone layout had no horizontal overflow and kept the
  board and controls available.
- Widths 320, 881, 900, 1024, 1100, 1279, and 1280 px had no horizontal
  overflow or clipped controls. The smallest board target was 45.31 px.
- `/`, `/demo`, `/privacy`, and `/terms` returned 200 with distinct titles,
  one h1, one main, and a footer. All crawled internal links returned 200.
- `/missing-page` deliberately returned HTTP 404 and showed its designed page,
  route title, h1, main, footer, and return action. This expected 404 is not a
  defect.
- A fresh service-worker context loaded `/demo`, went offline, reloaded, and
  retained the title, sample heading, and playable board.
- A fresh 390×844 run with 4× CPU throttling measured 180 frames at 60.00 fps,
  a 16.67 ms mean frame, 16.80 ms p95, and a 60.34 Hz fixed step.
- Lighthouse 13.4.1 mobile `/demo`: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; FCP 0.9 s, LCP 1.2 s, CLS 0, TBT 80 ms, transfer
  37 KiB.

Evidence: `review-3-evidence/live-review.json`, `lighthouse-mobile.json`,
`verify-home/`, and `verify-demo/`.

## Live and candidate parity

The freshly rebuilt candidate and production match byte for byte across all 13
served product files: HTML, service worker, hashed JS and CSS, designed 404,
404 CSS, both hero images, social image, icons, robots, and sitemap. Key
SHA-256 values are `087ec156…d63974e` for HTML,
`63e4e7f4…606554f9` for JS, and `54856cb7…09fa5483` for CSS.

The last runtime implementation change is `08d18d9`. Commit `df4eff2` changes
only tests, and commits through the reviewed documentation base `144c2d0`
change reports and evidence. A new product image is therefore unnecessary.

## Earlier finding disposition

| Earlier finding | Current disposition and fresh proof |
| --- | --- |
| Verification 1: full-suite offline failure | Closed. The standalone claim, 32-test suite, and fresh live offline reload passed. |
| Verification 1: game absent from first viewport | Closed. Fresh desktop and phone captures show the playable board without scrolling. |
| Verification 1: small demo/nav targets | Closed. Current responsive and target checks pass; minimum board target is 45.31 px. |
| Verification 1: untested 3–5 minute and frame claims | Closed. The duration claim was removed; the 60 Hz claim is declared, tested, and freshly measured. |
| Verification 2: silent storage-write failure | Closed. `persistence-recovery` shows the reload warning and passes. |
| Verification 2: incomplete undo, copy, session, and input claims | Closed. All four areas have passing declared claims. |
| Verification 2: first-screen facts hidden | Closed. All three facts are visible in both fresh opening captures. |
| Verification 2: missing route returned 200 | Closed. The designed route returns the expected HTTP 404. |
| Verification 2: skip target and 200% reflow | Closed. Target sizing and fresh 200% no-overflow checks pass. |
| Review 1 F-1-1: repeated daily perfect order | Closed. `unique-perfect` checks all orders across 48 dates and consecutive answers. |
| Review 1 F-1-2: under-tested demo isolation | Closed. The claim seeds real product storage, cookies, and IndexedDB; fresh live sentinels stayed unchanged. |
| Review 1 F-1-3: analytics and leaderboard claims | Closed. Both have separate passing claim tests; the live request log is same-origin only. |
| Review 1 F-1-4: scoring rule not registered | Closed. `mutation-scoring` passes target-first and target-missing outcomes. |
| Review 1 F-1-5: tier and itemized result not registered | Closed. `score-tiers` passes scores 1, 3, and 5 with five result items. |
| Review 1 F-1-6: phone hid action result | Closed. “Opens a complete sample board” is visible in the fresh phone capture. |
| Review 1 F-1-7: controls did not name results | Closed. Visible labels remain in accessible names; keyboard, touch, and Axe checks pass. |
| Review 1 F-1-8: result and board jargon | Closed. The UI uses Board ID, changed neighbors, and numeric tier labels. |
| Review 1 F-1-9: inconsistent affected object | Closed. Public copy consistently says a neighboring creature or changed neighbor. |
| Review 1 F-1-10: inaccurate home title | Closed. The live title is “Shapeshift Set — order five creatures daily.” |
| Review 1 F-1-11: decorative caption | Closed. The caption is absent; useful art provenance remains in the footer. |
| Review 1 F-1-12: README privacy jargon | Closed. README uses plain site, code, file, and offline wording. |
| Review 1 F-1-13: incomplete 404 metadata/footer | Closed. The live 404 has product metadata, icons, build footer, and art notice. |
| Verification 4: WCAG 2.5.3 label-in-name | Closed. Current Axe, the label regression, and the full suite pass. |
| Review 2: controls clipped at 881–1024 px | Closed. Fresh 881, 900, and 1024 px checks show no overflow or clipped controls. |
| Review 2: demo focus indicator had 1:1 contrast | Closed. Both actions show a 3 px night outline with 10.86:1 contrast. |
| Review 2: 6×6 promise was untested | Closed. `board-size` is declared and asserts 36 targets in six rows and columns. |
| Review 2: board cells below 44 px | Closed. The fresh matrix minimum is 45.31 px. |

All earlier blocking and minor findings remain closed.

## Scope and known limit

This is a static, local-first, one-player browser game. It has no backend,
tenant, server database, health endpoint, API allowance, rate limit, payment,
multiplayer room, CLI, desktop package, or library consumer install. Backend
isolation, restart persistence, 429/Retry-After, and installed-artifact checks
do not apply.

The brief's 40% aggregate completion success measure needs player analytics.
The product intentionally sends none, so that external product measure remains
unavailable and is not presented as a public product claim. The brief does not
imply a useful AI step, and adding one would not improve the finite puzzle.

## Final decision

**PASS — zero findings of every severity and zero untested public claims.**
