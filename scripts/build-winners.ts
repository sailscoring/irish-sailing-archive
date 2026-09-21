/**
 * `pnpm winners` — render `WINNERS.md` from `winners.json`.
 *
 * The All-Ireland roll of honour is the one thing in this repo with no route
 * to a results page: it is a list of names against years, not a scored
 * series, so there is nothing for the as-published pipeline to ingest. It is
 * kept here anyway, because it is the only consolidated copy of 75 years of
 * Irish sailing's oldest championship and the page it came from is gone from
 * the live site.
 *
 * Markdown, so GitHub renders it and anyone can read it without tooling;
 * generated, so the JSON stays the thing that is edited.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const IN = 'winners.json';
const OUT = 'WINNERS.md';

interface Winners {
  source: {
    url: string;
    wayback: string;
    snapshot: string;
    capture: string;
    publisher: string;
  };
  winners: Array<{
    year: number;
    senior: string | null;
    junior: string | null;
    juniorFirstGirl: string | null;
  }>;
}

const cell = (v: string | null) => (v ?? '').trim() || '—';

function main(): void {
  const doc = JSON.parse(readFileSync(IN, 'utf8')) as Winners;
  const rows = [...doc.winners].sort((a, b) => b.year - a.year);
  const first = rows[rows.length - 1].year;
  const last = rows[0].year;

  const named = rows.filter((r) => r.senior && r.senior !== 'no event').length;
  const juniors = rows.filter((r) => r.junior && r.junior !== 'no event').length;

  const body = rows
    .map(
      (r) =>
        `| ${r.year} | ${cell(r.senior)} | ${cell(r.junior)} | ${cell(r.juniorFirstGirl)} |`,
    )
    .join('\n');

  writeFileSync(
    OUT,
    `# All-Ireland Champions, ${first}–${last}

Ireland's oldest sailing championship: one helm from each class, sailed in
supplied boats, to decide a champion of champions. It has been known as the
All-Ireland Sailing Championships and as the **Helmsman's Cup**, and is now
the Irish Sailing Champions' Cup — see [RESEARCH.md](RESEARCH.md) on the
naming.

${rows.length} years, ${named} senior champions and ${juniors} junior champions.

> Published by ${doc.source.publisher} at
> [\`${new URL(doc.source.url).pathname}\`](${doc.source.url}), a page since
> removed from the live site. Taken from the Internet Archive's
> [${doc.source.snapshot} snapshot](${doc.source.wayback}), captured verbatim
> at [\`${doc.source.capture}\`](${doc.source.capture}).
>
> **Generated from [\`winners.json\`](winners.json) by \`pnpm winners\` — do
> not edit this file.** Cells are verbatim, including \`no event\` and
> \`no longer presented\`; an em dash means the published table said nothing
> there.

| Year | Senior | Junior | Junior First Girl |
|---:|---|---|---|
${body}
`,
  );

  console.log(`${rows.length} years (${first}–${last}) -> ${OUT}`);
}

main();
