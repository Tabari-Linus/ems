import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { SelectOption } from '@ems/ui/select';
import { FilterPill } from './filter-pill';

const OFFICES: SelectOption<string>[] = [
  { value: 'acc', label: 'Accra' },
  { value: 'kum', label: 'Kumasi' },
  { value: 'tak', label: 'Takoradi' },
];

@Component({
  imports: [FilterPill],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-filter-pill
      class="single"
      label="Office"
      [options]="offices"
      [disabled]="disabled()"
      [(value)]="office"
      (changed)="changes.push($event)"
    />
    <ui-filter-pill class="multi" label="Office" multiple [options]="offices" [(values)]="many" />
    <button type="button" class="outside">Outside</button>
  `,
})
class Host {
  readonly offices = OFFICES;
  readonly office = signal<string | null>(null);
  readonly many = signal<readonly string[]>([]);
  readonly disabled = signal(false);
  readonly changes: unknown[] = [];
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
  const single = root.querySelector('.single button') as HTMLButtonElement;
  const multi = root.querySelector('.multi button') as HTMLButtonElement;
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
  return { fixture, host: fixture.componentInstance, root, single, multi, listbox, options, key };
}

describe('FilterPill', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('shows "Office · All" with a readable name and popup semantics', async () => {
    const { single } = await setup();
    expect(single.textContent?.trim()).toBe('Office·All');
    expect(single.getAttribute('aria-label')).toBe('Office: All');
    expect(single.querySelector('.ui-filter-pill__dot')?.getAttribute('aria-hidden')).toBe('true');
    expect(single.getAttribute('aria-haspopup')).toBe('listbox');
    expect(single.getAttribute('aria-expanded')).toBe('false');
    expect(single.hasAttribute('data-active')).toBe(false);
  });

  it('single: opens with All selected, choosing closes and tints the pill', async () => {
    const { fixture, host, single, listbox, options } = await setup();
    single.click();
    await settle(fixture);

    expect(single.getAttribute('aria-expanded')).toBe('true');
    expect(single.getAttribute('aria-controls')).toBe(listbox()?.id);
    expect(listbox()?.getAttribute('aria-label')).toBe('Office');
    expect(options().map((o) => o.textContent?.trim())).toEqual([
      'All',
      'Accra',
      'Kumasi',
      'Takoradi',
    ]);
    expect(options()[0].getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(options()[0]);

    options()[2].click();
    await settle(fixture);
    expect(host.office()).toBe('kum');
    expect(host.changes).toEqual(['kum']);
    expect(listbox()).toBeNull();
    expect(document.activeElement).toBe(single);
    expect(single.querySelector('.ui-filter-pill__summary')?.textContent).toBe('Kumasi');
    expect(single.hasAttribute('data-active')).toBe(true);

    // "All" resets the filter.
    single.click();
    await settle(fixture);
    options()[0].click();
    await settle(fixture);
    expect(host.office()).toBeNull();
    expect(single.hasAttribute('data-active')).toBe(false);
  });

  it('keyboard: ArrowDown opens, End + Enter chooses, Escape and Tab close', async () => {
    const { fixture, host, single, listbox, options, key } = await setup();
    await key(single, 'ArrowDown');
    expect(listbox()).not.toBeNull();
    await key(listbox() as HTMLElement, 'End');
    expect(document.activeElement).toBe(options()[3]);
    await key(listbox() as HTMLElement, 'Enter');
    expect(host.office()).toBe('tak');
    expect(listbox()).toBeNull();

    await key(single, 'ArrowUp');
    await key(listbox() as HTMLElement, 'Escape');
    expect(listbox()).toBeNull();
    expect(document.activeElement).toBe(single);

    single.click();
    await settle(fixture);
    await key(listbox() as HTMLElement, 'Tab');
    expect(listbox()).toBeNull();
  });

  it('multiple: toggles stay open, shows a count, All clears', async () => {
    const { fixture, host, multi, listbox, options, root } = await setup();
    multi.click();
    await settle(fixture);
    expect(listbox()?.getAttribute('aria-multiselectable')).toBe('true');

    options()[1].click();
    await settle(fixture);
    expect(host.many()).toEqual(['acc']);
    expect(listbox()).not.toBeNull();
    expect(multi.querySelector('.ui-filter-pill__summary')?.textContent).toBe('Accra');

    options()[2].click();
    await settle(fixture);
    expect(host.many()).toEqual(['acc', 'kum']);
    expect(multi.querySelector('.ui-filter-pill__summary')?.textContent).toBe('2 selected');
    expect(options()[0].getAttribute('aria-selected')).toBe('false');

    options()[0].click();
    await settle(fixture);
    expect(host.many()).toEqual([]);
    expect(multi.querySelector('.ui-filter-pill__summary')?.textContent).toBe('All');

    // Outside click closes without moving focus back.
    (root.querySelector('.outside') as HTMLElement).click();
    await settle(fixture);
    expect(listbox()).toBeNull();
  });

  it('disabled pill does not open', async () => {
    const { fixture, host, single, listbox } = await setup();
    host.disabled.set(true);
    await settle(fixture);
    expect(single.disabled).toBe(true);
    single.click();
    await settle(fixture);
    expect(listbox()).toBeNull();
  });

  it('works with reactive forms in single and multiple mode', async () => {
    @Component({
      imports: [FilterPill, ReactiveFormsModule],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <ui-filter-pill class="one" label="Office" [options]="offices" [formControl]="one" />
        <ui-filter-pill
          class="many"
          label="Office"
          multiple
          [options]="offices"
          [formControl]="many"
        />
      `,
    })
    class Forms {
      readonly offices = OFFICES;
      readonly one = new FormControl<string | null>('acc');
      readonly many = new FormControl<string[] | null>(['kum', 'tak']);
    }

    const fixture = TestBed.createComponent(Forms);
    document.body.appendChild(fixture.nativeElement);
    await settle(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const one = root.querySelector('.one button') as HTMLButtonElement;
    const many = root.querySelector('.many button') as HTMLButtonElement;
    expect(one.textContent).toContain('Accra');
    expect(many.textContent).toContain('2 selected');

    one.click();
    await settle(fixture);
    document.querySelectorAll<HTMLElement>('[role="option"]')[3].click();
    await settle(fixture);
    expect(fixture.componentInstance.one.value).toBe('tak');
    expect(fixture.componentInstance.one.touched).toBe(true);

    fixture.componentInstance.many.setValue(null);
    fixture.componentInstance.one.setValue(null);
    fixture.componentInstance.one.disable();
    await settle(fixture);
    expect(many.textContent).toContain('All');
    expect(one.textContent).toContain('All');
    expect(one.disabled).toBe(true);
  });
});
