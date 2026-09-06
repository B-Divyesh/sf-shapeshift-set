# Review 4 — Order five creatures on a daily board

**Verdict: PASS — zero findings and zero untested public claims.**

- Work order: `shapeshift-set-review-4`
- Implementation candidate: `08d18d967b84f9ba9b71549f4e069dff608e1824`
- Later test-only commit: `df4eff25078fcbdbecb04aafae3840edbfa5f872`
- Documentation base reviewed: `fbb639a4f565a0d1832f8a598a9eb2e1e6e02410`
- Live URL: <https://shapeshift-set.sociobot.in>
- Reviewed: September 6, 2026 UTC
- Findings: 0 (P0: 0, P1: 0, P2: 0, P3: 0)
- Untested public claims: 0

No product code was changed during this review.

## Job, audience, and first action

The job is to order five creatures on a shared daily spatial board. The
audience is daily puzzle players who want a finite challenge. The first action
is **Try it with sample data**. The next line says it opens a complete sample
board.

Fresh, unscrolled 1440×900 desktop and 390×844 phone contexts showed the job,
audience sentence, action, action result, three plain facts, and the playable
board. The phone had no horizontal overflow. The game appears on the first
screen instead of behind a menu.

Evidence: `review-4-evidence/first-desktop.png`, `first-phone.png`, and
`live-review.json`.

## Clean checkout and declared claims

A fresh clone of `fbb639a` was installed with the documented Node.js and npm
setup. These commands passed:

- `npm ci`: 22 packages installed; no vulnerabilities reported.
- `npm test`: 32/32 Playwright tests passed.
- `npm run lint`: TypeScript check passed.
- `npm run build`: produced `dist/`.
- JavaScript: 24.59 kB raw / 9.03 kB gzip.
- CSS: 16.86 kB raw / 4.63 kB gzip.

Every exact command in `.factory/claims.json` was then run separately from the
clean clone. The manifest has 22 unique IDs. The test source has exactly one
matching tag for each ID, with no missing, duplicate, or extra claim tag.

| Claim | Result | Observable result |
| --- | --- | --- |
| `daily-end` | PASS | Five sample placements reached the scored end screen. |
| `board-size` | PASS | The board rendered six rows, six columns, and 36 targets. |
| `unique-perfect` | PASS | All 120 orders across 48 dates gave one perfect answer and no repeated consecutive answer. |
| `restart` | PASS | Replay restored 0/5 and an empty result trail. |
| `local-progress` | PASS | A real move survived reload. |
| `demo-isolation` | PASS | Seeded real storage, a cookie, and IndexedDB stayed separate from demo play, reset, and exit. |
| `offline-reload` | PASS | A warmed, isolated demo context reopened offline. |
| `piece-settle-duration` | PASS | Enabled motion used the stated 220 ms duration. |
| `frame-rate` | PASS | Fixed-step timing stayed inside the 55–65 Hz assertion around 60 Hz. |
| `keyboard-controls` | PASS | Number, Q/E, F, arrows, and Space selected, turned, moved, and placed a creature. |
| `all-inputs` | PASS | Pointer and touch each selected, turned, and placed a creature. |
| `undo-last-piece` | PASS | Undo returned the latest creature and removed its score and result entry. |
| `copy-result` | PASS | Clipboard output included score, result, and Board ID. |
| `session-length` | PASS | Four placements did not end the board; five did. |
| `persistence-recovery` | PASS | A rejected storage write produced the promised reload warning. |
| `same-origin` | PASS | Demo runtime requests stayed on the product origin. |
| `no-analytics` | PASS | A complete run and replay sent no analytics request or event payload. |
| `no-leaderboard` | PASS | The completed flow exposed no leaderboard control or output. |
| `mutation-scoring` | PASS | Target-first scored; dependent-first did not. |
| `score-tiers` | PASS | Scores 1, 3, and 5 showed the stated tier and five itemized results. |
| `utc-daily` | PASS | The same UTC date matched and the next date changed the board. |
| `free-no-upsells` | PASS | The complete flow had no account, ad, booster, or payment control. |

