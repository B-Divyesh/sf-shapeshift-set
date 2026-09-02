# Adversarial first-read review 1 — FAIL

**Work order:** `shapeshift-set-review-1`  
**Candidate:** `115d15d2bb4b8aff925ea35c664888efb031dab0`  
**Live URL:** <https://shapeshift-set.sociobot.in/>  
**Reviewed:** September 2, 2026 (UTC)  
**Verdict:** **FAIL — 5 blocking and 8 minor findings remain.**

## Cold first read

I opened fresh browser contexts at 390 × 844 and 1440 × 900 before scrolling.

| Question | Mobile answer | Desktop answer |
| --- | --- | --- |
| What does this do? | It is a daily board puzzle where I place five creatures in the right order and match them to habitats. | The same; the board and creature tray are visible beside the explanation. |
| Who is it for? | Daily puzzle players who want a short shared spatial challenge. | Daily puzzle players who want a five-creature shared challenge. |
| What should I click first? | “Try it with sample data.” | “Try it with sample data.” |

The explicit first-read blocking gate passes. The useful text is “Place five
creatures in the right order,” “For daily puzzle players…,” and “Try it with
sample data.” All three plain facts and part of the board are visible without
scrolling at both widths. The mobile presentation nevertheless hides the
adjacent explanation of what the primary action opens; see F-1-6.

## Findings

### Blocking

#### F-1-1 — Every date has the same perfect order

- **Location:** `src/core.ts:40-45`; live daily and sample boards; README “one
  shared daily board”; landing fact “A new shared board appears each UTC day.”
- **Evidence:** The dependency chain is constant: Mote starts the chain, Nook
  targets Mote, Wing targets Nook, Crown targets Wing, and Crook targets Crown.
  Therefore every date has the same perfect answer: Mote → Nook → Wing → Crown
  → Crook. Dates only rotate/reflect the habitat layout and initial piece
  orientations. The `unique-perfect` test enumerates orders for four dates but
  never checks that daily answers differ. The `utc-daily` test checks only that
  one next-day seed and geometry differ.
- **Why this blocks:** A returning daily-puzzle player learns the permanent
  answer after one run. The advertised new daily challenge becomes a repeated
  orientation exercise, so the product does not sustain the brief’s real
  daily job.
- **Concrete fix:** Generate a deterministic daily dependency order as well as
  the board transform. Run the solver before publishing a date to guarantee
  exactly one perfect order. Add a claim test that checks a broad date corpus,
  rejects consecutive repeated answers, and proves one perfect order per date.

#### F-1-2 — “Never reads real progress” is an unlisted, under-tested claim

- **Location/quote:** README: “It writes nothing to local storage and never
  reads real progress.” Privacy page: “Demo play stays in memory and is
  discarded when you leave the demo.”
- **Evidence:** `demo-isolation` promises only “Demo play writes no local
  progress.” Its test clears local storage before entry, so it cannot prove
  that demo mode does not read or alter existing real progress. It also does
  not inspect IndexedDB, OPFS, cookies, or the full storage boundary described
  in `.factory/demo.md`.
- **Why this blocks:** The stronger privacy promise has no matching
  `.factory/claims.json` entry and no complete sandbox test. An independent
  live check with a preloaded sentinel did pass, but an ad hoc review check is
  not the required repeatable claim test.
- **Concrete fix:** Expand the claim to “Demo uses memory only and never reads
  or changes real progress.” Seed a valid real run before `/demo`, play and
  reset the demo, inspect all browser storage, then leave through “Start for
  real” and assert the original run is unchanged.

#### F-1-3 — Analytics and leaderboard promises are unlisted claims

- **Location/quotes:** README: “There are no accounts, analytics events,
  third-party runtime resources, ads, boosters, or payment controls.” Landing:
  “There are no accounts, ads, boosters, or public leaderboards.” Privacy:
  “The game sends no analytics events and loads no third-party scripts.”
- **Evidence:** `same-origin` covers request origin, but same-origin analytics
  could still pass it. `free-no-upsells` does not mention or assert analytics
  or leaderboards, and its selector regex does not include “leaderboard.”
- **Why this blocks:** These are specific privacy and product-scope promises a
  visitor can rely on, but no manifest entry tests them.
