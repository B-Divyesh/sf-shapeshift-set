# Shapeshift Set polish round 1 handoff

## Delivered

Repair commit: `6372da80f02610ca8767fe5de8f043924399ee56` (`fix: complete
polish round one`). It closes all five blocking and eight minor findings in
`.factory/review-1.md`; the detailed finding-by-finding map is in
`.factory/polish-1.md`.

- Daily boards now use a deterministic, date-specific dependency order through
  all 120 creature permutations. Every board retains exactly one five-change
  solution, and consecutive UTC answers differ.
- `/demo` and `?demo=1` both open the isolated in-memory sample with a
  persistent banner, reset, and real-play exit. The demo never reads or alters
  real progress.
- Added executable claims for demo isolation, analytics, leaderboard absence,
  scoring behavior, and every result tier; all public privacy/scoring promises
  are now owned by `.factory/claims.json`.
- Repaired first-screen mobile copy, control labels, Board ID/result language,
  metadata, social titles, shared route announcements, and static 404 metadata
  and footer details while retaining the night-garden identity.

## Verification

From a fresh local clone at the repair commit (`/tmp/shapeshift-clean-hqCaK4`):

```sh
npm ci
npm test
```

Passed: **28/28** tests in **32.6 s**, including all 21 `@claim:` tests,
complete deterministic runs, restart, demo isolation/reset, offline reload,
keyboard/pointer/touch controls, 60 Hz fixed-timestep target, mobile 390 px
and 200% text, real 404 after service-worker control, metadata/routing, and
Playwright Axe scans over `/`, `/demo`, `/privacy`, `/terms`, and
`/missing-page` with no serious or critical violations.

`npm run build` passes and produces `dist/`; the initial JavaScript is 9.02 KB
gzip and CSS is 4.59 KB gzip. Local URL verification reports are committed at
`.factory/polish-evidence/local-home/verify.json` and
`.factory/polish-evidence/local-demo/verify.json`; they show no console errors,
one h1/main, `lang=en`, and complete image alt coverage. The local static
`/missing-page` response was HTTP 404.

The standalone Axe CLI could not discover a Chrome binary in this container.
The repository's installed-browser Playwright Axe integration passed instead.
The Lighthouse CLI was attempted with that browser but its tab crashed during
the full-page capture, so no Lighthouse score is claimed.

## Run and deploy

```sh
npm ci
npm test
npm run build
/opt/fleet/lib/deploy-static.sh shapeshift-set dist
```

## Deployment and production re-check

Deployed `dist/` through `/opt/fleet/lib/deploy-static.sh shapeshift-set dist`.
Azure deployment `ded8bf5d-c5b3-4a2c-a152-9235bdaca560` succeeded; the custom
domain returned HTTPS 200 immediately after deployment.

Cold production checks passed at <https://shapeshift-set.sociobot.in/> and
<https://shapeshift-set.sociobot.in/demo>; reports are in
`.factory/polish-evidence/live-home/verify.json` and
`.factory/polish-evidence/live-demo/verify.json`. A scripted live sample run
reached the 5/5 end screen, replay reset to 0/5, and `?demo=1` entered demo.
Live Playwright Axe scans passed for `/`, `/demo`, `/privacy`, `/terms`, and
the real 404 route (`/missing-page`, HTTP 404).

## Remaining work

No known product or review findings remain.
