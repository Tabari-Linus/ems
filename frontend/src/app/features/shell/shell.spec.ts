import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ThemeService } from '@ems/ui/theme';
import { ToastService } from '@ems/ui/toast';
import { press } from '../../../../projects/ui/testing/keyboard';
import { AuthService } from '../../core/services/auth.service';
import { SessionStore } from '../../core/services/session.store';
import { meWith, provideMe } from '../../testing/session';
import { Shell } from './shell';

describe('Shell', () => {
  let auth: { logout: ReturnType<typeof vi.fn>; logoutAll: ReturnType<typeof vi.fn> };

  async function render(permissions: string[]) {
    auth = { logout: vi.fn(() => Promise.resolve()), logoutAll: vi.fn(() => Promise.resolve()) };
    TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        provideMe(meWith(permissions)),
        { provide: AuthService, useValue: auth },
      ],
    });
    await TestBed.inject(SessionStore).load();
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  const navLabels = (el: HTMLElement) =>
    Array.from(el.querySelectorAll('a[uiNavItem]')).map((a) => a.textContent?.trim());

  async function openMenu(el: HTMLElement, fixture: { whenStable: () => Promise<unknown> }) {
    const trigger = el.querySelector<HTMLButtonElement>('button[uiShellUser]')!;
    trigger.focus();
    press('Enter');
    await fixture.whenStable();
    return document.querySelector('ui-menu') as HTMLElement;
  }

  afterEach(() => document.querySelectorAll('.cdk-overlay-container').forEach((n) => n.remove()));

  it('shows Home and People; My profile lives in the user menu only', async () => {
    const { el } = await render(['VIEW_SELF']);
    expect(navLabels(el)).toEqual(['Home', 'People']);
  });

  it('adds Settings at the bottom for admins', async () => {
    const { el } = await render(['VIEW_ADMIN', 'MANAGE_ADMIN']);
    expect(navLabels(el)).toEqual(['Home', 'People', 'Settings']);
    expect(el.querySelector('nav[aria-label="Workspace"]')?.textContent).toContain('Settings');
  });

  it('names the user on the account button', async () => {
    const { el } = await render([]);
    expect(el.querySelector('button[uiShellUser]')?.textContent).toContain('Ama Mensah');
  });

  it('searches People from the top bar', async () => {
    const { fixture, el } = await render([]);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const input = el.querySelector<HTMLInputElement>('ui-search-input input')!;
    input.value = '  kofi ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    el.querySelector('form[role=search]')!.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(navigate).toHaveBeenCalledWith(['/people'], { queryParams: { q: 'kofi' } });

    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    el.querySelector('form[role=search]')!.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(navigate).toHaveBeenLastCalledWith(['/people'], { queryParams: {} });
  });

  it('user menu: profile, change password, sign out, sign out everywhere', async () => {
    const { fixture, el } = await render(['VIEW_SELF']);
    const menu = await openMenu(el, fixture);
    const items = Array.from(menu.querySelectorAll<HTMLButtonElement>('button')).map((b) =>
      b.textContent?.trim(),
    );
    expect(items).toEqual(['My profile', 'Change password', 'Sign out', 'Sign out of all devices']);
  });

  it('toggles light and dark from the top bar', async () => {
    const { fixture, el } = await render([]);
    const theme = TestBed.inject(ThemeService);
    theme.setTheme('light');
    await fixture.whenStable();
    const toggle = el.querySelector<HTMLButtonElement>('button[uiShellActions]')!;
    expect(toggle.getAttribute('aria-label')).toBe('Switch to dark theme');

    toggle.click();
    await fixture.whenStable();
    expect(theme.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(toggle.getAttribute('aria-label')).toBe('Switch to light theme');

    toggle.click();
    await fixture.whenStable();
    expect(theme.theme()).toBe('light');
    theme.setTheme('system');
  });

  it('navigates from the menu and signs out', async () => {
    const { fixture, el } = await render(['VIEW_SELF']);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const click = async (label: string) => {
      const menu = await openMenu(el, fixture);
      (
        Array.from(menu.querySelectorAll('button')).find(
          (b) => b.textContent?.trim() === label,
        ) as HTMLButtonElement
      ).click();
      await fixture.whenStable();
    };
    await click('My profile');
    expect(navigate).toHaveBeenCalledWith('/my-profile');
    await click('Change password');
    expect(navigate).toHaveBeenCalledWith('/change-password');
    await click('Sign out');
    expect(auth.logout).toHaveBeenCalled();
    await click('Sign out of all devices');
    expect(auth.logoutAll).toHaveBeenCalled();
  });

  it('tells the user when signing out everywhere fails', async () => {
    const { fixture, el } = await render([]);
    const error = vi.spyOn(TestBed.inject(ToastService), 'error');
    auth.logoutAll.mockImplementation(() => Promise.reject(new Error('offline')));
    const menu = await openMenu(el, fixture);
    (
      Array.from(menu.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('all devices'),
      ) as HTMLButtonElement
    ).click();
    await fixture.whenStable();
    await vi.waitFor(() => expect(error).toHaveBeenCalled());
  });
});
