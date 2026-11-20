# Token Radar

A token launch radar: 226 pre-token protocols ranked by implied value, built from
a sealed DefiLlama snapshot (14 Nov 2026).

**Model `radar-2`** — each category's multiple is the median market-cap / TVL of
that category's live-token protocols in the same snapshot (fallback: overall
median). Implied value = TVL × category multiple × growth × maturity × chains.
No protocol name is special-cased.

- `main.ts` — reads `/input/snapshot.json`, writes `/output/board.json`,
  `/output/data.js`, copies `dashboard/` + `screenshots/`, writes `dossier.json`.
- `dashboard/` — static page, no network: sortable/filterable board, detail view
  with the model breakdown and a farm plan per protocol, live-token tab.
- `screenshots/` — board, detail, filtered views.

Built with Muse for the make.fun token-radar-01 bounty.
