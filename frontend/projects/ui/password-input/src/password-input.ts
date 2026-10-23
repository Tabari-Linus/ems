import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  input,
  model,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Input, InputGroup, type InputSize } from '@ems/ui/input';
import { Icon } from '@ems/icons';

/** 1 weak, 2 fair, 3 good, 4 strong. */
export type PasswordStrength = 1 | 2 | 3 | 4;

/**
 * A rough, dependency-free estimate (length and character variety). Good enough to nudge people
 * towards longer passwords; the server's password policy stays the source of truth.
 */
export function estimatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.max(1, score) as PasswordStrength;
}

const DEFAULT_STRENGTH_LABELS = ['Weak', 'Fair', 'Good', 'Strong'] as const;

/**
 * Password field with a reveal toggle and an optional strength meter.
 *
 * - The toggle is a real button with a fixed name ("Show password") and `aria-pressed`, so
 *   its state is announced without the name changing (APG *Button*, toggle variant).
 * - The strength meter (opt-in with `showStrength`, for new-password fields) has four steps and
 *   a text label ("Strength: Good") in a polite live region, so it is not conveyed by colour only.
 * - Inside `ui-form-field` the inner input gets the label, description and invalid state.
 * - Works with `[(value)]`, `[formField]`, `formControl` and `ngModel` (string value).
 *
 * @example
 * <ui-form-field label="Password">
 *   <ui-password-input autocomplete="current-password" [formField]="form.password" />
 * </ui-form-field>
 */
@Component({
  selector: 'ui-password-input',
  exportAs: 'uiPasswordInput',
  imports: [Input, InputGroup, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PasswordInput), multi: true },
  ],
  template: `
    <ui-input-group [size]="size()">
      <input
        #native
        uiInput
        [type]="revealed() ? 'text' : 'password'"
        [value]="value()"
        [disabled]="isDisabled()"
        [invalid]="invalid()"
        [attr.autocomplete]="autocomplete()"
        [attr.placeholder]="placeholder() || null"
        [attr.name]="name() || null"
        autocapitalize="off"
        spellcheck="false"
        (input)="onNativeInput($event)"
        (blur)="onTouched()"
      />
      <button
        uiInputTrailing
        type="button"
        class="ui-input-group__button"
        [attr.aria-pressed]="revealed()"
        [attr.aria-label]="revealLabel()"
        [disabled]="isDisabled()"
        (click)="toggleReveal()"
      >
        <ui-icon class="ui-input-group__icon" [name]="revealed() ? 'eye-off' : 'eye'" size="sm" />
      </button>
    </ui-input-group>
    @if (showStrength()) {
      <!-- The live region stays in the DOM so the first estimate is announced too. -->
      <div class="ui-password-input__strength" [attr.data-strength]="value() ? level() : null">
        @if (value()) {
          <span class="ui-password-input__meter" aria-hidden="true">
            @for (step of steps; track step) {
              <span
                class="ui-password-input__step"
                [attr.data-on]="step <= level() ? '' : null"
              ></span>
            }
          </span>
        }
        <span class="ui-password-input__strength-text" aria-live="polite">
          @if (value()) {
            {{ strengthPrefix() }} <strong>{{ strengthLabel() }}</strong>
          }
        </span>
      </div>
    }
  `,
  styleUrl: './password-input.css',
  host: { class: 'ui-password-input' },
})
export class PasswordInput implements ControlValueAccessor {
  /** The password; two-way bindable. */
  readonly value = model('');
  /** `current-password` for sign-in, `new-password` for set/change forms. */
  readonly autocomplete = input<'current-password' | 'new-password' | 'off'>('current-password');
  readonly placeholder = input<string>();
  readonly name = input<string>();
  readonly size = input<InputSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Shows the four-step strength meter while the field has a value. */
  readonly showStrength = input(false, { transform: booleanAttribute });
  /** Overrides the built-in estimate (e.g. with a score from the server or zxcvbn). */
  readonly strength = input<PasswordStrength | null>(null);
  /** Labels for steps 1–4. */
  readonly strengthLabels =
    input<readonly [string, string, string, string]>(DEFAULT_STRENGTH_LABELS);
  /** Text before the strength label. */
  readonly strengthPrefix = input('Strength:');
  /** Accessible name of the reveal toggle (its pressed state is announced separately). */
  readonly revealLabel = input('Show password');

  /** Whether the password is shown as plain text. */
  readonly revealed = signal(false);

  protected readonly steps = [1, 2, 3, 4] as const;
  protected readonly level = computed<PasswordStrength>(
    () => this.strength() ?? estimatePasswordStrength(this.value()),
  );
  protected readonly strengthLabel = computed(() => this.strengthLabels()[this.level() - 1]);

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  private readonly native = viewChild.required('native', { read: ElementRef<HTMLInputElement> });

  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  /** Moves focus to the text field. */
  focus(options?: FocusOptions): void {
    this.native().nativeElement.focus(options);
  }

  protected toggleReveal(): void {
    this.revealed.update((shown) => !shown);
  }

  protected onNativeInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.onChange(value);
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
