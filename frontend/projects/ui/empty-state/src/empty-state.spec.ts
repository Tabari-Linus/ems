import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EmptyState } from './empty-state';

@Component({
  imports: [EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-empty-state
      heading="No people in Kumasi yet"
      [description]="description()"
      [headingLevel]="level()"
    >
      @if (withIcon()) {
        <svg uiEmptyStateIcon></svg>
      }
      <button uiEmptyStateActions type="button">Add person</button>
    </ui-empty-state>
    <ui-empty-state id="bare" heading="Nothing here" headingLevel="3" />
  `,
})
class Host {
  readonly description = signal<string | undefined>('Add the first person to this office.');
  readonly level = signal<2 | 3 | 4>(2);
  readonly withIcon = signal(true);
}

describe('EmptyState', () => {
  it('renders heading, description, icon and actions in their slots', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = (fixture.nativeElement as HTMLElement).querySelector(
      'ui-empty-state',
    ) as HTMLElement;

    expect(el.querySelector('h2')?.textContent).toBe('No people in Kumasi yet');
    expect(el.querySelector('p')?.textContent).toBe('Add the first person to this office.');
    expect(el.querySelector('.ui-empty-state__icon svg')).not.toBeNull();
    expect(el.querySelector('.ui-empty-state__icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('.ui-empty-state__actions button')?.textContent).toBe('Add person');
  });

  it.each([3, 4] as const)('renders an h%s when headingLevel is %s', async (level) => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.level.set(level);
    await fixture.whenStable();
    const el = (fixture.nativeElement as HTMLElement).querySelector(
      'ui-empty-state',
    ) as HTMLElement;
    expect(el.querySelector(`h${level}`)?.textContent).toBe('No people in Kumasi yet');
    expect(el.querySelector('h2')).toBeNull();
  });

  it('omits the description when not given; accepts a string heading level', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.description.set(undefined);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('ui-empty-state p')).toBeNull();
    expect(root.querySelector('#bare h3')?.textContent).toBe('Nothing here');
  });
});
