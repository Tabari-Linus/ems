import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DOC_STYLES } from './doc-styles';
import { tokensUnder } from './token-data';

const ELEVATION_USE: Record<string, string> = {
  card: 'Cards and chips on the canvas',
  raised: 'Menus, popovers, the user menu',
  overlay: 'Dialogs and drawers',
  focus: 'Glow around a focused text field',
};

/** Spacing, radius, border width and elevation, rendered live (follows the theme toolbar). */
@Component({
  selector: 'ems-shape-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    DOC_STYLES,
    `
      .bar {
        block-size: var(--ems-space-2);
        border-radius: var(--ems-radius-pill);
        background: var(--ems-color-accent-solid);
      }
      .tiles {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ems-space-6);
        padding: var(--ems-space-6);
        border-radius: var(--ems-radius-xl);
        background: var(--ems-color-bg-canvas);
      }
      figure {
        margin: 0;
        display: grid;
        gap: var(--ems-space-2);
        justify-items: start;
        align-content: start;
      }
      figcaption {
        display: grid;
        font-size: var(--ems-type-caption-size);
        color: var(--ems-color-text-muted);
        max-inline-size: 11rem;
      }
      figcaption .role {
        font-size: var(--ems-type-label-size);
      }
      .radius {
        inline-size: 6rem;
        block-size: 4rem;
        background: var(--ems-color-accent-soft);
      }
      .elev {
        inline-size: 11rem;
        block-size: 6rem;
        border-radius: var(--ems-radius-xl);
        background: var(--ems-color-bg-surface);
      }
      .elev.raised,
      .elev.overlay {
        background: var(--ems-color-bg-raised);
      }
      .elev.focus {
        border-radius: var(--ems-radius-md);
        block-size: 2.625rem;
        outline: var(--ems-border-width-hairline) solid var(--ems-color-border-focus);
      }
    `,
  ],
  template: `
    <h1>Space and shape</h1>
    <p class="lead">
      Generous space, soft corners and shadow instead of lines. Cards are separated by elevation,
      controls are pills, inputs have a 10px corner.
    </p>

    <h2 id="space">Spacing</h2>
    <p>4-point scale: --ems-space-N is N × 4px. Pick from the scale; never in-between values.</p>
    <div class="card">
      <table aria-labelledby="space">
        <tbody>
          @for (t of space; track t.name) {
            <tr>
              <th scope="row">
                <code>{{ t.cssVar }}</code>
              </th>
              <td class="muted">{{ t.value }}</td>
              <td style="inline-size: 60%">
                <div class="bar" [style.inline-size]="t.value"></div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <h2 id="radius">Radius</h2>
    <p>Pill for anything you press or pick; xl for cards and dialogs; md for text fields.</p>
    <div class="tiles">
      @for (t of radii; track t.name) {
        <figure>
          <div class="radius" [style.border-radius]="'var(' + t.cssVar + ')'"></div>
          <figcaption>
            <span class="role">{{ t.name }} · {{ t.value }}</span>
            <span>{{ t.description }}</span>
          </figcaption>
        </figure>
      }
    </div>

    <h2 id="elevation">Elevation</h2>
    <p>
      Light: soft, layered, indigo-tinted shadows. Dark: depth comes from lighter surfaces
      (bg.raised) with a short shadow and a faint edge. Switch the toolbar theme to compare.
    </p>
    <div class="tiles">
      @for (t of elevation; track t.name) {
        <figure>
          <div
            class="elev"
            [class]="'elev ' + t.key"
            [style.box-shadow]="'var(' + t.cssVar + ')'"
          ></div>
          <figcaption>
            <span class="role">{{ t.name }}</span>
            <span>{{ t.use }}</span>
          </figcaption>
        </figure>
      }
    </div>

    <h2 id="borders">Lines, controls, icons and layers</h2>
    <p>
      Hairline for dividers and control outlines; thick for the focus ring. Layers keep overlays in
      order.
    </p>
    <div class="card">
      <table aria-labelledby="borders">
        <tbody>
          @for (t of others; track t.name) {
            <tr>
              <th scope="row">
                <code>{{ t.cssVar }}</code>
              </th>
              <td class="muted">{{ t.value }}</td>
              <td class="muted">{{ t.description }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class ShapePage {
  protected readonly space = tokensUnder('space.');
  protected readonly radii = tokensUnder('radius.');
  protected readonly elevation = tokensUnder('elevation.').map((t) => {
    const key = t.name.split('.')[1];
    return { ...t, key, use: ELEVATION_USE[key] ?? '' };
  });
  protected readonly others = [
    ...tokensUnder('border-width.'),
    ...tokensUnder('control.').filter((t) => t.name.endsWith('.height')),
    ...tokensUnder('icon-size.'),
    ...tokensUnder('z.'),
    ...tokensUnder('layout.'),
    ...tokensUnder('size.'),
    ...tokensUnder('breakpoint.'),
  ].map((t) => ({ ...t, value: t.value ?? t.light?.value }));
}
