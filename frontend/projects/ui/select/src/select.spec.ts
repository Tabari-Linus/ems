import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { form, FormField as SignalFormField } from '@angular/forms/signals';
import { FormField } from '@ems/ui/form-field';
import { NativeSelect } from './native-select';
import { Select, type SelectOption } from './select';

const OFFICES: SelectOption<string>[] = [
  { value: 'acc', label: 'Accra' },
  { value: 'kum', label: 'Kumasi' },
  { value: 'tak', label: 'Takoradi', disabled: true },
  { value: 'tam', label: 'Tamale' },
];

@Component({
  imports: [Select, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-form-field label="Office" [error]="error()">
      <ui-select
        placeholder="Choose an office"
        [options]="options()"
        [clearable]="clearable()"
        [disabled]="disabled()"
        [(value)]="value"
      />
    </ui-form-field>
    <button type="button" class="outside">Outside</button>
  `,
})
class Host {
  readonly options = signal(OFFICES);
  readonly value = signal<string | null>(null);
  readonly clearable = signal(true);
  readonly disabled = signal(false);
  readonly error = signal<string | null>(null);
}

const KEY_CODES: Record<string, number> = {
  Tab: 9,
  Enter: 13,
  Escape: 27,
  End: 35,
  Home: 36,
  ArrowUp: 38,
  ArrowDown: 40,
};

const flush = () => new Promise<void>((resolve) => setTimeout(resolve));

async function settle(fixture: ComponentFixture<unknown>) {
  fixture.detectChanges();
  await fixture.whenStable();
  await flush();
  fixture.detectChanges();
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  document.body.appendChild(fixture.nativeElement);
  await settle(fixture);
  const root = fixture.nativeElement as HTMLElement;
  const trigger = root.querySelector('.ui-select__trigger') as HTMLButtonElement;
  const listbox = () => document.querySelector('[role="listbox"]') as HTMLElement | null;
  const options = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')];
  const key = async (target: Element, key: string) => {
    // CDK key managers read keyCode.
    const keyCode = KEY_CODES[key];
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key, keyCode, bubbles: true, cancelable: true }),
    );
    await settle(fixture);
  };
  const component = fixture.debugElement.query((el) => el.componentInstance instanceof Select)
    .componentInstance as Select<string>;
  return {
    fixture,
    host: fixture.componentInstance,
    root,
    trigger,
    listbox,
    options,
    key,
    component,
  };
}

describe('Select', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a closed trigger labelled by the field label and the value', async () => {
    const { root, trigger, listbox } = await setup();
    const label = root.querySelector('label') as HTMLLabelElement;
    const value = root.querySelector('.ui-select__value') as HTMLElement;

    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.hasAttribute('aria-controls')).toBe(false);
    expect(label.htmlFor).toBe(trigger.id);
    expect(trigger.getAttribute('aria-labelledby')).toBe(`${label.id} ${value.id}`);
    expect(value.textContent?.trim()).toBe('Choose an office');
    expect(value.hasAttribute('data-placeholder')).toBe(true);
    expect(listbox()).toBeNull();
    // Nothing to clear yet.
    expect(root.querySelector('.ui-select__clear')).toBeNull();
  });

  it('opens on click, focuses an option, chooses with a click and closes', async () => {
    const { fixture, host, trigger, listbox, options } = await setup();
    trigger.click();
    await settle(fixture);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(listbox()?.id);
    expect(options().map((o) => o.textContent?.trim())).toEqual([
      'Accra',
      'Kumasi',
      'Takoradi',
      'Tamale',
    ]);
    expect(options()[2].getAttribute('aria-disabled')).toBe('true');
    expect(document.activeElement).toBe(options()[0]);

    options()[1].click();
    await settle(fixture);
    expect(host.value()).toBe('kum');
    expect(listbox()).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(trigger.textContent).toContain('Kumasi');
  });

  it('keyboard: ArrowDown opens on the selected option, Arrow/End move, Enter chooses', async () => {
    const { fixture, host, trigger, options, key, listbox } = await setup();
    host.value.set('kum');
    await settle(fixture);

    await key(trigger, 'ArrowDown');
    expect(listbox()).not.toBeNull();
    expect(document.activeElement).toBe(options()[1]);
    expect(options()[1].getAttribute('aria-selected')).toBe('true');

    await key(listbox() as HTMLElement, 'ArrowDown');
    // Takoradi is disabled and skipped.
    expect(document.activeElement).toBe(options()[3]);
    await key(listbox() as HTMLElement, 'Home');
    expect(document.activeElement).toBe(options()[0]);
    await key(listbox() as HTMLElement, 'Enter');
    expect(host.value()).toBe('acc');
    expect(listbox()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('Escape closes without choosing; Tab closes and returns focus to the trigger', async () => {
    const { fixture, host, trigger, key, listbox } = await setup();
    await key(trigger, 'ArrowUp');
    expect(listbox()).not.toBeNull();
    await key(listbox() as HTMLElement, 'Escape');
    expect(listbox()).toBeNull();
    expect(host.value()).toBeNull();
    expect(document.activeElement).toBe(trigger);

    trigger.click();
    await settle(fixture);
    await key(listbox() as HTMLElement, 'Tab');
    expect(listbox()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('re-choosing the selected option closes; clicking outside closes; trigger click toggles', async () => {
    const { fixture, host, trigger, options, listbox, root, component } = await setup();
    host.value.set('acc');
    await settle(fixture);
    trigger.click();
    await settle(fixture);
    options()[0].click();
    await settle(fixture);
    expect(listbox()).toBeNull();
    expect(host.value()).toBe('acc');

    component.toggle();
    await settle(fixture);
    expect(component.open()).toBe(true);
    component.toggle();
    await settle(fixture);
    expect(component.open()).toBe(false);

    trigger.click();
    await settle(fixture);
    (root.querySelector('.outside') as HTMLElement).click();
    await settle(fixture);
    expect(listbox()).toBeNull();
  });

  it('clear button resets the value; disabled blocks opening; error marks invalid', async () => {
    const { fixture, host, root, trigger, listbox } = await setup();
    host.value.set('tam');
    await settle(fixture);
    const clear = root.querySelector('.ui-select__clear') as HTMLButtonElement;
    expect(clear.getAttribute('aria-label')).toBe('Clear selection');
    clear.click();
    await settle(fixture);
    expect(host.value()).toBeNull();
    expect(document.activeElement).toBe(trigger);

    host.error.set('Choose the office you work from');
    host.disabled.set(true);
    await settle(fixture);
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(trigger.disabled).toBe(true);
    trigger.click();
    await settle(fixture);
    expect(listbox()).toBeNull();
  });

  it('shows an empty message without options', async () => {
    const { fixture, host, trigger } = await setup();
    host.options.set([]);
    await settle(fixture);
    trigger.click();
    await settle(fixture);
    expect(document.querySelector('.ui-select__empty')?.textContent?.trim()).toBe('No options');
  });

  it('standalone: named by label; works with reactive and signal forms', async () => {
    @Component({
      imports: [Select, ReactiveFormsModule, SignalFormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <ui-select class="reactive" label="Office" [options]="offices" [formControl]="control" />
        <ui-select class="signal" label="Office" [options]="offices" [formField]="model.office" />
      `,
    })
    class Forms {
      readonly offices = OFFICES;
      readonly control = new FormControl<string | null>('acc');
      readonly data = signal({ office: 'kum' });
      readonly model = form(this.data);
    }

    const fixture = TestBed.createComponent(Forms);
    document.body.appendChild(fixture.nativeElement);
    await settle(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const reactive = root.querySelector('.reactive .ui-select__trigger') as HTMLButtonElement;
    const signalTrigger = root.querySelector('.signal .ui-select__trigger') as HTMLButtonElement;

    expect(reactive.getAttribute('aria-label')).toBe('Office, Accra');
    expect(reactive.hasAttribute('aria-labelledby')).toBe(false);
    expect(reactive.id).toMatch(/^ui-select-\d+$/);
    expect(signalTrigger.textContent).toContain('Kumasi');

    reactive.click();
    await settle(fixture);
    (document.querySelectorAll<HTMLElement>('[role="option"]')[3] as HTMLElement).click();
    await settle(fixture);
    expect(fixture.componentInstance.control.value).toBe('tam');
    expect(fixture.componentInstance.control.touched).toBe(true);

    signalTrigger.click();
    await settle(fixture);
    (document.querySelectorAll<HTMLElement>('[role="option"]')[0] as HTMLElement).click();
    await settle(fixture);
    expect(fixture.componentInstance.data().office).toBe('acc');

    fixture.componentInstance.control.disable();
    await settle(fixture);
    expect(reactive.disabled).toBe(true);
    fixture.componentInstance.control.setValue(null);
    await settle(fixture);
    expect(reactive.textContent).toContain('Select');
  });
});

describe('NativeSelect', () => {
  it('styles a native select and wires it to the form field', async () => {
    @Component({
      imports: [NativeSelect, FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <ui-form-field label="Department" error="Choose a department" required>
          <select uiSelect size="sm">
            <option value="">Choose a department</option>
            <option value="eng">Engineering</option>
          </select>
        </ui-form-field>
        <select uiSelect class="bare" invalid>
          <option>One</option>
        </select>
      `,
    })
    class Native {}

    const fixture = TestBed.createComponent(Native);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const select = root.querySelector('select') as HTMLSelectElement;
    const bare = root.querySelector('select.bare') as HTMLSelectElement;

    expect(select.classList).toContain('ui-native-select');
    expect(select.options.length).toBe(2);
    expect((root.querySelector('label') as HTMLLabelElement).htmlFor).toBe(select.id);
    expect(select.getAttribute('aria-invalid')).toBe('true');
    expect(select.getAttribute('aria-required')).toBe('true');
    expect(select.getAttribute('aria-describedby')).toBeTruthy();
    expect(select.dataset['size']).toBe('sm');
    expect(bare.getAttribute('aria-invalid')).toBe('true');
    expect(bare.hasAttribute('id')).toBe(false);
  });
});