The live page, README, privacy page, terms, demo documentation, catalog copy,
and metadata were compared with the manifest. Every functional, privacy,
offline, input, size, timing, and scope statement has a test. No unlisted
public claim was found.

## Fresh live game runs

The desktop context entered `/demo` through the first-screen action. The
persistent banner read **Demo — sample board, nothing is saved**. Real product
storage sentinels and a cookie remained byte-for-byte unchanged through demo
play, reset, both end states, and **Start for real**.

The desktop run checked no selection, open ground, wrong shape, wrong
orientation, and a filled habitat. Each invalid action gave a useful recovery
instruction and left the board playable. Wing → Crook → Crown → Nook → Mote
reached the actual 1/5 **Try again (0–2)** end screen with five itemized
results. Reset restored 0/5 and an empty trail. Mote → Nook → Crown → Crook →
Wing then reached 5/5 **Perfect (5)** with five successful results. Undo and
**Play this board again** also restored the expected state.

A separate keyboard-only desktop run used number selection, Q/E, F, arrows,
Space, and Enter and reached 5/5 Perfect. A fresh 390×844 touch session entered
the sample from home, completed the same perfect order, reached the real 5/5
end screen without overflow, and replayed to 0/5 with an empty trail.

Evidence: `review-4-evidence/loss-desktop.png`, `win-desktop.png`,
`keyboard-win.png`, `phone-perfect-end.png`, `live-review.json`, and
`supplemental.json`.

Daily play and the isolated sample are the only advertised modes. The product
does not advertise multiplayer, sound, adjustable settings, accounts, or paid
features.

## Accessibility, routes, privacy, offline use, and performance

- Fresh Axe scans on `/`, `/demo`, `/privacy`, `/terms`, and the designed
  missing route found zero violations.
- `/opt/fleet/lib/verify-url.sh` passed live home and demo. Both have the right
  title, `lang=en`, one h1, one main, complete image alt text, labeled buttons,
  and no console errors.
- Keyboard focus is visible on the demo banner actions. Route changes focus
  the h1 and announce the page. Browser back restored home focus and the prior
  scrolled position. The reset dialog opened with a clear name and initial
  focus, kept keyboard focus in the modal, and returned focus after Escape.
- The viewport permits zoom. At 200% text size, the phone layout retained the
  board and controls with no horizontal overflow.
- Widths 320, 881, 900, 1024, 1100, 1279, and 1280 px had no horizontal
  overflow or clipped controls. The smallest board target was 45.31 px.
- Reduced motion lowered animation and transition duration to 0.00001 seconds.
  There is no flashing, autoplay, or audio.
- `/`, `/demo`, `/privacy`, and `/terms` returned 200 with distinct titles,
  one h1, one main, and a footer. All internal links, `robots.txt`,
  `sitemap.xml`, and the external Param Factory link returned 200.
- `/missing-page` deliberately returned HTTP 404 and showed the designed page,
  correct title, one h1/main, shared footer, and a return action. The expected
  404 is not a defect.
- A fresh service-worker context was controlled by an activated worker with
  the current hashed JavaScript and CSS cached. No worker was waiting or
  installing. The warmed `/demo` route then reopened offline with its board.
- The recorded complete flow made five same-origin GET requests, sent no
  bodies, and produced no console or page errors.
- On a 390×844 context with 4× CPU throttling, 180 frames measured 60.00 fps,
  16.67 ms mean, 16.70 ms p95, and a 60.33 Hz fixed step.
- Fresh Lighthouse mobile `/demo`: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; FCP 0.9 s, LCP 1.2 s, TBT 70 ms, CLS 0, and 37 KiB
  transferred.
- HTTPS sends HSTS, `nosniff`, strict-origin referrer policy, a same-origin CSP
  with `frame-ancestors 'none'`, and a restrictive permissions policy.

The single-mode night palette, editorial layout, generated moon-garden art,
board shapes, typography, spacing, and reduced-motion policy match
`.factory/design.md`. The interface is product-specific and stays usable on
the reviewed phone and desktop sizes.

## Live and candidate parity