- **Concrete fix:** Add `no-analytics` and `no-leaderboard` claims. Record the
  complete flow’s requests and storage writes, assert no analytics endpoint or
  payload, and inspect the completed UI for leaderboard controls and output.
  Alternatively remove the untested promises.

#### F-1-4 — The published scoring rule is not a registered claim

- **Location/quotes:** Landing: “An arrow scores only when its target creature
  is already on the board.” README: “Follow the arrows backwards: a target
  must be on the board before the creature that points to it.”
- **Evidence:** No claim entry names this rule. `unique-perfect` counts perfect
  orders, but it does not assert the stated per-arrow behavior or the visible
  success/failure result for both target-present and target-absent cases.
- **Why this blocks:** This is the game’s central rule, not decorative copy.
  The claims contract requires a matching observable test.
- **Concrete fix:** Add a `mutation-scoring` claim and test one placement after
  its target and one before its target. Assert score, trail wording, and board
  state for both outcomes.

#### F-1-5 — The tier and itemized-result promise is not registered

- **Location/quote:** README: “The result shows a Quiet, Shifting, or Radiant
  tier and an itemized mutation score.”
- **Evidence:** `daily-end` tests only the 5/5 Radiant result. No claim entry
  covers all named tiers or the promised itemized output. The independent live
  exercise reached 1/5, 3/5, and 5/5, but those checks are not part of a listed
  claim command.
- **Why this blocks:** The README promises three result states and detail that
  the claim suite does not own.
- **Concrete fix:** Add a `score-tiers` claim whose test reaches the 0–2, 3–4,
  and 5 boundaries and asserts one itemized result per placed creature.

### Minor

#### F-1-6 — Mobile hides what the primary action will open

- **Location/quote:** `src/main.ts:266`, “It opens a complete sample board.”;
  hidden at `src/styles.css:425` for widths at or below 640 px.
- **Why it matters:** The mandatory first-screen shape calls for the result of
  the primary action beside the action. A phone visitor sees only the button.
- **Concrete fix:** Keep “Opens a complete sample board” visible below the
  button on mobile. The first screen has room if the decorative spacing is
  reduced slightly.

#### F-1-7 — Several buttons do not name their result

- **Location/quotes:** Creature buttons expose “Mote / Turn it,” “Nook / Fits,”
  and equivalent labels. Desktop turn buttons read “Left,” “Flip,” and “Right.”
  At 390 px their words are hidden at `src/styles.css:452`, leaving only ↶, ↔,
  and ↷. Board buttons are announced as coordinates and state, for example
  “Row 1, column 1. Mote habitat, empty,” without the action.
- **Why it matters:** A first-time sighted visitor must infer the icon actions,
  and a screen-reader user hears a cell state rather than what activating it
  will do. These controls fail the result-naming verb rule.
- **Concrete fix:** Keep “Rotate left,” “Flip creature,” and “Rotate right”
  visible at mobile widths. Name tray buttons “Select Mote — needs turning” or
  “Select Nook — ready.” Name an empty habitat action “Place selected creature
  in Mote habitat, row 1, column 1.”

#### F-1-8 — Result and board terms use unexplained jargon and mood labels

- **Location/quotes:** “Seed,” “Mutation score,” “mutations,” “Quiet set,”
  “Shifting set,” and “Radiant set.”
- **Why it matters:** “Seed” is an implementation term, while the three tier
  names do not state whether the result is poor, partial, or perfect. A new
  player must translate both systems.
- **Concrete fix:** Use “Board ID,” “Changed neighbors,” “Try again (0–2),”
  “Close (3–4),” and “Perfect (5).” If the decorative names remain, put the
  numeric meaning in the same label.

#### F-1-9 — README changes the object that a creature affects

- **Location/quote:** README: “Each creature must match a habitat and can
  change one neighboring tile.” The landing game says the creature changes
  “that neighbor,” and the result trail names another creature.
- **Why it matters:** “Tile” and “creature” describe different game objects.
  The player cannot tell whether placement changes a board cell or another
  creature.
- **Concrete fix:** “Each creature must match a habitat and can change one
  neighboring creature.” Use that object consistently in the rule and score
  trail.

#### F-1-10 — The home title describes the action incorrectly

- **Location/quote:** `<title>` and social title: “Shapeshift Set — place a
  daily creature puzzle.”
