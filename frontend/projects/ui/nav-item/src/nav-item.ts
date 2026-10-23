import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
} from '@angular/core';

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const n = numberAttribute(value, NaN);
  return Number.isNaN(n) ? null : n;
}

/**
 * Sidebar navigation link on a native `<a>` (works with `routerLink`).
 *
 * The current page is marked with `aria-current="page"`, which is also what styles the solid
 * indigo pill. With the router, let `routerLinkActive` set it:
 * `<a uiNavItem routerLink="/people" routerLinkActive ariaCurrentWhenActive="page">`.
 *
 * - Put an icon first with the `uiNavIcon` attribute (`<ui-icon uiNavIcon name="users" />`).
 * - `badge` shows a count pill; screen readers hear "Requests, 2 pending" (`badgeLabel`).
 * - Inside a collapsed `ui-app-shell` sidebar the label is visually hidden but still names the link.
 *
 * @example
 * <a uiNavItem routerLink="/requests" routerLinkActive ariaCurrentWhenActive="page" [badge]="2">
 *   <ui-icon uiNavIcon name="mail" /> Requests
 * </a>
 */
@Component({
  // Attribute selector on purpose: the host stays a native <a> (link semantics, routerLink).
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'a[uiNavItem]',
  exportAs: 'uiNavItem',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="ui-nav-item__icon"><ng-content select="[uiNavIcon]" /></span>
    <span class="ui-nav-item__label"
      ><ng-content />
      @if (showBadge()) {
        <span class="ui-visually-hidden">, {{ badge() }} {{ badgeLabel() }}</span>
      }
    </span>
    @if (showBadge()) {
      <span class="ui-nav-item__badge" aria-hidden="true">{{ badgeText() }}</span>
    }
  `,
  styleUrl: './nav-item.css',
  host: {
    class: 'ui-nav-item',
    '[attr.data-has-badge]': 'showBadge() ? "" : null',
  },
})
export class NavItem {
  /** Count shown in a pill after the label. Hidden when null or 0. */
  readonly badge = input<number | null, unknown>(null, { transform: optionalNumber });
  /** What the count means, for screen readers: "2 pending". */
  readonly badgeLabel = input('pending');
  /** Counts above this show as "99+". */
  readonly badgeMax = input(99, { transform: numberAttribute });

  protected readonly showBadge = computed(() => (this.badge() ?? 0) > 0);
  protected readonly badgeText = computed(() => {
    const count = this.badge() ?? 0;
    return count > this.badgeMax() ? `${this.badgeMax()}+` : `${count}`;
  });
}
