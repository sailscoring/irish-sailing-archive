/**
 * `pnpm transcriptions` — turn a hand-read results table into the Sailwave
 * HTML shape the app's parser reads, so a result that was only ever published
 * as a *picture* can still be ingested.
 *
 * This exists for exactly one situation: Irish Sailing published no results
 * page for an event, and the only published form of the standings is a
 * photograph of the scorer's table in a news report. Transcribing is a last
 * resort — every other series here is a verbatim capture the app parses — so
 * the output is kept apart from `sources/` and never pretends otherwise.
 *
 * **The arithmetic is the check.** A standings table carries its own
 * checksum: each row's race cells must sum to its published Total, and Total
 * minus the discarded (parenthesised) cell must equal its published Nett. A
 * misread digit breaks both. Every row is verified before anything is
 * written, and a row that will not reconcile fails the build — a transcription
 * that cannot be proved right does not reach a results page.
 *
 * Do not "fix" a figure to make a sum work. If a row will not reconcile, the
 * reading is wrong or the source is; both are findings for CLARIFICATIONS.md.
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const DIR = 'transcriptions';

interface Transcription {
  source: {
    capture: string;
    url: string;
    publisher: string;
    /** How the figures got here: read by eye off an image, or extracted from
     *  the text of a captured page. Only the first can misread a digit. */
    reading: 'hand-read' | 'extracted';
  };
  title: string;
  venue: string;
  sectionTitle: string;
  caption: string;
  /** The published table had a rank column. When false, rows begin at the
   *  first lead column and the page publishes no places — which the app
   *  already understands (a section may legitimately rank nobody). */
  ranked: boolean;
  leadColumns: Array<{ key: string; label: string }>;
  raceHeaders: string[];
  rows: string[][];
  /** Rows whose own published figures contradict each other. Each must be
   *  declared with the numbers, so the check still catches a misreading while
   *  letting a *source* error through verbatim — which is the whole point of
   *  an as-published archive. */
  sourceDiscrepancies?: Array<{ row: string; published: string; note: string }>;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** The numeric score in a cell, ignoring a code suffix and the discard
 *  parentheses: "(16.0 DNF)" -> 16, "4.0" -> 4. */
function scoreOf(cell: string): number {
  const m = /-?\d+(?:\.\d+)?/.exec(cell);
  if (!m) throw new Error(`no score in cell "${cell}"`);
  return Number.parseFloat(m[0]);
}

const isDiscard = (cell: string) => cell.trim().startsWith('(');

/** Verify a row against its own published Total and Nett. Returns the
 *  problems, empty when the row reconciles. */
function checkRow(
  row: string[],
  raceCount: number,
  leadCount: number,
  nameAt: number,
  ranked: boolean,
): string[] {
  // Name the sailor, not the cell: a row identified by one of its own scores
  // is the least useful thing to be told when a sum fails.
  const who = row[nameAt] || row[0];
  const rank = ranked ? 1 : 0;
  const races = row.slice(rank + leadCount, rank + leadCount + raceCount);
  const total = scoreOf(row[rank + leadCount + raceCount]);
  const nett = scoreOf(row[rank + 1 + leadCount + raceCount]);
  const problems: string[] = [];

  // A cell can be blank where the boat did not sail that race at all and the
  // publisher left it empty rather than scoring it.
  const sum = races.filter((c) => c.trim()).reduce((n, c) => n + scoreOf(c), 0);
  if (Math.abs(sum - total) > 0.001) {
    problems.push(`${who}: race cells sum to ${sum}, published Total is ${total}`);
  }
  const discards = races.filter((c) => c.trim()).filter(isDiscard);
  if (discards.length > 1) {
    problems.push(`${who}: ${discards.length} cells are parenthesised; expected one discard`);
  }
  const dropped = discards.reduce((n, c) => n + scoreOf(c), 0);
  if (Math.abs(total - dropped - nett) > 0.001) {
    problems.push(
      `${who}: Total ${total} less discard ${dropped} is ${total - dropped}, published Nett is ${nett}`,
    );
  }
  return problems;
}

/** The Sailwave shape `lib/archive-kit/sailwave-html.ts` reads: an
 *  `<h3 class="summarytitle">`, a `<div class="caption">`, and a
 *  `<table class="summarytable">` whose colgroup classes name the columns. */
