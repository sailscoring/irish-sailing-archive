/**
 * `pnpm capture` — fetch every event listed in `sources/events.json`.
 *
 *   pnpm capture              # skip files already on disk
 *   pnpm capture --refresh    # re-fetch everything
 *
 * sailwave.com is a small public server, so this is single-threaded with a
 * delay between requests and is never parallelised. Existing files are reused
 * rather than re-fetched: published results are frozen once an event is over,
 * so `--refresh` matters only while one is still running.
 *
 * Files are written as received — bytes, not re-encoded. The captures are
 * verbatim third-party pages, kept for reproducibility; Sailwave publishes
 * ISO-8859-1, and re-encoding one here is how accented names get mangled
 * before anything downstream can notice.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { CAPTURE_DIR, readEvents } from './events';

const DELAY_MS = 750;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  const refresh = process.argv.slice(2).includes('--refresh');
  const events = readEvents();

  mkdirSync(CAPTURE_DIR, { recursive: true });
  console.log(`${events.length} event${events.length === 1 ? '' : 's'} listed`);

  let fetched = 0;
  for (const event of events) {
    // A transcribed event has no results page to fetch: its `file` is built
    // by `pnpm transcriptions` from a photograph already kept under sources/.
    if (event.transcribed) {
      console.log(`  ~ ${event.key} (transcribed, nothing to fetch)`);
      continue;
    }
    const path = join(CAPTURE_DIR, event.file);
    if (!refresh && existsSync(path)) {
      console.log(`  = ${event.file}`);
      continue;
    }
    const res = await fetch(event.url);
    if (!res.ok) {
      console.warn(`  ! ${res.status} ${event.url}`);
      continue;
    }
    writeFileSync(path, Buffer.from(await res.arrayBuffer()));
    fetched++;
    console.log(`  + ${event.file}`);
    await sleep(DELAY_MS);
  }

  console.log(`${fetched} fetched\n\nNext: pnpm emit-as-published`);
}

void main();
