import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
} from '@angular/core';

export type SkeletonShape = 'text' | 'avatar' | 'card';

/**
 * A placeholder with the shape of content that is still loading.
 *
 * Skeletons are decorative (`aria-hidden`). Announce loading on the region that holds them instead:
 * `aria-busy="true"` while loading, plus a visually hidden or `ui-spinner` status message.
 *
 * - `text`: `lines` bars, the last one shorter.
 * - `avatar`: a circle the size of a 40px avatar.
 * - `card`: a person-card shaped block (avatar, two lines, footer line).
 *
 * The pulse stops under `prefers-reduced-motion`.
 *
 * @example
 * <div aria-busy="true"><ui-skeleton shape="card" /></div>
 */
@Component({
  selector: 'ui-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (shape()) {
      @case ('avatar') {
        <span class="ui-skeleton__bone ui-skeleton__avatar"></span>
      }
      @case ('card') {
        <span class="ui-skeleton__card">
          <span class="ui-skeleton__card-top">
            <span class="ui-skeleton__bone ui-skeleton__avatar"></span>
            <span class="ui-skeleton__lines">
              <span class="ui-skeleton__bone ui-skeleton__line" data-width="long"></span>
              <span class="ui-skeleton__bone ui-skeleton__line" data-width="short"></span>
            </span>
          </span>
          <span class="ui-skeleton__bone ui-skeleton__line" data-width="medium"></span>
        </span>
      }
      @default {
        <span class="ui-skeleton__lines">
          @for (line of lineList(); track line) {
            <span class="ui-skeleton__bone ui-skeleton__line" [attr.data-width]="line"></span>
          }
        </span>
      }
    }
  `,
  styleUrl: './skeleton.css',
  host: {
    class: 'ui-skeleton',
    'aria-hidden': 'true',
    '[attr.data-shape]': 'shape()',
  },
})
export class Skeleton {
  readonly shape = input<SkeletonShape>('text');
  /** Number of text lines (shape `text`), at least 1. */
  readonly lines = input(1, { transform: numberAttribute });

  /** One entry per line; the last line of a paragraph is shorter. Values are unique track keys. */
  protected readonly lineList = computed(() => {
    const count = Math.max(1, Math.floor(this.lines() || 1));
    return Array.from({ length: count }, (_, i) =>
      count > 1 && i === count - 1 ? 'short' : `full-${i}`,
    );
  });
}