function render(t: Transcription): string {
  const leadKeys = t.leadColumns.map((c) => c.key);
  const cols = [
    ...(t.ranked ? ['rank'] : []),
    ...leadKeys,
    ...t.raceHeaders.map(() => 'race'),
    'total',
    'nett',
  ];
  const headers = [
    ...(t.ranked ? ['Rank'] : []),
    ...t.leadColumns.map((c) => c.label),
    ...t.raceHeaders,
    'Total',
    'Nett',
  ];
  const body = t.rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(t.title)}</title>
<!--
  GENERATED — NOT A CAPTURE. Built by \`pnpm transcriptions\` from
  ${escapeHtml(basename(DIR))}/, a ${escapeHtml(t.source.reading)} copy of a
  table published by ${escapeHtml(t.source.publisher)}:
    ${escapeHtml(t.source.url)}
  The source itself is kept verbatim at ${escapeHtml(t.source.capture)}.
  Every row below was checked against its own published Total and Nett before
  this file was written, except those the JSON declares as source
  discrepancies. Do not edit it by hand; edit the JSON.
-->
</head>
<body>
<h1>${escapeHtml(t.title)}</h1>
<h2>${escapeHtml(t.venue)}</h2>
<h3 class="summarytitle">${escapeHtml(t.sectionTitle)}</h3>
<div class="caption">${escapeHtml(t.caption)}</div>
<table class="summarytable">
<colgroup>${cols.map((c) => `<col class="${c}">`).join('')}</colgroup>
<thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
<tbody>
${body}
</tbody>
</table>
</body>
</html>
`;
}

function main(): void {
  const files = readdirSync(DIR).filter((f) => f.endsWith('.json')).sort();
  if (files.length === 0) {
    console.log('no transcriptions');
    return;
  }

  const problems: string[] = [];
  let written = 0;
  let checked = 0;
  let discrepancies = 0;

  for (const file of files) {
    const t = JSON.parse(readFileSync(join(DIR, file), 'utf8')) as Transcription;
    const leadCount = t.leadColumns.length;
    const raceCount = t.raceHeaders.length;
    // A rank cell, when the table has one, sits at column 0 and shifts every
    // lead column one to the right.
    const rankCols = t.ranked ? 1 : 0;
    const width = rankCols + leadCount + raceCount + 2;
    const helmIndex = t.leadColumns.findIndex((c) => c.key === 'helmname');
    const nameAt = helmIndex >= 0 ? helmIndex + rankCols : 0;

    // Declared source errors: a row here is published contradicting itself,
    // and is carried verbatim. Every one must be spent — a declaration for a
    // row that now reconciles means the reading changed under it, and is as
    // much a problem as an undeclared mismatch.
    const declared = new Map(
      (t.sourceDiscrepancies ?? []).map((d) => [d.row, d]),
    );
    const spent = new Set<string>();

    t.rows.forEach((row, i) => {
      if (row.length !== width) {
        problems.push(`${file} row ${i + 1}: ${row.length} cells, expected ${width}`);
        return;
      }
      const who = row[nameAt] || row[0];
      const found = checkRow(row, raceCount, leadCount, nameAt, t.ranked);
      const declaration = declared.get(who);
      if (found.length > 0 && declaration) {
        spent.add(who);
        // The declaration has to name the same arithmetic the check found, or
        // it is covering for something nobody looked at.
        for (const f of found) {
          if (!f.includes(declaration.published)) {
            problems.push(
              `${file}: ${who} is declared as "${declaration.published}", ` +
                `but the check says "${f}"`,
            );
          }
        }
      } else {
        problems.push(...found.map((p) => `${file}: ${p}`));
      }
      checked++;
    });

    for (const [who] of declared) {
      if (!spent.has(who)) {
        problems.push(
          `${file}: ${who} is declared a source discrepancy but reconciles — ` +
            `remove the declaration or check the reading`,
        );
      }
    }
    discrepancies += declared.size;

    if (problems.length === 0) {
      writeFileSync(join(DIR, file.replace(/\.json$/, '.html')), render(t));
      written++;
    }
  }

  if (problems.length > 0) {
    console.error(`${problems.length} problems — nothing written:`);
    for (const p of problems) console.error(`  ${p}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `${written} transcription${written === 1 ? '' : 's'} -> ${DIR}/*.html\n` +
      `  ${checked - discrepancies} of ${checked} rows reconcile against their ` +
      `published Total and Nett` +
      (discrepancies > 0
        ? `\n  ${discrepancies} carried verbatim as declared source discrepancies`
        : ''),
  );
}

main();
