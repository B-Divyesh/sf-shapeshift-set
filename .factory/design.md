# Shapeshift Set visual thesis

## Direction and purpose

Shapeshift Set uses surreal editorial scenery: a quiet night garden appears to
have been cut from a natural-history magazine, then rearranged into a precise
game board. Oversized smooth stones, paper creatures, and a low moon make the
world strange without hiding the puzzle. The scene supports a five-minute daily
ritual. It does not turn the landing page into a generic software pitch.

The game itself is the first-screen focal point. The landscape occupies one
asymmetric side. A solid ink-colored game plate occupies the other. Copy always
sits on a plain surface, never directly on detailed imagery.

## Palette

The palette is derived from twilight, chalk paths, and coral paper cutouts in
the hero scene.

| Token | Value | Use |
| --- | --- | --- |
| `--night` | `#10182b` | Page background and deep game plate |
| `--ink` | `#17233a` | Raised surfaces |
| `--paper` | `#fff8e8` | Primary text and board paths |
| `--mist` | `#bec8d8` | Secondary text |
| `--coral` | `#ff7a6e` | Primary action and selected creature |
| `--coral-ink` | `#241018` | Text on coral |
| `--lichen` | `#b9d66b` | Successful mutation and focus |
| `--gold` | `#f2c45f` | Perfect score and daily marker |
| `--danger` | `#ff9c91` | Placement errors |

All text pairs meet WCAG AA. This is an intentionally single-mode night scene;
a second color mode would weaken the editorial premise. Browser chrome is
painted `--night`.

## Typography

Headlines use Georgia, a widely available editorial serif, at sparse sizes and
tight leading. Body and controls use the system sans-serif stack. This avoids a
font download while keeping the display/body contrast clear. Numbers use
tabular figures. Body text never drops below 16 px.

## Spacing and shape

Spacing follows an 8 px base: 8, 16, 24, 32, 48, 64, and 96 px. The 6x6 board
is the dominant square. Panels use clipped upper-right corners like pieces cut
from a printed page. Controls are rounded capsules only when they act as one
compact tool group. All targets are at least 44 px.

## Game grammar and difficulty

Each date selects a deterministic rotation and reflection of one proven board.
The same date therefore gives every player the same layout and tray turns.
There are five distinct creature silhouettes. Each silhouette has one habitat.
Players select a creature, rotate it, and place it into the matching habitat.

A visible dotted link shows which neighbor each creature mutates. The first
creature changes a seed tile. Each later creature changes the prior creature,
so five successful mutations require one unique placement order. A placed piece
cannot score retroactively. Players may undo or reset and can inspect every
mutation in the score trail. The three result tiers are Quiet (0–2), Shifting
(3–4), and Radiant (5). The intended run is 3–5 minutes. Daily transforms change
spatial reading, not difficulty.

Keyboard grammar: Tab selects controls; number keys select creatures; Q/E or
the rotate buttons turn a creature; arrows move the board cursor; Enter places.
Pointer and touch use the same select, rotate, place sequence. Undo and reset
are always available. Sound is absent, so no mute control is needed.

## Motion policy

Paper pieces settle onto the board in 220 ms with a small scale-down. A
successful mutation sends one 600 ms glow along its visible link. The landscape
stays still so it does not compete with the board. Motion never communicates
the only version of a state. Under `prefers-reduced-motion`, transitions stop;
success remains visible through color, text, and symbols. There is no flashing,
shake, or infinite animation.

## Asset plan and provenance

The hero is one original generated 3:2 editorial landscape, exported to WebP
at two responsive sizes. It depicts an impossible moon garden with five blank
paper-creature shapes, oversized stones, and negative space. It contains no
text, people, brands, or known characters. The social image is composed from
the same generated art plus code-rendered color fields; no essential text is
inside the image. Game creatures and UI marks are original SVG/CSS geometry
authored in this repository.

Prompt sheet: “Surreal editorial night garden, overhead-isometric impossible
terraces arranged around a six-by-six pale stone clearing, five small abstract
paper cutout creatures without faces, oversized moon and smooth rocks, deep
navy dusk, warm ivory chalk, coral paper, lichen green accents, gold moonlight,
matte gouache and cut-paper texture, strong negative space on the left, no
people, no hands, no letters, no numbers, no text, no watermark, no logos, no
recognizable characters, no gradients, clean edges, magazine illustration.”

Generation tool: Azure OpenAI image generation via
`/opt/fleet/lib/gen-image.sh`, model deployment `factory-image`, generated on
2026-09-02. Prompt sidecars are stored with source candidates under
`assets/src/`. Generated imagery is disclosed in the site footer.

## Responsive composition

At 390 px the board appears directly below the short introduction. The hero
landscape becomes a shallow backdrop and loses parallax. Tool controls wrap
into two rows; the board remains a square. Desktop places the editorial intro
beside the playable board, then uses the art as a full-width transition. No
content is hidden behind fixed controls or safe areas.
