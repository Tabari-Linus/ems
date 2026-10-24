import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UI_FORM_FIELD } from '@ems/ui/form-field';
import { Input, InputGroup, type InputSize } from '@ems/ui/input';
import { Icon } from '@ems/icons';

export type ShortcutPlatform = 'auto' | 'mac' | 'other';

function detectMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform ?? nav.platform ?? '';
  return /mac|iphone|ipad|ipod/i.test(platform);
}

/**
 * Search field: a pill `type="search"` input with a search icon, a clear button and an optional
 * ⌘K / Ctrl K hint that also focuses the field from anywhere on the page.
 *
 * - `query` emits the trimmed text after `debounce` ms of no typing (default 250); Enter and the
 *   clear button emit immediately. `value` / forms get every keystroke.
 * - Escape clears a non-empty field (and emits `''`).
 * - Without a `ui-form-field`, the input is named by `label` (default "Search"); the placeholder
 *   is not a label.
 * - The shortcut hint is `aria-hidden`; the input carries `aria-keyshortcuts` instead.
 *
 * @example
 * <ui-search-input placeholder="Search people, offices, requests" shortcut (query)="search($event)" />
 */
@Component({
  selector: 'ui-search-input',
  exportAs: 'uiSearchInput',
  imports: [Input, InputGroup, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SearchInput), multi: true },
  ],
  template: `
    <ui-input-group shape="pill" [size]="size()">
      <ui-icon uiInputLeading class="ui-input-group__icon" name="search" size="sm" />
      <input
        #native
        uiInput
        type="search"
        enterkeyhint="search"
        autocomplete="off"
        [value]="value()"
        [disabled]="isDisabled()"
        [attr.aria-label]="hasField ? null : label()"
        [attr.placeholder]="placeholder() || null"
        [attr.name]="name() || null"
        [attr.aria-keyshortcuts]="shortcut() ? keyShortcuts() : null"
        (input)="onNativeInput($event)"
        (keydown)="onKeydown($event)"
        (blur)="onTouched()"
      />
      @if (value() && !isDisabled()) {
        <button
          uiInputTrailing
          type="button"
          class="ui-input-group__button"
          [attr.aria-label]="clearLabel()"
          (click)="clear()"
        >
          <ui-icon class="ui-input-group__icon" name="x" size="sm" />
        </button>
      } @else if (shortcut()) {
        <kbd uiInputTrailing class="ui-search-input__kbd" aria-hidden="true">{{ hint() }}</kbd>
      }
    </ui-input-group>
  `,
  styleUrl: './search-input.css',
  host: {
    class: 'ui-search-input',
    '(document:keydown)': 'onDocumentKeydown($event)',
  },
})
export class SearchInput implements ControlValueAccessor {
  /** Current text; two-way bindable (every keystroke). */
  readonly value = model('');
  readonly placeholder = input<string>();
  readonly name = input<string>();
  /** Accessible name when not inside a `ui-form-field`. */
  readonly label = input('Search');
  /** Accessible name of the clear button. */
  readonly clearLabel = input('Clear search');
  readonly size = input<InputSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Milliseconds of no typing before `query` emits. */
  readonly debounce = input(250, { transform: numberAttribute });
  /** Shows the ⌘K / Ctrl K hint and focuses the field on that shortcut. */
  readonly shortcut = input(false, { transform: booleanAttribute });
  /** Which modifier the hint shows; `auto` detects the platform. */
  readonly platform = input<ShortcutPlatform>('auto');

  /** Debounced, trimmed search text. */
  readonly query = output<string>();

  protected readonly hasField = inject(UI_FORM_FIELD, { optional: true }) !== null;
  private readonly detectedMac = detectMac();
  protected readonly isMac = computed(() =>
    this.platform() === 'auto' ? this.detectedMac : this.platform() === 'mac',
  );
  protected readonly hint = computed(() => (this.isMac() ? '⌘K' : 'Ctrl K'));
  protected readonly keyShortcuts = computed(() => (this.isMac() ? 'Meta+K' : 'Control+K'));

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  private readonly native = viewChild.required('native', { read: ElementRef<HTMLInputElement> });

  private timer: ReturnType<typeof setTimeout> | undefined;
  private lastEmitted: string | undefined;
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  /** Moves focus to the text field. */
  focus(options?: FocusOptions): void {
    this.native().nativeElement.focus(options);
  }

  /** Empties the field, emits `''` immediately and keeps focus in the field. */
  clear(): void {
    this.setValue('');
    this.emitNow();
    this.focus();
  }

  protected onNativeInput(event: Event): void {
    this.setValue((event.target as HTMLInputElement).value);
    this.schedule();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.emitNow();
    } else if (event.key === 'Escape' && this.value()) {
      event.preventDefault();
      // Stop here so an enclosing dialog does not also close on the same Escape.
      event.stopPropagation();
      this.clear();
    }
  }

  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.shortcut() || this.isDisabled()) return;
    const modifier = this.isMac() ? event.metaKey : event.ctrlKey;
    if (modifier && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.focus();
      this.native().nativeElement.select();
    }
  }

  private setValue(value: string): void {
    this.value.set(value);
    this.onChange(value);
  }

  private schedule(): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.emitNow(), this.debounce());
  }

  private emitNow(): void {
    clearTimeout(this.timer);
    const text = this.value().trim();
    if (text !== this.lastEmitted) {
      this.lastEmitted = text;
      this.query.emit(text);
    }
  }

  writeValue(value: unknown): void {
    this.value.set(typeof value === 'string' ? value : '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
