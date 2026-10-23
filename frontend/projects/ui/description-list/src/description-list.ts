import { DOCUMENT } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  numberAttribute,
  signal,
  viewChild,
} from '@angular/core';

export type DescriptionListColumns = 1 | 2 | 3;

function toColumns(value: unknown): DescriptionListColumns {
  const n = numberAttribute(value, 2);
  return (n === 1 || n === 3 ? n : 2) as DescriptionListColumns;
}

/**
 * Label/value pairs on a native `<dl>`, laid out in 1–3 columns (fewer on narrow screens).
 * Each pair is a `div[uiDescriptionItem]` (a `<div>` is the only valid grouping inside `<dl>`).
 *
 * @example
 * <dl uiDescriptionList [columns]="3">
 *   <div uiDescriptionItem label="Department">Platform Engineering</div>
 *   <div uiDescriptionItem label="Employee no." mono copyable>GH-ACC-0042</div>
 * </dl>
 */
@Component({
  // Attribute selector on purpose: the host stays a native <dl> (term/definition semantics).
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'dl[uiDescriptionList]',
  exportAs: 'uiDescriptionList',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styleUrl: './description-list.css',
  host: {
    class: 'ui-description-list',
    '[attr.data-columns]': 'columns()',
  },
})
export class DescriptionList {
  /** Columns on wide screens (1–3). Collapses to fewer as the container narrows. */
  readonly columns = input<DescriptionListColumns, unknown>(2, { transform: toColumns });
}

/**
 * One label/value pair inside `dl[uiDescriptionList]`: renders `<dt>` + `<dd>`.
 *
 * - `mono` sets the value in Geist Mono with tabular figures (employee numbers, codes, dates).
 * - `copyable` adds a copy button. Feedback ("Copied", or how to copy manually if the clipboard
 *   is unavailable) is shown next to it and announced through a polite live region.
 * - `span` widens the pair to 2, 3 or all columns.
 */
@Component({
  // Attribute selector on purpose: a <div> is the only valid wrapper of <dt>/<dd> inside <dl>.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'div[uiDescriptionItem]',
  exportAs: 'uiDescriptionItem',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dt class="ui-description-item__label">{{ label() }}</dt>
    <dd class="ui-description-item__value">
      <span #value class="ui-description-item__text"><ng-content /></span>
      @if (copyable()) {
        <button
          type="button"
          class="ui-description-item__copy"
          [attr.aria-label]="copyLabel() || 'Copy ' + label().toLocaleLowerCase()"
          [attr.data-state]="state()"
          (click)="copy()"
        >
          @if (state() === 'copied') {
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          } @else {
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
            </svg>
          }
        </button>
        <span class="ui-description-item__feedback" role="status">{{ feedback() }}</span>
      }
    </dd>
  `,
  styleUrl: './description-item.css',
  host: {
    class: 'ui-description-item',
    '[attr.data-mono]': 'mono() ? "" : null',
    '[attr.data-span]': 'span()',
  },
})
export class DescriptionItem {
  readonly label = input.required<string>();
  /** Monospaced, tabular value (employee no., codes, dates). */
  readonly mono = input(false, { transform: booleanAttribute });
  /** Adds a copy-to-clipboard button. */
  readonly copyable = input(false, { transform: booleanAttribute });
  /** Text to copy. Defaults to the value's text content. */
  readonly copyValue = input<string | null>(null);
  /** Accessible name of the copy button. Defaults to "Copy <label>". */
  readonly copyLabel = input<string | null>(null);
  /** Columns the pair spans. */
  readonly span = input<1 | 2 | 3 | 'full'>(1);
  /** How long the "Copied" feedback stays, in ms. */
  readonly feedbackDuration = input(2000, { transform: numberAttribute });

  protected readonly state = signal<'idle' | 'copied' | 'failed'>('idle');
  protected readonly feedback = signal('');

  private readonly valueEl = viewChild.required<ElementRef<HTMLElement>>('value');
  private readonly document = inject(DOCUMENT);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  /** Copies the value; resolves to whether it worked. */
  async copy(): Promise<boolean> {
    const text = (this.copyValue() ?? this.valueEl().nativeElement.textContent ?? '').trim();
    let copied: boolean;
    try {
      const clipboard = this.document.defaultView?.navigator.clipboard;
      if (!clipboard) {
        throw new Error('Clipboard API unavailable');
      }
      await clipboard.writeText(text);
      copied = true;
    } catch {
      copied = this.legacyCopy(text);
    }

    this.state.set(copied ? 'copied' : 'failed');
    this.feedback.set(copied ? 'Copied' : 'Copy failed. Select the text to copy it.');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.state.set('idle');
      this.feedback.set('');
    }, this.feedbackDuration());
    return copied;
  }

  /** Fallback for browsers or contexts without the async Clipboard API (e.g. plain http). */
  private legacyCopy(text: string): boolean {
    const doc = this.document;
    const previousFocus = doc.activeElement as HTMLElement | null;
    const area = doc.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    doc.body.appendChild(area);
    try {
      area.select();
      return typeof doc.execCommand === 'function' && doc.execCommand('copy');
    } catch {
      return false;
    } finally {
      area.remove();
      previousFocus?.focus();
    }
  }
}
