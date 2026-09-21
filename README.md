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

> 📋 **[CLARIFICATIONS.md](CLARIFICATIONS.md)** — the judgement calls the
> corpus forced, and the open questions for Irish Sailing.
> 🔎 **[RESEARCH.md](RESEARCH.md)** — where the older events' results survive,
> and the trap in the undated pages that hold them.
> 🏆 **[WINNERS.md](WINNERS.md)** — the All-Ireland roll of honour, 1947–2021.

## What's here

```
sources/
  events.json                the curated event list (the only hand-written input)
  sailwave.com/results/      captured Sailwave pages (verbatim)
  afloat.ie/                 a published results photograph (verbatim)
  irishsailinglive.ie/       Irish Sailing's own results API (verbatim)
  web.archive.org/           Irish Sailing's own event pages, since deleted
                             from the live site (verbatim)
winners.json                 the All-Ireland roll of honour, 1947–2021
WINNERS.md                   ...rendered  (`pnpm winners`)
transcriptions/              hand-read tables for results nobody published as
                             a page, plus the HTML built from them (§8)
scripts/
  events.ts                  the event list's shape, shared by the scripts
  capture.ts                 refresh the capture      (`pnpm capture`)
  build-transcriptions.ts    transcription → HTML     (`pnpm transcriptions`)
  emit-as-published-config.ts events + captures → ingest config
  bootstrap-identities.ts    rows → identities.json   (`pnpm identities`)
  build-winners.ts           winners.json → WINNERS.md (`pnpm winners`)
identity-curation.json       hand-maintained input to `pnpm identities`
identities.json              the competitor-identity manifest (committed)
as-published.config.json     generated ingest config (committed; the input to
                             the app's `archive-generate`)
.github/workflows/
  as-published.yml           emit → generate → push to the irishsailing workspace
```

## Commands

```
pnpm install
pnpm capture              # fetch every event listed in sources/events.json
pnpm capture --refresh    # re-fetch, for an event still running
pnpm transcriptions       # hand-read tables → Sailwave-shaped HTML
pnpm winners              # winners.json → WINNERS.md
pnpm emit-as-published    # events + captures → as-published.config.json
pnpm identities           # generated documents → identities.json
pnpm typecheck
```

The full loop, since `pnpm identities` reads what `archive-generate` writes:

```
pnpm capture && pnpm transcriptions && pnpm emit-as-published
(cd ../sailscoring && pnpm archive-generate ../irish-sailing-archive/as-published.config.json)
pnpm identities
```

Re-run the generate afterwards if the manifest changed — it copies
`identities.json` alongside the series documents for the ingest to apply.

## The pipeline

1. **Capture** — `pnpm capture` fetches each event's page from
   sailwave.com. Single-threaded, 0.75 s between requests, and files already
   on disk are reused rather than re-fetched (`--refresh` overrides).
2. **Emit** — `pnpm emit-as-published` turns the event list and the captures
   into `as-published.config.json`: one as-published series per event, one
   fleet per summary section on its page. Series ids are UUIDv5 over
   `irish-sailing-archive/series/<key>` and can never re-mint.
3. **Identities** — `pnpm identities` groups the generated rows into people
   and writes `identities.json`, the manifest the ingest applies. It runs
   against `archive-generate`'s output, so it is an operator step rather than
   a CI one; slugs are minted once and never move, and a re-run only assigns
   rows that aren't claimed yet.
4. **Ingest** — CI checks out the app repo, runs `pnpm archive-generate` over
   the config, and pushes with
   `pnpm cli as-published push … --workspace irishsailing`, authenticated by
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

**Four events ingested**:

