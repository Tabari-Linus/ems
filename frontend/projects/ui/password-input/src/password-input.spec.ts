import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { form, FormField as SignalFormField, required, submit } from '@angular/forms/signals';
import { FormField } from '@ems/ui/form-field';
import { estimatePasswordStrength, PasswordInput, type PasswordStrength } from './password-input';

@Component({
  imports: [PasswordInput, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-form-field label="New password" hint="At least 12 characters.">
      <ui-password-input
        autocomplete="new-password"
        placeholder="Choose a password"
        name="password"
        [(value)]="value"
        [showStrength]="showStrength()"
        [strength]="strength()"
        [disabled]="disabled()"
      />
    </ui-form-field>
  `,
})
class Host {
  readonly value = signal('');
  readonly showStrength = signal(true);
  readonly strength = signal<PasswordStrength | null>(null);
  readonly disabled = signal(false);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const input = root.querySelector('input') as HTMLInputElement;
  const toggle = root.querySelector('button') as HTMLButtonElement;
  const type = async (text: string) => {
    input.value = text;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const update = async (change: (host: Host) => void) => {
    change(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { fixture, host: fixture.componentInstance, root, input, toggle, type, update };
}

describe('estimatePasswordStrength', () => {
  it.each([
    ['', 1],
    ['short', 1],
    ['longenough', 1],
    ['Longenough', 2],
    ['Longenough1!', 4],
    ['akwaaba-labs-2026', 3],
  ])('%s -> %i', (password, expected) => {
    expect(estimatePasswordStrength(password)).toBe(expected);
  });
});

describe('PasswordInput', () => {
  it('is a labelled password field with a named reveal toggle', async () => {
    const { root, input, toggle } = await setup();
    const label = root.querySelector('label') as HTMLLabelElement;

    expect(input.type).toBe('password');
    expect(label.htmlFor).toBe(input.id);
    expect(input.getAttribute('autocomplete')).toBe('new-password');
    expect(input.placeholder).toBe('Choose a password');
    expect(input.name).toBe('password');
    expect(input.getAttribute('aria-describedby')).toBeTruthy();
    expect(toggle.type).toBe('button');
    expect(toggle.getAttribute('aria-label')).toBe('Show password');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
  });

  it('reveal toggle switches the type and aria-pressed, keeping its name', async () => {
    const { fixture, input, toggle } = await setup();
    toggle.click();
    fixture.detectChanges();
    expect(input.type).toBe('text');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe('Show password');
    toggle.click();
    fixture.detectChanges();
    expect(input.type).toBe('password');
  });

  it('typing updates the value and the strength meter with a text label', async () => {
    const { root, host, type } = await setup();
    const live = () => root.querySelector('.ui-password-input__strength-text') as HTMLElement;
    expect(live().getAttribute('aria-live')).toBe('polite');
    expect(live().textContent?.trim()).toBe('');
    expect(root.querySelector('.ui-password-input__meter')).toBeNull();

    await type('Longenough1!');
    expect(host.value()).toBe('Longenough1!');
    expect(live().textContent?.replace(/\s+/g, ' ').trim()).toBe('Strength: Strong');
    expect(root.querySelectorAll('.ui-password-input__step[data-on]').length).toBe(4);
    expect(root.querySelector('.ui-password-input__meter')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('accepts a strength from outside and can hide the meter', async () => {
    const { root, type, update } = await setup();
    await type('anything');
    await update((h) => h.strength.set(2));
    expect(root.querySelectorAll('.ui-password-input__step[data-on]').length).toBe(2);
    expect(root.querySelector('.ui-password-input__strength-text')?.textContent).toContain('Fair');

    await update((h) => h.showStrength.set(false));
    expect(root.querySelector('.ui-password-input__strength')).toBeNull();
  });

  it('disabled disables the field and the toggle', async () => {
    const { input, toggle, update } = await setup();
    await update((h) => h.disabled.set(true));
    expect(input.disabled).toBe(true);
    expect(toggle.disabled).toBe(true);
  });

  it('focus() focuses the text field', async () => {
    const { fixture, input } = await setup();
    document.body.appendChild(fixture.nativeElement);
    const component = fixture.debugElement.query(
      (el) => el.componentInstance instanceof PasswordInput,
    ).componentInstance as PasswordInput;
    component.focus();
    expect(document.activeElement).toBe(input);
    fixture.nativeElement.remove();
  });

  it('works with reactive forms', async () => {
    @Component({
      imports: [PasswordInput, ReactiveFormsModule],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<ui-password-input [formControl]="control" />`,
    })
    class Forms {
      readonly control = new FormControl<string | null>('secret');
    }

    const fixture = TestBed.createComponent(Forms);
    await fixture.whenStable();
    fixture.detectChanges();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('secret');

    input.value = 'changed';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.control.value).toBe('changed');
    input.dispatchEvent(new Event('blur'));
    expect(fixture.componentInstance.control.touched).toBe(true);

    fixture.componentInstance.control.setValue(null);
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(input.value).toBe('');
    expect(input.disabled).toBe(true);
  });

  describe('with a required signal-forms field', () => {
    @Component({
      imports: [PasswordInput, FormField, SignalFormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <ui-form-field label="Password" [error]="firstError()">
          <ui-password-input [formField]="model.password" />
        </ui-form-field>
      `,
    })
    class Required {
      readonly model = form(signal({ password: '' }), (s) =>
        required(s.password, { message: 'Enter your password.' }),
      );
      readonly firstError = () => this.model.password().errors()[0]?.message ?? null;
    }

    async function setupForm() {
      const fixture = TestBed.createComponent(Required);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      return {
        fixture,
        model: fixture.componentInstance.model,
        input: root.querySelector('input') as HTMLInputElement,
        error: () => root.querySelector('.ui-form-field__error'),
      };
    }

    it('is not invalid on load, although the empty field is', async () => {
      const { model, input, error } = await setupForm();

      expect(model.password().invalid()).toBe(true);
      expect(input.hasAttribute('aria-invalid')).toBe(false);
      expect(error()).toBeNull();
    });

    it('is invalid with its message after blur', async () => {
      const { fixture, model, input, error } = await setupForm();
      input.dispatchEvent(new Event('blur'));
      await fixture.whenStable();

      expect(model.password().touched()).toBe(true);
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(error()?.textContent).toContain('Enter your password.');
    });

    it('is invalid with its message after submit', async () => {
      const { fixture, model, input, error } = await setupForm();
      await submit(model, async () => undefined);
      await fixture.whenStable();

      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(error()?.textContent).toContain('Enter your password.');
    });

    it('writes typed text to the form', async () => {
      const { fixture, model, input } = await setupForm();
      input.value = 'correct horse';
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();

      expect(model.password().value()).toBe('correct horse');
      expect(model.password().invalid()).toBe(false);
    });
  });
});
