import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { EMS_ICONS, type IconName } from './registry';

/** A size from the icon scale (`--ems-icon-size-{sm,md,lg}`: 16 / 20 / 24px). */
export type IconSizeToken = 'sm' | 'md' | 'lg';

/**
 * An icon from the curated set.
 *
 * - Without `label` the icon is decorative: `aria-hidden="true"`, so it adds nothing to the
 *   accessible name of its button or link (give those their own text or `aria-label`).
 * - With `label` it is a meaningful image: `role="img"` and `aria-label`.
 *
 * The icon draws in `currentColor`, so it takes the text colour of its context.
 *
 * Size: a token from the icon scale (`sm` 16, `md` 20, `lg` 24), a number of px, or any CSS length.
 * Without `size` the icon takes `--ui-icon-size` from its context (default `--ems-icon-size-md`),
 * so a component can size the icons it projects from CSS. `--ui-icon-stroke-width` overrides
 * Lucide's stroke width (2) the same way.
 *
 * @example
 * <ui-icon name="search" />
 * <ui-icon name="circle-alert" label="Error" size="sm" />
 */
@Component({
  selector: 'ui-icon',
  imports: [LucideDynamicIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg
    [lucideIcon]="icon()"
    [size]="svgSize()"
    aria-hidden="true"
    focusable="false"
  ></svg>`,
  styles: `
    @layer components {
      :host {
        display: inline-flex;
        flex: none;
        inline-size: var(--ui-icon-size, var(--ems-icon-size-md));
        block-size: var(--ui-icon-size, var(--ems-icon-size-md));
        vertical-align: middle;
        line-height: 0;
      }

      svg {
        inline-size: 100%;
        block-size: 100%;
        stroke-width: var(--ui-icon-stroke-width, 2);
      }
    }
  `,
  host: {
    class: 'ui-icon',
    '[attr.data-icon]': 'name()',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
    '[style.--ui-icon-size]': 'cssSize()',
  },
})
export class Icon {
  /** Icon name from the curated set (see EMS_ICONS). */
  readonly name = input.required<IconName>();
  /** `sm` | `md` | `lg` (icon scale), px (number) or any CSS length. Omit to size from CSS. */
  readonly size = input<IconSizeToken | number | string>();
  /** Accessible name. Omit for decorative icons. */
  readonly label = input<string>();

  protected readonly icon = computed(() => EMS_ICONS[this.name()]);

  /** The value of `--ui-icon-size` on the host, or null to inherit it. */
  protected readonly cssSize = computed(() => {
    const size = this.size();
    if (size === undefined || size === '') {
      return null;
    }
    if (typeof size === 'number') {
      return `${size}px`;
    }
    return size === 'sm' || size === 'md' || size === 'lg' ? `var(--ems-icon-size-${size})` : size;
  });

  /** Intrinsic size of the <svg> (CSS sizes it to the host; this only matters without CSS). */
  protected readonly svgSize = computed(() => {
    const size = this.size();
    if (typeof size === 'number') {
      return size;
    }
    return size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  });
}
