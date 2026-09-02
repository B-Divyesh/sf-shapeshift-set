# Independent verification 3 — PASS

**Candidate:** `b1349b734edabe67b9f5d8f6f2e689486c41ef31`  
**Live URL:** <https://shapeshift-set.sociobot.in/>  
**Verified:** 2026-09-02 (UTC)  
**Verdict:** **PASS — accept this candidate.**

## Cold first read

The cold page says “Place five creatures in the right order,” identifies daily
puzzle players who want a finite shared spatial challenge, and gives “Try it
with sample data” as the first action. Its adjacent text says that the action
opens a complete sample board. One click opens `/demo` with “Demo — sample
board, nothing is saved,” Reset demo, and Start for real.

The playable board itself is visible in both the initial 1440×900 desktop
capture and the initial 390×844 mobile capture. All three required facts are
also visible: free to play, progress stays in this browser, and a new shared
board appears each UTC day. This passes the first-read and game-first capture
gate. Evidence: `verification-artifacts-3/first-read-desktop.png` and
`first-read-mobile.png`.

## Mandatory claims gate

`.factory/claims.json` exists with 17 entries. I ran every listed command
independently, in manifest order, after `npm ci` and before broader QA. All 17
passed:

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `daily-end` | PASS | Five sample placements reached “You changed 5 of 5.” |
| `unique-perfect` | PASS | All 120 orders across four dated transforms produced exactly one perfect order per board. |
| `restart` | PASS | Replay returned to 0/5, cleared the trail, and restored five pieces. |
| `local-progress` | PASS | A real move survived reload. |
| `demo-isolation` | PASS | Demo play left localStorage empty and real play started separately. |
| `offline-reload` | PASS | Two fresh contexts cached the current shell and reopened `/demo` offline. |
| `piece-settle-duration` | PASS | Enabled-motion computed duration was 0.22 seconds. |
| `frame-rate` | PASS | Fixed-step ticks stayed within the asserted 55–65 Hz range and advertised target was 60. |
| `keyboard-controls` | PASS | Number, Q/E, F, arrows, and Space selected, turned, moved, and placed. |
| `all-inputs` | PASS | Pointer and 390 px touch contexts selected, turned, and placed. |
| `undo-last-piece` | PASS | Undo restored the piece, 0/5 score, and an empty trail. |
| `copy-result` | PASS | Clipboard contained score, Radiant tier, and sample seed. |
| `session-length` | PASS | No result appeared at four placements; the fifth produced the result. |
| `persistence-recovery` | PASS | Rejected storage displayed the data-loss warning and reload started clean. |
| `same-origin` | PASS | The complete demo request log contained only the product origin. |
| `utc-daily` | PASS | Same UTC date matched; the next date changed seed and geometry. |
| `free-no-upsells` | PASS | The complete flow had no account, ad, booster, purchase, or payment control. |

The live page and README claims are represented in the manifest. No unlisted
visitor-facing functional, privacy, offline, input, or quantitative claim was
found.

## Clean local gates

- `npm ci`: PASS; 22 packages installed and npm reported 0 vulnerabilities.
- `npm test`: PASS; 23/23 tests in 49.7 seconds, including claims, offline,
  accessibility, first-screen, 200% reflow, touch-size, and 404 checks.
- `npm run lint`: PASS (`tsc --noEmit`).
- `npm run build`: PASS; exact output produced in `dist/`.
- Production assets: JS 23.31 kB raw / 8.69 kB gzip; CSS 16.63 kB raw /
  4.59 kB gzip; service worker 2.47 kB; mobile hero 22.34 kB. These are below
  the 200 kB JS, 50 kB CSS, and 300 kB hero budgets. No font is downloaded.

## Independent live game exercise

A fresh scripted pointer run went from the visible game through Mote → Nook →
Wing → Crown → Crook and reached the real Radiant end screen at 5/5 with five
itemized mutations and zero undos. Copy result returned `5/5 · Radiant` and
`Seed 989809312`. Play this board again reset the score, trail, result, and
all five pieces. Evidence: `verification-artifacts-3/live-perfect-end.png`.

A reverse Crook → Crown → Wing → Nook → Mote run reached the real Quiet end
screen at 1/5 with four itemized misses. A separate three-success order reached
the Shifting tier at its 3/5 boundary. This confirms all three score tiers and
the win/loss conditions. Evidence: `live-loss-end.png`.

A second complete run used only advertised keyboard input: number selection,
Q/E rotation, F flip, Tab navigation, arrows, and alternating Space/Enter
placement. It reached 5/5. Touch selection, rotation, and placement passed at
390 px. Pointer controls passed in the primary run.

Invalid and recovery paths passed for no selected creature, open ground,
wrong habitat, wrong orientation, and an occupied habitat. Undo restored the
latest piece and score. Real play wrote only
`shapeshift-set:daily:2026-09-02`, survived reload, and the reset dialog took
focus and restored it after Escape. Demo play wrote no local storage.

## Deployment, privacy, accessibility, and performance

- Live deployment identity: freshly built `index.html`, `sw.js`, hashed JS,
  hashed CSS, both hero WebPs, and social card byte-match production. Key
  SHA-256 values are `6e415aae…a9a3fe4` (HTML),
  `669efa83…6c8b85c0b` (JS), and `38b95925…12850e0` (CSS).
- A full live demo run made four requests, all to
  `https://shapeshift-set.sociobot.in`; there were no console or page errors.
- `/opt/fleet/lib/verify-url.sh` passed `/demo`: HTTP 200, title, `lang=en`,
  one h1, main landmark, image alt coverage, labeled buttons, and no console
  errors. Recorded load was 672 ms.
- Independent Axe scans on `/`, `/demo`, `/privacy`, and `/terms` found zero
  serious or critical violations. Each route has one h1, one main, `lang=en`,
  a route title, and no missing image alt. The keyboard focus ring measured
  3 px. All 56 visible links/buttons measured at least 44×44 CSS px at 390 px.
- The 390 px layout had no horizontal overflow, including at 200% text size.
  Reduced-motion animation and transition duration computed to 0.00001 s.
- Internal route crawl returned 200 for `/`, `/demo`, `/privacy`, and `/terms`.
  `/missing-page` returned HTTP 404 before and after service-worker control.
- Service-worker update found the active current cache
  `shapeshift-set-1uj8een`, with the current hashed JS and CSS present. A fresh
  `/demo` reload succeeded offline.
- Live headers include same-origin CSP with `frame-ancestors 'none'`, HSTS,
  `nosniff`, strict-origin referrer policy, and a restrictive permissions
  policy. HTML and `sw.js` revalidate after 30 seconds; hashed assets are
  cached for one year as immutable.
- Lighthouse 13.4.1, live mobile `/demo`: Performance 95, Accessibility 100,
  Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.1 s, CLS 0, TBT 250 ms, total
  transfer 36 KiB.
- Chromium at 390×844 with 4× CPU throttling measured 60.00 fps over 180
  frames (16.67 ms mean, 16.70 ms p95), satisfying the measured frame-rate
  claim.

## Defects by severity

No P0, P1, P2, or P3 product defects were found.

## Not applicable

This is a static, local-first browser game. It has no server-side product or
unlock endpoint, account, sign-in, billing, shared persistence, CLI, or library
package. API allowance/429/Retry-After, backend concurrency and health, Entra
authority, and consumer-package checks do not apply. It has a service worker
but no installable PWA manifest; update and offline reload were still tested.
The brief’s fleet-wide 40% completion success measure requires aggregate usage
data and is not inferable from one independent QA run.
