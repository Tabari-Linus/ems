import contrastPairs from '../contrast-pairs.json';
import tokensJson from '../src/generated/tokens.json';

/** Data helpers shared by the Foundations stories. Everything is read from the built tokens. */

export type Theme = 'light' | 'dark';
export const THEMES: readonly Theme[] = ['light', 'dark'];

interface ThemedValue {
  value: string | number;
  hex?: string;
  ref: string | null;
}

export interface TokenEntry {
  name: string;
  cssVar: string;
  type: string;
  tier: 'primitive' | 'foundation' | 'semantic' | 'component';
  description?: string;
  value?: string | number;
  hex?: string;
  light?: ThemedValue;
  dark?: ThemedValue;
}

export type PairKind = 'text' | 'large-text' | 'ui';
interface ContrastPair {
  fg: string;
  bg: string;
  kind: PairKind;
}

export const MINIMUM: Record<PairKind, number> = { text: 4.5, 'large-text': 3, ui: 3 };

const raw = tokensJson.tokens as Record<string, Omit<TokenEntry, 'name'>>;
export const ALL_TOKENS: readonly TokenEntry[] = Object.entries(raw).map(([name, token]) => ({
  name,
  ...token,
}));

export function token(name: string): TokenEntry {
  const entry = raw[name];
  if (!entry) throw new Error(`Unknown token ${name}`);
  return { name, ...entry };
}

export function tokensUnder(prefix: string): TokenEntry[] {
  return ALL_TOKENS.filter((t) => t.name.startsWith(prefix));
}

/** Resolved value in a theme (themeless tiers return their single value). */
export function valueOf(name: string, theme: Theme = 'light'): string {
  const t = token(name);
  return String(t.value ?? t[theme]?.value ?? '');
}

export function hexOf(name: string, theme: Theme): string {
  const t = token(name);
  const hex = t.hex ?? t[theme]?.hex;
  if (!hex) throw new Error(`No hex value for ${name}`);
  return hex;
}

/** WCAG 2.x relative luminance of an sRGB hex colour. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export interface PairResult {
  theme: Theme;
  fgHex: string;
  bgHex: string;
  ratio: string;
  pass: boolean;
}

export interface CheckedPair extends ContrastPair {
  min: number;
  results: PairResult[];
}

/** Every declared contrast pair, measured in both themes (same data as the CI gate). */
export const CHECKED_PAIRS: readonly CheckedPair[] = (contrastPairs.pairs as ContrastPair[]).map(
  (pair) => ({
    ...pair,
    min: MINIMUM[pair.kind],
    results: THEMES.map((theme) => {
      const fgHex = hexOf(pair.fg, theme);
      const bgHex = hexOf(pair.bg, theme);
      const ratio = contrastRatio(fgHex, bgHex);
      return { theme, fgHex, bgHex, ratio: ratio.toFixed(2), pass: ratio >= MINIMUM[pair.kind] };
    }),
  }),
);
