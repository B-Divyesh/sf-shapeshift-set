# Landing copy audit

Re-audited September 6, 2026 for repair 6. Player-facing copy is unchanged.
Word counts treat numbers and hyphenated forms as one word. No listed sentence
exceeds 22 words or contains a banned marketing word.

## First screen

| Copy | Words | Flag |
| --- | ---: | --- |
| Place five creatures in the right order | 7 | None |
| One shared 6×6 board each day | 6 | Covered by `board-size` |
| For daily puzzle players who want one shared spatial challenge that ends after five creatures. | 15 | None |
| Opens a complete sample board. | 5 | None; visible at 390 px |
| Free to play. | 3 | None |
| Progress stays in this browser. | 5 | None |
| A new shared board appears each UTC day. | 8 | Covered by `utc-daily` |

## Game and supporting screens

| Copy | Words | Flag |
| --- | ---: | --- |
| Place an arrow’s target creature first. | 6 | Covered by `mutation-scoring` |
| Then the creature changes that neighbor and scores one. | 9 | Covered by `mutation-scoring` |
| The gold point marks the creature that starts the chain. | 10 | None |
| Each arrow points to a creature that must be placed first. | 12 | Covered by `mutation-scoring` |
| Changed neighbors will appear here. | 5 | None |
| Finish the board, inspect each changed neighbor, and compare your result. | 12 | Covered by `score-tiers` |
| There are no accounts, ads, boosters, or public leaderboards. | 9 | Covered by `free-no-upsells`, `no-leaderboard` |
| Your daily progress stays in this browser. | 7 | Covered by `local-progress` |
| Demo actions use memory only. | 5 | Covered by `demo-isolation` |
| The game loads from this site and can reopen offline after the first visit. | 14 | Covered by `same-origin`, `offline-reload` |
| Demo play uses memory only and never reads or changes real progress. | 12 | Covered by `demo-isolation` |
| The game sends no analytics events and loads no code or files from other sites. | 14 | Covered by `no-analytics`, `same-origin` |

## Result and recovery text

| Copy | Words | Flag |
| --- | ---: | --- |
| Try again (0–2) | 2 | Covered by `score-tiers` |
| Close (3–4) | 1 | Covered by `score-tiers` |
| Perfect (5) | 1 | Covered by `score-tiers` |
| All five neighbors changed. You found the only perfect order. | 9 | None |
| Three or four neighbors changed. Trace each arrow back before another run. | 11 | None |
| Some target creatures were not placed. Place each arrow target first. | 11 | None |
| Progress could not be saved. This run will not survive reload. Keep this tab open to finish the board. | 19 | Covered by `persistence-recovery` |

## Terminology

| Concept | One word used |
| --- | --- |
| Polyomino game object | creature |
| Destination outline | habitat |
| Scored effect | changed neighbor |
| Ordered result list | changed neighbors |
| Daily identifier | Board ID |
| Isolated try-out | demo |
| Reverse one placement | undo |
