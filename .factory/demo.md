# Demo sandbox

## Entry point

- Production: `https://shapeshift-set.sociobot.in/demo`
- Local: `http://localhost:5173/demo`

The `/demo` route opens the playable sample immediately. It needs no account,
file upload, or setup.

## Sample data

The sample is the shared board for August 14, 2026. It contains five named
creatures, five transformed habitats, a visible mutation chain, deterministic
starting orientations, and seed `989809312`.

## Isolation

Demo state lives only in JavaScript memory. It does not read or write
`localStorage`, IndexedDB, OPFS, cookies, or a backend. Real play uses keys with
the `shapeshift-set:daily:` prefix. The demo never reads that namespace.

The persistent banner reads “Demo — sample board, nothing is saved.” “Start
for real” discards the in-memory sample and opens today’s separately stored
board.

## Reset and verification

Use “Reset demo” in the banner or game controls. Reset restores the original
piece orientations, empty board, zero score, and zero undo count.

The claims suite starts from fresh browser contexts and uses only `/demo` plus
the bundled sample. Run all checks with `npm test`, or a single claim with the
command recorded in `.factory/claims.json`.
