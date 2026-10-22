import { ChangeDetectionStrategy, Component } from '@angular/core';
import contrastPairs from '../contrast-pairs.json';
import tokensJson from '../src/generated/tokens.json';

type Theme = 'light' | 'dark';

interface ThemedValue {
  value: string | number;
  hex?: string;
  ref: string | null;
}

interface TokenEntry {
  cssVar: string;
  type: string;
  tier: 'primitive' | 'semantic' | 'component';
  description?: string;
  value?: string | number;
  hex?: string;
  light?: ThemedValue;
  dark?: ThemedValue;
}

interface ContrastPair {
  fg: string;
  bg: string;
  kind: 'text' | 'large-text' | 'ui';
}

const MINIMUM: Record<ContrastPair['kind'], number> = { text: 4.5, 'large-text': 3, ui: 3 };
const tokens = tokensJson.tokens as Record<string, TokenEntry>;
const entries = Object.entries(tokens).map(([name, token]) => ({ name, ...token }));

function hexOf(name: string, theme: Theme): string {
  const token = tokens[name];
  const hex = token.tier === 'primitive' ? token.hex : token[theme]?.hex;
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

/**
 * Generated token gallery: everything is read from tokens.json (built by Style Dictionary) and
 * contrast-pairs.json, so it cannot drift from the shipped tokens.
 */
@Component({
  selector: 'ems-token-gallery',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      color: var(--ems-color-text-default);
      font-family: var(--ems-text-body-family);
      max-inline-size: 72rem;
    }
    h2 {
      font-size: var(--ems-font-size-xl);
      margin-block: var(--ems-space-8) var(--ems-space-3);
    }
    p {
      color: var(--ems-color-text-muted);
      margin-block-end: var(--ems-space-4);
    }
    table {
      border-collapse: collapse;
      inline-size: 100%;
      font-size: var(--ems-font-size-sm);
    }
    th,
    td {
      text-align: start;
      padding: var(--ems-space-2) var(--ems-space-3);
      border-block-end: 1px solid var(--ems-color-border-default);
      vertical-align: middle;
    }
    code {
      font-family: var(--ems-text-code-family);
      font-size: var(--ems-font-size-xs);
    }
    .swatch {
      display: inline-block;
      inline-size: 2.5rem;
      block-size: 1.5rem;
      border-radius: var(--ems-radius-sm);
      border: 1px solid var(--ems-color-border-strong);
      vertical-align: middle;
    }
    .pair {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-inline-size: 3rem;
      padding: var(--ems-space-1) var(--ems-space-2);
      border-radius: var(--ems-radius-sm);
      border: 1px solid var(--ems-color-border-strong);
    }
    .pair-fg {
      inline-size: 1.5rem;
      block-size: 0.5rem;
      border-radius: var(--ems-radius-full);
    }
    .fail {
      color: var(--ems-color-status-danger-text);
      font-weight: var(--ems-font-weight-semibold);
    }
    .ramp {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ems-space-2);
      margin-block-end: var(--ems-space-4);
    }
    .ramp figure {
      margin: 0;
      display: grid;
      gap: var(--ems-space-1);
      justify-items: center;
      font-size: var(--ems-font-size-xs);
    }
    .bar {
      block-size: 1rem;
      background: var(--ems-color-accent-bg);
      border-radius: var(--ems-radius-sm);
    }
    .radius {
      inline-size: 4rem;
      block-size: 4rem;
      background: var(--ems-color-bg-subtle);
      border: 1px solid var(--ems-color-border-strong);
    }
  `,
  template: `
    <h2 id="contrast">Contrast pairs (WCAG 2.x)</h2>
    <p>
      Every declared pair in both themes. Minimum 4.5:1 for text, 3:1 for large text and UI
      (borders, focus rings). The same pairs gate CI (npm run tokens:check-contrast).
    </p>
    <table aria-describedby="contrast">
      <thead>
        <tr>
          <th scope="col">Foreground</th>
          <th scope="col">Background</th>
          <th scope="col">Kind</th>
          <th scope="col">Light</th>
          <th scope="col">Dark</th>
        </tr>
      </thead>
      <tbody>
        @for (pair of pairs; track $index) {
          <tr>
            <td>
              <code>{{ pair.fg }}</code>
            </td>
            <td>
              <code>{{ pair.bg }}</code>
            </td>
            <td>{{ pair.kind }} (≥ {{ pair.min }}:1)</td>
            @for (result of pair.results; track result.theme) {
              <td>
                <span class="pair" [style.background-color]="result.bgHex" aria-hidden="true">
                  <span class="pair-fg" [style.background-color]="result.fgHex"></span>
                </span>
                <span [class.fail]="!result.pass">
                  {{ result.ratio }}:1 {{ result.pass ? 'pass' : 'FAIL' }}</span
                >
              </td>
            }
          </tr>
        }
      </tbody>
    </table>

    <h2 id="semantic">Semantic and component colours</h2>
    <p>Light and dark values with the token each one references.</p>
    <table aria-describedby="semantic">
      <thead>
        <tr>
          <th scope="col">Token</th>
          <th scope="col">Light</th>
          <th scope="col">Dark</th>
        </tr>
      </thead>
      <tbody>
        @for (token of themedColors; track token.name) {
          <tr>
            <td>
              <code>{{ token.cssVar }}</code>
            </td>
            @for (theme of themes; track theme) {
              <td>
                <span class="swatch" [style.background-color]="token[theme]?.hex"></span>
                <code>{{ token[theme]?.ref ?? token[theme]?.value }} {{ token[theme]?.hex }}</code>
              </td>
            }
          </tr>
        }
      </tbody>
    </table>

    <h2>Primitive colour ramps (OKLCH)</h2>
    @for (ramp of ramps; track ramp.name) {
      <h3>{{ ramp.name }}</h3>
      <div class="ramp">
        @for (step of ramp.steps; track step.name) {
          <figure>
            <span class="swatch" [style.background-color]="step.value"></span>
            <figcaption>{{ step.label }}</figcaption>
          </figure>
        }
      </div>
    }

    <h2 id="spacing">Spacing</h2>
    <table aria-describedby="spacing">
      <tbody>
        @for (token of spacing; track token.name) {
          <tr>
            <th scope="row">
              <code>{{ token.cssVar }}</code>
            </th>
            <td>{{ token.value }}</td>
            <td><div class="bar" [style.inline-size]="token.value"></div></td>
          </tr>
        }
      </tbody>
    </table>

    <h2 id="radius">Radius</h2>
    <div class="ramp">
      @for (token of radii; track token.name) {
        <figure>
          <div class="radius" [style.border-radius]="token.value"></div>
          <figcaption>
            <code>{{ token.name }}</code> {{ token.value }}
          </figcaption>
        </figure>
      }
    </div>

    <h2 id="type">Type scale</h2>
    <table aria-describedby="type">
      <tbody>
        @for (token of fontSizes; track token.name) {
          <tr>
            <th scope="row">
              <code>{{ token.cssVar }}</code> {{ token.value }}
            </th>
            <td [style.font-size]="token.value">Employee directory</td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class TokenGallery {
  protected readonly themes: Theme[] = ['light', 'dark'];

  protected readonly pairs = (contrastPairs.pairs as ContrastPair[]).map((pair) => ({
    ...pair,
    min: MINIMUM[pair.kind],
    results: this.themes.map((theme) => {
      const fgHex = hexOf(pair.fg, theme);
      const bgHex = hexOf(pair.bg, theme);
      const ratio = contrastRatio(fgHex, bgHex);
      return { theme, fgHex, bgHex, ratio: ratio.toFixed(2), pass: ratio >= MINIMUM[pair.kind] };
    }),
  }));

  protected readonly themedColors = entries.filter(
    (t) => t.type === 'color' && t.tier !== 'primitive',
  );

  private readonly primitiveColors = entries.filter(
    (t) => t.type === 'color' && t.tier === 'primitive',
  );

  protected readonly ramps = [
    ...new Set(this.primitiveColors.map((t) => t.name.split('.')[1])),
  ].map((name) => ({
    name,
    steps: this.primitiveColors
      .filter((t) => t.name.split('.')[1] === name)
      .map((t) => ({ name: t.name, value: String(t.value), label: t.name.split('.')[2] })),
  }));

  protected readonly spacing = entries.filter((t) => t.name.startsWith('space.'));
  protected readonly radii = entries.filter((t) => t.name.startsWith('radius.'));
  protected readonly fontSizes = entries.filter((t) => t.name.startsWith('font.size.'));
}
