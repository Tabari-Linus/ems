import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { form, FormField, submit, validate } from '@angular/forms/signals';
import { Checkbox } from './checkbox';

@Component({
  imports: [Checkbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-checkbox
      name="remember"
      value="yes"
      describedBy="remember-hint"
      [(checked)]="checked"
      [(indeterminate)]="mixed"
      [disabled]="disabled()"
      [invalid]="invalid()"
      [required]="true"
      >Keep me signed in</ui-checkbox
    >
  `,
})
class Host {
  readonly checked = signal(false);
  readonly mixed = signal(false);
  readonly disabled = signal(false);
  readonly invalid = signal(false);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const input = root.querySelector('input') as HTMLInputElement;
  const update = async (change: (host: Host) => void) => {
    change(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { fixture, host: fixture.componentInstance, root, input, update };
}

describe('Checkbox', () => {
  it('is a labelled native checkbox', async () => {
    const { root, input } = await setup();
    const label = root.querySelector('label') as HTMLLabelElement;

    expect(input.type).toBe('checkbox');
    expect(label.htmlFor).toBe(input.id);
    expect(label.textContent?.trim()).toBe('Keep me signed in');
    expect(input.name).toBe('remember');
    expect(input.value).toBe('yes');
    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-describedby')).toBe('remember-hint');
    expect(root.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('toggles on click and updates the two-way binding', async () => {
    const { input, host, fixture } = await setup();
    input.click();
    fixture.detectChanges();
    expect(host.checked()).toBe(true);
    expect(input.checked).toBe(true);
  });

  it('indeterminate sets the native property and is cleared by the next toggle', async () => {
    const { input, host, update, fixture, root } = await setup();
    await update((h) => h.mixed.set(true));
    expect(input.indeterminate).toBe(true);
    expect(root.querySelector('.ui-checkbox__mark')?.getAttribute('data-icon')).toBe('minus');

    input.click();
    fixture.detectChanges();
    expect(host.mixed()).toBe(false);
    expect(input.indeterminate).toBe(false);
    expect(root.querySelector('.ui-checkbox__mark')?.getAttribute('data-icon')).toBe('check');
  });

  it('reflects disabled and invalid', async () => {
    const { input, root, update } = await setup();
    await update((h) => {
      h.disabled.set(true);
      h.invalid.set(true);
    });
    expect(input.disabled).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(root.querySelector('ui-checkbox')?.hasAttribute('data-disabled')).toBe(true);
  });

  it('focus() focuses the native input', async () => {
    const { fixture, input } = await setup();
    document.body.appendChild(fixture.nativeElement);
    const checkbox = fixture.debugElement.children[0].componentInstance as Checkbox;
    checkbox.focus();
    expect(document.activeElement).toBe(input);
    fixture.nativeElement.remove();
  });

  it('works as a ControlValueAccessor (reactive forms and signal forms)', async () => {
    @Component({
      imports: [Checkbox, ReactiveFormsModule, FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <ui-checkbox class="reactive" [formControl]="control">Reactive</ui-checkbox>
        <ui-checkbox class="signal" [formField]="model.agree">Signal</ui-checkbox>
      `,
    })
    class Forms {
      readonly control = new FormControl(true);
      readonly data = signal({ agree: false });
      readonly model = form(this.data);
    }

    const fixture = TestBed.createComponent(Forms);
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const reactive = root.querySelector('.reactive input') as HTMLInputElement;
    const signalInput = root.querySelector('.signal input') as HTMLInputElement;
    expect(reactive.checked).toBe(true);

    reactive.click();
    expect(fixture.componentInstance.control.value).toBe(false);

    reactive.dispatchEvent(new Event('blur'));
    expect(fixture.componentInstance.control.touched).toBe(true);

    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(reactive.disabled).toBe(true);

    signalInput.click();
    expect(fixture.componentInstance.data().agree).toBe(true);
  });

  describe('with an invalid signal-forms field', () => {
    @Component({
      imports: [Checkbox, FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<ui-checkbox [formField]="model.agree">I agree</ui-checkbox>`,
    })
    class MustAgree {
      readonly model = form(signal({ agree: false }), (s) =>
        validate(s.agree, ({ value }) =>
          value() ? null : { kind: 'agree', message: 'Accept the terms.' },
        ),
      );
    }

    async function setupForm() {
      const fixture = TestBed.createComponent(MustAgree);
      await fixture.whenStable();
      const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
      return { fixture, input, model: fixture.componentInstance.model };
    }

    it('is not invalid on load, although the field is', async () => {
      const { input, model } = await setupForm();

      expect(model.agree().invalid()).toBe(true);
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('is invalid after blur', async () => {
      const { fixture, input } = await setupForm();
      input.dispatchEvent(new Event('blur'));
      await fixture.whenStable();

      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('is invalid after submit', async () => {
      const { fixture, input, model } = await setupForm();
      await submit(model, async () => undefined);
      await fixture.whenStable();

      expect(input.getAttribute('aria-invalid')).toBe('true');
    });
  });
});
