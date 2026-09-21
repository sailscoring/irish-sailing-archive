# Research: the older events, and what is recoverable

This archive currently holds the Junior Champions' Cup for 2023, 2024 and
2025. Irish Sailing's older events — the **All-Ireland Championships** (senior
and junior) and the **Youth Nationals** — are not in it yet. This is the
working note on where their results survive and what each source is actually
good for.

Nothing here has been ingested. It is written down first because the sources
are booby-trapped in a specific way, and the trap is easy to walk into.

## The naming

One event, several names, and they overlap in the sources:

| Era | Senior | Junior |
|---|---|---|
| to 2021 | All Ireland Sailing Championships, *aka* the **Helmsman's Cup** | All Ireland Junior Championships |
| 2023– | Irish Sailing Champions' Cup | Irish Sailing Junior Champions' Cup |

The 2018 senior page heads itself "Irish Sailing All Ireland Sailing
Championships 2018"; the roll of honour calls the whole 75-year sequence the
All-Ireland Championships. The current site calls it the Champions' Cup.
**It is one continuous championship**, which matters here: a sailor's career
arc should not break because the organiser renamed the event.

## The sources

Irish Sailing has reorganised `sailing.ie` more than once and these pages are
gone from the live site, so everything below is from the Internet Archive,
captured verbatim under [`sources/web.archive.org/`](sources/web.archive.org/).

### Year-specific URLs — safe

`…/2018-All-Ireland-Junior-Championships` and friends say in their own URL and
heading which year they are. Four of these exist:

| Capture | Holds |
|---|---|
| `junior-2018.html` | flighted results — Flight Races, Repêchage, two finals — plus the entry list |
| `junior-2019.html` | the 2019 result (Chris Bateman), entry list, event timeline |
| `senior-2018.html` | flighted results plus a 17-boat entry list |
| `senior-2019.html` | the 2019 result (Michael O'Connor), flights, entry list |

### Undated URLs — **handle with care**

`…/All-Ireland-Junior-Championships` and
`…/All-Ireland-Sailing-Championships` have no year in them. They are the
*live* page at whatever moment the Archive crawled it, and Irish Sailing used
them to promote the next event while the previous one's results were still on
the page. A snapshot therefore mixes years, and says so nowhere.

`junior-2021.html` (crawled 2022-01-17) is the worst of them. It carries
**three different years at once**:

| On the page | Actually |
|---|---|
| `<h1>` | "All Ireland Junior Championships **2022**" |
| first results table | the **2021** event — Rocco Wright winning on 33 net |
| entry list | 2021 |
| third table, further down | the **2019** results, left in place — Chris Bateman |

`junior-2022.html` (crawled six months later) is byte-identical in its
results tables: the page had not been touched.

So a reader taking "the results table" off that page gets 2019, and would
publish Chris Bateman as the 2021 junior champion. The roll of honour says
Rocco Wright, which is what caught it. **Date every table against
[`WINNERS.md`](WINNERS.md) before believing it.**

`senior-2021.html` has the same shape — headed "Irish Sailing Senior All
Ireland Championships 2022" with "All Ireland Championships 2021" over the
results.

## What is recoverable, and how hard

**The roll of honour: done.** 1947–2021, in [`winners.json`](winners.json) and
rendered to [`WINNERS.md`](WINNERS.md). No route to a published page — it is
names against years, not a scored series — but it is the only consolidated
copy and its source page is gone.

**2021 Junior: done, but not as cleanly as this note first claimed.** The
table is the same shape as the modern events — R1–R8, a medal race, Tot and
Net — and being HTML it extracts rather than needing to be read by eye. But
it publishes no rank column, its Nett column is out of order for the bottom
six boats, and **five of its sixteen rows contradict their own arithmetic**.
All five are carried verbatim and declared; no places are published. See
CLARIFICATIONS §10. (An earlier draft of this file said it "transcribes
exactly like the 2023 event", which was written after reading the top of the
table and not the bottom of it.)

**2018 and 2019, senior and junior: not straightforward.** These were sailed
as flights plus a repêchage plus a final, and published as several small
tables per stage. That is not an Appendix A series and the as-published model
has no shape for it. Ingesting them means deciding what a "series" even is
here — one page per stage, or a single standings derived from the final —
and deriving anything is re-scoring, which ADR-010 forbids. Left alone until
that question has an answer.

**Youth Nationals: not started.** Sailwave's root folder has
`Irish sailing youth nationals 2024.htm` and six 2021 pages (one per class,
two of them near-duplicate uploads of the ILCA 6 results). Each needs a
which-upload-is-current decision, and the six-page 2021 event needs deciding
whether it is one series of six fleets or six series.

## Irish Sailing Live

[irishsailinglive.ie](https://www.irishsailinglive.ie/) is Irish Sailing's own
results app, and a **fourth kind of source** for this archive: not a published
page but a database. Scorers push to it from Sailwave or HalSail, and the push
lands as structured per-race data — points, finish places, discard flags,
scoring codes — plus standings, readable through a public JSON API that needs
no sign-in. Nothing renders server-side, so none of it is indexable and none of
it turns up in a search; the API is the only way in. See
[`sources/irishsailinglive.ie/`](sources/irishsailinglive.ie/) for the
endpoints and the captures.

It is thin and uneven. Across all 54 events it files, 2002–2026, Irish
Sailing's own championships appear only from a 2023–24 trial period; from 2025
the organisation went back to publishing on sailwave.com and HalSail.

**What it gave us.** The only Junior Champions' Cup on it is **2023** — the one
event in this archive with no published results page, which we had transcribed
by hand from a photograph. Checked cell by cell, all fifteen rows agree
exactly (CLARIFICATIONS §8). That is the transcription independently verified,
and it is why §8 now reads as a method note rather than a worry.

**What it did not.** No 2021, 2024 or 2025 Junior event. No club names for the
2023 event either — `clubName` is null throughout — so the photograph remains
the published source, carrying Class and Club, while the API proves the
numbers. And its dates are whatever the plugin sent: it files 2023 as a single
day, 1 December, for an event whose results were in print on 5 November.

**What to take from it next**, as and when:

| Event | Id | Source | Notes |
|---|--:|---|---|
| Irish Sailing Youth Nationals 2023 | 849 | Sailwave push | Howth YC, 13–16 April |
| Irish Sailing Youth Nationals 2024 | 847 | Sailwave push | Royal Cork YC |

The senior Champions' Cup is **not** on it for any year; those results live on
sailwave.com (dinghy) and HalSail's public pages (keelboat), and the older
All-Ireland years only on the Internet Archive pages above.

## Ask Irish Sailing

Most of what is missing is cheaper to ask for than to reconstruct:

- **The 2023 Junior file.** Its figures are now verified against Irish Sailing
  Live, so this is no longer about trusting them — but the `.blw` would carry
  the **dates and the clubs together**, which neither surviving source does.
- **Event dates.** 2023 has none published at all, and the older events' dates
  live only in Notices of Race that are themselves only on the Archive.
- **Post-2021 winners.** The roll of honour stops at 2021; 2022 onwards is
  presumably recorded somewhere internally.
- **Anything before 1947.** The table starts there without saying whether that
  is the start of the championship or the start of the record.
