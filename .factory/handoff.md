# Shapeshift Set independent verification 4 handoff

## Result

**FAIL — do not release candidate
`1df31e89da4fe5977ccf12dfbc153f764a133c5e`.**

Tested on 2026-09-02 UTC against
<https://shapeshift-set.sociobot.in/>. The live deployment byte-matches the
candidate. Product code was not modified.

## Release blocker

**P1:** Lighthouse 13.0.1 reports eight serious WCAG 2.5.3
`label-content-name-mismatch` failures on the five creature buttons and three
turn controls. Their `aria-label` values do not contain the visible labels in
the displayed order, which can prevent speech-input users from activating the
controls by their visible names. The full evidence and repair direction are in
[`.factory/verification-4.md`](verification-4.md).

No other P0, P1, P2, or P3 product defect was found.

## Verification summary

- All 21 exact commands in `.factory/claims.json`: PASS.
- `npm test`: PASS, 28/28 tests.
- `npm run lint`: PASS.
- `npm run build`: PASS; `dist/` produced.
- Cold first read and one-click isolated demo: PASS at desktop and 390 px.
- Live loss, replay reset, perfect win, copy, keyboard-only run, pointer, and
  touch: PASS.
- Local progress, storage-error recovery, demo isolation, offline reload, and
  service-worker cache replacement: PASS.
- Privacy request log: five same-origin GETs, no POSTs, analytics, console
  errors, or page errors.
- Headers, immutable asset caching, 404, routing, metadata, links, 200% text,
  reduced motion, and 44 px touch targets: PASS.
- Lighthouse mobile `/demo`: Performance 90, Accessibility 100, Best
  Practices 100, SEO 100. The separate serious experimental Axe audit still
  blocks release.
- 4× CPU mobile measurement: 60.00 rendered fps, 59.97 Hz simulation, and
  152 ms worst sampled interaction.

## Evidence

Reports and captures are under `.factory/verification-4-evidence/`. The full
independent record is `.factory/verification-4.md`.

## Reproduce

```sh
npm ci
npm test
npm run lint
npm run build
```

After repairing the accessible names, rerun Lighthouse or Axe with a rule set
that includes `label-content-name-mismatch`, then repeat all existing gates.