- **Why it matters:** Players place creatures, not a puzzle. The title is under
  60 characters but does not state the job in natural language.
- **Concrete fix:** “Shapeshift Set — order five creatures daily.”

#### F-1-11 — Decorative caption carries no usable information

- **Location/quote:** Landing art caption: “A moon garden built for five
  shapes.”
- **Why it matters:** This is mood copy, not a section name, instruction,
  provenance note, or product fact. It violates the no-brand-lore rule.
- **Concrete fix:** Remove it. The footer already gives the useful provenance:
  “The moon garden image was generated for this product.”

#### F-1-12 — README privacy copy uses developer jargon

- **Location/quotes:** “third-party runtime resources” and “The service worker
  caches the game shell…”
- **Why it matters:** A player should not need web-platform vocabulary to
  understand privacy or offline behavior.
- **Concrete fix:** Use “The game loads no code or files from other sites.” and
  “After one online visit, the game can reopen without an internet connection.”

#### F-1-13 — The real 404 omits required shared metadata and footer details

- **Location:** `public/404.html:3-33`; live `/missing-page`.
- **Evidence:** The route correctly returns 404 and is designed, but it has no
  Open Graph/Twitter metadata or apple-touch icon. Its footer omits the version
  or build ID and art notice shown on every SPA route.
- **Why it matters:** The site-structure contract requires canonical/OG/favicon
  metadata and a consistent footer on every route.
- **Concrete fix:** Add the product OG/Twitter image metadata and apple-touch
  icon to `404.html`, and reuse the normal footer content including version or
  build ID.

## Copy audit

Counts treat hyphenated forms, code tokens, dates, and numbers as one word.
No sentence exceeds 22 words. No banned marketing word appears. Findings below
cover jargon, inconsistent terms, mood copy, and non-result-naming buttons.

### Landing-page sentences

| Sentence | Words | Flag |
| --- | ---: | --- |
| For daily puzzle players who want one shared spatial challenge that ends after five creatures. | 15 | — |
| It opens a complete sample board. | 6 | F-1-6: hidden on mobile |
| Free to play. | 3 | — |
| Progress stays in this browser. | 5 | — |
| A new shared board appears each UTC day. | 8 | F-1-1: daily answer does not change |
| Place an arrow’s target first. | 5 | F-1-4: unlisted scoring claim |
| Then the creature changes that neighbor and scores one. | 9 | F-1-4: unlisted scoring claim |
| The gold point starts the chain. | 6 | F-1-4: unlisted scoring claim |
| Each arrow points to a neighbor that must be placed first. | 11 | F-1-4: unlisted scoring claim |
| Match its blocks to one dotted habitat. | 7 | — |
| Choose a creature, turn it, then select its habitat. | 9 | — |
| Placed mutations will appear here. | 5 | F-1-8: jargon |
| An arrow scores only when its target creature is already on the board. | 13 | F-1-4: unlisted scoring claim |
| Rotate or flip its blocks until they match one dotted habitat. | 11 | — |
| Finish the board, inspect each mutation, and compare your score tier. | 11 | F-1-5/F-1-8 |
| There are no accounts, ads, boosters, or public leaderboards. | 9 | F-1-3: partly unlisted |
| Your daily progress uses local browser storage. | 7 | — |
| Demo actions use memory only. | 5 | F-1-2: stronger than registered claim |
| The game loads from this site and can reopen offline after the first visit. | 14 | — |
| One shared creature puzzle each day. | 6 | F-1-1: same answer repeats |
| Original game art. | 3 | — |
| The moon garden image was generated for this product. | 9 | — |

### Landing headings, labels, and actions

| Copy | Words | Assessment |
| --- | ---: | --- |
| Place five creatures in the right order | 7 | Clear h1 |
| One shared 6×6 board each day | 6 | F-1-1 |
| Try it with sample data | 5 | Clear result-naming action |
| Match the habitats | 3 | Clear game heading |
| Daily board · September 2, 2026 | 5 | Clear date label |
| Seed | 1 | F-1-8 |
| Mutations / Mutation score | 1 / 2 | F-1-8 |
| Choose a creature | 3 | Clear heading |
| Mote / Nook / Wing / Crown / Crook with “Turn it” or “Fits” | 1–3 | F-1-7 |
| Left / Flip / Right | 1 each | F-1-7; words disappear on mobile |
| Undo last piece | 3 | Clear result-naming action |
| Reset board | 2 | Clear result-naming action |
| A moon garden built for five shapes | 7 | F-1-11 |
| Three actions | 2 | Useful count, but redundant with the list |
| How to play | 3 | Clear heading |
| Read the arrows / Turn each creature / Place all five | 3 each | Clear step headings |
| Scope and privacy | 3 | Clear section label |
| One puzzle, then a clear ending | 6 | Clear scope heading |
| Privacy / Terms / Built by Param Factory | 1 / 1 / 4 | Clear links |
| Version 1.0 | 2 | Clear version label |

