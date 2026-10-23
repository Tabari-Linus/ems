import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  numberAttribute,
  output,
  viewChild,
} from '@angular/core';
import { Button } from '@ems/ui/button';

export type ErrorStateKind = 'forbidden' | 'not-found' | 'server' | 'network';
export type ErrorStateHeadingLevel = 1 | 2 | 3;

export interface ErrorStateCopy {
  /** HTTP status shown for support conversations, or null. */
  code: string | null;
  heading: string;
  description: string;
  actionLabel: string;
}

/** Default copy: what went wrong, then how to recover. */
export const ERROR_STATE_COPY: Readonly<Record<ErrorStateKind, ErrorStateCopy>> = {
  forbidden: {
    code: '403',
    heading: "You don't have access to this page",
    description:
      'Your access level does not include this page. Ask an HR admin to grant access, or go back to Home.',
    actionLabel: 'Go to Home',
  },
  'not-found': {
    code: '404',
    heading: "We can't find that page",
    description:
      'The link may be out of date, or the record may have been archived. Check the address, or go back to Home.',
    actionLabel: 'Go to Home',
  },
  server: {
    code: '500',
    heading: 'Something went wrong on our side',
    description:
      'We could not load this page. Try again in a moment. If it keeps happening, contact your EMS admin.',
    actionLabel: 'Try again',
  },
  network: {
    code: null,
    heading: "You're offline",
    description: 'We cannot reach EMS right now. Check your internet connection, then try again.',
    actionLabel: 'Try again',
  },
};

/**
 * A failure state for a page or section (403, 404, 500, network), with helpful default copy and
 * one recovery action.
 *
 * The heading is focusable (`tabindex="-1"`): call `focus()` after rendering an error in place of
 * content so screen-reader and keyboard users land on it. Extra actions (e.g. a "Contact HR"
 * link) go in `[uiErrorStateActions]`.
 *
 * @example
 * <ui-error-state kind="server" (action)="reload()" />
 */
@Component({
  selector: 'ui-error-state',
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ui-error-state__icon" aria-hidden="true">
      @switch (kind()) {
        @case ('forbidden') {
          <svg viewBox="0 0 24 24" focusable="false">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        }
        @case ('not-found') {
          <svg viewBox="0 0 24 24" focusable="false">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        }
        @case ('network') {
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M12 20h.01" />
            <path d="M8.5 16.429a5 5 0 0 1 7 0" />
            <path d="M5 12.859a10 10 0 0 1 5.17-2.69" />
            <path d="M19 12.859a10 10 0 0 0-2.007-1.523" />
            <path d="M2 8.82a15 15 0 0 1 4.177-2.643" />
            <path d="M22 8.82a15 15 0 0 0-11.288-3.764" />
            <path d="m2 2 20 20" />
          </svg>
        }
        @default {
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        }
      }
    </div>
    @if (copy().code; as code) {
      <p class="ui-error-state__code">Error {{ code }}</p>
    }
    <div
      #headingEl
      class="ui-error-state__heading"
      role="heading"
      tabindex="-1"
      [attr.aria-level]="headingLevel()"
    >
      {{ heading() ?? copy().heading }}
    </div>
    <p class="ui-error-state__description">{{ description() ?? copy().description }}</p>
    <div class="ui-error-state__actions">
      @if (showAction()) {
        <button uiButton type="button" (click)="action.emit()">
          {{ actionLabel() ?? copy().actionLabel }}
        </button>
      }
      <ng-content select="[uiErrorStateActions]" />
    </div>
  `,
  styleUrl: './error-state.css',
  host: {
    class: 'ui-error-state',
    '[attr.data-kind]': 'kind()',
  },
})
export class ErrorState {
  readonly kind = input<ErrorStateKind>('server');
  /** Overrides the default heading. */
  readonly heading = input<string>();
  /** Overrides the default description. */
  readonly description = input<string>();
  /** Overrides the default recovery action label. */
  readonly actionLabel = input<string>();
  /** Shows the built-in recovery button. */
  readonly showAction = input(true, { transform: booleanAttribute });
  /** 1 for a full page (404 route), 2–3 inside a page section. */
  readonly headingLevel = input<ErrorStateHeadingLevel, unknown>(2, {
    transform: (v: unknown) => numberAttribute(v, 2) as ErrorStateHeadingLevel,
  });
  /** The recovery button was activated (navigate home, retry the query, …). */
  readonly action = output<void>();

  protected readonly copy = computed(() => ERROR_STATE_COPY[this.kind()]);
  private readonly headingRef = viewChild.required<ElementRef<HTMLElement>>('headingEl');

  /** Moves focus to the heading so the error is announced and keyboard users start here. */
  focus(): void {
    this.headingRef().nativeElement.focus();
  }
}
