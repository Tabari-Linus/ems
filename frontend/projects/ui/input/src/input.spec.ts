import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { form, FormField as SignalFormField, required, submit } from '@angular/forms/signals';
import { Input, InputGroup, type InputSize } from './input';

@Component({
  imports: [Input, InputGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input uiInput class="plain" [size]="size()" [invalid]="invalid()" />
    <textarea uiInput rows="3"></textarea>
    <ui-input-group size="sm" shape="pill">
      <span uiInputLeading>@</span>
      <input uiInput class="grouped" />
      <button uiInputTrailing type="button" class="ui-input-group__button">x</button>
    </ui-input-group>
  `,
})
class Host {
  readonly size = signal<InputSize>('md');
  readonly invalid = signal(false);
}

describe('Input', () => {
  it('renders a native input/textarea with size, invalid and no frame inside a group', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const plain = root.querySelector('input.plain') as HTMLInputElement;
    const grouped = root.querySelector('input.grouped') as HTMLInputElement;

    expect(plain.classList).toContain('ui-input');
    expect(plain.dataset['size']).toBe('md');
    expect(plain.hasAttribute('data-grouped')).toBe(false);
    expect(plain.hasAttribute('aria-invalid')).toBe(false);
    expect(plain.hasAttribute('id')).toBe(false);
    expect(root.querySelector('textarea')?.classList).toContain('ui-input');
    expect(grouped.hasAttribute('data-grouped')).toBe(true);

    fixture.componentInstance.size.set('sm');
    fixture.componentInstance.invalid.set(true);
    fixture.detectChanges();
    expect(plain.dataset['size']).toBe('sm');
    expect(plain.getAttribute('aria-invalid')).toBe('true');
  });

  it('input-group reflects size and shape and projects slots in order', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const group = (fixture.nativeElement as HTMLElement).querySelector(
      'ui-input-group',
    ) as HTMLElement;

    expect(group.dataset['size']).toBe('sm');
    expect(group.dataset['shape']).toBe('pill');
    expect([...group.children].map((child) => child.tagName)).toEqual(['SPAN', 'INPUT', 'BUTTON']);
  });

  it('binds with reactive forms, ngModel and signal forms', async () => {
    @Component({
      imports: [Input, ReactiveFormsModule, FormsModule, SignalFormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <input uiInput class="reactive" [formControl]="control" />
        <input uiInput class="model" [(ngModel)]="text" />
        <input uiInput class="signal" [formField]="model.email" />
      `,
    })
    class Forms {
      readonly control = new FormControl('ama@akwaabalabs.example');
      text = 'Kumasi';
      readonly data = signal({ email: 'kofi@akwaabalabs.example' });
      readonly model = form(this.data);
    }

    const fixture = TestBed.createComponent(Forms);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const reactive = root.querySelector('.reactive') as HTMLInputElement;
    const signalInput = root.querySelector('.signal') as HTMLInputElement;

    expect(reactive.value).toBe('ama@akwaabalabs.example');
    expect((root.querySelector('.model') as HTMLInputElement).value).toBe('Kumasi');
    expect(signalInput.value).toBe('kofi@akwaabalabs.example');

    signalInput.value = 'esi@akwaabalabs.example';
    signalInput.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.data().email).toBe('esi@akwaabalabs.example');

    fixture.componentInstance.control.disable();
    expect(reactive.disabled).toBe(true);
  });

  describe('with a required signal-forms field', () => {
    @Component({
      imports: [Input, SignalFormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<input uiInput [formField]="model.name" />`,
    })
    class Required {
      readonly model = form(signal({ name: '' }), (s) => required(s.name));
    }

    async function setup() {
      const fixture = TestBed.createComponent(Required);
      await fixture.whenStable();
      const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
      return { fixture, input, form: fixture.componentInstance.model };
    }

    it('is not invalid on load, although the empty field is', async () => {
      const { input, form } = await setup();

      expect(form.name().invalid()).toBe(true);
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('is invalid after blur', async () => {
      const { fixture, input } = await setup();
      input.dispatchEvent(new Event('blur'));
      await fixture.whenStable();

      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('is invalid after submit, and valid again once filled', async () => {
      const { fixture, input, form } = await setup();
      await submit(form, async () => undefined);
      await fixture.whenStable();

      expect(input.getAttribute('aria-invalid')).toBe('true');

      input.value = 'Ama';
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });
  });
});