The 36 board buttons use two repeated accessible-name patterns: “Row N,
column N. Open ground.” (6 words) and “Row N, column N. [Creature] habitat,
empty/filled.” (7 words). Their missing result verb is covered by F-1-7.

### Landing dynamic and recovery sentences

| Sentence or template | Words | Flag |
| --- | ---: | --- |
| The complete sample board is ready to play. | 8 | — |
| Saved progress could not be read. | 6 | — |
| A fresh board is ready. | 5 | — |
| Progress could not be saved. | 5 | — |
| This run will not survive reload. | 7 | — |
| Keep this tab open to finish the board. | 8 | — |
| No creature is selected. | 5 | — |
| Choose one from the tray first. | 6 | — |
| That tile has no habitat. | 5 | — |
| Choose a dotted shape. | 4 | — |
| That habitat is filled. | 4 | — |
| Choose an empty dotted habitat. | 5 | — |
| That creature has a different shape. | 6 | — |
| Choose its matching habitat. | 4 | — |
| The blocks do not match yet. | 6 | — |
| Rotate or flip the creature, then try again. | 8 | — |
| [Creature] selected. | 2 | — |
| Its shape now fits. | 4 | — |
| Turn it to match its dotted habitat. | 7 | — |
| [Creature] changed its neighbor. | 4 | F-1-4/F-1-8 |
| One mutation scored. | 3 | F-1-4/F-1-8 |
| [Creature] was placed, but its target was empty. | 8 | F-1-4 |
| No mutation scored. | 3 | F-1-4/F-1-8 |
| [Creature] now fits its habitat. | 5 | — |
| [Creature] turned. | 2 | — |
| [Creature] flipped. | 2 | — |
| The last piece returned to the tray. | 7 | — |
| Its mutation was removed. | 4 | F-1-8 |
| Every mutation landed. | 3 | F-1-5/F-1-8 |
| You found the only perfect order. | 6 | — |
| Most mutations landed. | 3 | F-1-5/F-1-8 |
| Trace each arrow back before another run. | 7 | — |
| Some neighbors were still empty. | 5 | — |
| Place each arrow target first. | 5 | — |
| The sample board was reset. | 5 | — |
| Today’s board was reset. | 5 | — |
| Result copied. | 2 | — |
| It contains the score, tier, and seed. | 7 | F-1-8 |
| The result could not be copied. | 6 | — |
| Allow clipboard access and try again. | 6 | — |
| Your current moves and score will be cleared. | 8 | — |
| You are back online. | 4 | — |
| The current board stayed in place. | 6 | — |
| You are offline. | 3 | — |
| This loaded board still works. | 5 | — |

Dynamic headings and actions are “You changed N of 5,” “Quiet/Shifting/Radiant
set,” “Play this board again,” “Copy result,” “Start this board again?”, “Keep
my moves,” and “Reset board.” The tier labels are covered by F-1-8; the other
actions name their result.

### README sentences and standalone instructions

