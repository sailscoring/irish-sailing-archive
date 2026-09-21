/**
 * `sources/events.json` — the curated event list, and the only hand-written
 * input this repo has.
 *
 * Irish Sailing's results are published into Sailwave's shared results
 * folder, one page per event, under whatever filename the scorer saved. That
 * folder is not a per-club folder, so there is no index to walk and nothing
 * to infer a season or an event name from: an event enters this archive by
 * being listed here. Everything else — the fleets, the races, the venue — is
 * read off the captured page itself.
 */

import { readFileSync } from 'node:fs';

export const EVENTS_FILE = 'sources/events.json';
/** Where captures land, mirroring the source URL's path. */
export const CAPTURE_DIR = 'sources/sailwave.com/results';

export interface ArchiveEvent {
  /** Stable per-series key. The series id is UUIDv5 over it, so it is
   *  permanent: renaming one re-mints the id and orphans the ingested
   *  series. */
  key: string;
  /** Where the result was published. Normally the Sailwave page; for a
   *  transcribed event, the article carrying the photograph it was read from. */
  url: string;
  /** Normally the capture's filename under `CAPTURE_DIR`, verbatim from the
   *  URL. For a transcribed event, a path from the repo root. */
  file: string;
  /** This event was never published as a results page, and its standings were
   *  read by hand off a photograph (`pnpm transcriptions`). `file` is then the
   *  generated HTML rather than a capture, `pnpm capture` skips it, and the
   *  `title` check does not apply — the title is ours, not a publisher's.
   *  See CLARIFICATIONS.md §8. */
  transcribed?: boolean;
  /** The published slug's season folder (app ADR-011). */
  season: string;
  /** The event's slug within its season. Public URL; never changed. */
  slug: string;
  /** Display name for the series. */
  name: string;
  /** The page's `<h1>` as published, checked against the capture on every
   *  emit so a re-capture that moves under us is noticed rather than
   *  absorbed. */
  title: string;
  /** Event dates, at whatever precision a published source actually states:
   *  a full day, a month, or a year alone. Never finer than the evidence. */
  startDate?: string;
  endDate?: string;
  /** Which published text the dates were read from. */
  datesFrom?: string;
  eventUrl?: string;
  venueUrl?: string;
  /** A note rendered on every page of this event's publication: what the
   *  figures cannot say for themselves. Only an event that needs one has one —
   *  a verbatim capture of a published results page says everything by being
   *  what it is. */
  seriesNote?: string;
}

export function readEvents(): ArchiveEvent[] {
  const { events } = JSON.parse(readFileSync(EVENTS_FILE, 'utf8')) as {
    events: ArchiveEvent[];
  };
  return events;
}
