// `npm run ds:lint-css`: tokens-only gate for @ems/ui and @ems/icons component styles.
//
// Checks every component stylesheet (projects/ui/*/src/*.css) and every inline `styles:` block in
// component sources (projects/{ui,icons}/**/src/*.ts, specs and stories excluded) for:
//   - colour literals (hex, rgb(), hsl(), oklch(), named colours); forced-colors system colours
//     (Canvas, CanvasText, Highlight, ...) are allowed;
//   - lengths and durations written as literals (px, rem, em, pt, ms, s) instead of tokens;
//   - numeric z-index (use --ems-z-*), !important;
//   - @media widths other than the breakpoint tokens (MEDIA_QUERIES in @ems/tokens);
//   - --ems-* variables that do not exist, or that are primitives (components use foundation,
//     semantic and component tokens only).
//
// A line that genuinely needs a literal says why with `/* ds-lint-allow: <reason> */`, on the
// line itself or as a comment on the line above.
// Exit code 1 lists every finding as file:line.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontend = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const tokensJson = JSON.parse(
  readFileSync(join(frontend, 'projects/tokens/src/generated/tokens.json'), 'utf8'),
);

const tierByVar = new Map(Object.values(tokensJson.tokens).map((t) => [t.cssVar, t.tier]));
const breakpointQueries = Object.entries(tokensJson.tokens)
  .filter(([name]) => name.startsWith('breakpoint.'))
  .map(([, t]) => `(max-width: ${Number.parseFloat(t.value) - 0.02}px)`);

const NAMED_COLOURS =
  /\b(white|black|red|green|blue|gray|grey|silver|orange|yellow|purple|pink|navy|teal)\b/i;
const COLOUR_FN = /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;
const HEX = /#[0-9a-f]{3,8}\b/i;
// A number with a unit. Zero needs no token (0, 0px, 0s), so it is not reported.
const LITERAL_UNIT = /(?<![\w.-])-?(?!0*\.?0+(?:px|rem|em|pt|ms|s)\b)\d*\.?\d+(px|rem|em|pt|ms|s)\b/;
const ALLOWED_MEDIA = /^@media\s*\((prefers-reduced-motion|prefers-color-scheme|forced-colors)\b/;

/** Source files to lint, with the CSS text and the line it starts on. */
function* sources() {
  for (const pkg of ['ui', 'icons']) {
    const root = join(frontend, 'projects', pkg);
    for (const file of walk(root)) {
      const rel = relative(frontend, file).replaceAll('\\', '/');
      if (!/\/src\//.test(rel) || /\.(spec|stories)\.ts$/.test(rel)) continue;
      const text = readFileSync(file, 'utf8');
      if (rel.endsWith('.css')) {
        yield { rel, css: text, offset: 0 };
      } else if (rel.endsWith('.ts')) {
        // Inline component styles: styles: `...` (one template literal per component).
        for (const match of text.matchAll(/styles:\s*`([^`]*)`/g)) {
          const offset = text.slice(0, match.index).split('\n').length - 1;
          yield { rel, css: match[1], offset };
        }
      }
    }
  }
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (/\.(css|ts)$/.test(entry.name)) yield path;
  }
}

/** Replaces comments with spaces, keeping line numbers. */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));

const findings = [];
let files = 0;
for (const { rel, css, offset } of sources()) {
  files += 1;
  const lines = css.split('\n');
  const code = stripComments(css).split('\n');
  const report = (index, message) => {
    if (lines[index]?.includes('ds-lint-allow')) return;
    if (lines[index - 1]?.trim().startsWith('/* ds-lint-allow')) return;
    findings.push(`${rel}:${offset + index + 1}  ${message}\n    ${lines[index].trim()}`);
  };

  code.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('@media')) {
      if (ALLOWED_MEDIA.test(trimmed)) return;
      const query = trimmed.replace(/^@media\s*/, '').replace(/\s*\{$/, '');
      if (!breakpointQueries.includes(query)) {
        report(i, `media query is not a breakpoint token (${breakpointQueries.join(' | ')})`);
      }
      return;
    }
    if (trimmed.startsWith('@container')) {
      if (LITERAL_UNIT.test(trimmed)) report(i, 'literal length in a container query');
      return;
    }
    if (trimmed.startsWith('@')) return;

    // Only declaration values carry colours and lengths (selectors may contain anything).
    const declaration = trimmed.match(/^(--?[\w-]+|[a-z-]+)\s*:\s*(.*)$/);
    const value = declaration ? declaration[2] : /[{}]|,$/.test(trimmed) ? null : trimmed;
    if (value === null) return;
    const property = declaration?.[1] ?? '';

    if (/!important/.test(value)) report(i, '!important');
    if (HEX.test(value) || COLOUR_FN.test(value) || NAMED_COLOURS.test(value)) {
      report(i, 'raw colour: use a --ems-color-* token');
    }
    const unit = value.match(LITERAL_UNIT);
    if (unit) report(i, `literal ${unit[0]}: use a token (space, size, radius, duration, ...)`);
    if (property === 'z-index' && !/var\(--ems-z-/.test(value) && !/^(0|auto)\b/.test(value)) {
      report(i, 'numeric z-index: use --ems-z-*');
    }
    for (const [, name] of value.matchAll(/var\((--ems-[\w-]+)/g)) {
      const tier = tierByVar.get(name);
      if (!tier) report(i, `${name} is not a token (see docs/design/token-contract.md)`);
      else if (tier === 'primitive') report(i, `${name} is a primitive: use a semantic token`);
    }
  });
}

if (findings.length) {
  console.error(findings.join('\n'));
  console.error(`\nds:lint-css: ${findings.length} finding(s) in ${files} sources.`);
  process.exit(1);
}
console.log(`ds:lint-css: ${files} sources, 0 findings.`);
