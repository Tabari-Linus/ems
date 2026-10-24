import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Icon } from './icon';
import { EMS_ICONS, ICON_NAMES, type IconName } from './registry';

@Component({
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ui-icon [name]="name()" [size]="size()" [label]="label()" />`,
})
class Host {
  readonly name = signal<IconName>('search');
  readonly size = signal<number | string | undefined>(20);
  readonly label = signal<string | undefined>(undefined);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const icon = (fixture.nativeElement as HTMLElement).querySelector('ui-icon') as HTMLElement;
  const update = async (change: (host: Host) => void) => {
    change(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { icon, update };
}

describe('Icon', () => {
  it('is decorative without a label', async () => {
    const { icon } = await setup();

    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.hasAttribute('role')).toBe(false);
    expect(icon.hasAttribute('aria-label')).toBe(false);
    expect(icon.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('is a labelled image with a label', async () => {
    const { icon, update } = await setup();
    await update((h) => h.label.set('Search'));

    expect(icon.getAttribute('role')).toBe('img');
    expect(icon.getAttribute('aria-label')).toBe('Search');
    expect(icon.hasAttribute('aria-hidden')).toBe(false);
  });

  it('treats an empty label as decorative', async () => {
    const { icon, update } = await setup();
    await update((h) => h.label.set(''));

    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.hasAttribute('aria-label')).toBe(false);
  });

  it('renders the named Lucide icon at the requested size', async () => {
    const { icon, update } = await setup();
    const svg = () => icon.querySelector('svg') as SVGSVGElement;

    expect(icon.dataset['icon']).toBe('search');
    expect(svg().getAttribute('width')).toBe('20');
    expect(svg().querySelectorAll('path, circle, line, rect, polyline, polygon').length).toBe(
      EMS_ICONS.search.node.length,
    );

    await update((h) => {
      h.name.set('x');
      h.size.set(16);
    });
    expect(icon.dataset['icon']).toBe('x');
    expect(svg().getAttribute('width')).toBe('16');
    expect(svg().getAttribute('height')).toBe('16');
  });

  it('maps size tokens to the icon scale and inherits the size from CSS without one', async () => {
    const { icon, update } = await setup();
    const sizeVar = () => icon.style.getPropertyValue('--ui-icon-size');
    const svg = () => icon.querySelector('svg') as SVGSVGElement;

    expect(sizeVar()).toBe('20px');

    await update((h) => h.size.set('sm'));
    expect(sizeVar()).toBe('var(--ems-icon-size-sm)');
    expect(svg().getAttribute('width')).toBe('16');

    await update((h) => h.size.set('lg'));
    expect(sizeVar()).toBe('var(--ems-icon-size-lg)');
    expect(svg().getAttribute('width')).toBe('24');

    await update((h) => h.size.set('1em'));
    expect(sizeVar()).toBe('1em');
    expect(svg().getAttribute('width')).toBe('20');

    await update((h) => h.size.set(undefined));
    expect(sizeVar()).toBe('');
  });

  it('exposes a sorted list of curated names', () => {
    expect(ICON_NAMES).toEqual([...Object.keys(EMS_ICONS)].sort());
    expect(ICON_NAMES).toContain('check');
  });
});
