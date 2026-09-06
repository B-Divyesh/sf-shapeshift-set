# Review 5 — Order five creatures on a daily board

**Verdict: FAIL — 1 finding and 1 untested public claim.**

- Work order: `shapeshift-set-review-5`
- Implementation candidate: `08d18d967b84f9ba9b71549f4e069dff608e1824`
- Later test-only commit: `df4eff25078fcbdbecb04aafae3840edbfa5f872`
- Documentation base reviewed: `ccb4763e52211392212ed309885692e2b6976602`
- Live URL: <https://shapeshift-set.sociobot.in>
- Reviewed: September 6, 2026 UTC
- Findings: 1 (P0: 0, P1: 1, P2: 0, P3: 0)
- Untested public claims: 1

No product code was changed during this review.

## Finding

### P1 — The demo isolation claim test does not cover its full storage promise

The public claim says: **“Demo uses memory only and never reads or changes real
progress.”** `.factory/demo.md` makes the storage boundary explicit: the demo
does not read or write localStorage, IndexedDB, OPFS, cookies, or a backend.

The exact `@claim:demo-isolation` command passes, but its test is incomplete:

- It seeds `shapeshift-set:daily:sentinel`, not the real sample-date key
  `shapeshift-set:daily:2026-08-14`. A regression that reads the normal key for
  the sample date would not be detected.
- It compares localStorage and a cookie and enumerates IndexedDB databases.
  It never creates or checks an OPFS sentinel, despite the explicit OPFS
  promise.
- It proves the seeded values were not changed. It does not observe whether
  real progress was read while demo mode was active.

A fresh ad hoc live check found that the current product behaves correctly. It
seeded the real sample-date key, a cookie, and an OPFS file; instrumented
localStorage reads; played and reset the demo; and found zero demo reads with
all three sentinels unchanged. That manual result does not repair the declared
claim command. The claims contract requires the exact command to prove the
full promise on every build.

Evidence: `review-5-evidence/claim-gap.json` and
`tests/game.spec.ts:181-204`.

Required repair: extend `@claim:demo-isolation` to seed a valid real run under
the sample-date storage key, detect reads during demo play, create and compare
an OPFS sentinel when OPFS is available, and keep the existing cookie,
localStorage, IndexedDB, reset, and exit checks.

## Job, audience, and first action

The job is to order five creatures on a shared daily spatial board. The
audience is daily puzzle players who want one finite challenge. The first
action is **Try it with sample data**. The next line says it opens a complete
sample board.

Fresh, unscrolled 1440×900 desktop and 390×844 phone contexts showed the job,
audience sentence, action, action result, three plain facts, and the playable
board. The phone had no horizontal overflow. The game appears on the first
screen instead of behind a menu.

Evidence: `review-5-evidence/first-desktop.png`, `first-phone.png`, and
`live-review.json`.

## Clean checkout and declared claims

A fresh clone of `ccb4763` was installed with the documented Node.js 20-or-
later and npm setup. The review used Node.js 22.23.2 and npm 10.9.8.

- `npm ci`: passed; 22 packages installed and no vulnerabilities were
  reported.
- `npm test`: passed; 32/32 Playwright tests in 40.5 seconds.
- `npm run lint`: passed.
- `npm run build`: passed and produced `dist/`.
- JavaScript: 24.59 kB raw / 9.03 kB gzip.
- CSS: 16.86 kB raw / 4.63 kB gzip.

All 22 exact commands in `.factory/claims.json` were run separately. Every
command exited successfully. The manifest has 22 unique IDs and 22 unique
commands. The test source has exactly one tag for every ID, with no missing,
duplicate, or extra tag.

| Claim | Command result | Review result and evidence |
| --- | --- | --- |
| `daily-end` | PASS | Five sample placements reached the scored end screen. |
| `board-size` | PASS | The sample rendered six rows, six columns, and 36 targets. |
| `unique-perfect` | PASS | All 120 orders across 48 dates gave one perfect answer and different consecutive answers. |
| `restart` | PASS | Replay restored 0/5 and an empty result trail. |
| `local-progress` | PASS | A real move survived reload locally and on the live site. |
| `demo-isolation` | PASS | **FAIL: incomplete test.** It does not cover the real sample-date key, OPFS, or read detection. |
| `offline-reload` | PASS | A warmed isolated context reopened the sample offline. |
| `piece-settle-duration` | PASS | Enabled motion used the stated 220 ms duration. |
| `frame-rate` | PASS | Fixed-step timing stayed inside the 55–65 Hz assertion around 60 Hz. |
| `keyboard-controls` | PASS | Number, Q/E, F, arrows, Space, and Enter operated the game. |
| `all-inputs` | PASS | Pointer and touch selected, turned, and placed creatures. |
| `undo-last-piece` | PASS | Undo returned the creature and removed its score and trail entry. |
| `copy-result` | PASS | Clipboard text included score, result, and Board ID. |
| `session-length` | PASS | Four placements did not end the board; five did. |
| `persistence-recovery` | PASS | A rejected storage write showed the promised reload warning. |
| `same-origin` | PASS | Demo runtime requests stayed on the product origin. |
| `no-analytics` | PASS | A complete run and replay sent no analytics request or event payload. |
| `no-leaderboard` | PASS | The completed flow exposed no leaderboard control or output. |
| `mutation-scoring` | PASS | Target-first scored and dependent-first did not. |
| `score-tiers` | PASS | Scores 1, 3, and 5 showed the stated tier and five result items. |
| `utc-daily` | PASS | The same UTC date matched and the next date changed the board. |
| `free-no-upsells` | PASS | The complete flow exposed no account, ad, booster, or payment control. |

