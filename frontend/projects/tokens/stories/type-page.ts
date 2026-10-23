import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DOC_STYLES } from './doc-styles';
import { valueOf } from './token-data';

interface Role {
  role: string;
  sample: string;
  usage: string;
}

const ROLES: readonly Role[] = [
  {
    role: 'display',
    sample: 'Good morning, Ama',
    usage: 'The Home greeting. Used once in the whole app.',
  },
  { role: 'title', sample: 'Kwame Asante', usage: 'Page titles and the name on a profile (h1).' },
  { role: 'headline', sample: 'Needs your attention', usage: 'Section, card and dialog titles.' },
  {
    role: 'body',
    sample: 'Approving sends Kwame a link to set a new password.',
    usage: 'Running text, descriptions, table cells.',
  },
  {
    role: 'body-strong',
    sample: 'Senior Backend Engineer',
    usage: 'Names and values inside body text, description-list values.',
  },
  { role: 'label', sample: 'Save changes', usage: 'Buttons, nav items, tabs, form labels.' },
  {
    role: 'caption',
    sample: 'Password reset · 2h ago',
    usage: 'Hints, meta lines, timestamps, table headers.',
  },
  {
    role: 'mono',
    sample: 'GH-ACC-0042 · 2023-03-14',
    usage: 'Employee numbers, codes, dates, counts.',
  },
];

/** The type roles, rendered with the --ems-type-* tokens (generated values). */
@Component({
  selector: 'ems-type-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    DOC_STYLES,
    `
      .rows {
        display: grid;
      }
      .row {
        display: grid;
        grid-template-columns: minmax(10rem, 14rem) minmax(0, 1fr);
        gap: var(--ems-space-2) var(--ems-space-6);
        align-items: baseline;
        padding-block: var(--ems-space-5);
        border-block-end: var(--ems-border-width-hairline) solid var(--ems-color-border-subtle);
      }
      .row:last-child {
        border-block-end: 0;
      }
      .meta {
        display: grid;
        gap: var(--ems-space-1);
      }
      .sample {
        min-inline-size: 0;
        overflow-wrap: anywhere;
      }
      .usage {
        grid-column: 2;
        color: var(--ems-color-text-muted);
        font-size: var(--ems-type-caption-size);
      }
      @media (max-width: 40rem) {
        .row {
          grid-template-columns: minmax(0, 1fr);
        }
        .usage {
          grid-column: 1;
        }
      }
      .faces {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
        gap: var(--ems-space-4);
      }
      .face {
        padding: var(--ems-space-5);
      }
      .face p {
        color: var(--ems-color-text-secondary);
        margin-block-start: var(--ems-space-2);
      }
      .big {
        font-size: var(--ems-type-title-size);
        font-weight: var(--ems-type-title-weight);
        letter-spacing: var(--ems-type-title-letter-spacing);
        line-height: var(--ems-type-title-line-height);
      }
      .big-mono {
        font-family: var(--ems-font-family-mono);
        font-size: var(--ems-type-headline-size);
        font-variant-numeric: tabular-nums;
      }
    `,
  ],
  template: `
    <h1>Typography</h1>
    <p class="lead">
      Plus Jakarta Sans for everything, with real contrast in size and weight: 800 with tight
      tracking only for the greeting and page titles, 600 to 700 for titles and names, 400 to 500
      for UI and body. Geist Mono with tabular numerals for data. Sentence case throughout.
    </p>

    <div class="faces">
      <div class="card face">
        <span class="big">Aa Plus Jakarta Sans</span>
        <p>--ems-font-family-sans. Variable 200 to 800, self-hosted, latin + latin-ext.</p>
      </div>
      <div class="card face">
        <span class="big-mono">0123456789 GH-ACC</span>
        <p>--ems-font-family-mono. Geist Mono, tabular numerals so columns of numbers align.</p>
      </div>
    </div>

    <h2 id="roles">Roles</h2>
    <p>
      Use a role, never a raw size: --ems-type-&lt;role&gt;-{{
        '{'
      }}size,weight,line-height,letter-spacing{{ '}' }}, or the .ui-type-&lt;role&gt; utility class.
    </p>
    <div class="card">
      <div class="rows">
        @for (r of roles; track r.role) {
          <div class="row">
            <div class="meta">
              <span class="role">{{ r.role }}</span>
              <code>{{ spec(r.role) }}</code>
            </div>
            <span [class]="'sample ui-type-' + r.role">{{ r.sample }}</span>
            <span class="usage">{{ r.usage }}</span>
          </div>
        }
      </div>
    </div>
  `,
})
export class TypePage {
  protected readonly roles = ROLES;

  protected spec(role: string): string {
    const px = (rem: string): string => `${Math.round(parseFloat(rem) * 16)}px`;
    const size = px(valueOf(`type.${role}.size`));
    const weight = valueOf(`type.${role}.weight`);
    const lh = valueOf(`type.${role}.line-height`);
    const ls = valueOf(`type.${role}.letter-spacing`);
    return `${size} / ${weight} / ${lh}${ls.startsWith('-') ? ` / ${ls}` : ''}`;
  }
}
