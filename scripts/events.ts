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
  /** The published page, as linked from the Sailwave results folder. */
  url: string;
  /** The capture's filename under `CAPTURE_DIR`, verbatim from the URL. */
  file: string;
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
  /** Event dates. Stated only where a published source states them; see
   *  `datesFrom`. */
  startDate?: string;
  endDate?: string;
  /** Which published text the dates were read from. */
  datesFrom?: string;
  eventUrl?: string;
  venueUrl?: string;
}

export function readEvents(): ArchiveEvent[] {
  const { events } = JSON.parse(readFileSync(EVENTS_FILE, 'utf8')) as {
    events: ArchiveEvent[];
  };
  return events;
}
