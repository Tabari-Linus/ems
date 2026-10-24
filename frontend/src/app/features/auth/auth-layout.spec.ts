import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from '@ems/ui/theme';
import { AuthLayout } from './auth-layout';

@Component({
  imports: [AuthLayout],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-auth-layout headingId="h"><h1 id="h">Sign in</h1></app-auth-layout>`,
})
class Host {}

describe('AuthLayout', () => {
  afterEach(() => TestBed.inject(ThemeService).setTheme('system'));

  it('frames the card with the brand, a main landmark and the footer', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-brand')?.textContent).toContain('EMS');
    expect(el.querySelector('main section')?.getAttribute('aria-labelledby')).toBe('h');
    expect(el.querySelector('footer')?.textContent).toContain('Ask People Operations');
  });

  it('switches between light and dark', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const [light, dark] = Array.from(el.querySelectorAll<HTMLButtonElement>('[role=group] button'));
    dark.click();
    await fixture.whenStable();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(dark.getAttribute('aria-pressed')).toBe('true');
    expect(light.getAttribute('aria-pressed')).toBe('false');
    light.click();
    await fixture.whenStable();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
