# Irish Sailing Live — the API responses

[irishsailinglive.ie](https://www.irishsailinglive.ie/) is Irish Sailing's own
results app: a browser-rendered PWA over a public JSON API that needs no
sign-in. Scorers push to it from Sailwave (plugin, since 2.33) or HalSail, and
the push lands as structured per-race data — points, finish places, discard
flags, scoring codes — plus standings. It is the database, not an index:
nothing there links back out to a results page.

Nothing is rendered server-side, so none of it is indexable and none of it
turns up in a search. The only way in is the API:

```
App/Years                                   the years it files events under
App/Dates?year=YYYY                         dates with events
App/Events?date=YYYY-MM-DD                  events on a date
App/EventDetailsAndSeries?eventId=&fleetId= a fleet's full results
```

Responses are captured here verbatim.

| File | Event |
|---|---|
| `event-47-junior-champions-cup-2023.json` | Junior Champions' Cup 2023, fleet 465 ("Handicap"), 15 entries over 9 races |

## What it does and does not hold

Surveyed across all 54 events it files, 2002–2026: the **only** Junior
Champions' Cup on it is 2023, pushed during Irish Sailing's 2023 trial of the
platform. 2021, 2024 and 2025 are not there — from 2025 the organisation's own
championships went back to publishing on sailwave.com.

It **does** hold the **Youth Nationals for 2023** (event 849, Howth YC,
13–16 April) and **2024** (event 847, Royal Cork YC), both pushed from
Sailwave. Those are the next thing to take from it.

Two cautions, both borne out here:

- **Dates are whatever the scorer's plugin sent, and are not checked.** This
  event is filed as a single day, 1 December 2023, which cannot be right: its
  results were published in a news article on 5 November 2023.
- **Club names are not always pushed.** Every `clubName` in this event is
  null, though the published results table carries them.
