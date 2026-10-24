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
import { Icon, type IconName } from '@ems/icons';

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

/** One icon per kind: a lock for 403, a search for 404, no signal offline, a warning otherwise. */
const ERROR_STATE_ICONS: Readonly<Record<ErrorStateKind, IconName>> = {
  forbidden: 'lock',
  'not-found': 'search',
  network: 'wifi-off',
  server: 'triangle-alert',
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
  imports: [Button, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ui-error-state__icon" aria-hidden="true">
      <ui-icon [name]="kindIcon()" size="lg" />
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
  protected readonly kindIcon = computed<IconName>(() => ERROR_STATE_ICONS[this.kind()]);
  private readonly headingRef = viewChild.required<ElementRef<HTMLElement>>('headingEl');

  /** Moves focus to the heading so the error is announced and keyboard users start here. */
  focus(): void {
    this.headingRef().nativeElement.focus();
  }
}
