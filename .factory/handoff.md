# Shapeshift Set verification 6 handoff

**Verdict: PASS — fresh independent QA accepted the deployed implementation.**

- Implementation candidate: `08d18d967b84f9ba9b71549f4e069dff608e1824`
- Documentation/evidence base: `1b2b702ef3f200c61ab73fe825bff10743f6ea1a`
- Final prior handoff commit: `a5ec3c808643f06c725d00dabc2c7d159010e149`
- Independent verification report: `.factory/verification-6.md`
- Live URL: <https://shapeshift-set.sociobot.in>

## Job, audience, and first action

The job is a short shared daily spatial puzzle. It is for daily puzzle players
who want a finite challenge. The first action is **Try it with sample data**;
it opens a complete sample board.

Fresh unscrolled 1440×900 desktop and 390×844 phone browsers showed that job,
the audience sentence, the first action, and the playable board. The phone had
zero horizontal overflow. Captures: `repair-5-evidence/live-first-desktop.png`
and `repair-5-evidence/live-first-phone.png`.

## Repairs

- The opening layout now stacks through 1279 px. This keeps the tray, turn,
  undo, and reset controls inside the visible document from 881–1024 px.
- At 320 px the game uses the full available width and a narrower game plate
  inset. Every one of the 36 board cells is at least 44×44 px.
- Demo-banner keyboard focus now uses a 3 px night outline against the lichen
  banner. Its measured contrast is 10.86:1 for both actions.
- The public 6×6 board promise is now declared as `board-size`. Its browser
  test verifies six rendered rows, six columns, and 36 board targets.
- Added outcome-level regressions for the exact responsive matrix and for
  Tab/Shift+Tab focus on both demo actions.

## Clean verification

From the documented clean setup:

```sh
npm ci
npm test
npm run lint
npm run build
```

- `npm ci`: PASS — 22 packages, 0 vulnerabilities reported.
- `npm test`: PASS — 32/32 Playwright tests. This includes desktop/mobile
  first-screen, touch, keyboard, loss/win/replay, offline, privacy, 404,
  route/Axe, 200% text reflow, target sizing, and the new responsive/focus
  checks.
- `npm run lint`: PASS.
- `npm run build`: PASS — `dist/` generated. JS is 24.59 kB raw / 9.03 kB
  gzip; CSS is 16.86 kB raw / 4.63 kB gzip.
- Every exact command in `.factory/claims.json` passed independently after
  the clean install: all 22 declared claims, including `board-size`.
- Manifest integrity check: 22 declared IDs, 22 tagged claim tests, each ID
  represented exactly once.

## HTTPS verification

- The static deployment succeeded and `dist/` matches live production byte for
  byte across 13 served product files. Details:
  `repair-5-evidence/deployment-parity.json`.
- `/opt/fleet/lib/verify-url.sh` passed live `/` and `/demo`: route titles,
  `lang=en`, one h1, main landmark, image alt coverage, labeled buttons, and
  no console errors. Reports are in `repair-5-evidence/verify-home/` and
  `repair-5-evidence/verify-demo/`.
- Fresh desktop demo: an invalid empty-board action gave recovery feedback;
  Wing → Crook → Crown → Nook → Mote reached the real 1/5 **Try again** end
  screen. Reset demo restored 0/5 and an empty trail. Mote → Nook → Crown →
  Crook → Wing reached **Perfect (5)** with five successful result items.
  Screenshots: `live-loss-desktop.png` and `live-win-desktop.png`.
- A fresh keyboard-only run used number selection, Q/E, F, arrows, Space, and
  Enter and reached the 5/5 Perfect end screen. A fresh 390 px touch run
  selected, turned, and placed Mote for 1/5. Screenshot:
  `live-keyboard-win.png`.
- The persistent demo label stayed visible. Seeded real browser storage and a
  cookie were unchanged through demo play, Reset demo, and Start for real; its
  request log contained only the product origin.
- A fresh controlled service-worker context reopened `/demo` offline. `/`,
  `/demo`, `/privacy`, and `/terms` returned 200; the designed `/missing-page`
  returned HTTP 404 with its own title, h1, and main landmark.
- Live Axe found no serious or critical violations. The live responsive matrix
  tested 320, 881, 900, 1024, 1100, 1279, and 1280 px: each had zero horizontal
  overflow, all controls were horizontally reachable, and the smallest board
  target was 45.31 px. Full report: `live-browser-check.json`.
- Lighthouse 13.4.1 mobile `/demo`: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; FCP 1.0 s, LCP 1.1 s, CLS 0, TBT 50 ms, transfer
  37 KiB. Raw report: `repair-5-evidence/lighthouse-mobile.json`.

## Earlier finding disposition

| Finding | Current disposition |
| --- | --- |
| Verification 1: offline suite, game-first viewport, targets, FPS claims | Closed. Offline has its isolated fresh-context claim; first-screen, target, and 60 Hz checks pass. |
| Verification 2: storage recovery, inputs/undo/copy/session, first facts, 404, reflow | Closed by current claim and browser checks. |
| Review 1 F-1-1 through F-1-13 | Closed: daily answer uniqueness, demo isolation, privacy/scope claims, mutation/tier behavior, plain copy, metadata, controls, and the static 404 remain covered. |
| Verification 4: WCAG 2.5.3 labels | Closed by the rendered label-in-name Axe regression. |
| Review 2: clipped controls at 881–1024 px | Closed by the 1279 px opening-layout breakpoint and live matrix. |
| Review 2: demo action focus contrast | Closed by the 10.86:1 keyboard-focus outline and Tab regression. |
| Review 2: untested 6×6 promise | Closed by declared `board-size` and its 36-cell browser assertion. |
| Review 2: board cells below 44 px | Closed: matrix minimum is 45.31 px at 320 px. |

## Known limits

The brief’s 40% completion success measure requires aggregate player data. The
game intentionally has no analytics, so it remains unavailable. This is a
static, local-first, one-player browser game with no backend, accounts,
payments, multiplayer, sound, or adjustable settings; none is advertised.
