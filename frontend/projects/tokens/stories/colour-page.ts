import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DOC_STYLES } from './doc-styles';
import {
  CHECKED_PAIRS,
  hexOf,
  THEMES,
  tokensUnder,
  type Theme,
  type TokenEntry,
} from './token-data';

interface Group {
  id: string;
  title: string;
  usage: string;
  tokens: TokenEntry[];
}

const GROUPS: readonly Omit<Group, 'tokens'>[] = [
  {
    id: 'color.bg.',
    title: 'Surfaces',
    usage:
      'A faint indigo canvas, white cards on top. Separate cards with elevation.card, not borders. In dark, raised layers get lighter.',
  },
  {
    id: 'color.text.',
    title: 'Text',
    usage:
      'primary for content, secondary for supporting lines, muted for meta and hints. All three pass 4.5:1 on every surface.',
  },
  {
    id: 'color.border.',
    title: 'Borders',
    usage:
      'subtle divides rows (decorative). default outlines controls and passes 3:1. focus is the ring colour.',
  },
  {
    id: 'color.accent.',
    title: 'Accent (indigo)',
    usage:
      'solid marks the one primary action and the current nav item. soft is the quiet selected state: tabs, filters, secondary buttons, counts.',
  },
  {
    id: 'color.status.',
    title: 'Status',
    usage:
      'Alerts, toasts and validation. Pair the colour with an icon and words; never colour alone.',
  },
];

const EMPLOYEE_STATUSES = ['active', 'pending', 'inactive', 'archived'] as const;
const AVATARS = [
  { n: 1, initials: 'KA', dept: 'Platform Engineering' },
  { n: 2, initials: 'EB', dept: 'Design' },
  { n: 3, initials: 'KO', dept: 'Analytics' },
  { n: 4, initials: 'AD', dept: 'People Operations' },
  { n: 5, initials: 'YA', dept: 'Quality Engineering' },
  { n: 6, initials: 'NA', dept: 'Finance' },
];

