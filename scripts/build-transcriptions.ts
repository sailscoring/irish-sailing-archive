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
  source: { image: string; imageUrl: string; article: string; articleTitle: string; publisher: string };
  title: string;
  venue: string;
  sectionTitle: string;
  caption: string;
  leadColumns: Array<{ key: string; label: string }>;
  raceHeaders: string[];
  rows: string[][];
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
): string[] {
  // Name the sailor, not the cell: a row identified by one of its own scores
  // is the least useful thing to be told when a sum fails.
  const who = row[nameAt] || row[0];
  const races = row.slice(1 + leadCount, 1 + leadCount + raceCount);
  const total = scoreOf(row[1 + leadCount + raceCount]);
  const nett = scoreOf(row[2 + leadCount + raceCount]);
  const problems: string[] = [];

  const sum = races.reduce((n, c) => n + scoreOf(c), 0);
  if (Math.abs(sum - total) > 0.001) {
    problems.push(`${who}: race cells sum to ${sum}, published Total is ${total}`);
  }
  const discards = races.filter(isDiscard);
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
    'rank',
    ...leadKeys,
    ...t.raceHeaders.map(() => 'race'),
    'total',
    'nett',
  ];
  const headers = [
    'Rank',
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
  ${escapeHtml(basename(DIR))}/, which is a hand reading of a photograph
  published by ${escapeHtml(t.source.publisher)}:
    ${escapeHtml(t.source.article)}
  The image itself is kept verbatim at ${escapeHtml(t.source.image)}.
  Every row below was checked against its own published Total and Nett
  before this file was written. Do not edit it by hand; edit the JSON.
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

  for (const file of files) {
    const t = JSON.parse(readFileSync(join(DIR, file), 'utf8')) as Transcription;
    const leadCount = t.leadColumns.length;
    const raceCount = t.raceHeaders.length;
    const width = 1 + leadCount + raceCount + 2;
    // The rank cell is column 0, so a lead column sits one to the right of its
    // own index. Falls back to the rank when no column names a helm.
    const helmIndex = t.leadColumns.findIndex((c) => c.key === 'helmname');
    const nameAt = helmIndex >= 0 ? helmIndex + 1 : 0;

    t.rows.forEach((row, i) => {
      if (row.length !== width) {
        problems.push(`${file} row ${i + 1}: ${row.length} cells, expected ${width}`);
        return;
      }
      problems.push(
        ...checkRow(row, raceCount, leadCount, nameAt).map((p) => `${file}: ${p}`),
      );
      checked++;
    });

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
      `  ${checked} rows reconcile against their published Total and Nett`,
  );
}

main();
