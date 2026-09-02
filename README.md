# Shapeshift Set

Place five shifting creatures in the right order on one shared daily board.

Shapeshift Set is a free, one-player spatial puzzle for daily game regulars.
Each creature must match a habitat and can change one neighboring creature.
The only perfect order changes five neighbors. A round ends after five placements.
A session is one five-placement board.

Live site: <https://shapeshift-set.sociobot.in>

## Play

Open the daily board and select a creature. Rotate or flip it until its blocks
match one dotted habitat. Follow the arrows backwards: a target must be on the
board before the creature that points to it.

The board ends after all five creatures are placed. The result shows Try again
(0–2), Close (3–4), or Perfect (5), with one changed-neighbor result per
creature. “Play this board again” clears the run.

Keyboard controls:

- `1`–`5`: select a creature.
- `Q` and `E`: rotate left and right.
- `F`: flip the selected creature.
- Arrow keys: move between board cells.
- `Enter` or `Space`: place on the focused habitat.

Pointer and touch controls use the same select, turn, and place sequence.
Undo last piece returns the latest creature to the tray and removes its score.
After a completed board, Copy result puts the score, result, and Board ID on
your clipboard.

## Try the isolated demo

Open <https://shapeshift-set.sociobot.in/demo> or run the site locally and open
`http://localhost:5173/demo`.

The demo loads the fixed August 14, 2026 sample board. It uses memory only and
never reads or changes real progress. Use “Reset demo” for a clean run.
See [.factory/demo.md](.factory/demo.md) for the verifier contract.

## Privacy and offline use

Real daily progress stays in browser storage under
`shapeshift-set:daily:<date>`. There are no accounts, analytics events, ads,
boosters, payment controls, or public leaderboards. The game loads no code or
files from other sites. After one online visit, the game can reopen without an
internet connection.

Visual feedback uses a 60 frames-per-second timing target. A placed creature
settles in 220 milliseconds when reduced motion is not requested.

## Develop and verify

Requirements: Node.js 20 or later and npm.

```sh
npm ci
npm run dev
```

Run every deterministic, browser, claim, offline, accessibility, and mobile
check:

```sh
npm test
```

Run one documented claim:

```sh
npm test -- --grep @claim:offline-reload
```

Build the static deployment:

```sh
npm run build
```

The exact deploy output is `dist/`, with `dist/index.html` at its root. Azure
Static Web Apps routing and security headers are in
`public/staticwebapp.config.json`.

## Project structure

- `src/core.ts` contains deterministic board transforms, scoring, and recovery.
- `src/main.ts` contains the game UI, routes, demo mode, and local persistence.
- `tests/game.spec.ts` contains the full browser and claim suite.
- `.factory/design.md` records the visual and interaction system.
- `.factory/claims.json` maps product claims to executable tests.
- `assets/src/` stores the generated source art and prompt provenance.

## License

Code is available under the [MIT License](LICENSE). The original moon garden
image was generated for this product; its prompt and review are recorded in
`assets/src/moon-garden.prompt.json`.
