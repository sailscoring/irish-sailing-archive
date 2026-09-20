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
season folder, the event slug, the display name, and the dates with a note
saying which published text they were read from. The fleets, the race tables
and the venue are read off the capture.

It also records each page's `<h1>` as captured. `pnpm emit-as-published`
checks it and fails if it has moved — a re-published page is a change to
review, not one to absorb on the way past.

## Capture etiquette

sailwave.com is a small public server. `pnpm capture` is single-threaded with
a 0.75 s delay between requests and is never parallelised. Files already on
disk are reused rather than re-fetched, so re-runs of a finished event cost
nothing; `--refresh` forces a re-fetch and is only needed while an event is
still running. The capture is read-only and unauthenticated.