| Sentence or instruction | Words | Flag |
| --- | ---: | --- |
| Place five shifting creatures in the right order on one shared daily board. | 13 | F-1-1 |
| Shapeshift Set is a free, one-player spatial puzzle for daily game regulars. | 12 | — |
| Each creature must match a habitat and can change one neighboring tile. | 12 | F-1-9 |
| The only perfect order scores five mutations. | 7 | F-1-1/F-1-8 |
| A round ends after five placements. | 6 | — |
| A session is one five-placement board. | 6 | — |
| Open the daily board and select a creature. | 8 | — |
| Rotate or flip it until its blocks match one dotted habitat. | 11 | — |
| Follow the arrows backwards: a target must be on the board before the creature that points to it. | 18 | F-1-4 |
| The board ends after all five creatures are placed. | 9 | — |
| The result shows a Quiet, Shifting, or Radiant tier and an itemized mutation score. | 14 | F-1-5/F-1-8 |
| “Play this board again” clears the run. | 7 | — |
| `1`–`5`: select a creature. | 5 | — |
| `Q` and `E`: rotate left and right. | 7 | — |
| `F`: flip the selected creature. | 5 | — |
| Arrow keys: move between board tiles. | 6 | — |
| `Enter` or `Space`: place on the focused habitat. | 8 | — |
| Pointer and touch controls use the same select, turn, and place sequence. | 12 | — |
| Undo last piece returns the latest creature to the tray and removes its score. | 14 | — |
| After a completed board, Copy result puts the score, tier, and seed on your clipboard. | 15 | F-1-8 |
| Open `https://shapeshift-set.sociobot.in/demo` or run the site locally and open `http://localhost:5173/demo`. | 12 | — |
| The demo loads the fixed August 14, 2026 sample board. | 10 | — |
| It writes nothing to local storage and never reads real progress. | 11 | F-1-2 |
| Use “Reset demo” for a clean run. | 7 | F-1-2: reset behavior is not in the isolation claim |
| See `.factory/demo.md` for the verifier contract. | 6 | — |
| Real daily progress stays in browser local storage under `shapeshift-set:daily:<date>`. | 10 | — |
| There are no accounts, analytics events, third-party runtime resources, ads, boosters, or payment controls. | 14 | F-1-3/F-1-12 |
| The service worker caches the game shell, so a loaded board can reopen offline. | 14 | F-1-12 |
| Visual feedback uses a 60 frames-per-second timing target. | 8 | — |
| A placed creature settles in 220 milliseconds when reduced motion is not requested. | 13 | — |
| Requirements: Node.js 20 or later and npm. | 7 | — |
| Run every deterministic, browser, claim, offline, accessibility, and mobile check. | 10 | — |
| Run one documented claim. | 4 | — |
| Build the static deployment. | 4 | — |
| The exact deploy output is `dist/`, with `dist/index.html` at its root. | 11 | — |
| Azure Static Web Apps routing and security headers are in `public/staticwebapp.config.json`. | 11 | — |
| `src/core.ts` contains deterministic board transforms, scoring, and recovery. | 8 | — |
| `src/main.ts` contains the game UI, routes, demo mode, and local persistence. | 11 | — |
| `tests/game.spec.ts` contains the full browser and claim suite. | 8 | — |
| `.factory/design.md` records the visual and interaction system. | 7 | — |
| `.factory/claims.json` maps product claims to executable tests. | 7 | — |
| `assets/src/` stores the generated source art and prompt provenance. | 9 | — |
| Code is available under the MIT License. | 7 | — |
| The original moon garden image was generated for this product; its prompt and review are recorded in `assets/src/moon-garden.prompt.json`. | 18 | — |

All README headings (“Play,” “Try the isolated demo,” “Privacy and offline
use,” “Develop and verify,” “Project structure,” and “License”) name their
sections without metaphor.

## Demo and sandbox

- One click from the landing action opens `/demo`.
- The first 390 px demo viewport shows the persistent banner, the sample date,
  the instructions, and the realistic transformed 6×6 board. The creature tray
  requires scrolling but no setup.
- The banner says “Demo — sample board, nothing is saved” and exposes “Reset
  demo” and “Start for real.”
- A live move followed by Reset demo restored 0/5, no score items, and five
  enabled creatures.
- With a pre-existing real-storage sentinel, demo entry, play, reset, and exit
  left the sentinel byte-for-byte unchanged.
- A full live demo made four requests, all to the product origin. It produced
  no console or page errors. A fresh controlled context reopened `/demo`
  offline.

The behavior passes. Its repeatable claims coverage does not; see F-1-2.

## Claims execution

Every command in `.factory/claims.json` was run independently in manifest
order after `npm ci`.

| Claim ID | Result |
| --- | --- |
| `daily-end` | PASS |
| `unique-perfect` | PASS |
| `restart` | PASS |
| `local-progress` | PASS |
| `demo-isolation` | PASS |
| `offline-reload` | PASS |
| `piece-settle-duration` | PASS |
| `frame-rate` | PASS |
| `keyboard-controls` | PASS |
| `all-inputs` | PASS |
| `undo-last-piece` | PASS |
| `copy-result` | PASS |
| `session-length` | PASS |
| `persistence-recovery` | PASS |
| `same-origin` | PASS |
| `utc-daily` | PASS |
| `free-no-upsells` | PASS |