| Season | Event | Source | |
|---|---|---|--:|
| [2021](https://app.sailscoring.ie/p/irishsailing/2021/all-ireland-junior-championships) | All Ireland Junior Championships | **extracted** from Irish Sailing's own page, since deleted (§10) | 16 boats, 9 races |
| [2023](https://app.sailscoring.ie/p/irishsailing/2023/junior-champions-cup) | Junior Champions' Cup | **hand-read** from a published photograph, since verified against Irish Sailing Live (§8) | 15 boats, 9 races |
| [2024](https://app.sailscoring.ie/p/irishsailing/2024/junior-champions-cup) | Junior Champions' Cup | Sailwave capture, standings only | 16 boats, 8 races |
| [2025](https://app.sailscoring.ie/p/irishsailing/2025/junior-champions-cup) | Junior Champions' Cup | Sailwave capture, with race tables | 16 boats, 7 races |

The 2021 event predates the Champions' Cup name — it is the same continuous
championship under its older title ([RESEARCH.md](RESEARCH.md)). It publishes
no places and five of its rows contradict their own arithmetic; both are
carried as published ([CLARIFICATIONS §10](CLARIFICATIONS.md)).

Note the workspace slug is **`irishsailing`**, with no hyphen, while this
repo and its series keys are `irish-sailing-…`. The slug is the `/p/` segment
on every public URL; the keys are internal and seed the series ids. Pushing to
the wrong one fails closed with `forbidden — workspace-not-a-member`, which
reads like a credentials problem and isn't.

- ✅ Capture, config and a clean `archive-generate`.
- ✅ Accented Irish names survive ingest — the 2025 page is windows-1252, and
   the app decodes captures by their encoding.
- ✅ The `irishsailing` workspace is provisioned and CI is armed, so a push
   to `main` re-ingests.
- ✅ **Event dates for 2024 and 2025.** 2025 states its own in the capture;
   2024 is dated from Irish Sailing's Sailing Instructions (CLARIFICATIONS §2).
   2023 has none — nobody published them.
- ✅ **The identity manifest** — 126 rows resolved to **101 sailors**, every
   row manifest-pinned and nothing left to the ingest's auto-pass. Twenty-two
   appear in more than one event; Caoilinn Geraghty-McDonnell is in all four.
- ✅ **Crew count as sailors** (app
   [#348](https://github.com/sailscoring/sailscoring/issues/348)) — every boat
   in all three events names a crew, so reading the helm field alone would
   have left half the entrants out of the record.
- ⬜ **Ask for the real 2023 file.** 2024 and 2025 were both published to
   sailwave.com by the same operation, so a `.blw` or unpublished HTML for
   2023 very likely exists. It would retire the transcription (§8).
- ✅ **Both recovered events say what they are.** The 2023 and 2021 pages
   carry a note (app
   [#628](https://github.com/sailscoring/sailscoring/issues/628)) recording
   that no results page was published, where the figures came from, and — for
   2021 — that the source publishes no places and contradicts itself five
   times.
- ✅ **2023 is dated to the year** (app
   [#629](https://github.com/sailscoring/sailscoring/issues/629)). Nobody
   published the racing days and the week straddles October and November, so
   `2023` is what is known and what is recorded. Enough for the competitor
   index to file it and a career arc to label it.
- ⬜ **The rest of the corpus** — the 2025 Dinghy Champions' Cup and the 2021
   and 2024 Youth Nationals are in Sailwave's root folder, each needing a
   naming and a which-upload-is-current decision first.
- ⬜ **The older All-Ireland events** (2018 and 2019, senior and junior; 2021
   senior). Their
   pages are gone from `sailing.ie` and survive only on the Internet Archive,
   captured here. 2018 and 2019 were sailed as flights and a repêchage, which
   the as-published model has no shape for. [RESEARCH.md](RESEARCH.md) has the
   detail.
- ✅ **The All-Ireland roll of honour**, 1947–2021 ([WINNERS.md](WINNERS.md)).
   No route to a published page — it is names against years, not a scored
   series — but its source page no longer exists, so the repo is the copy.

## The live 2026 event

Irish Sailing scores the 2026 Junior Champions' Cup *in* Sail Scoring, so the
`irishsailing` workspace holds a live series alongside this archive. The two
share sailors, and the app's automatic identity pass — not this repo's
manifest — decides whether a 2026 entry joins an archived one.

Corrections split along that line, and the app enforces the split:

- **A duplicate identity spanning both** is merged in the workspace's
  Competitors tab. The archive identity always survives; dissolving one is
  refused with `archive-managed`, because the next ingest would recreate it.
- **The display name on the surviving identity** is corrected *here*, in
  `identity-curation.json`, because it comes from the manifest.

See [CLARIFICATIONS §7](CLARIFICATIONS.md) for the five pairs the 2026 event
produced and why the matcher missed them.

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
  `as-published.config.json`, `identities.json`, `identity-curation.json`,
  `README.md`, `SOURCES.md`, `CLARIFICATIONS.md`:
  [CC0 1.0](LICENSE-DATA). These are extractions of published facts (event
  names, dates, structure), and facts are not copyrightable.
- **Source pages** — the verbatim captures under `sources/sailwave.com/`:
  **not covered by either license.** These are results published by Irish
  Sailing (hosted by Sailwave), included only for reproducibility. All rights
  remain with their owners.
