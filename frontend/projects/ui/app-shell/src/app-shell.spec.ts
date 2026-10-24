import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppShell, APP_SHELL_COMPACT_QUERY } from './app-shell';
import { press } from '../../testing/keyboard';

@Component({
  imports: [AppShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-app-shell [(collapsed)]="collapsed" [(drawerOpen)]="open" [collapsible]="collapsible()">
      <a uiShellBrand href="#home">EMS</a>
      <a uiShellNav href="#people" id="people-link">People</a>
      <a uiShellFooter href="#settings">Settings</a>
      <input uiShellSearch aria-label="Search" />
      <button uiShellActions type="button">Help</button>
      <button uiShellUser type="button">Ama Mensah</button>
      <p>Page content</p>
    </ui-app-shell>
  `,
})
class Host {
  readonly collapsed = signal(false);
  readonly open = signal(false);
  readonly collapsible = signal(true);
}

type Listener = () => void;

/** Controllable matchMedia for the compact breakpoint. */
function mockMatchMedia(initial: boolean) {
  let listener: Listener | null = null;
  const query = {
    matches: initial,
    media: APP_SHELL_COMPACT_QUERY,
    addEventListener: (_: string, l: Listener) => (listener = l),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => query),
  );
  return {
    query,
    set(matches: boolean) {
      query.matches = matches;
      listener?.();
    },
  };
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const shell = root.querySelector('ui-app-shell') as HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const sidebar = () => shell.querySelector('.ui-app-shell__sidebar') as HTMLElement;
  const instance = fixture.debugElement.children[0].componentInstance as AppShell;
  return { fixture, root, shell, settle, sidebar, instance, host: fixture.componentInstance };
}

describe('AppShell', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders landmarks, slots and a skip link to main', async () => {
    mockMatchMedia(false);
    const { shell } = await setup();
    const skip = shell.querySelector('.ui-app-shell__skip') as HTMLAnchorElement;
    expect(skip.textContent?.trim()).toBe('Skip to content');
    expect(skip.getAttribute('href')).toBe('#main-content');
    expect(shell.querySelector('nav')?.getAttribute('aria-label')).toBe('Main');
    expect(shell.querySelector('nav #people-link')).not.toBeNull();
    expect(shell.querySelector('header .ui-app-shell__search input')).not.toBeNull();
    expect(shell.querySelector('header .ui-app-shell__actions')?.textContent).toContain('Help');
    expect(shell.querySelector('main')?.id).toBe('main-content');
    expect(shell.querySelector('main')?.textContent).toContain('Page content');
    expect(shell.dataset['sidebar']).toBe('expanded');
    expect(shell.dataset['layout']).toBe('wide');
    expect(shell.querySelector('.ui-app-shell__menu')).toBeNull();
  });

  it('skip link focuses main without navigating', async () => {
    mockMatchMedia(false);
    const { shell } = await setup();
    const skip = shell.querySelector('.ui-app-shell__skip') as HTMLAnchorElement;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    skip.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(shell.querySelector('main'));
  });

  it('collapses and expands on desktop', async () => {
    mockMatchMedia(false);
    const { shell, settle, host } = await setup();
    const toggle = () => shell.querySelector('.ui-app-shell__collapse') as HTMLButtonElement;
    expect(toggle().getAttribute('aria-label')).toBe('Collapse sidebar');
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    toggle().click();
    await settle();
    expect(host.collapsed()).toBe(true);
    expect(shell.dataset['sidebar']).toBe('collapsed');
    expect(toggle().getAttribute('aria-label')).toBe('Expand sidebar');

    host.collapsible.set(false);
    await settle();
    expect(shell.querySelector('.ui-app-shell__collapse')).toBeNull();
    expect(shell.dataset['sidebar']).toBe('expanded');
  });

  it('is an off-canvas drawer when compact: open, Escape, scrim, link click', async () => {
    const media = mockMatchMedia(true);
    const { shell, settle, sidebar, host } = await setup();
    expect(shell.dataset['layout']).toBe('compact');
    expect(shell.dataset['sidebar']).toBe('closed');
    expect(sidebar().hasAttribute('inert')).toBe(true);

    const menu = shell.querySelector('.ui-app-shell__menu') as HTMLButtonElement;
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    expect(menu.getAttribute('aria-controls')).toBe(sidebar().id);

    menu.click();
    await settle();
    expect(host.open()).toBe(true);
    expect(shell.dataset['sidebar']).toBe('open');
    expect(sidebar().getAttribute('role')).toBe('dialog');
    expect(sidebar().getAttribute('aria-modal')).toBe('true');
    expect(sidebar().hasAttribute('inert')).toBe(false);
    expect(shell.querySelector('.ui-app-shell__app')?.hasAttribute('inert')).toBe(true);
    expect(sidebar().contains(document.activeElement)).toBe(true);

    // Other keys are ignored; Escape closes and returns focus.
    press('a', sidebar());
    await settle();
    expect(host.open()).toBe(true);
    press('Escape', sidebar());
    await settle();
    expect(host.open()).toBe(false);
    expect(document.activeElement).toBe(shell.querySelector('.ui-app-shell__menu'));

    // Scrim closes.
    (shell.querySelector('.ui-app-shell__menu') as HTMLButtonElement).click();
    await settle();
    (shell.querySelector('.ui-app-shell__scrim') as HTMLElement).click();
    await settle();
    expect(host.open()).toBe(false);

    // Close button and following a link close it; clicks elsewhere don't.
    (shell.querySelector('.ui-app-shell__menu') as HTMLButtonElement).click();
    await settle();
    (shell.querySelector('.ui-app-shell__brand') as HTMLElement).click();
    expect(host.open()).toBe(true);
    (shell.querySelector('.ui-app-shell__close') as HTMLButtonElement).click();
    await settle();
    expect(host.open()).toBe(false);
    (shell.querySelector('.ui-app-shell__menu') as HTMLButtonElement).click();
    await settle();
    (shell.querySelector('#people-link') as HTMLAnchorElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );
    await settle();
    expect(host.open()).toBe(false);

    // Growing past the breakpoint closes the drawer.
    host.open.set(true);
    await settle();
    media.set(false);
    await settle();
    expect(host.open()).toBe(false);
    expect(shell.dataset['layout']).toBe('wide');
  });

  it('closeDrawer is a no-op when already closed', async () => {
    mockMatchMedia(true);
    const { instance, host } = await setup();
    instance.closeDrawer();
    expect(host.open()).toBe(false);
  });

  it('works without matchMedia (server, old browsers)', async () => {
    vi.stubGlobal('matchMedia', undefined);
    const { shell } = await setup();
    expect(shell.dataset['layout']).toBe('wide');
  });
});