/** Generated from tokens.json and contrast-pairs.json: every colour role in both themes. */
@Component({
  selector: 'ems-colour-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    DOC_STYLES,
    `
      .pill {
        display: inline-flex;
        align-items: center;
        gap: var(--ems-space-2);
        block-size: 1.5rem;
        padding-inline: var(--ems-space-2) var(--ems-space-3);
        border-radius: var(--ems-radius-pill);
        font-size: var(--ems-type-caption-size);
        font-weight: var(--ems-type-label-weight);
      }
      .dot {
        inline-size: 0.5rem;
        block-size: 0.5rem;
        border-radius: var(--ems-radius-pill);
        background: currentColor;
      }
      .avatar {
        display: inline-grid;
        place-items: center;
        inline-size: 2.5rem;
        block-size: 2.5rem;
        border-radius: var(--ems-radius-pill);
        font-weight: var(--ems-type-headline-weight);
        font-size: var(--ems-type-label-size);
      }
      .sample {
        display: inline-grid;
        place-items: center;
        min-inline-size: 2.75rem;
        block-size: 1.75rem;
        border-radius: var(--ems-radius-sm);
        font-weight: var(--ems-type-label-weight);
        margin-inline-end: var(--ems-space-2);
        vertical-align: middle;
      }
      .bar {
        inline-size: 1.5rem;
        block-size: 0.375rem;
        border-radius: var(--ems-radius-pill);
      }
      .fail {
        color: var(--ems-color-status-danger-text);
        font-weight: var(--ems-type-label-weight);
      }
      .theme-pair {
        display: flex;
        gap: var(--ems-space-3);
        flex-wrap: wrap;
      }
      .theme-pair > div {
        display: flex;
        gap: var(--ems-space-2);
        flex-wrap: wrap;
        align-items: center;
        padding: var(--ems-space-3);
        border-radius: var(--ems-radius-lg);
      }
    `,
  ],
  template: `
    <h1>Colour</h1>
    <p class="lead">
      One hue, indigo 272°, runs through every neutral. Light is the default; dark is designed from
      layered indigo-slate surfaces with a lifted accent, not inverted. Swatches show both themes at
      once whatever the toolbar says.
    </p>

    @for (group of groups; track group.id) {
      <h2 [id]="group.id">{{ group.title }}</h2>
      <p>{{ group.usage }}</p>
      <div class="card">
        <table [attr.aria-labelledby]="group.id">
          <thead>
            <tr>
              <th scope="col">Token</th>
              <th scope="col">Light</th>
              <th scope="col">Dark</th>
              <th scope="col">Use</th>
            </tr>
          </thead>
          <tbody>
            @for (t of group.tokens; track t.name) {
              <tr>
                <th scope="row">
                  <code>{{ t.cssVar }}</code>
                </th>
                @for (theme of themes; track theme) {
                  <td>
                    <span class="swatch" [style.background-color]="t[theme]?.hex"></span>
                    <code>{{ t[theme]?.hex }}</code>
                  </td>
                }
                <td class="muted">{{ t.description }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <h2 id="employee-status">Employee status</h2>
    <p>
      --ems-color-employee-status-{{ '{' }}active,pending,inactive,archived{{ '}' }}-{{
        '{'
      }}bg,text{{ '}' }}. Always with a dot shape and the word, so status never depends on colour.
    </p>
    <div class="card">
      <div class="theme-pair">
        @for (theme of themes; track theme) {
          <div
            [style.background-color]="hex('color.bg.surface', theme)"
            [attr.aria-label]="theme + ' theme'"
            role="group"
          >
            @for (s of statuses; track s) {
              <span
                class="pill"
                [style.background-color]="hex('color.employee-status.' + s + '.bg', theme)"
                [style.color]="hex('color.employee-status.' + s + '.text', theme)"
                ><span class="dot" aria-hidden="true"></span>{{ label(s) }}</span
              >
            }
          </div>
        }
      </div>
    </div>

    <h2 id="avatars">Avatar tints</h2>
    <p>
      --ems-color-avatar-{{ '{' }}1..6{{ '}' }}-{{ '{' }}bg,text{{ '}' }}: department pastels. The
      only place department colour appears.
    </p>
    <div class="card">
      <div class="theme-pair">
        @for (theme of themes; track theme) {
          <div
            [style.background-color]="hex('color.bg.surface', theme)"
            [attr.aria-label]="theme + ' theme'"
            role="group"
          >
            @for (a of avatars; track a.n) {
              <span
                class="avatar"
                [title]="'avatar.' + a.n + ' · ' + a.dept"
                [style.background-color]="hex('color.avatar.' + a.n + '.bg', theme)"
                [style.color]="hex('color.avatar.' + a.n + '.text', theme)"
                >{{ a.initials }}</span
              >
            }
          </div>
        }
      </div>
    </div>

    <h2 id="contrast">Contrast pairs</h2>
    <p>
      Every declared pair in both themes, measured from the built tokens: 4.5:1 for text, 3:1 for
      control boundaries and focus rings. The same list gates CI (npm run tokens:check-contrast).
    </p>
    <div class="card">
      <table aria-labelledby="contrast">
        <thead>
          <tr>
            <th scope="col">Foreground</th>
            <th scope="col">Background</th>
            <th scope="col">Minimum</th>
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
              <td class="muted">{{ pair.min }}:1 {{ pair.kind }}</td>
              @for (r of pair.results; track r.theme) {
                <td>
                  @if (pair.kind === 'ui') {
                    <span class="sample" [style.background-color]="r.bgHex" aria-hidden="true">
                      <span class="bar" [style.background-color]="r.fgHex"></span>
                    </span>
                  } @else {
                    <span
                      class="sample"
                      [style.background-color]="r.bgHex"
                      [style.color]="r.fgHex"
                      aria-hidden="true"
                      >Aa</span
                    >
                  }
                  <span [class.fail]="!r.pass">{{ r.ratio }}:1{{ r.pass ? '' : ' FAIL' }}</span>
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class ColourPage {
  protected readonly themes = THEMES;
  protected readonly groups: Group[] = GROUPS.map((g) => ({
    ...g,
    tokens: tokensUnder(g.id).filter((t) => t.type === 'color'),
  }));
  protected readonly statuses = EMPLOYEE_STATUSES;
  protected readonly avatars = AVATARS;
  protected readonly pairs = CHECKED_PAIRS;

  protected hex(name: string, theme: Theme): string {
    return hexOf(name, theme);
  }

  protected label(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
