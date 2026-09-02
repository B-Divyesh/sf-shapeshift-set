# Independent verification 2 — FAIL

**Candidate:** `0d512956a0c34366575da0da834deb33164cf894`  
**Live URL:** <https://shapeshift-set.sociobot.in/>  
**Verified:** 2026-09-02 (UTC)  
**Verdict:** **FAIL — do not release this candidate.**

## Cold first read

The cold live page passes the explicit first-read gate. It says “Place five
creatures in the right order,” names daily puzzle players, and presents “Try it
with sample data” with the explanation that it opens a complete sample board.
The playable 6×6 board is visible in the initial 1440×900 and 390×844
viewports. One click opens `/demo` with the persistent “Demo — sample board,
nothing is saved” banner, Reset demo, and Start for real.

The broader plain-words layout contract still fails: at 390 px CSS explicitly
hides all three required plain facts. At 1440×900 only “Free to play” reaches
the viewport; the progress and UTC facts are below it.

## Mandatory claims gate

`.factory/claims.json` exists and contains 12 entries. Every listed command was
run from this clean checkout against the documented `/demo` entry point before
the broader review.

| Claim | Result | Evidence |
| --- | --- | --- |
| `daily-end` | PASS | Full five-piece sample run reached the scored result. |
| `unique-perfect` | PASS | All 120 orders were enumerated for four dates; each had one perfect order. |
| `restart` | PASS | Replay returned to 0/5, no trail, and five available pieces. |
| `local-progress` | PASS | Normal localStorage persisted Mote and 1/5 through reload. |
| `demo-isolation` | PASS | Demo play left localStorage empty and real play started at 0/5. |
| `offline-reload` | **FAIL** | Exact standalone command failed twice from fresh contexts. Offline reopen was a blank page; JS failed with `ERR_INTERNET_DISCONNECTED` and CSS with `ERR_FAILED`/`ERR_INTERNET_DISCONNECTED`. Screenshot and trace were retained under `test-results/game--claim-offline-reload-86308-fline-after-its-first-visit/`. |
| `piece-settle-duration` | PASS | Computed duration was 0.22 s with motion enabled. |
| `frame-rate` | PASS | Fixed-step rate remained inside the asserted 55–65 Hz range. |
| `keyboard-controls` | PASS | The declared test selected, turned, and placed Mote. |
| `same-origin` | PASS | Local demo requests used only its own origin. |
| `utc-daily` | PASS | Same dates matched; the next UTC date produced another seed. |
| `free-no-upsells` | PASS | Completed flow exposed no account, ad, booster, or payment control. |

The aggregate `npm test` later passed 15/15 once, including the offline test.
That retry does not cancel the two reproducible failures of the exact required
claim command; the claims contract says any failing claim test blocks release.

Claims coverage is also incomplete. “Copy result” and “Undo last piece” are
observable product promises without claim entries. The README advertises `Q`,
arrow keys, Space, and pointer/touch, while the registered keyboard test covers
only number selection, E/F, direct focus, and Enter. The README also omits the
required intended session length rather than proving the brief's bounded
five-minute target.

## Clean local gates

- `npm ci`: PASS; 22 packages installed and audit found 0 vulnerabilities.
- `npm test`: PASS on the aggregate retry, 15/15 in 34.3 s. The standalone
  offline claim remains a release-blocking failure as documented above.
- `npm run build`: PASS. TypeScript checking runs through `tsc --noEmit`.
- No separate lint script exists.
- Exact output: `dist/index.html`, 23.28 kB JS (8.67 kB gzip), 16.10 kB CSS
  (4.47 kB gzip), and a 1.87 kB service worker.

## Deployment identity and live behavior

The deployment matches the candidate. Fresh build and live SHA-256 hashes
matched for `index.html`, `sw.js`, `index-CnAXLVUh.js`, and
`index-BE4pGDc2.css`.

A deterministic live pointer run placed Mote → Nook → Wing → Crown → Crook.
It reached “You changed 5 of 5,” Radiant set, five successful mutations, and
0 undos. “Play this board again” reset the score, trail, and all pieces. A
keyboard-only run also reached 5/5. A reversed run reached the real loss result,
“You changed 1 of 5,” Quiet set, with four misses. A mixed order reached 3/5,
Shifting set.

