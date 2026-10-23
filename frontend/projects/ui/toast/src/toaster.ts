import { ChangeDetectionStrategy, Component, ElementRef, inject, input } from '@angular/core';
import { Icon, STATUS_ICONS } from '@ems/icons';
import { ToastService } from './toast.service';

/**
 * Renders the toasts of `ToastService`. Put exactly one at the end of the app shell, so it is
 * last in the tab order:
 *
 * ```html
 * <ui-toaster />
 * ```
 *
 * The host is a labelled region ("Notifications") holding a polite live region, so a new toast is
 * announced without moving focus. Timers pause while the pointer is over the toasts or focus is
 * inside them; Escape closes the focused toast.
 */
@Component({
  selector: 'ui-toaster',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="ui-toaster__list" aria-live="polite">
      @for (toast of toasts.visible(); track toast.id) {
        <li class="ui-toast" [attr.data-tone]="toast.tone" [attr.data-toast-id]="toast.id">
          <span class="ui-toast__icon" aria-hidden="true">
            <ui-icon [name]="statusIcons[toast.tone]" size="sm" />
          </span>
          <p class="ui-toast__message">{{ toast.message }}</p>
          @if (toast.action; as action) {
            <button type="button" class="ui-toast__action" (click)="toasts.runAction(toast.id)">
              {{ action.label }}
            </button>
          }
          <button
            type="button"
            class="ui-toast__close"
            [attr.aria-label]="dismissLabel()"
            (click)="toasts.dismiss(toast.id)"
          >
            <ui-icon name="x" size="sm" />
          </button>
        </li>
      }
    </ol>
  `,
  styleUrl: './toaster.css',
  host: {
    class: 'ui-toaster',
    role: 'region',
    '[attr.aria-label]': 'label()',
    '(mouseenter)': 'hovered = true; toasts.pause()',
    '(mouseleave)': 'hovered = false; maybeResume()',
    '(focusin)': 'toasts.pause()',
    '(focusout)': 'onFocusOut($event)',
    '(keydown.escape)': 'onEscape($event)',
  },
})
export class Toaster {
  /** Accessible name of the region. */
  readonly label = input('Notifications');
  /** Accessible name of each toast's close button. */
  readonly dismissLabel = input('Dismiss notification');

  protected readonly toasts = inject(ToastService);
  protected readonly statusIcons = STATUS_ICONS;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected hovered = false;

  /** Escape inside a toast closes that toast. */
  protected onEscape(event: Event): void {
    const item = (event.target as Element).closest('[data-toast-id]');
    if (!item) return;
    event.stopPropagation();
    this.toasts.dismiss(Number(item.getAttribute('data-toast-id')));
    this.maybeResume();
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.host.contains(next)) this.maybeResume(true);
  }

  protected maybeResume(focusLeft = false): void {
    const focusInside = !focusLeft && this.host.contains(document.activeElement);
    if (!this.hovered && !focusInside) this.toasts.resume();
  }
}
