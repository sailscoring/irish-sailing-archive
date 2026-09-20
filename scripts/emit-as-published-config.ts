/**
 * `pnpm emit-as-published` — emit `as-published.config.json` from the curated
 * event list and the captures (ADR-010, sailscoring#283). It is the input to
 * the app repo's `pnpm archive-generate`.
 *
 * One as-published series per event, one fleet per summary section on its
 * page. `sources/events.json` supplies only what the page cannot state for
 * itself — the season, the slug, the display name, the dates; the fleets, the
 * race tables and the venue are read off the capture through the app's
 * Sailwave parser, so the config can never disagree with what gets ingested.
 *
 * URLs: the season is the published slug and the event sits under it —
 * `/p/irishsailing/2025/junior-champions-cup`, with a further segment per
 * fleet where an event scored more than one. Slugs are data, minted once in
 * `events.json` and never derived at ingest; series ids are UUIDv5 over
 * `irish-sailing-archive/series/<key>`, so regeneration updates rows in place
 * and can never mint duplicates. **Never change an emitted key or slug** —
 * one re-mints the series id, the other orphans a public URL.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { decodeCapture } from '../../sailscoring/lib/archive-kit/capture-encoding';
import { seriesIdForKey } from '../../sailscoring/lib/archive-kit/ids';
import { parseSailwaveHtml } from '../../sailscoring/lib/archive-kit/sailwave-html';

import { CAPTURE_DIR, readEvents, type ArchiveEvent } from './events';

const OUT = 'as-published.config.json';
const REPO_KEY = 'irish-sailing-archive';

function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'fleet'
  );
}

/** The app's derived folder label (humanizeSlug): title-cased words. */
function humanizeSegment(segment: string): string {
  return segment
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface EmittedFleet {
  name: string;
  subPath: string;
  file: string;
  sectionTitle?: string;
  includeRaces?: boolean;
}

/** Sailwave puts the venue in the `<h2>`, under the event name. */
function venueOf(subtitle: string | null): string | undefined {
  const line = subtitle?.trim();
  return line && !/^https?:\/\//i.test(line) ? line : undefined;
}

function buildSeries(event: ArchiveEvent) {
  // A transcribed event's file is generated into the repo, not captured from
  // a publisher, so it is addressed from the repo root rather than the capture
  // directory.
  const path = event.transcribed ? event.file : join(CAPTURE_DIR, event.file);
  const { text } = decodeCapture(readFileSync(path));
  const page = parseSailwaveHtml(text);

  // The curated name is a display decision, but the `<h1>` is the evidence it
  // was made from. A re-capture that moves it means the scorer re-published
  // something different, and that is a review, not a silent re-emit.
  // A transcription's `<h1>` is our own text, so it proves nothing about a
  // publisher and the check does not apply; the arithmetic check in
  // `pnpm transcriptions` is what guards those rows instead.
  const title = page.title?.replace(/\s+/g, ' ').trim() ?? '';
  if (!event.transcribed && title !== event.title) {
    throw new Error(
      `${event.file}: the page's <h1> is now "${title}", but events.json ` +
        `records "${event.title}". Check what changed, then update ` +
        `events.json — see CLARIFICATIONS.md.`,
    );
  }
  if (page.summaries.length === 0) {
    throw new Error(`${event.file}: no summary sections — nothing to publish`);
  }

  const multi = page.summaries.length > 1;
  const fleets: EmittedFleet[] = page.summaries.map((summary) => {
    // Sailwave leaves a lone section untitled, or titles it "Overall"; on a
    // multi-fleet page the titles are the real class or division names.
    const name = summary.title?.trim() || 'Overall';
    return {
      name,
      subPath: multi ? `${event.slug}/${slug(name)}` : event.slug,
      file: event.transcribed ? event.file : `${CAPTURE_DIR}/${event.file}`,
      // Only disambiguate where there is something to disambiguate; a
      // single untitled section has no title to match on.
      ...(summary.title ? { sectionTitle: summary.title } : {}),
      // Carry the per-race detail tables where the page publishes them.
      ...(page.races.length > 0 ? { includeRaces: true } : {}),
    };
  });

  return {
    key: event.key,
    id: seriesIdForKey(REPO_KEY, event.key),
    publishedSlug: event.season,
    name: event.name,
    ...(venueOf(page.subtitle) ? { venue: venueOf(page.subtitle) } : {}),
    ...(event.startDate ? { startDate: event.startDate } : {}),
    ...(event.endDate ? { endDate: event.endDate } : {}),
    ...(event.eventUrl ? { eventUrl: event.eventUrl } : {}),
    ...(event.venueUrl ? { venueUrl: event.venueUrl } : {}),
    source: 'sailwave' as const,
    fleets,
    // A multi-fleet event's pages sit in an interior folder; pin its display
    // label where title-casing the segment would mangle it. A single-fleet
    // event is a root page and labels itself by its series name.
    ...(multi && humanizeSegment(event.slug) !== event.name
      ? { folders: [{ path: event.slug, label: event.name }] }
      : {}),
  };
}

function main(): void {
  const events = readEvents();

  const keys = new Set<string>();
  const paths = new Set<string>();
  for (const event of events) {
    if (keys.has(event.key)) throw new Error(`duplicate event key: ${event.key}`);
    keys.add(event.key);
    const path = `${event.season}/${event.slug}`;
    if (paths.has(path)) throw new Error(`duplicate published path: ${path}`);
    paths.add(path);
  }

  const series = events
    .slice()
    .sort((a, b) => a.season.localeCompare(b.season) || a.slug.localeCompare(b.slug))
    .map(buildSeries);

  writeFileSync(
    OUT,
    `${JSON.stringify(
      {
        version: 1,
        out: 'as-published',
        // The competitor-identity manifest (app #218), maintained by
        // `pnpm identities`. archive-generate copies it alongside the series
        // documents and the ingest applies it.
        identities: 'identities.json',
        series,
      },
      null,
      2,
    )}\n`,
  );

  const fleetCount = series.reduce((n, s) => n + s.fleets.length, 0);
  const seasons = [...new Set(series.map((s) => s.publishedSlug))].sort();
  console.log(
    `${series.length} series / ${fleetCount} fleet page${fleetCount === 1 ? '' : 's'} -> ${OUT}\n` +
      `  season${seasons.length === 1 ? '' : 's'} ${seasons.join(', ')}`,
  );
}

main();
