# Clarifications

The judgement calls this corpus forced, and the questions still open for
Irish Sailing. Everything here is either **verified** (a published source
states it) or **inferred** (we decided, and said why). Nothing is guessed at
silently.

Kept because the archive is small enough that each call is still visible —
and because the two Junior Champions' Cup pages captured so far disagree with
each other about the event's name, its venue and whether its results are
final.

## 1. The 2024 results are provisional, and stay that way

**Verified.** `ISjuniorchamps2024.htm` says *"Results are provisional as of
18:08 on September 22, 2024"*. The 2025 page says *final*.

Sailwave's results folder holds no later 2024 upload — that file is the only
Junior Champions' Cup page for the season — so the provisional result **is**
the published record. As-published ingests what was published (ADR-010), so
it is ingested as it stands rather than held back.

*Open question for Irish Sailing:* was a final 2024 result ever published
anywhere? If so it supersedes this page, and this archive should carry that
one instead.

## 2. The 2024 dates come from the Sailing Instructions, not the results page

**Verified, from a second published source.** The 2025 event carries its dates
in its own `<h1>` ("20 - 21 September 2025"). The 2024 page states none
anywhere — not in the `<h1>`, not in the `<h2>`, not in the `<title>`.

They are recorded from **Irish Sailing's own Sailing Instructions** for the
event, which head their first page:

> Fastnet Marine Outdoor & Education Centre, Schull Harbour, Co. Cork
> Saturday 21st & 22nd September 2024

