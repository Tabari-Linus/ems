import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Skeleton, type SkeletonShape } from './skeleton';

@Component({
  imports: [Skeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ui-skeleton [shape]="shape()" [lines]="lines()" />`,
})
class Host {
  readonly shape = signal<SkeletonShape>('text');
  readonly lines = signal(1);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const el = (fixture.nativeElement as HTMLElement).querySelector('ui-skeleton') as HTMLElement;
  const update = async (change: (h: Host) => void) => {
    change(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { el, update };
}

describe('Skeleton', () => {
  it('is hidden from assistive technology and renders one full line by default', async () => {
    const { el } = await setup();
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.dataset['shape']).toBe('text');
    const lines = el.querySelectorAll('.ui-skeleton__line');
    expect(lines).toHaveLength(1);
    expect(lines[0].getAttribute('data-width')).toBe('full-0');
  });

  it('renders N lines with a shorter last line; clamps invalid counts to 1', async () => {
    const { el, update } = await setup();
    await update((h) => h.lines.set(3));
    const lines = Array.from(el.querySelectorAll('.ui-skeleton__line'));
    expect(lines.map((l) => l.getAttribute('data-width'))).toEqual(['full-0', 'full-1', 'short']);

    await update((h) => h.lines.set(0));
    expect(el.querySelectorAll('.ui-skeleton__line')).toHaveLength(1);
  });

  it('renders avatar and card shapes', async () => {
    const { el, update } = await setup();
    await update((h) => h.shape.set('avatar'));
    expect(el.querySelector('.ui-skeleton__avatar')).not.toBeNull();
    expect(el.querySelector('.ui-skeleton__line')).toBeNull();

    await update((h) => h.shape.set('card'));
    expect(el.querySelector('.ui-skeleton__card .ui-skeleton__avatar')).not.toBeNull();
    expect(el.querySelectorAll('.ui-skeleton__card .ui-skeleton__line')).toHaveLength(3);
  });
});