The aggregate `npm test` also passed 23/23. Green listed tests do not cover the
unlisted promises in F-1-2 through F-1-5 or the repeated daily solution in
F-1-1.

## Earlier findings rechecked

No earlier `.factory/review-*.md` or `.factory/polish-*.md` exists. I rechecked
every defect in the two earlier verification reports and the prior handoff.

| Earlier finding | Live and code result |
| --- | --- |
| Verification 1: aggregate offline claim failure | Fixed. Standalone and aggregate offline tests pass; live offline reload passes. |
| Verification 1: game below first viewport | Fixed. The board begins in both cold viewports. |
| Verification 1: mobile targets below 44 px | Fixed. All 56 visible demo links/buttons measured at least 44 × 44 px. |
| Verification 1: missing duration/FPS claims | Fixed as written. The duration copy was removed; FPS and settle-duration claims now have passing tests. |
| Verification 2: standalone offline failure | Fixed. The exact command and live check pass. |
| Verification 2: silent failed storage write | Fixed. The claim test shows the warning and honest reload behavior. |
| Verification 2: copy, undo, inputs, and session coverage | Fixed for those exact omissions; all four registered tests pass. New unlisted claims remain in F-1-2 through F-1-5. |
| Verification 2: three facts hidden on first screen | Fixed. All three are visible at 390 × 844 and 1440 × 900. |
| Verification 2: missing route returned 200 | Fixed. `/missing-page` returns 404 before and after service-worker control. |
| Verification 2: skip target and 200% reflow | Fixed. Targets pass and all tested routes have zero horizontal overflow at 200% text. |
| Prior handoff: no known product defects | Rejected by this review because F-1-1 through F-1-13 remain. |

## Structure, accessibility, and links

- `/`, `/demo`, `/privacy`, and `/terms` return 200; `/missing-page` returns a
  designed 404.
- Each tested route has `lang="en"`, one h1, one main landmark, a route title,
  a description, and a canonical link. Route navigation and browser Back focus
  the destination h1.
- Every discovered internal and external link returned its expected status.
  The only 404 target is the missing page’s own in-page skip fragment.
- The standard live header and footer appear on the SPA routes. F-1-13 records
  the static 404 differences.
- Playwright Axe found zero serious or critical issues on the four live routes.
  The fleet URL verifier passed with zero console errors. The standalone Axe
  CLI could not find its Chrome binary in this container; the installed
  Playwright Axe integration completed the same checks successfully.
- Focus is a visible 3 px lichen outline, reduced motion is effectively instant,
  200% text has no horizontal overflow, and all measured targets are at least
  44 × 44 px.
- The editorial night-garden and cut-paper board are visually specific to this
  game. This does not look like a generic SaaS template.

## Missed leverage

The obvious missing value is not AI. This deterministic spatial game does not
benefit from sending play data to a model. It already has the expected result
copy action, offline behavior, and local progress. The missing leverage is a
genuinely different daily solution, described in F-1-1.

## Verification summary

- `npm ci`: PASS; 22 packages installed, no audit vulnerabilities.
- All 17 exact claim commands: PASS.
- `npm test`: PASS, 23/23.
- `npm run lint`: PASS.
- `npm run build`: PASS; `dist/` produced. Main JS is 23.31 kB raw and 8.69 kB
  gzip.
- Live perfect, middle, and low-score runs: PASS.
- Live pointer, touch, keyboard-only, undo, copy, replay, reset, error states,
  persistence, route focus, Back, offline, same-origin requests, and real 404:
  PASS.
- Live mobile render cadence under 4× CPU throttle: 60.00 fps over 180 frames.

## What would make this perfect

Ship genuinely different, solver-validated daily answers; register and test
every remaining gameplay and privacy promise; keep the primary-action outcome
visible on phones; replace ambiguous control and result language; remove the
decorative caption; correct the page title; and bring the static 404 metadata
and footer up to the same standard as the rest of the site. Re-run this entire
review from a fresh context after those changes. Zero findings are required for
PASS.
