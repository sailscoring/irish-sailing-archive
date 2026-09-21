# Sources

Everything under `sources/sailwave.com/` is captured by `pnpm capture` and
written as received — verbatim, third-party, never edited by hand.

## `sailwave.com/results/` — the results

<https://www.sailwave.com/results/>

Sailwave hosts a results folder for anyone publishing from the Sailwave
application. Clubs that publish regularly get their own subfolder
(`/results/KSC/`, and so on); Irish Sailing does not. Its events land in the
**shared root folder**, one page per event, under whatever filename the
scorer saved:

```
sources/sailwave.com/results/
  Irish Sailing Junior Champions' Cup 2025.htm
```

Filenames are kept exactly as published — spaces, apostrophe and all — so a
capture path is a URL you can check.

That shared folder is the reason this repo has a hand-maintained event list
rather than a crawler. It holds over eleven thousand pages from clubs and
classes worldwide, with no per-organisation index, so there is nothing to
walk and no filename convention to infer a season or an event name from. An
event enters this archive by being listed in
[`sources/events.json`](sources/events.json).

Notes on the format:

- Pages are **Sailwave 2.x HTML**, parsed by the app's
  `lib/archive-kit/sailwave-html.ts` — an `<h3 class="summarytitle">`, a
  `<div class="caption">` and a `<table class="summarytable">` per section,
  with per-race detail tables following the same shape.
- They declare **ISO-8859-1**, and the accented Irish names in them decode as
  **windows-1252**. Never decode a capture by hand — use the app's
  `decodeCapture`, which both `pnpm emit-as-published` and `archive-generate`
  read through, so the config can never disagree with what gets ingested.

## What the event list adds

`sources/events.json` holds only what the page cannot state for itself: the
season folder, the event slug, the display name, and the dates. The fleets,
the race tables and the venue are read off the capture.

Every date carries a `datesFrom` note naming the published text it was read
from, because the two events state theirs in different places — 2025 in its
own `<h1>`, 2024 nowhere at all. A date with no such source does not go in.

## `sailing.ie` — what the results page leaves out

<https://www.sailing.ie/Racing/Events-Calendar/Junior-Champions-Cup>

Irish Sailing's own site is the second source, consulted rather than captured:
it is where the event lives, and it carries the Notice of Race, the Sailing
Instructions and the entry lists that the Sailwave page does not.

So far it has supplied one fact — the 2024 event dates, from that year's
[Sailing Instructions](https://www.sailing.ie/Portals/0/2024%20SIs%20-%20Irish%20Sailing%20Junior%20Champions%20Cup%202024.pdf)
(CLARIFICATIONS §2). Nothing from it is mirrored under `sources/`: it is a
living site rather than a frozen results file, and a stale copy of a page that
still exists would be worse than a citation. Anything taken from it is
recorded in `events.json` with a `datesFrom`-style note saying where it came
from.

It also records each page's `<h1>` as captured. `pnpm emit-as-published`
checks it and fails if it has moved — a re-published page is a change to
review, not one to absorb on the way past.

## `afloat.ie` — where a result exists only as a picture

The 2023 Junior Champions' Cup was never published as a results page. Its
standings survive as a photograph of the scorer's table in afloat.ie's report
of the event, captured verbatim at
`sources/afloat.ie/I0000s1kApQNMtEA.jpg`.

That image cannot be parsed, so the figures were read by hand into
`transcriptions/` and rendered into the Sailwave shape — the only entry in
this archive whose numbers were typed rather than captured. It is marked as
such wherever it appears, and CLARIFICATIONS §8 says what that costs and how
the arithmetic check limits the damage.

## `web.archive.org` — Irish Sailing's deleted event pages

The All-Ireland Championships pages (senior and junior, 2018–2021) and the
roll of honour are gone from the live `sailing.ie`. They survive as Internet
Archive snapshots, captured under `sources/web.archive.org/` with the `id_`
flag so they are the original bytes rather than the Wayback replay wrapper.

Three of those URLs carry no year, and a snapshot of one mixes a forthcoming
event's heading with a previous event's results — in one case with a third
year's results still on the page. **[`RESEARCH.md`](RESEARCH.md) before
use.**

## `irishsailinglive.ie` — Irish Sailing's own results database

A fourth kind of source: not a published page but a JSON API, holding what
scorers pushed from Sailwave and HalSail. It is the only place the **2023**
Junior Champions' Cup's structured data survives, and checking the hand
transcription against it found no differences at all.

Captures and the endpoint list are in
[`sources/irishsailinglive.ie/`](sources/irishsailinglive.ie/); what it does
and does not hold is in [`RESEARCH.md`](RESEARCH.md).

## Capture etiquette

sailwave.com is a small public server. `pnpm capture` is single-threaded with
a 0.75 s delay between requests and is never parallelised. Files already on
disk are reused rather than re-fetched, so re-runs of a finished event cost
nothing; `--refresh` forces a re-fetch and is only needed while an event is
still running. The capture is read-only and unauthenticated.
