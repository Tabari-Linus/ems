import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Input } from '@ems/ui/input';
import { FormField } from './form-field';
import { injectFormFieldControl, uniqueId } from './form-field-control';

@Component({
  imports: [FormField, Input],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-form-field label="Work email" [hint]="hint()" [error]="error()" [required]="required()">
      <a uiFormFieldAside href="#help">Need help?</a>
      <input uiInput type="email" />
    </ui-form-field>
  `,
})
class Host {
  readonly hint = signal<string | null>('We send sign-in links here.');
  readonly error = signal<string | null>(null);
  readonly required = signal(false);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const update = async (change: (host: Host) => void) => {
    change(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return {
    root,
    update,
    label: () => root.querySelector('label') as HTMLLabelElement,
    control: () => root.querySelector('input') as HTMLInputElement,
    hint: () => root.querySelector('.ui-form-field__hint'),
    error: () => root.querySelector('.ui-form-field__error'),
  };
}

describe('FormField', () => {
  it('points the label at the projected control and describes it with the hint', async () => {
    const { label, control, hint, root } = await setup();

    expect(label().textContent?.trim()).toBe('Work email');
    expect(control().id).toBeTruthy();
    expect(label().htmlFor).toBe(control().id);
    expect(hint()?.textContent?.trim()).toBe('We send sign-in links here.');
    expect(control().getAttribute('aria-describedby')).toBe(hint()?.id);
    expect(control().hasAttribute('aria-invalid')).toBe(false);
    expect(root.querySelector('[uiFormFieldAside]')?.textContent).toBe('Need help?');
  });

  it('shows an error instead of the hint, marks the control invalid and announces it', async () => {
    const { control, hint, error, root, update } = await setup();

    await update((h) => h.error.set('Enter a work email like name@akwaabalabs.example'));

    expect(hint()).toBeNull();
    expect(error()?.textContent?.trim()).toBe('Enter a work email like name@akwaabalabs.example');
    expect(error()?.getAttribute('role')).toBe('alert');
    expect(control().getAttribute('aria-describedby')).toBe(error()?.id);
    expect(control().getAttribute('aria-invalid')).toBe('true');
    expect(root.querySelector('ui-form-field')?.hasAttribute('data-invalid')).toBe(true);

    await update((h) => h.error.set(null));
    expect(error()).toBeNull();
    expect(control().hasAttribute('aria-invalid')).toBe(false);
  });

  it('has no describedby without hint or error', async () => {
    const { control, update } = await setup();
    await update((h) => h.hint.set(null));
    expect(control().hasAttribute('aria-describedby')).toBe(false);
  });

  it('shows a decorative required marker and sets aria-required', async () => {
    const { label, control, update } = await setup();
    expect(label().querySelector('.ui-form-field__required')).toBeNull();

    await update((h) => h.required.set(true));
    const marker = label().querySelector('.ui-form-field__required');
    expect(marker?.getAttribute('aria-hidden')).toBe('true');
    expect(control().getAttribute('aria-required')).toBe('true');
  });

  it('does not announce an error that is present on first render', async () => {
    @Component({
      imports: [FormField, Input],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<ui-form-field label="Phone" error="Enter the full number"
        ><input uiInput
      /></ui-form-field>`,
    })
    class InitialError {}

    const fixture = TestBed.createComponent(InitialError);
    await fixture.whenStable();
    const error = (fixture.nativeElement as HTMLElement).querySelector('.ui-form-field__error');
    expect(error?.textContent?.trim()).toBe('Enter the full number');
    expect(error?.hasAttribute('role')).toBe(false);
  });

  it('keeps a control id that was set by the author', async () => {
    @Component({
      imports: [FormField, Input],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<ui-form-field label="Department"
        ><input uiInput id="department"
      /></ui-form-field>`,
    })
    class OwnId {}

    const fixture = TestBed.createComponent(OwnId);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('input')?.id).toBe('department');
    expect(root.querySelector('label')?.htmlFor).toBe('department');
  });
});

describe('injectFormFieldControl', () => {
  it('without a field: no id unless a prefix is given, own invalid only', async () => {
    @Component({
      selector: 'ui-probe',
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Probe {
      readonly bare = injectFormFieldControl();
      readonly prefixed = injectFormFieldControl(() => true, 'ui-probe');
    }

    const fixture = TestBed.createComponent(Probe);
    const probe = fixture.componentInstance;
    expect(probe.bare.field).toBeNull();
    expect(probe.bare.id()).toBeNull();
    expect(probe.bare.invalid()).toBe(false);
    expect(probe.bare.describedBy()).toBeNull();
    expect(probe.bare.required()).toBe(false);
    expect(probe.prefixed.id()).toMatch(/^ui-probe-\d+$/);
    expect(probe.prefixed.invalid()).toBe(true);
  });

  it('uniqueId increments', () => {
    expect(uniqueId('x')).not.toBe(uniqueId('x'));
  });
});
