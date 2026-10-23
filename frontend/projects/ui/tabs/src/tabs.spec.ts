import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TabLink, TabNav } from './tab-nav';
import { TabPanel, Tabs } from './tabs';
import { press } from '../../testing/keyboard';

@Component({
  imports: [Tabs, TabPanel, TabNav, TabLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-tabs label="Profile sections" [(selectedIndex)]="selected">
      <ui-tab-panel label="Overview">Overview body</ui-tab-panel>
      <ui-tab-panel label="Job">Job body</ui-tab-panel>
      <ui-tab-panel label="Documents">Documents body</ui-tab-panel>
    </ui-tabs>
    <nav uiTabNav aria-label="Settings sections">
      <a uiTab href="#companies" aria-current="page">Companies</a>
      <a uiTab href="#offices">Offices</a>
    </nav>
  `,
})
class Host {
  readonly selected = signal(0);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const tabs = () => Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = () => Array.from(root.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const key = async (target: HTMLElement, k: string) => {
    press(k, target);
    await settle();
  };
  return { fixture, root, tabs, panels, settle, key, host: fixture.componentInstance };
}

describe('Tabs (in-page)', () => {
  it('builds a labelled tablist wired to its panels', async () => {
    const { root, tabs, panels } = await setup();
    expect(root.querySelector('[role="tablist"]')?.getAttribute('aria-label')).toBe(
      'Profile sections',
    );
    expect(tabs().map((t) => t.textContent?.trim())).toEqual(['Overview', 'Job', 'Documents']);
    const [first] = tabs();
    const [panel] = panels();
    expect(first.getAttribute('aria-selected')).toBe('true');
    expect(first.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(first.id);
    expect(panel.getAttribute('tabindex')).toBe('0');
    expect(panels().map((p) => p.hidden)).toEqual([false, true, true]);
    expect(tabs().map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
  });

  it('selects on click and updates the two-way index', async () => {
    const { tabs, panels, settle, host } = await setup();
    tabs()[2].click();
    await settle();
    expect(host.selected()).toBe(2);
    expect(panels()[2].hidden).toBe(false);
  });

  it('moves with arrows (wrapping), Home and End, and ignores other keys', async () => {
    const { tabs, key, host } = await setup();
    await key(tabs()[0], 'ArrowRight');
    expect(host.selected()).toBe(1);
    expect(document.activeElement).toBe(tabs()[1]);
    await key(tabs()[1], 'End');
    expect(host.selected()).toBe(2);
    await key(tabs()[2], 'ArrowRight');
    expect(host.selected()).toBe(0);
    await key(tabs()[0], 'ArrowLeft');
    expect(host.selected()).toBe(2);
    await key(tabs()[2], 'Home');
    expect(host.selected()).toBe(0);
    await key(tabs()[0], 'a');
    expect(host.selected()).toBe(0);
  });

  it('clamps an out-of-range index', async () => {
    const { panels, settle, host } = await setup();
    host.selected.set(10);
    await settle();
    expect(panels()[2].hidden).toBe(false);
  });
});

describe('TabNav / TabLink (routed)', () => {
  it('keeps native nav and links', async () => {
    const { root } = await setup();
    const nav = root.querySelector('nav') as HTMLElement;
    expect(nav.classList).toContain('ui-tab-nav');
    const links = nav.querySelectorAll('a');
    expect(links[0].classList).toContain('ui-tab');
    expect(links[0].getAttribute('aria-current')).toBe('page');
    expect(links[1].hasAttribute('aria-current')).toBe(false);
  });
});
