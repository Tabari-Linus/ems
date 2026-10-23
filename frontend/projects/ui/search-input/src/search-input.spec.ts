import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField } from '@ems/ui/form-field';
import { SearchInput, type ShortcutPlatform } from './search-input';

@Component({
  imports: [SearchInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-search-input
      placeholder="Search people, offices, requests"
      name="q"
      [debounce]="300"
      [shortcut]="shortcut()"
      [platform]="platform()"
      [disabled]="disabled()"
      [(value)]="value"
      (query)="queries.push($event)"
    />
  `,
})
class Host {
  readonly value = signal('');
  readonly shortcut = signal(true);
  readonly platform = signal<ShortcutPlatform>('mac');
  readonly disabled = signal(false);
  readonly queries: string[] = [];
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  document.body.appendChild(root);
  const input = root.querySelector('input') as HTMLInputElement;
  const type = (text: string) => {
    input.value = text;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const update = (change: (host: Host) => void) => {
    change(fixture.componentInstance);
    fixture.detectChanges();
  };
  const key = (target: EventTarget, init: KeyboardEventInit) => {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };
  return { fixture, host: fixture.componentInstance, root, input, type, update, key };
}

describe('SearchInput', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('is a named search field with a decorative icon and a platform shortcut hint', async () => {
    const { root, input, update } = await setup();
    expect(input.type).toBe('search');
    expect(input.getAttribute('aria-label')).toBe('Search');
    expect(input.placeholder).toBe('Search people, offices, requests');
    expect(input.name).toBe('q');
    expect(input.getAttribute('aria-keyshortcuts')).toBe('Meta+K');
    const kbd = root.querySelector('kbd') as HTMLElement;
    expect(kbd.textContent).toBe('⌘K');
    expect(kbd.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');

    update((h) => h.platform.set('other'));
    expect(root.querySelector('kbd')?.textContent).toBe('Ctrl K');
    expect(input.getAttribute('aria-keyshortcuts')).toBe('Control+K');

    update((h) => h.shortcut.set(false));
    expect(root.querySelector('kbd')).toBeNull();
    expect(input.hasAttribute('aria-keyshortcuts')).toBe(false);
  });

  it('emits a trimmed, debounced query once typing pauses', async () => {
    const { host, type } = await setup();
    vi.useFakeTimers();
    type('A');
    type('Ama ');
    vi.advanceTimersByTime(299);
    expect(host.queries).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(host.queries).toEqual(['Ama']);
    expect(host.value()).toBe('Ama ');

    // Same trimmed text again does not re-emit.
    type('Ama');
    vi.advanceTimersByTime(300);
    expect(host.queries).toEqual(['Ama']);
  });

  it('Enter emits immediately; Escape and the clear button clear and emit empty', async () => {
    const { host, root, input, type, key } = await setup();
    vi.useFakeTimers();
    type('Kumasi');
    key(input, { key: 'Enter' });
    expect(host.queries).toEqual(['Kumasi']);

    // While there is text the clear button replaces the shortcut hint.
    expect(root.querySelector('kbd')).toBeNull();
    const clear = root.querySelector('button') as HTMLButtonElement;
    expect(clear.getAttribute('aria-label')).toBe('Clear search');
    clear.click();
    expect(host.value()).toBe('');
    expect(host.queries).toEqual(['Kumasi', '']);
    expect(document.activeElement).toBe(input);

    type('Accra');
    const escape = key(input, { key: 'Escape' });
    expect(escape.defaultPrevented).toBe(true);
    expect(host.value()).toBe('');

    // Escape on an empty field is left alone (e.g. for a dialog to close).
    const idle = key(input, { key: 'Escape' });
    expect(idle.defaultPrevented).toBe(false);
  });

  it('⌘K focuses the field from anywhere; ignored when disabled or without the shortcut', async () => {
    const { input, key, update } = await setup();
    const event = key(document, { key: 'k', metaKey: true });
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input);

    input.blur();
    expect(key(document, { key: 'k', ctrlKey: true }).defaultPrevented).toBe(false);
    expect(key(document, { key: 'k', metaKey: true, shiftKey: true }).defaultPrevented).toBe(false);

    update((h) => h.disabled.set(true));
    expect(key(document, { key: 'k', metaKey: true }).defaultPrevented).toBe(false);
    expect(input.disabled).toBe(true);

    update((h) => {
      h.disabled.set(false);
      h.shortcut.set(false);
    });
    expect(key(document, { key: 'k', metaKey: true }).defaultPrevented).toBe(false);
  });

  it('inside a form field it is labelled by the field, and works with reactive forms', async () => {
    @Component({
      imports: [SearchInput, FormField, ReactiveFormsModule],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <ui-form-field label="Find a colleague">
          <ui-search-input [formControl]="control" platform="auto" shortcut />
        </ui-form-field>
      `,
    })
    class Forms {
      readonly control = new FormControl<string | null>('Esi');
    }

    const fixture = TestBed.createComponent(Forms);
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector('input') as HTMLInputElement;
    expect(input.hasAttribute('aria-label')).toBe(false);
    expect((root.querySelector('label') as HTMLLabelElement).htmlFor).toBe(input.id);
    expect(input.value).toBe('Esi');

    input.value = 'Esi M';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.control.value).toBe('Esi M');
    input.dispatchEvent(new Event('blur'));
    expect(fixture.componentInstance.control.touched).toBe(true);

    fixture.componentInstance.control.setValue(null);
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(input.value).toBe('');
    expect(input.disabled).toBe(true);
    // jsdom is not a Mac.
    expect(root.querySelector('kbd')?.textContent).toBe('Ctrl K');
  });
});
