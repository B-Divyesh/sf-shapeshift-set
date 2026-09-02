# Independent verification 4 — FAIL

**Candidate:** `1df31e89da4fe5977ccf12dfbc153f764a133c5e`  
**Live URL:** <https://shapeshift-set.sociobot.in/>  
**Verified:** 2026-09-02 (UTC)  
**Verdict:** **FAIL — do not release this candidate.**

The product, deployment, claims, game loop, privacy, performance, and previous
blocking fixes pass. One newly detected serious WCAG 2.5.3 issue remains on
eight game controls. The acceptance contract requires zero serious or critical
accessibility findings, so this candidate cannot pass.

## Cold first read

The cold page says “Place five creatures in the right order,” identifies daily
puzzle players who want a finite shared spatial challenge, and gives “Try it
with sample data” as the first action. The adjacent line says it opens a
complete sample board. The three required facts say the game is free, progress
stays in this browser, and a new shared board appears each UTC day.

The game itself is visible in the opening viewport at both 1440×900 and
390×844; the mobile board begins at y=573 px. One click opens `/demo` with the
persistent “Demo — sample board, nothing is saved” banner, Reset demo, and
Start for real. This mandatory gate passes. Evidence:
`verification-4-evidence/first-read-desktop.png` and
`verification-4-evidence/first-read-mobile.png`.

## Mandatory claims gate

`.factory/claims.json` exists. After the clean-clone dependency install, every
listed command was run independently in manifest order through `npm test`.
All 21 passed:

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `daily-end` | PASS | The five-piece sample run reached “You changed 5 of 5.” |
| `unique-perfect` | PASS | The test enumerated all 120 orders for 48 UTC dates, finding one perfect order and no repeated consecutive answer. |
| `restart` | PASS | Replay restored 0/5 and an empty result trail. |
| `local-progress` | PASS | A real move survived reload. |
| `demo-isolation` | PASS | Seeded real storage/cookie data was unchanged; demo created no IndexedDB data. |
| `offline-reload` | PASS | Two fresh contexts reopened the cached sample offline. |
| `piece-settle-duration` | PASS | Enabled-motion duration was 0.22 seconds. |
| `frame-rate` | PASS | Fixed-step ticks remained within the asserted 55–65 Hz range. |
| `keyboard-controls` | PASS | Number, Q/E, F, arrows, and Space operated the game. |
| `all-inputs` | PASS | Pointer and 390 px touch operation placed a creature. |
| `undo-last-piece` | PASS | Undo restored the piece, score, and trail. |
| `copy-result` | PASS | Clipboard text contained score, result, and Board ID. |
| `session-length` | PASS | No result appeared after four placements; the fifth ended the round. |
| `persistence-recovery` | PASS | A rejected storage write showed the data-loss warning. |
| `same-origin` | PASS | Runtime requests stayed on the product origin. |
| `no-analytics` | PASS | A complete run and replay sent no analytics request or event payload. |
| `no-leaderboard` | PASS | The completed flow exposed no leaderboard. |
| `mutation-scoring` | PASS | Target-before-dependent scored; reversed dependency did not. |
| `score-tiers` | PASS | Deterministic 1/5, 3/5, and 5/5 runs showed all tiers and five trail items. |
| `utc-daily` | PASS | Same-date seeds matched and the next UTC date differed. |
| `free-no-upsells` | PASS | The full flow exposed no account, ad, booster, or purchase control. |

Each manifest ID occurs exactly once as a `@claim:<id>` test. Public gameplay,
privacy, offline, input, and quantitative claims are represented in the
manifest; no unlisted functional claim was found.

## Clean local gates

- `npm ci`: PASS; 22 packages installed, 0 vulnerabilities reported.
- `npm test`: PASS; 28/28 tests in 1.3 minutes.
- `npm run lint`: PASS (`tsc --noEmit`).
- `npm run build`: PASS and produced `dist/`.
- Output: JS 24.54 kB raw / 9.02 kB gzip; CSS 16.65 kB raw / 4.59 kB gzip;
  service worker 2.46 kB; mobile hero 22.34 kB. There are no downloaded fonts.

## Independent live game exercise

A deterministic pointer run from the visible opening game entered `/demo`,
handled no-selection, wrong-habitat, wrong-orientation, and open-ground errors,
then placed the reverse order Wing → Crook → Crown → Nook → Mote. It reached
the real “Try again (0–2)” end screen at 1/5 with five itemized results.

“Play this board again” returned to 0/5 with an empty trail. The scripted
perfect order Mote → Nook → Crown → Crook → Wing then reached “Perfect (5),”
“You changed 5 of 5,” and five successful results. Copy result produced:

```text
Shapeshift Set 2026-08-14
✦✦✦✦✦ 5/5 · Radiant
Board ID 989809312
```

