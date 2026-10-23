import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DOC_STYLES } from './doc-styles';
import { ALL_TOKENS, THEMES, type TokenEntry } from './token-data';

const TIERS: readonly { tier: TokenEntry['tier']; title: string; note: string }[] = [
  {
    tier: 'semantic',
    title: 'Semantic',
    note: 'Roles that switch with the theme. Components use these.',
  },
  {
    tier: 'component',
    title: 'Component',
    note: 'Per-component decisions referencing semantic tokens.',
  },
  {
    tier: 'foundation',
    title: 'Foundation',
    note: 'Theme-independent scales components may use: space, radius, border width, motion, layers, font families.',
  },
  {
    tier: 'primitive',
    title: 'Primitive',
    note: 'Raw ramps and literal shadows for the token build only. Never referenced by components.',
  },
];

/**
 * Generated token reference: every token with its CSS variable and resolved value(s), read from
 * tokens.json (built by Style Dictionary), so it cannot drift from the shipped tokens.
 */
@Component({
  selector: 'ems-token-gallery',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    DOC_STYLES,
    `
      td code {
        overflow-wrap: anywhere;
      }
    `,
  ],
  template: `
    <h1>Token reference</h1>
    <p class="lead">
      All {{ total }} tokens. Names are fixed by docs/design/token-contract.md; values come from the
      DTCG sources in projects/tokens/tokens.
    </p>
    @for (group of groups; track group.tier) {
      <h2 [id]="'tier-' + group.tier">{{ group.title }} ({{ group.tokens.length }})</h2>
      <p>{{ group.note }}</p>
      <div class="card">
        <table [attr.aria-labelledby]="'tier-' + group.tier">
          <thead>
            <tr>
              <th scope="col">Variable</th>
              @if (group.themed) {
                @for (theme of themes; track theme) {
                  <th scope="col">{{ theme === 'light' ? 'Light' : 'Dark' }}</th>
                }
              } @else {
                <th scope="col">Value</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (t of group.tokens; track t.name) {
              <tr>
                <th scope="row">
                  <code>{{ t.cssVar }}</code>
                </th>
                @if (group.themed) {
                  @for (theme of themes; track theme) {
                    <td>
                      @if (t.type === 'color') {
                        <span class="swatch" [style.background-color]="t[theme]?.hex"></span>
                      }
                      <code>{{ t[theme]?.ref ?? t[theme]?.value }}</code>
                    </td>
                  }
                } @else {
                  <td>
                    @if (t.type === 'color') {
                      <span class="swatch" [style.background-color]="t.hex"></span>
                    }
                    <code>{{ t.value }}</code>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class TokenGallery {
  protected readonly themes = THEMES;
  protected readonly total = ALL_TOKENS.length;
  protected readonly groups = TIERS.map((g) => ({
    ...g,
    themed: g.tier === 'semantic' || g.tier === 'component',
    tokens: ALL_TOKENS.filter((t) => t.tier === g.tier),
  }));
}
