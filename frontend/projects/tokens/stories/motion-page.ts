import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DOC_STYLES } from './doc-styles';
import { tokensUnder } from './token-data';

/** Durations and easings. The demo honours prefers-reduced-motion via the global styles. */
@Component({
  selector: 'ems-motion-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    DOC_STYLES,
    `
      .track {
        position: relative;
        block-size: 2.5rem;
        border-radius: var(--ems-radius-pill);
        background: var(--ems-color-bg-sunken);
        margin-block: var(--ems-space-2);
      }
      .dot {
        position: absolute;
        inset-block: var(--ems-space-1);
        inset-inline-start: var(--ems-space-1);
        aspect-ratio: 1;
        border-radius: var(--ems-radius-pill);
        background: var(--ems-color-accent-solid);
        transition-property: inset-inline-start;
      }
      .track.on .dot {
        inset-inline-start: calc(100% - 2.25rem);
      }
      .demo {
        display: grid;
        gap: var(--ems-space-3);
        padding-block: var(--ems-space-4);
      }
      button {
        justify-self: start;
        font: inherit;
        font-weight: var(--ems-type-label-weight);
        color: var(--ems-color-accent-soft-text);
        background: var(--ems-color-accent-soft);
        border: 0;
        border-radius: var(--ems-radius-pill);
        padding: var(--ems-space-2) var(--ems-space-4);
        cursor: pointer;
      }
    `,
  ],
  template: `
    <h1>Motion</h1>
    <p class="lead">
      Quick and quiet: 120 to 240 ms. Colour and hover changes use fast + standard; overlays enter
      with base or slow + emphasized, a slight settle. Reduced motion turns transitions off.
    </p>

    <h2 id="durations">Durations and easing</h2>
    <p>--ems-duration-* and --ems-easing-*.</p>
    <div class="card">
      <table aria-labelledby="durations">
        <tbody>
          @for (t of tokens; track t.name) {
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
      <div class="demo">
        <button type="button" (click)="moved.set(!moved())" [attr.aria-pressed]="moved()">
          Play the transitions
        </button>
        @for (d of durations; track d.name) {
          <div>
            <code>{{ d.name }} + {{ easingFor(d.name) }}</code>
            <div class="track" [class.on]="moved()" aria-hidden="true">
              <span
                class="dot"
                [style.transition-duration]="'var(' + d.cssVar + ')'"
                [style.transition-timing-function]="'var(--ems-easing-' + easingFor(d.name) + ')'"
              ></span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class MotionPage {
  protected readonly durations = tokensUnder('duration.');
  protected readonly tokens = [...this.durations, ...tokensUnder('easing.')];
  protected readonly moved = signal(false);

  protected easingFor(duration: string): 'standard' | 'emphasized' {
    return duration === 'duration.fast' ? 'standard' : 'emphasized';
  }
}