A separate run used keyboard input only after navigation: 1–5, E, F,
Shift+Tab, Enter, and Space. It also reached 5/5. Touch selection, rotation,
and placement passed at 390 px. Real progress used only
`shapeshift-set:daily:2026-09-02`, survived reload, and reset through a
focus-managed dialog. Corrupt saved JSON recovered to a fresh board with a
visible explanation. Demo play left localStorage, cookies, and IndexedDB empty.

Evidence: `verification-4-evidence/live-loss-desktop.png`,
`live-win-desktop.png`, `live-keyboard-win.png`, and `live-mobile-390.png`.

There are two advertised modes: daily and isolated demo; both passed. There is
no sound, account, or adjustable in-game setting. Persistent daily progress is
the only persistent player state and passed.

## Deployment, privacy, PWA, and performance

- Every deployable file in `dist/` byte-matches production, including HTML,
  JS/CSS and source map, service worker, both hero images, social image, icons,
  robots, sitemap, and static 404. Key SHA-256 values are
  `6721820b…004e99` (HTML), `953bfacb…c7709` (JS),
  `9a822862…f097` (CSS), and `bb0b7e38…2467` (service worker).
- A complete live demo run made five GET requests, all to
  `https://shapeshift-set.sociobot.in`; there were no POSTs, third-party
  requests, console errors, or page errors.
- Headers include HSTS, `nosniff`, strict-origin referrer policy, restrictive
  permissions policy, and a same-origin CSP with `frame-ancestors 'none'`.
  HTML and `sw.js` revalidate after 30 seconds. Hashed assets use one-year
  immutable caching.
- The active service worker used cache `shapeshift-set-8xirk8`, contained the
  exact current shell, removed a seeded stale cache on reinstallation, and
  reopened and played `/demo` offline.
- Internal routes returned 200, every site link resolved, the external factory
  link returned 200, and `/missing-page` returned a real 404 before and after
  service-worker control. Titles, descriptions, canonicals, social metadata,
  robots, and sitemap were present and route-appropriate.
- `/opt/fleet/lib/verify-url.sh` passed `/` and `/demo`: title, `lang=en`, one
  h1/main, complete image alt coverage, labeled buttons, and no console errors.
  Reports are in `verification-4-evidence/verify-home/verify.json` and
  `verification-4-evidence/verify-demo/verify.json`.
- At 390 px there was no horizontal overflow, all 56 visible links/buttons
  were at least 44×44 CSS px, and all first-screen facts were visible. An
  isolated 200% text reflow check had zero overflow on `/`, `/demo`,
  `/privacy`, and `/terms`. Reduced motion shortened animation to 0.01 ms.
- Lighthouse 13.0.1 mobile `/demo`: Performance 90, Accessibility 100, Best
  Practices 100, SEO 100; FCP 0.93 s, LCP 1.26 s, CLS 0, TBT 417 ms, total
  transfer 37,718 bytes. The raw report is
  `verification-4-evidence/lighthouse-mobile.json`.
- At 390×844 with 4× CPU slowdown, 180 animation frames measured 60.00 fps
  (16.67 ms mean, 16.70 ms p95). Fixed-step simulation measured 59.97 Hz over
  one second. Four sampled touch interactions had a worst Event Timing value
  of 152 ms, below the 200 ms INP budget.

## Defects by severity

### P1 — Eight game controls fail WCAG 2.5.3 Label in Name

Lighthouse 13.0.1’s Axe audit `label-content-name-mismatch` reports **serious**
impact on eight controls in `/demo`:

- Five creature buttons visibly read forms such as “1 Mote Ready,” while their
  accessible names are forms such as “Select Mote — ready.”
- The three turn buttons visibly read “Rotate left,” “Flip creature,” and
  “Rotate right,” while their accessible names insert different words, such as
  “Rotate selected creature left.”

The visible label is not contained in the accessible name, so speech-input
users may be unable to activate a control by saying its displayed text. This
violates WCAG 2.5.3 and the work order’s zero-serious/critical gate. The
repository’s Axe 4.10.2 integration reports no violations because this newer
rule is not surfaced there; the Lighthouse raw result records all eight nodes
with impact `serious` and tags `wcag21a` and `wcag253`.

Repair by making each accessible name contain its visible label in the same
order. Put extra action/state help in `aria-describedby` or visually hidden
text instead of replacing the visible label with a different `aria-label`.
Add a regression test for `label-content-name-mismatch` with the current Axe
rule set.

### P2 / P3

No additional defects found.

## Not applicable

This is a static local-first browser game. It has no server-side product or
unlock endpoint, account, sign-in, billing, shared persistence, CLI, or
library package. API allowance/429/Retry-After, backend concurrency and health,
Entra authority, and consumer-package checks do not apply. It uses a service
worker but makes no installability claim. The brief’s fleet-wide 40% completion
measure requires aggregate usage data and cannot be inferred from one QA run.