The live page, README, privacy page, terms, demo documentation, catalog copy,
and metadata were compared with the manifest. No other unlisted or incomplete
public claim was found.

## Fresh live game runs

The desktop context entered `/demo` through the first-screen action. The
persistent banner read **Demo — sample board, nothing is saved**. The sample
was dated August 14, 2026, used Board ID `989809312`, and showed five named
creatures, habitats, arrows, and an itemized changed-neighbor trail.

The desktop run checked no selection, open ground, wrong shape, wrong
orientation, and a filled habitat. Each invalid action gave a useful recovery
instruction and left the board playable. Wing → Crook → Crown → Nook → Mote
reached the actual 1/5 **Try again (0–2)** end screen with five result items.
Reset restored 0/5 and an empty trail. Mote → Nook → Crown → Crook → Wing then
reached 5/5 **Perfect (5)** with five successful results. Copy result included
5/5, Radiant, and Board ID `989809312`. Replay and undo each restored the
expected state.

A separate keyboard-only desktop run used number selection, Q/E, F, arrows,
Space, and Enter and reached 5/5 Perfect. A fresh 390×844 touch session entered
the sample from home, completed the same perfect order, reached the real 5/5
end screen without overflow, and replayed to 0/5 with an empty trail.

The normal daily mode saved one move only under
`shapeshift-set:daily:2026-09-06` and restored it after reload. A forced storage
write failure showed “This run will not survive reload,” and reload returned
to 0/5. Offline and online status changes kept the current 1/5 board in place.

The original live demo sentinel check left real storage and its cookie
unchanged. The stronger ad hoc check also left the real sample-date key and an
OPFS file unchanged and observed no localStorage reads in demo mode. The
finding is about the incomplete registered claim command, not a reproduced
runtime data change.

Evidence: `review-5-evidence/loss-desktop.png`, `win-desktop.png`,
`keyboard-win.png`, `phone-win.png`, `live-review.json`, `supplemental.json`,
and `claim-gap.json`.

Daily play and the isolated sample are the only advertised modes. The product
does not advertise multiplayer, sound, adjustable settings, accounts, or paid
features.

## Accessibility, routes, privacy, offline use, and performance

- Fresh Axe scans on `/`, `/demo`, `/privacy`, `/terms`, and the designed
  missing route found zero violations.
- `/opt/fleet/lib/verify-url.sh` passed the live home and demo routes. Both had
  the right title, `lang=en`, one h1, one main, complete image alt text,
  labeled buttons, and no console errors.
- The skip link worked. Keyboard focus was visible on the demo actions. The
  reset dialog had a clear name, kept focus inside, closed with Escape, and
  returned focus to Reset board.
- Route changes focused the h1 and announced the new page. Browser back
  restored home focus and the prior scroll position.
- Browser zoom was enabled. At 200% text size the phone layout kept the board
  and controls without horizontal overflow.
- Widths 320, 390, 881, 900, 1024, 1100, 1279, 1280, and 1440 px had no
  horizontal overflow or clipped controls. The smallest board target was
  45.31 px.
- Reduced motion lowered animation and transition duration to 0.00001 seconds.
  There is no autoplay, audio, or flashing content.
- `/`, `/demo`, `/privacy`, and `/terms` returned 200 with distinct titles,
  descriptions, canonicals, one h1, one main, and a footer. Every link checked
  returned 200.
- `/missing-page-review-5` deliberately returned HTTP 404 and showed the
  designed page, correct title, shared structure, and return action. The
  browser's expected 404 resource message is not a defect.
- A fresh service-worker context was controlled by an activated worker with
  the current hashed JavaScript and CSS cached. No worker was waiting or
  installing. The warmed sample reopened offline.
- The complete recorded flow made only same-origin GET requests, sent no
  request bodies, and produced no unexpected console or page errors.
- On a 390×844 context with 4× CPU throttling, 180 frames measured 60.00 fps,
  16.67 ms mean, 16.70 ms p95, and a 60.34 Hz fixed step.
- Fresh Lighthouse mobile `/demo`: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; FCP 0.90 s, LCP 1.20 s, TBT 73 ms, CLS 0, and 37.8
  kB transferred.
- HTTPS sent HSTS, `nosniff`, strict-origin referrer policy, a same-origin CSP
  with `frame-ancestors 'none'`, and a restrictive permissions policy.

