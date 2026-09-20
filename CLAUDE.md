# CLAUDE.md

Guidance for Claude Code working in this repo. **Read `README.md` first** —
it has the mission, the sources, the pipeline, and the status. This file
covers the working conventions.

## What this repo is

A data pipeline, not an application. It captures Irish Sailing's published
Sailwave results verbatim and emits the **as-published** ingest config (app
ADR-010) that feeds them into Sail Scoring — ingested faithfully, never
re-scored.

It is the Irish Sailing counterpart of the sibling `hyc-archive`,
`ksc-archive`, `dbsc-archive` and `iodai-archive` repos; the same spirit
applies. It is closest to `ksc-archive`, which is also Sailwave-sourced and
also as-published-native — but much smaller, and without that repo's season
inference, since Irish Sailing's events are listed by hand rather than
discovered. Domain background (handicap systems, fleets) lives in the app
repo under `../sailscoring/docs/`.

## Commands

```
pnpm install
pnpm capture              # fetch every event in sources/events.json
pnpm capture --refresh    # re-fetch everything
pnpm emit-as-published    # events + captures → as-published.config.json
pnpm typecheck
```

## Rules that are easy to get wrong

1. **Be a good citizen to the server.** Keep the single-threaded 0.75 s delay
   in `scripts/capture.ts`; never parallelise. Files on disk are reused, so
   re-runs are cheap — `--refresh` should be rare.

2. **Source pages are verbatim and third-party.** Everything under
   `sources/sailwave.com/` is unmodified published output, kept for
   reproducibility. Do not edit it, do not transcode it (see rule 4), and do
   not relicense it — see README "Licensing".

3. **Only real published data.** If something is missing, leave it missing —
   do not fabricate, interpolate, or guess. An event with no stated venue
   gets no venue. Dates carry a `datesFrom` note saying which published text
   they were read from; a date with no such source does not go in.

4. **Never decode a capture by hand.** Sailwave publishes ISO-8859-1 and the
   pages carry accented Irish names, so reading them as UTF-8 silently
   mangles exactly the names that matter. Use the app's `decodeCapture`
   (`lib/archive-kit/capture-encoding.ts`) — the same reader
   `archive-generate` uses, so the config can never disagree with what gets
   ingested. A local re-implementation is how the two drift apart.

5. **Never change an emitted `key` or `slug`.** Series ids are deterministic
   UUIDv5 over `irish-sailing-archive/series/<key>`, so renaming a key
   re-mints the id and orphans the ingested series and its identity links;
   the slug is a public URL. Either change is a migration — a managed 301
   (app `pnpm redirects`) plus a delete of the orphaned row — not a rename.

6. **The `<h1>` check is not noise.** `sources/events.json` records each
   page's title as captured, and `pnpm emit-as-published` fails when the
   capture no longer matches. A scorer re-publishing a page under a different
   title is a change to review, not one to absorb on the way past. Work out
   what changed before updating the recorded title.

7. **Record judgement calls.** This corpus is small enough not to need a
   CLARIFICATIONS.md yet, but the moment a decision is made that the sources
   do not settle for themselves — which of two uploads is current, what an
   event is really called, whether two pages are one event — write it down,
   in a `CLARIFICATIONS.md` if there are more than a couple. State what is
   verified, mark what is inferred, and put the rest to Irish Sailing as a
   question. Do not guess at intent.

## Relationship to the app repo

This repo assumes the sibling app checkout exists at `../sailscoring`. It
**reuses** the app's Sailwave parser, capture decoder and id derivation by
relative import (`../sailscoring/lib/archive-kit/…`) rather than forking
them — one canonical toolkit, as the other archive repos do. `jsdom` is a
direct dependency here because the parser needs it.

The as-published toolkit (parsers, generator, ingest client) stays in the
app; this repo contributes config, not code, to the ingest. Pushing to the
production workspace is CI's job — this repo's job ends at a validated
config.

## Git conventions

- Commit logically (one coherent change per commit). Keep the tree
  consistent.
- Commit as `markbmc@gmail.com`, unsigned (`commit.gpgsign=false`).
- **End every commit message with:**
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- **Do not push unless asked.** Commit locally; let the human review and
  push.
