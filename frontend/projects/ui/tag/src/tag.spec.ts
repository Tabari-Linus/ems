import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Tag, type TagVariant } from './tag';

@Component({
  imports: [Tag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-tag
      [label]="label()"
      [variant]="variant()"
      [removable]="removable()"
      [removeLabel]="removeLabel()"
      (remove)="removed.set(removed() + 1)"
    />
  `,
})
class Host {
  readonly label = signal('Angular');
  readonly variant = signal<TagVariant>('neutral');
  readonly removable = signal(false);
  readonly removeLabel = signal<string | undefined>(undefined);
  readonly removed = signal(0);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const tag = (fixture.nativeElement as HTMLElement).querySelector('ui-tag') as HTMLElement;
  const update = async (change: (h: Host) => void) => {
    change(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { tag, host: fixture.componentInstance, update };
}

describe('Tag', () => {
  it('renders the label without a remove button by default', async () => {
    const { tag } = await setup();
    expect(tag.textContent?.trim()).toBe('Angular');
    expect(tag.dataset['variant']).toBe('neutral');
    expect(tag.querySelector('button')).toBeNull();
    expect(tag.hasAttribute('data-removable')).toBe(false);
  });

  it('removable: a button named "Remove {label}" emits remove', async () => {
    const { tag, host, update } = await setup();
    await update((h) => h.removable.set(true));

    const button = tag.querySelector('button') as HTMLButtonElement;
    expect(button.type).toBe('button');
    expect(button.getAttribute('aria-label')).toBe('Remove Angular');
    expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    button.click();
    expect(host.removed()).toBe(1);
  });

  it('removeLabel overrides the accessible name; variant is reflected', async () => {
    const { tag, update } = await setup();
    await update((h) => {
      h.removable.set(true);
      h.removeLabel.set('Remove skill Angular');
      h.variant.set('accent');
    });
    expect(tag.querySelector('button')?.getAttribute('aria-label')).toBe('Remove skill Angular');
    expect(tag.dataset['variant']).toBe('accent');
  });
});
