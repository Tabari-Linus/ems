import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { EMS_ICONS, type IconName } from './registry';

/**
 * An icon from the curated set.
 *
 * - Without `label` the icon is decorative: `aria-hidden="true"`, so it adds nothing to the
 *   accessible name of its button or link (give those their own text or `aria-label`).
 * - With `label` it is a meaningful image: `role="img"` and `aria-label`.
 *
 * The icon draws in `currentColor`, so it takes the text colour of its context.
 *
 * @example
 * <ui-icon name="search" />
 * <ui-icon name="circle-alert" label="Error" [size]="16" />
 */
@Component({
  selector: 'ui-icon',
  imports: [LucideDynamicIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg
    [lucideIcon]="icon()"
    [size]="size()"
    aria-hidden="true"
    focusable="false"
  ></svg>`,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      vertical-align: middle;
      line-height: 0;
    }
  `,
  host: {
    class: 'ui-icon',
    '[attr.data-icon]': 'name()',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
})
export class Icon {
  /** Icon name from the curated set (see EMS_ICONS). */
  readonly name = input.required<IconName>();
  /** Width and height in px (number) or any CSS length (string, e.g. '1em'). */
  readonly size = input<number | string>(20);
  /** Accessible name. Omit for decorative icons. */
  readonly label = input<string>();

  protected readonly icon = computed(() => EMS_ICONS[this.name()]);
}
