# Irish Sailing results → Sail Scoring

A capture of **Irish Sailing**'s published event results and the
**as-published ingest pipeline** that feeds them into
[Sail Scoring](https://app.sailscoring.ie).

It is the Irish Sailing counterpart of the sibling
[`hyc-archive`](https://github.com/sailscoring/hyc-archive),
[`ksc-archive`](https://github.com/sailscoring/ksc-archive),
[`dbsc-archive`](https://github.com/sailscoring/dbsc-archive) and
[`iodai-archive`](https://github.com/sailscoring/iodai-archive) repos, and
follows the **as-published** model (app ADR-010,
`docs/design/decisions/010-as-published-archives.md`): the results Irish
Sailing originally published are ingested and displayed faithfully —
structured ranks plus verbatim display cells — and **never re-scored**.

## What's here

```
sources/
  events.json                the curated event list (the only hand-written input)
  sailwave.com/results/      captured Sailwave pages (verbatim)
scripts/
  events.ts                  the event list's shape, shared by both scripts
  capture.ts                 refresh the capture      (`pnpm capture`)
  emit-as-published-config.ts events + captures → ingest config
as-published.config.json     generated ingest config (committed; the input to
                             the app's `archive-generate`)
.github/workflows/
  as-published.yml           emit → generate → push to the irish-sailing workspace
```

## Commands

```
pnpm install
pnpm capture              # fetch every event listed in sources/events.json
pnpm capture --refresh    # re-fetch, for an event still running
pnpm emit-as-published    # events + captures → as-published.config.json
pnpm typecheck
```

The full loop:

```
pnpm capture && pnpm emit-as-published
(cd ../sailscoring && pnpm archive-generate ../irish-sailing-archive/as-published.config.json)
```

## The pipeline

1. **Capture** — `pnpm capture` fetches each event's page from
   sailwave.com. Single-threaded, 0.75 s between requests, and files already
   on disk are reused rather than re-fetched (`--refresh` overrides).
2. **Emit** — `pnpm emit-as-published` turns the event list and the captures
   into `as-published.config.json`: one as-published series per event, one
   fleet per summary section on its page. Series ids are UUIDv5 over
   `irish-sailing-archive/series/<key>` and can never re-mint.
3. **Ingest** — CI checks out the app repo, runs `pnpm archive-generate` over
   the config, and pushes with
   `pnpm cli as-published push … --workspace irish-sailing`, authenticated by
   a workspace- and capability-scoped archivist token. Ingest is idempotent —
   unchanged documents are no-ops by content hash — so a push that touches one
   capture re-publishes only what actually moved. Publishing is automatic;
   there is no separate publish step.

## Adding an event

Irish Sailing publishes into Sailwave's **shared** results folder rather than
a folder of its own, so there is no index to walk — see
[SOURCES.md](SOURCES.md). An event joins the archive by being added to
`sources/events.json`:

```json
{
  "key": "irish-sailing-2025-junior-champions-cup",
  "url": "https://www.sailwave.com/results/Irish%20Sailing%20Junior%20Champions'%20Cup%202025.htm",
  "file": "Irish Sailing Junior Champions' Cup 2025.htm",
  "season": "2025",
  "slug": "junior-champions-cup",
  "name": "Irish Sailing Junior Champions' Cup 2025",
  "title": "Irish Sailing Junior Champions' Cup 20 - 21 September 2025",
  "startDate": "2025-09-20",
  "endDate": "2025-09-21",
  "datesFrom": "the page's own <h1> — \"20 - 21 September 2025\"",
  "eventUrl": "https://www.sailing.ie/Racing/Events-Calendar/Junior-Champions-Cup"
}
```

Then `pnpm capture && pnpm emit-as-published`, and commit the capture, the
event list and the regenerated config together.

`key` and `slug` are permanent: the key seeds the series' UUIDv5 id, and the
slug is a public URL. Changing either is a migration (a managed 301 plus a
delete of the orphaned row), not a rename.

## Status

**One event ingested**, at
`/p/irish-sailing/2025/junior-champions-cup` — the **2025 Junior Champions'
Cup**, 16 boats over 7 races including the medal race, published as one
Overall fleet.

- ✅ Capture, config and a clean `archive-generate`.
- ✅ Accented Irish names survive ingest — the page is windows-1252, and the
   app decodes captures by their encoding.
- ⬜ **Provision the `irish-sailing` workspace** and arm CI (both secrets).
- ⬜ **The rest of the corpus.** Sailwave's root folder also holds the 2025
   Dinghy Champions' Cup (two pages) and the Youth Nationals for 2021 (six
   per-class pages, two of them near-duplicate uploads) and 2024. Each needs
   a naming and a which-upload-is-current decision before it is listed.
- ⬜ **No identity manifest yet.** With one event there is nothing to link
   across, so the ingest's auto-pass drafts the competitor identities. A
   curated manifest becomes worthwhile once the archive spans several events —
   see `ksc-archive`'s `bootstrap-identities.ts` for the shape.

## Relationship to the app repo

This repo assumes the sibling app checkout exists at `../sailscoring`. It
**reuses** the app's Sailwave parser, capture decoder and id derivation by
relative import (`../sailscoring/lib/archive-kit/…`) rather than forking
them — one canonical toolkit. The as-published toolkit (parsers, generator,
ingest client) lives in the app's `lib/archive-kit/` and is driven from here
via config.

Pushing to the production workspace is CI's job; this repo's job ends at a
validated config.

## Licensing

- **Code** — `scripts/`: [MIT](LICENSE).
- **Normalised data & docs** — `sources/events.json`,
  `as-published.config.json`, `README.md`, `SOURCES.md`:
  [CC0 1.0](LICENSE-DATA). These are extractions of published facts (event
  names, dates, structure), and facts are not copyrightable.
- **Source pages** — the verbatim captures under `sources/sailwave.com/`:
  **not covered by either license.** These are results published by Irish
  Sailing (hosted by Sailwave), included only for reproducibility. All rights
  remain with their owners.