([2024 SIs](https://www.sailing.ie/Portals/0/2024%20SIs%20-%20Irish%20Sailing%20Junior%20Champions%20Cup%202024.pdf),
sailing.ie.) That is the organising authority stating its own event dates, so
it outranks anything that could be inferred from the capture. The SI wording
is slightly off — "Saturday 21st & 22nd" names the weekday of the first day
only — but 21 September 2024 was indeed a Saturday and the 22nd the Sunday,
and Irish Sailing's report of the event describes racing on both days.

**Not** the upload timestamp. The Sailwave folder gives the file
2024-09-22 16:01 and the page stamps itself 18:08 the same day; those are when
the scorer published, which happens to fall on the second day but states
nothing about the first. An event whose publication ran a week late would have
been filed a week wrong.

Why it mattered: the public competitor index files sailors by season from the
series' dates, so while 2024 had none its year filter offered 2025 only, and
every career arc showed `—` where the 2024 dates belong.

## 3. "Champions Cup" vs "Champions' Cup"

**Inferred.** The two pages spell the event differently:

| | As published (`<h1>`) |
|---|---|
| 2024 | Irish Sailing Junior Champions Cup 2024 |
| 2025 | Irish Sailing Junior Champions' Cup 20 - 21 September 2025 |

Irish Sailing's own event page calls it the
[Junior Champions' Cup](https://www.sailing.ie/Racing/Events-Calendar/Junior-Champions-Cup),
with the apostrophe. It is one recurring event, so both seasons are named
**"Irish Sailing Junior Champions' Cup &lt;year&gt;"** here, and the archive
reads as the single event it is.

The verbatim `<h1>` is not lost: `sources/events.json` records it per event in
`title`, and the emit fails if a re-capture no longer matches it. The
normalisation is a display decision, recorded here; the evidence stays on
file.

## 4. The venue name differs between the two years

**Verified, and left alone.** Each page's `<h2>` names the venue, and the two
disagree:

| | As published (`<h2>`) |
|---|---|
| 2024 | Fastnet Marine Outdoor & Education Centre |
| 2025 | Fastnet Marine & Outdoor Education Centre, Schull, Co Cork |

The same place, written two ways by the same scorer — the ampersand moves,
and only 2025 gives the town. Venue is read off each page and **not**
normalised: unlike the event name, it is not the thing the archive is
organised by, and flattening it would discard a published difference for no
gain. If a venue ever needs to be one string across seasons, that is a
decision to make here first.

No `venueUrl` is recorded for either: the centre has no website that resolves.

## 5. The 2024 page publishes standings only

**Verified.** It has one `Overall` summary and no per-race detail tables, so
the series is ingested with standings and no race breakdown. That is a
complete published result, not a truncated capture — the 2025 page, by
contrast, does publish its seven race tables, and those are carried.

## 6. Sailors spelled two ways across the two years

**Resolved.** Sixteen boats sailed each year, and the second
event makes the archive cross-referential for the first time. Four people
appear in both under an identical name:

| | 2024 | 2025 |
|---|---|---|
| Cormac Byrne | crew, RNIYC | helm, Ballyholme YC |
| Isha Duggan | crew, Blessington SC | crew, Blessington SC |
| Killian Power | crew, Schull CC SC / Schull Harbour SC | crew, RStGYC |
| Maeve Donagh | helm, RSGYC/LDYC | helm, RStGYC/LDYC |

And five pairs are near-misses the scorer spelled differently between years:

| 2024 | 2025 |
|---|---|
| Cora McNaughton | Cora Naughton |
| Daniel Copthorne | Daniel Copithorne |
| Lucy Copthorne | Lucy Copithorne |
| Ryan O Driscoll | Ryan O'Driscoll |
| Caoilinn Geraghty-McDonnell | Caoilinn McDonnell |

**All five pairs are confirmed as one sailor each**, and are merged in
[`identity-curation.json`](identity-curation.json). Each shares a first name,
a club and a class with its partner, and the slips are systematic rather than
coincidental: the 2024 page drops the second *i* from both Copithornes and the
apostrophe from O'Driscoll, so it is one scorer's spelling habit, not two
families.

The four exact-name people needed no curation — the bootstrap treats one
normalised name as one sailor, and `nameKey` already folds punctuation, so
"Ryan O Driscoll" and "Ryan O'Driscoll" would have agreed even unmerged.

Display names follow the **most recently published spelling**, the scorer's
latest word on it, with two exceptions where that rule is wrong:

- **Cora McNaughton**, not Cora Naughton. The rule picked the 2025 spelling;
  she is confirmed as McNaughton, and the 2025 page is the outlier — she is
  McNaughton in 2024 and again in 2026. Her slug stays `cora-naughton-zpy6`:
  a slug is a public URL and seeds the identity's UUIDv5, so it never moves
  when a display name is corrected.
- **Caoilinn Geraghty-McDonnell**, because the 2024 form is strictly fuller —
  the 2025 page keeps only the second half of a double-barrelled surname, and
  dropping part of someone's name is a loss rather than a correction.

Cora is the useful lesson: the most-recent rule is a default for the
unconfirmed, not evidence. A spelling anyone has actually confirmed beats it,
and gets a note saying so.

## 7. Duplicates across the archive and the live 2026 event

**Where a correction belongs depends on which side of the line it is on**, and
the line is real: the app enforces it.

Irish Sailing scores the 2026 Junior Champions' Cup *in* Sail Scoring, so that
series is a live series in the same workspace as this archive. Its competitor
identities are drawn by the app's automatic pass, not by this repo's manifest.
The pass joins a 2026 sailor to an archive identity only when something
corroborates the name — sail number, age, or club — and this event has no
ages, recycles its sail numbers as tally letters and numbers each year, and
writes clubs many ways. So a recurring sailor whose club string moved gets a
second identity.

Five pairs came out of the 2026 event:

| archive identity (this repo) | live 2026 identity (the app) |
|---|---|
| `cora-naughton-zpy6` | `cora-mcnaughton-…` |
| `kate-spain-kaay` | `kate-spain-…` |
| `matt-maplebeck-tqgk` | `matt-mapplebeck-…` |
| `molly-hooper-jones-xrph` | `mollie-hooper-jones-…` |
| `riona-mcmorrow-moriarty-jtv9` | `riona-mcmorrowmoriaty-…` |

**Merging them is the app's job, not this repo's.** The manifest addresses
rows by `(series-key, sail, slot)` and only knows this archive's series; it
cannot claim a row in a live series. The merge happens in the workspace's
Competitors tab.

**The archive identity always survives**, and the app enforces it — dissolving
an archive-managed identity is refused with `archive-managed`, because the
next ingest would recreate it from the manifest and quietly undo the merge.
So the live identity merges *into* the archive one, and the surviving page
keeps the archive slug and the display name this repo sets.

Which means a display name on a merged identity is still corrected **here**,
in `identity-curation.json` — not in the app.

## Still to decide

Events in Sailwave's root folder that are Irish Sailing's but not yet listed
in `sources/events.json`, each needing a call before it is:

- **Dinghy Champions' Cup 2025** — two uploads 58 minutes apart, one suffixed
  `F`. Which is current, and does `F` mean final?
- **Youth Nationals 2021** — six per-class pages, two of them near-duplicate
  uploads of the ILCA 6 results. Which upload, and is a six-page event one
  series of six fleets or six series?
- **Youth Nationals 2024** — one page, not yet examined.
