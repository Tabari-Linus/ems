import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  Avatar,
  avatarInitials,
  avatarTintFor,
  type AvatarStatus,
  type AvatarTint,
} from './avatar';

@Component({
  imports: [Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ui-avatar
    [name]="name()"
    [src]="src()"
    [tint]="tint()"
    [tintKey]="tintKey()"
    [status]="status()"
    [decorative]="decorative()"
    size="xl"
  />`,
})
class Host {
  readonly name = signal('Ama Mensah');
  readonly src = signal<string | null>(null);
  readonly tint = signal<AvatarTint | null>(null);
  readonly tintKey = signal<string | null>(null);
  readonly status = signal<AvatarStatus | null>(null);
  readonly decorative = signal(false);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const el = (fixture.nativeElement as HTMLElement).querySelector('ui-avatar') as HTMLElement;
  const update = async (change: (h: Host) => void) => {
    change(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { el, update };
}

describe('avatarInitials', () => {
  it.each([
    ['Ama Mensah', 'AM'],
    ['Ama K. Mensah', 'AM'],
    ['  kwame  ', 'K'],
    ['', '?'],
    [null, '?'],
    ['élise ödegaard', 'ÉÖ'],
  ])('%s → %s', (name, expected) => {
    expect(avatarInitials(name)).toBe(expected);
  });
});

describe('avatarTintFor', () => {
  it('is stable and within 1–6', () => {
    const tint = avatarTintFor('platform-engineering');
    expect(tint).toBe(avatarTintFor('platform-engineering'));
    for (const key of ['a', 'Design', 'Finance', '', null, undefined]) {
      const t = avatarTintFor(key);
      expect(t).toBeGreaterThanOrEqual(1);
      expect(t).toBeLessThanOrEqual(6);
    }
  });
});

describe('Avatar', () => {
  it('renders initials as an image named after the person', async () => {
    const { el } = await setup();
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Ama Mensah');
    expect(el.textContent?.trim()).toBe('AM');
    expect(el.dataset['size']).toBe('xl');
    expect(el.dataset['tint']).toBe(String(avatarTintFor('Ama Mensah')));
  });

  it('prefers an explicit tint, then the tint key', async () => {
    const { el, update } = await setup();
    await update((h) => h.tintKey.set('design'));
    expect(el.dataset['tint']).toBe(String(avatarTintFor('design')));
    await update((h) => h.tint.set(5));
    expect(el.dataset['tint']).toBe('5');
  });

  it('adds the status to the name and draws a dot', async () => {
    const { el, update } = await setup();
    await update((h) => h.status.set('pending'));
    expect(el.getAttribute('aria-label')).toBe('Ama Mensah, Pending');
    expect(el.querySelector('.ui-avatar__status')?.getAttribute('data-status')).toBe('pending');
  });

  it('falls back to a generic name when blank', async () => {
    const { el, update } = await setup();
    await update((h) => h.name.set('  '));
    expect(el.getAttribute('aria-label')).toBe('Unknown person');
  });

  it('is hidden from assistive technology when decorative', async () => {
    const { el, update } = await setup();
    await update((h) => h.decorative.set(true));
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-label')).toBe(false);
  });

  it('shows the photo, falls back to initials on error, and retries a new src', async () => {
    const { el, update } = await setup();
    await update((h) => h.src.set('/photo.png'));
    const img = el.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('alt')).toBe('');
    img.dispatchEvent(new Event('error'));
    await update(() => undefined);
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent?.trim()).toBe('AM');

    await update((h) => h.src.set('/other.png'));
    expect(el.querySelector('img')).not.toBeNull();
  });
});
