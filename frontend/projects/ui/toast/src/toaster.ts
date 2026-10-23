import { ChangeDetectionStrategy, Component, ElementRef, inject, input } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="ui-toaster__list" aria-live="polite">
      @for (toast of toasts.visible(); track toast.id) {
        <li class="ui-toast" [attr.data-tone]="toast.tone" [attr.data-toast-id]="toast.id">
          <span class="ui-toast__icon" aria-hidden="true">
            @switch (toast.tone) {
              @case ('success') {
                <svg viewBox="0 0 24 24" focusable="false">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              }
              @case ('warning') {
                <svg viewBox="0 0 24 24" focusable="false">
                  <path
                    d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
                  />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
              }
              @case ('danger') {
                <svg viewBox="0 0 24 24" focusable="false">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
              }
              @default {
                <svg viewBox="0 0 24 24" focusable="false">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              }
            }
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
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
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