The single-mode night palette, editorial layout, generated moon-garden art,
board shapes, typography, spacing, and reduced-motion behavior match
`.factory/design.md`. The generated image provenance is recorded. The product
does not need an AI feature; its job is a deterministic daily puzzle.

## Live and candidate parity

The rebuilt implementation and production matched byte-for-byte across all 13
public product files: HTML, service worker, hashed JavaScript and CSS, designed
404, 404 CSS, both hero images, social image, both icons, robots, and sitemap.
The HTML SHA-256 begins `087ec156`, JavaScript `63e4e7f4`, and CSS `54856cb7`.

The last runtime implementation change is `08d18d9`. Commit `df4eff2` changes
only tests. Commits through documentation base `ccb4763` change reports and
evidence only, so a later product image is not required.

Evidence: `review-5-evidence/deployment-parity.json`.

## Earlier finding disposition

| Earlier finding | Current disposition and fresh proof |
| --- | --- |
| Verification 1: aggregate offline failure | Closed. The 32-test aggregate, standalone offline claim, activated worker, and live offline reload passed. |
| Verification 1: game absent from the first viewport | Closed. Fresh desktop and phone captures show the playable board before scrolling. |
| Verification 1: small demo/navigation targets | Closed. The responsive matrix passed; the smallest board target was 45.31 px. |
| Verification 1: untested duration and frame claims | Closed. The old 3–5 minute statement remains absent; the 220 ms and 60 Hz claims passed and frame rate was measured live. |
| Verification 2: standalone offline failure | Closed. The exact command and fresh isolated live context passed. |
| Verification 2: silent storage-write failure | Closed. The exact claim and fresh forced live failure showed the reload warning. |
| Verification 2: incomplete undo, copy, session, and input coverage | Closed. Each registered command passed; desktop, phone, and keyboard flows were exercised. |
| Verification 2: first-screen facts hidden | Closed. All three facts were visible in both fresh opening captures. |
| Verification 2: missing route returned 200 | Closed. The host and active worker preserve a deliberate HTTP 404. |
| Verification 2: skip target and 200% reflow | Closed. The skip link, zoom, and 200% phone reflow passed. |
| Review 1 F-1-1: repeated daily perfect order | Closed. `unique-perfect` checked all 120 orders for 48 dates and rejected consecutive repeats. |
| Review 1 F-1-2: demo privacy under-tested | **Reopened by this review.** The runtime behaves correctly, but the registered test still omits the real sample-date key, OPFS, and read detection. |
| Review 1 F-1-3: analytics and leaderboard claims | Closed. Both exact claims passed; the live flow used same-origin GET requests without bodies. |
| Review 1 F-1-4: scoring rule not registered | Closed. `mutation-scoring` passed target-present and target-missing outcomes. |
| Review 1 F-1-5: tiers and itemized results not registered | Closed. The claim reached 1, 3, and 5 with five result items. |
| Review 1 F-1-6: phone hid the sample outcome | Closed. The action result is visible in the fresh phone capture. |
| Review 1 F-1-7: controls did not name their result | Closed. Labels remain in accessible names; keyboard, touch, regression, and Axe checks passed. |
| Review 1 F-1-8: unexplained result terms | Closed. The product uses Board ID, changed neighbors, and numbered result labels. |
| Review 1 F-1-9: README changed creature to tile | Closed. README consistently says creature. |
| Review 1 F-1-10: incorrect home title | Closed. The title says “order five creatures daily.” |
| Review 1 F-1-11: decorative caption | Closed. The caption remains absent. |
| Review 1 F-1-12: privacy jargon | Closed. Current text says no code or files load from other sites. |
| Review 1 F-1-13: incomplete 404 metadata/footer | Closed. The live 404 has the required metadata, shared footer, and return action. |
| Verification 4: WCAG 2.5.3 label-in-name failures | Closed. The regression check and fresh route Axe scans found no violation. |
| Review 2: controls clipped from 881–1024 px | Closed. The fresh width matrix had no overflow or clipped controls. |
| Review 2: demo focus indicator had 1:1 contrast | Closed. Both banner actions showed a contrasting 3 px outline. |
| Review 2: 6×6 statement was untested | Closed. `board-size` is declared and asserts 36 targets in six rows and columns. |
| Review 2: board cells fell below 44 px | Closed. The fresh matrix minimum was 45.31 px. |
| Verification 3, Verification 5, Verification 6, Review 3, and Review 4 | They reported no open defects. Their game, route, privacy, offline, accessibility, and performance paths passed again except for the reopened claim-coverage gap above. |

## Scope and final decision

This is a static, local-first, one-player browser game. It has no backend,
tenant, server database, health endpoint, API allowance, rate limit, payment,
multiplayer room, CLI, desktop package, or library consumer install. Backend
isolation, restart persistence, 429/Retry-After, multiplayer, and installed
artifact checks do not apply.

The brief's 40% aggregate completion measure requires player analytics. The
product intentionally sends none, so that external measure is unavailable and
is not a public product claim.

**FAIL — 1 P1 finding and 1 untested public claim.**