The rebuilt implementation and production matched byte-for-byte across all 13
public product files: HTML, service worker, hashed JavaScript and CSS, designed
404, 404 CSS, both hero images, social image, icons, robots, and sitemap. The
HTML SHA-256 begins `087ec156`, JavaScript `63e4e7f4`, and CSS `54856cb7`.

The last runtime implementation change is `08d18d9`. Commit `df4eff2` changes
only tests. Commits through documentation base `fbb639a` change reports and
evidence only, so a later product image is not required.

## Earlier finding disposition

| Earlier finding | Current disposition and fresh proof |
| --- | --- |
| Verification 1: aggregate offline failure | Closed. The aggregate suite, exact claim, activated live worker, and offline reload passed. |
| Verification 1: game absent from the first viewport | Closed. Fresh desktop and phone captures show the playable board without scrolling. |
| Verification 1: small demo/navigation targets | Closed. Current target and responsive checks pass; the smallest board target is 45.31 px. |
| Verification 1: untested duration and frame claims | Closed. The removed session-duration statement remains absent; 220 ms and 60 Hz claims passed and were measured live. |
| Verification 2: silent storage-write failure | Closed. `persistence-recovery` passed with the reload warning. |
| Verification 2: incomplete undo, copy, session, and input coverage | Closed. Each area has a separate passing claim and live exercise. |
| Verification 2: first-screen facts hidden | Closed. All three facts are visible in both fresh opening captures. |
| Verification 2: missing route returned 200 | Closed. The designed missing route returns HTTP 404 before and after worker control. |
| Verification 2: skip target and 200% reflow | Closed. Touch sizing, zoom, and 200% reflow pass. |
| Review 1 F-1-1: repeated daily perfect order | Closed. `unique-perfect` checks all orders across 48 dates and rejects consecutive repeats. |
| Review 1 F-1-2: demo privacy under-tested | Closed. Seeded storage, cookie, IndexedDB, reset, and exit checks pass; fresh live sentinels stayed unchanged. |
| Review 1 F-1-3: analytics and leaderboard claims | Closed. Both separate claims pass; live requests are same-origin GETs without bodies. |
| Review 1 F-1-4: scoring rule not registered | Closed. `mutation-scoring` proves target-present and target-missing outcomes. |
| Review 1 F-1-5: tiers and itemized results not registered | Closed. Scores 1, 3, and 5 each show five results. |
| Review 1 F-1-6: phone hid the sample outcome | Closed. The action result is visible in the fresh phone capture. |
| Review 1 F-1-7: controls did not name results | Closed. Visible labels remain in accessible names; keyboard, touch, and Axe checks pass. |
| Review 1 F-1-8 and F-1-9: unclear or inconsistent result terms | Closed. The product uses Board ID, changed neighbors, creature, and numbered result labels consistently. |
| Review 1 F-1-10 through F-1-13: title, decorative copy, privacy jargon, and incomplete 404 | Closed. The title and privacy words are plain; decorative copy is absent; the fresh 404 has complete metadata and footer content. |
| Verification 4: WCAG 2.5.3 label-in-name failures | Closed. The regression test and fresh Axe scans pass. |
| Review 2: controls clipped from 881–1024 px | Closed. The fresh responsive matrix has no overflow or clipped tools. |
| Review 2: demo focus indicator had 1:1 contrast | Closed. Both banner actions show the designed contrasting outline. |
| Review 2: 6×6 statement was untested | Closed. `board-size` is declared and asserts 36 targets in six rows and columns. |
| Review 2: board cells fell below 44 px | Closed. The fresh matrix minimum is 45.31 px. |

All earlier blocking and minor findings remain closed.

## Scope and final decision

This is a static, local-first, one-player browser game. It has no backend,
tenant, server database, health endpoint, API allowance, rate limit, payment,
multiplayer room, CLI, desktop package, or library consumer install. Backend
isolation, restart persistence, 429/Retry-After, multiplayer, and installed
artifact checks do not apply.

The brief's 40% aggregate completion measure would require player analytics.
The product intentionally sends none, so that external measure is unavailable
and is not a public product claim. The brief does not imply a useful AI step.

**PASS — zero findings of every severity and zero untested public claims.**
