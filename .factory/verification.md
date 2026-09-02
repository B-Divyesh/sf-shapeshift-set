# Independent verification 1 — FAIL

**Candidate:** `071f7ddff392dfd57131f3d1f49e968a7bf1a166`  
**Live URL:** <https://shapeshift-set.sociobot.in/>  
**Verified:** 2026-09-02 (UTC)  
**Verdict:** **FAIL — do not release this candidate.**

## Cold first read

The cold page says, in plain words, that this is a shared five-creature spatial
puzzle for daily puzzle players, and the first action is “Try it with sample
data,” which opens a complete sample board. This part passes. The primary
promise is understandable and the one-click demo exists.

It fails the browser-game first-capture requirement. The initial 1440 × 900
viewport contains only the landing hero and moon-garden illustration; the
interactive `#game` begins at y=960.9 px. At 390 × 844 the game begins at
y=888.8 px. The captured first screen therefore does not show the actual game.

## Clean local verification

- `npm ci`: passed; 22 packages installed, audit reported 0 vulnerabilities.
- Exact production build, `npm run build`: passed. Output is `dist/`; JS is
  22.83 KB / 8.50 KB gzip and CSS is 15.57 KB / 4.40 KB gzip.
- There is no separate lint script. Type checking is included in the build via
  `tsc --noEmit`.
- Every command recorded in `.factory/claims.json` was run independently from
  the demo entry point and passed: `daily-end`, `unique-perfect`, `restart`,
  `local-progress`, `demo-isolation`, `offline-reload`, `keyboard-controls`,
  `same-origin`, `utc-daily`, and `free-no-upsells`.
- The required complete command **does not pass**. Two runs of
  `npx playwright test` (the test part of `npm test`) failed test 6/12:
  `@claim:offline-reload the demo reopens offline after its first visit` at
  `tests/game.spec.ts:119`. After the context is put offline, the test cannot
  find “Place five sample creatures in order.” The retained trace records
  `net::ERR_INTERNET_DISCONNECTED` for the JS and CSS requests. The same
  failure occurred in the preceding `npm test` run. This is release-blocking
  under the claims contract even though the isolated claim command passed.

## Live deployment and gameplay evidence

- Candidate comparison: the live `index.html`, hashed JS, hashed CSS, `sw.js`,
  and both hero WebPs byte-match the freshly built candidate.
- A scripted live `/demo` run selected, oriented, and placed Mote → Nook →
  Wing → Crown → Crook. It reached the actual end screen: “You changed 5 of
  5,” Radiant Set, with 0 undos. “Play this board again” reset score to 0/5
  and removed all score-trail items.
- A second run was completed with keyboard input only: number keys for
  selection, E/F for orientation, Tab to each habitat, and Enter to place.
- Invalid/recovery checks passed: selecting no creature reports “No creature
  is selected”; placing an unturned Wing reports the orientation recovery
  instruction; Reset demo restores the sample; real-progress placement
  persisted through a live reload under `shapeshift-set:daily:2026-09-02`.
- Demo isolation was confirmed live: demo play left `localStorage` empty.
- Eight fresh live browser contexts successfully reopened `/demo` offline
  after their first visit. This does not negate the reproducible full-suite
  claim-test failure above.
- Frame sampling at 390 px with 4× CPU throttling observed 60.00 fps average,
  16.8 ms p95 over 180 `requestAnimationFrame` intervals. This is a manual
  measurement only; no required FPS claim test is registered.

## Privacy, headers, accessibility, and responsive checks

- A complete live demo flow requested only
  `https://shapeshift-set.sociobot.in`; there were no third-party runtime
  requests, console errors, or page errors.
- Headers include HTTPS HSTS, `nosniff`, strict-origin referrer policy,
  permissions policy, and a same-origin CSP with `frame-ancestors 'none'`.
  Hashed JS/CSS have `Cache-Control: public, max-age=31536000, immutable`;
  HTML and service worker are revalidated at 30 seconds.
- Live axe scans found no serious or critical issues on `/`, `/demo`,
  `/privacy`, `/terms`, or a missing route. Each had `lang=en`, exactly one
  `<main>`, exactly one `<h1>`, route-appropriate titles, and no console
  errors. A visible focus outline was measured as a 3 px lichen outline.
- No horizontal overflow was observed at 390 px. Reduced-motion CSS removes
  animations and transforms.
- Mobile touch sizing fails the stated 44 px baseline: the `/demo` banner’s
  “Reset demo” button is 105.9 × 32 px and “Start for real” is 103.4 × 32 px;
  the header “Play” link is 38.8 × 44 px. The playable board cells and game
  controls are at least 44 px.

## Release-blocking defects

### P1 — Standard test suite fails a documented offline claim

`npm test`/`npx playwright test` fails `@claim:offline-reload` in the normal
full-suite order, twice. A product cannot claim offline reopen while its
required claim test is not reliable in the complete release command. Repair
the service-worker/test lifecycle and make the full test suite pass repeatedly.

### P1 — First captured viewport is a landing hero, not the game

The board starts below both desktop and mobile cold viewports. The browser-game
contract requires the first captured screen to show the game itself rather than
a menu/landing wall. Put a usable live board in the opening viewport.

### P1 — Mobile demo and navigation targets are below the 44 px minimum

The demo banner actions are 32 px tall, and the “Play” navigation target is
38.8 px wide at 390 px. Increase their actual hit areas to at least 44 × 44 px
without crowding adjacent controls.

### P1 — Claims coverage is incomplete

README’s “A run is designed for 3–5 minutes” is a quantitative visitor claim
without a `.factory/claims.json` entry and observable test. The game-loop
contract also requires a 60-fps claim/test; the handoff reports a frame-rate
number but no FPS claim is registered. Either add valid deterministic/sandbox
coverage or remove the unprovable duration statement and add the required FPS
claim coverage.

## Not applicable

This is a static browser game. No product server-side API, sign-in flow,
payment flow, or product-unlock endpoint was exposed, so API rate-limit and
identity-provider checks were not applicable.
