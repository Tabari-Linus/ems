import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Spinner, type SpinnerSize } from './spinner';

@Component({
  imports: [Spinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ui-spinner [label]="label()" [size]="size()" /><ui-spinner id="default" />`,
})
class Host {
  readonly label = signal('Loading people');
  readonly size = signal<SpinnerSize>('md');
}

describe('Spinner', () => {
  it('defaults to role="status" with a visually hidden "Loading" label', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const spinner = (fixture.nativeElement as HTMLElement).querySelector('#default') as HTMLElement;
    expect(spinner.getAttribute('role')).toBe('status');
    expect(spinner.dataset['size']).toBe('md');
    expect(spinner.querySelector('.ui-visually-hidden')?.textContent).toBe('Loading');
    expect(spinner.querySelector('.ui-spinner__arc')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('is decorative (aria-hidden, no role) when the label is empty; reflects size', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const spinner = (fixture.nativeElement as HTMLElement).querySelector(
      'ui-spinner',
    ) as HTMLElement;
    expect(spinner.textContent?.trim()).toBe('Loading people');

    fixture.componentInstance.label.set('');
    fixture.componentInstance.size.set('lg');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(spinner.hasAttribute('role')).toBe(false);
    expect(spinner.getAttribute('aria-hidden')).toBe('true');
    expect(spinner.querySelector('.ui-visually-hidden')).toBeNull();
    expect(spinner.dataset['size']).toBe('lg');
  });
});
