// WCAG 2.x contrast gate for @ems/tokens.
//
// Reads the built tokens (src/generated/tokens.json, so run `npm run tokens:build` first) and the
// declared pairs in contrast-pairs.json, resolves both colours in the light and the dark theme,
// gamut-maps the OKLCH values to sRGB the way browsers do (CSS Color 4), and computes the WCAG 2.x
// contrast ratio with culori. Exits 1 if any pair is below its minimum:
//   text       4.5:1  (WCAG 1.4.3)
//   large-text 3:1    (WCAG 1.4.3, >= 24px or >= 18.66px bold)
//   ui         3:1    (WCAG 1.4.11: control borders, focus rings, icons)
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatHex, parse, toGamut, wcagContrast } from 'culori';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MINIMUM = { text: 4.5, 'large-text': 3, ui: 3 };
const THEMES = ['light', 'dark'];
const toSrgb = toGamut('rgb', 'oklch');

const { tokens } = JSON.parse(await readFile(join(root, 'src/generated/tokens.json'), 'utf8'));
const { pairs } = JSON.parse(await readFile(join(root, 'contrast-pairs.json'), 'utf8'));

function colorOf(name, theme) {
  const token = tokens[name];
  if (!token) throw new Error(`contrast-pairs.json: unknown token "${name}"`);
  if (token.type !== 'color') throw new Error(`contrast-pairs.json: "${name}" is not a colour`);
  const value = token.tier === 'primitive' ? token.value : token[theme].value;
  const parsed = parse(String(value));
  if (!parsed) throw new Error(`Cannot parse colour ${value} of "${name}"`);
  return toSrgb(parsed);
}

const rows = [];
for (const theme of THEMES) {
  for (const { fg, bg, kind } of pairs) {
    const min = MINIMUM[kind];
    if (min === undefined) throw new Error(`contrast-pairs.json: unknown kind "${kind}"`);
    const fgColor = colorOf(fg, theme);
    const bgColor = colorOf(bg, theme);
    const ratio = wcagContrast(fgColor, bgColor);
    rows.push({
      theme,
      fg,
      bg,
      kind,
      fgHex: formatHex(fgColor),
      bgHex: formatHex(bgColor),
      ratio,
      min,
      pass: ratio >= min,
    });
  }
}

const header = ['theme', 'foreground', 'background', 'kind', 'ratio', 'min', 'result'];
const table = rows.map((r) => [
  r.theme,
  `${r.fg} ${r.fgHex}`,
  `${r.bg} ${r.bgHex}`,
  r.kind,
  `${r.ratio.toFixed(2)}:1`,
  `${r.min}:1`,
  r.pass ? 'pass' : 'FAIL',
]);
const widths = header.map((h, i) => Math.max(h.length, ...table.map((row) => row[i].length)));
const line = (cells) => `| ${cells.map((c, i) => c.padEnd(widths[i])).join(' | ')} |`;
console.log(line(header));
console.log(`|${widths.map((w) => '-'.repeat(w + 2)).join('|')}|`);
for (const row of table) console.log(line(row));

const failures = rows.filter((r) => !r.pass);
const lowest = rows.reduce((a, b) => (b.ratio < a.ratio ? b : a));
console.log(
  `\n${rows.length} checks (${pairs.length} pairs x ${THEMES.length} themes), ${failures.length} failing; lowest ${lowest.ratio.toFixed(2)}:1 (${lowest.theme} ${lowest.fg} on ${lowest.bg}).`,
);
if (failures.length > 0) {
  console.error('Contrast gate FAILED.');
  process.exit(1);
}