Independent checks also passed for touch placement, Q/E/F, arrow movement,
Enter/Space placement, undo, reset confirmation, Escape focus restoration,
copying a result, wrong habitat, empty ground, occupied habitat, wrong
orientation, and no-selection recovery. History navigation restored the route
and focused its h1. Demo mode used no local/session storage or cookies. Real
play used `shapeshift-set:daily:2026-09-02` and persisted normally.

Storage failure does not recover honestly. With `Storage.setItem` throwing
`QuotaExceededError`, Mote changed the visible score to 1/5 and the UI said the
mutation scored. The intended “Progress could not be saved” warning was not
visible, and reload returned to 0/5. Corrupt JSON did recover to a fresh board
with a visible explanation.

## Privacy, headers, accessibility, and performance

- A Playwright request log covering the complete live demo flow contained five
  requests, all to `https://shapeshift-set.sociobot.in`; console errors and page
  errors were empty.
- Browser response headers include same-origin CSP with
  `frame-ancestors 'none'`, HSTS, `nosniff`, strict-origin referrer policy, and
  a restrictive permissions policy. Hashed JS/CSS are cached for one year as
  immutable; HTML and `sw.js` revalidate after 30 seconds.
- Live service-worker update succeeded. A fresh live context cached the shell,
  had no route-specific `/demo` cache entry, went offline, and reopened the
  board. This live pass does not excuse the required local claim failure.
- `/opt/fleet/lib/verify-url.sh` passed live `/demo`: HTTP 200, title, `lang=en`,
  one h1, main landmark, no missing alt text, no unlabeled buttons, and no
  console errors.
- Axe reported no serious or critical issues on `/`, `/demo`, `/privacy`,
  `/terms`, or the missing-page view. Keyboard focus used a visible 3 px lichen
  outline. The modal received initial focus and restored it after Escape.
- At 390 px there was no normal horizontal overflow and the entire board was in
  the first viewport. One target misses the 44 px baseline: the focused skip
  link is 43 px high. Enlarging text to 200% made the page 516 px wide in a
  390 px viewport, requiring horizontal scrolling.
- Reduced motion made animations/transitions effectively instant (0.01 ms).
- Lighthouse mobile: Performance 94, Accessibility 100, Best Practices 100,
  SEO 100; LCP 1.2 s, FCP 1.0 s, CLS 0, total transfer 36 KiB.
- A 390 px run with 4× CPU throttling measured 59.84 fps across 180 frames
  (16.71 ms mean, 16.70 ms p95), matching the advertised 60 fps target.
- Unknown URLs render the styled not-found view but return HTTP **200**, not a
  real 404 response.

## Defects by severity

### P1 — Required offline claim test fails from a clean standalone run

`npm test -- --grep @claim:offline-reload` failed on the mandatory first pass
and again on an immediate standalone rerun. The offline document was blank and
its current hashed JS/CSS were not served. A later suite pass and live manual
pass show nondeterminism, not a reliable claim.

### P1 — Failed progress writes are silent and lose the run on reload

When localStorage is unavailable or full, the game reports a successful move
instead of the save failure. The visible 1/5 run reloads as 0/5. This violates
the progress promise and the required error/recovery behavior.

### P1 — Claims and session-contract coverage are incomplete

Result copying and undo have no claims entries. Advertised keyboard/touch
inputs are only partly covered by the registered test. The intended session
length required for a browser game and implied by the five-minute brief is not
stated and tested.

### P1 — Required three first-screen facts disappear

The mobile stylesheet hides Free, local progress, and UTC cadence. Desktop at
the tested first viewport does not show all three either. The explicit
what/who/first-action gate passes, but the attached mandatory first-screen
shape does not.

### P2 — Missing routes return 200 instead of 404

`/missing-page` displays correct not-found copy but responds with HTTP 200, so
clients and search engines cannot distinguish it from a valid route.

### P2 — Accessibility sizing/reflow edges

The skip link is 43 px high rather than 44 px. At 200% text size, the 390 px
page expands to 516 px and requires horizontal scrolling.

## Not applicable

This is a static browser game with no server-side product API, unlock call,
account, sign-in, billing, or backend persistence. API allowance/429,
Retry-After, concurrency, backend health, and Entra authority checks do not
apply. It has a service worker but no installable PWA manifest; update and
offline behavior were still exercised. The brief's aggregate 40% player
completion measure cannot be inferred from one deterministic verification run.
