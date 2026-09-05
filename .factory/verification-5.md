# Independent verification 5 — PASS

**Verdict: PASS — accept the reviewed implementation.**

- Implementation candidate: `13798bda2c3d332c1a9051ae5145ff87e2223716`
- Test-only commit: `76b1867a1929e48512aa7b57e22cd9edb9cd3657`
- Documentation/evidence base: `1626cc87977c3933631ae2a41795341b36898903`
- Live URL: <https://shapeshift-set.sociobot.in>
- Verified: 2026-09-05 UTC
- Findings: 0 (P0: 0, P1: 0, P2: 0, P3: 0)
- Untested public claims: 0

## Job, audience, and first action

The job is a short shared daily spatial puzzle. It is for daily puzzle players
who want a finite challenge. The first action is **Try it with sample data**;
it opens a complete sample board.

Fresh unscrolled desktop (1440×900) and phone (390×844) contexts showed the
game board on the first screen. Both showed the h1, audience sentence, first
action, and its result. Board top positions were 316.45 px on desktop and
573.16 px on phone. The phone had zero horizontal overflow. Captures are in
`.factory/verification-5-evidence/live-first-desktop.png` and
`live-first-phone.png`.

## Clean checkout and claims

After `npm ci`, all declared local commands passed:

```text
npm test       PASS — 29/29
npm run lint   PASS
npm run build  PASS — dist/
```

The build produced 24.59 kB JavaScript (9.03 kB gzip) and 16.65 kB CSS
(4.59 kB gzip). Every one of the 21 exact commands in
`.factory/claims.json` was run independently and passed:

| Claims | Result |
| --- | --- |
| `daily-end`, `unique-perfect`, `restart`, `local-progress`, `demo-isolation`, `offline-reload`, `piece-settle-duration` | PASS |
| `frame-rate`, `keyboard-controls`, `all-inputs`, `undo-last-piece`, `copy-result`, `session-length`, `persistence-recovery` | PASS |
| `same-origin`, `no-analytics`, `no-leaderboard`, `mutation-scoring`, `score-tiers`, `utc-daily`, `free-no-upsells` | PASS |

The full suite additionally passed the control-name audit, route/Axe checks,
real static-host 404 checks, first-screen checks, and mobile 200% reflow.
The public page and README claims were cross-checked with the manifest; no
unlisted claim was found.

## Fresh live game exercise

On a new desktop `/demo` context, the persistent banner read “Demo — sample
board, nothing is saved.” An invalid empty-board selection gave the
no-selection message; selecting open ground gave the no-habitat recovery.

The deterministic reverse order reached **You changed 1 of 5**, **Try again
(0–2)**, and five itemized results. “Play this board again” restored 0/5 and
an empty trail. The perfect order then reached **You changed 5 of 5**,
**Perfect (5)**, and five successful result items. Captures are
`live-loss-desktop.png` and `live-win-desktop.png` in the evidence directory.

On a new touch phone context, selecting, turning, and placing Mote produced
1/5. The independently run `keyboard-controls` claim completed selection,
rotation, flip, movement, and placement with the advertised keys.

Demo storage was empty after desktop and touch runs. A separate context seeded
with a real local-storage value and cookie was unchanged after demo play and
Reset demo. The complete desktop request log contained only the product origin,
with no console or page errors.

## Accessibility, routes, offline, and deployment

- Axe found no violations on `/`, `/demo`, `/privacy`, `/terms`, or the real
  `/missing-page` 404. Each had `lang=en`, one h1/main, alt coverage, a route
  title, and no normal-width overflow.
- The experimental Axe `label-content-name-mismatch` rule found zero live
  violations. Its incomplete `aria-prohibited-attr` and `color-contrast`
  heuristics were not violations; normal route scans had no violations.
- Reduced-motion durations were 0.00001 s. `verify-url.sh` passed `/` and
  `/demo`, including no console errors and labeled buttons.
- Required routes/assets returned 200; `/missing-page` returned 404. A fresh
  service-worker context reopened `/demo` offline after warm-up.
- Fixed-step timing was 59.99 Hz over one second at a 390 px viewport.
- Live `index.html`, `assets/index-C3bkU2Gm.js`, and
  `assets/index-C7W7j_p6.css` hashes exactly match `dist`. HTTPS sends HSTS,
  `nosniff`, strict-origin referrer policy, same-origin CSP with
  `frame-ancestors 'none'`, and restrictive permissions policy.

## Earlier findings disposition

| Earlier finding | Current disposition |
| --- | --- |
| Verification 1: game-first viewport, offline full suite, targets, frame-rate | Closed: first-screen and offline tests pass; mobile/reflow and frame timing are covered. |
| Review 1 F-1-1 through F-1-5 | Closed: daily order, demo isolation, analytics/leaderboard absence, mutation rule, and score tiers have explicit claims. |
| Review 1 F-1-6 through F-1-13 | Closed: visible action result, control names, plain terms/title/privacy/art copy, and 404 metadata/footer are corrected. |
| Verification 2: recovery, inputs/undo/copy/session, first facts, 404, sizing/reflow | Closed: current tests and live route/phone checks pass. |
| Verification 3 | No defect was open; its offline, 404, input, privacy, and performance checks still pass. |
| Verification 4: WCAG 2.5.3 | Closed: experimental live Axe and local regression both pass. |

## Not applicable

This static local-first browser game has no backend, account, payment, tenant,
multiplayer, health, rate-limit, CLI, or consumer-library surface. Therefore
backend persistence/restart/429 checks do not apply. It has no settings or
advertised modes beyond daily play and isolated demo; both were exercised. The
brief's aggregate 40% completion measure remains unavailable by design because
the game sends no analytics.

Evidence: `.factory/verification-5-evidence/live-browser-check.json`, the
captures in the same directory, and `verify-home/` and `verify-demo/` reports.

