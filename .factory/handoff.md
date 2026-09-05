# Shapeshift Set review 2 handoff

## Review 2

**FAIL — 4 findings remain, including 1 untested public claim.**

Review 2 examined implementation `13798bda2c3d332c1a9051ae5145ff87e2223716`,
test-only commit `76b1867a1929e48512aa7b57e22cd9edb9cd3657`, and documentation base
`2acb9ba2f5466edb37e78a933544d02c796cd40e`. It made no product-code changes.

Fresh live desktop and phone runs passed the first-screen, sample, loss,
middle-score, perfect-win, reset, touch, keyboard, privacy, route, offline,
and timing checks. All 21 declared claim commands passed independently from a
clean clone. `npm test` passed 29/29, lint passed, build produced `dist/`, and
13 served files byte-matched the clean build. Lighthouse mobile scored
100/100/100/100.

The strict review found four release-blocking or material issues:

- At 900 px, the game creates 81 px of clipped, non-scrollable overflow and
  places the Crook control fully outside the viewport, blocking pointer/touch
  completion. The fault is also present at 881 and 1024 px.
- Reset demo and Start for real use a lichen focus outline on the same lichen
  banner. Its 1:1 contrast gives keyboard users no visible focus change.
- The public 6×6 claim has no manifest entry or tagged quantitative assertion.
- All 36 board cells fall below 44×44 px at 320 px and at tested widths from
  881 through 1100 px.

See `.factory/review-2.md` and `.factory/review-2-evidence/`. The next repair
should widen the stacked-layout breakpoint or remove the inner minimum-width
overflow, preserve 44 px board targets at every supported width, give the demo
actions a contrasting focus treatment, and register/assert the 6×6 claim.

## Previous verification 5 handoff

## Independent verification 5

**PASS — accept the deployed implementation.**

Verification 5 reviewed implementation `13798bda2c3d332c1a9051ae5145ff87e2223716`,
test-only commit `76b1867a1929e48512aa7b57e22cd9edb9cd3657`, and documentation
base `1626cc87977c3933631ae2a41795341b36898903`. It made no product-code
changes.

Fresh desktop and phone live sessions showed the job, audience, first action,
and playable board before scrolling. The isolated demo showed its persistent
sample banner, reached both 1/5 loss and 5/5 Perfect end screens, reset to an
empty board, preserved real-data sentinels, and made only same-origin requests.
Touch play, offline reopen, real 404, legal routes, reduced motion, titles,
and 59.99 Hz fixed timing passed. The repaired experimental Axe
`label-content-name-mismatch` scan had zero violations.

`npm ci`, all 21 individual claim commands, `npm test` (29/29), `npm run lint`,
and `npm run build` passed. Live `index.html`, JS, and CSS hashes match
`dist`. There are zero findings and zero untested claims. See
`.factory/verification-5.md` and `.factory/verification-5-evidence/`.

## Previous repair 4 handoff


## Current result

**PASS — release the repaired product.**

The job is a short shared daily spatial puzzle for daily puzzle players. The
first action is “Try it with sample data,” which opens the complete isolated
sample board.

The deployed product implementation is
`13798bda2c3d332c1a9051ae5145ff87e2223716`
(`fix: align game control accessible names`). The following test-only commit is
`76b1867a1929e48512aa7b57e22cd9edb9cd3657`; it does not change the built
browser artifact. Documentation and evidence are committed after this handoff.

## Repair made

The prior candidate failed WCAG 2.5.3 because the five creature controls and
three turn controls gave screen readers names that changed the order of the
visible label.

- Creature controls now begin their accessible name with their displayed
  number, creature, and state, then give the action or placed state.
- Turn controls now begin with the visible “Rotate left,” “Flip creature,” or
  “Rotate right” label, then add the selected-creature context.
- Axe 4.13.0 is pinned, and the browser suite explicitly enables its
  experimental `label-content-name-mismatch` rule. The regression check audits
  both the starting tray and a tray after a creature is placed.

## Verification

From the documented clean setup on 2026-09-05 UTC:

```sh
npm ci
npm test
npm run lint
npm run build
```

- All 21 commands declared in `.factory/claims.json` passed independently.
- `npm test` passed: 29/29 tests, including the new rendered-label audit.
- `npm run lint` passed.
- `npm run build` passed and produced `dist/`. The built JavaScript is 24.59
  kB raw / 9.03 kB gzip; CSS is 16.65 kB raw / 4.59 kB gzip.
- The local regression audit and a fresh HTTPS Axe 4.13.0 run found zero
  `label-content-name-mismatch` violations or incomplete results. Nine
  rendered controls passed that rule in the live demo.
- `/opt/fleet/lib/verify-url.sh` passed on live `/` and `/demo`: route titles,
  `lang=en`, one h1, one main landmark, complete image alt text, labeled
  controls, and no console errors. The reports are in
  `.factory/repair-4-evidence/verify-home/` and `verify-demo/`.

## Live browser exercise

The existing static product was deployed with
`/opt/fleet/lib/deploy-static.sh shapeshift-set dist`. It reused the existing
`sf-shapeshift-set` static app and HTTPS domain. Cold HTTPS then served the
repaired `index-C3bkU2Gm.js` bundle.

Fresh desktop (1440×900) and phone (390×844) contexts both began at scroll
position zero with the game board visible. They showed the title “Place five
creatures in the right order,” named daily puzzle players as the audience, and
gave “Try it with sample data” as the first action with the result stated next
to it.

On the live desktop demo, I recorded the deterministic loss order
Wing → Crook → Crown → Nook → Mote. It reached “You changed 1 of 5,” with five
itemized outcomes. The persistent sample banner stayed visible. Its Reset demo
action restored 0/5, no result items, and no end screen. The deterministic
perfect order Mote → Nook → Crown → Crook → Wing then reached “You changed 5
of 5,” Perfect (5), and five changed neighbors. The fresh phone context tapped
the tray, turn controls, and habitat to reach 1/5.

The demo left `localStorage` and cookies empty. Its request log contained only
`https://shapeshift-set.sociobot.in`. After a warm-up, the live fixed-step loop
measured 59.99 Hz against its 60 Hz target. The captured browser report and
screenshots are in `.factory/repair-4-evidence/`.

## Earlier finding disposition

- Verification 1: the game-first viewport, 44 px targets, full offline claim,
  frame-rate claim, and clean full suite remain covered by the current
  responsive, offline, and frame-rate tests.
- Verification 2: storage-write recovery, all required first-screen facts,
  real HTTP 404, reflow, undo/copy/input coverage, and complete claims remain
  covered by their current browser tests and claim commands.
- Review 1 F-1-1 through F-1-13 remain closed: daily order uniqueness,
  isolated demo storage, analytics and leaderboard absence, mutation scoring,
  all score tiers, visible mobile action explanation, result-naming controls,
  plain terms, metadata, useful art disclosure, player-language privacy copy,
  and static 404 metadata are covered by the current claims, browser tests,
  copy audit, and route checks.
- Verification 3 had no open defects.
- Verification 4’s only P1, the eight WCAG 2.5.3 control-name failures, is
  closed by this repair and the live experimental Axe audit. It reported no
  P2 or P3 defects.

## Known limits

The brief’s 40% completion success measure requires aggregate player data. The
product deliberately collects no analytics, so that measure is not currently
available. This static local-first game has no backend, accounts, purchases,
sound, settings, or multiplayer; none is advertised.
