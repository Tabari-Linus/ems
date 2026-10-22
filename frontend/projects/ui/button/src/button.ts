import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
} from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button behaviour and styling on a native `<button>` or `<a>` (WAI-ARIA APG "Button" pattern;
 * native elements give keyboard activation and semantics for free).
 *
 * - `disabled` on a `<button>` sets the native `disabled` attribute. On an `<a>`, which has no
 *   disabled state, it sets `aria-disabled="true"`, removes it from the tab order and blocks clicks.
 * - `loading` shows a spinner, sets `aria-busy="true"` and `aria-disabled="true"`, and blocks
 *   activation while keeping focus on the element (a native `disabled` would drop focus to `<body>`).
 *
 * @example
 * <button uiButton variant="secondary" size="sm" (click)="save()">Save</button>
 * <a uiButton variant="ghost" routerLink="/help">Help</a>
 */
@Component({
  // Attribute selector on purpose: the host stays a native <button>/<a> (semantics, keyboard, forms).
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[uiButton], a[uiButton]',
  exportAs: 'uiButton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <span class="ui-button__spinner" aria-hidden="true"></span>
    }
    <span class="ui-button__label"><ng-content /></span>
  `,
  styleUrl: './button.css',
  host: {
    class: 'ui-button',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.data-loading]': 'loading() ? "" : null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.disabled]': 'isNativeButton && disabled() ? "" : null',
    '[attr.aria-disabled]': 'ariaDisabled() ? "true" : null',
    '[attr.tabindex]': '!isNativeButton && disabled() ? "-1" : null',
  },
})
export class Button {
  /** Visual emphasis. */
  readonly variant = input<ButtonVariant>('primary');
  /** Height, padding and font size. */
  readonly size = input<ButtonSize>('md');
  /** Shows a spinner and blocks activation; the element stays focusable. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Disables the button (native `disabled` on `<button>`, `aria-disabled` on `<a>`). */
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly isNativeButton = this.host.tagName === 'BUTTON';

  protected readonly ariaDisabled = computed(
    () => this.loading() || (!this.isNativeButton && this.disabled()),
  );

  constructor() {
    // Capture phase on the host runs before any (click) bindings the consumer put on the same
    // element (a host listener would not), so they never see a click while inert.
    const blockWhenInert = (event: Event): void => {
      if (this.loading() || this.disabled()) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    this.host.addEventListener('click', blockWhenInert, { capture: true });
    inject(DestroyRef).onDestroy(() =>
      this.host.removeEventListener('click', blockWhenInert, { capture: true }),
    );
  }
}
