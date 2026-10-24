import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PageHeader } from '@ems/ui/page-header';
import { TabLink, TabNav } from '@ems/ui/tabs';

/** Settings frame: page title, routed pill tabs, and the current section below. */
@Component({
  selector: 'app-settings',
  imports: [PageHeader, TabNav, TabLink, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <ui-page-header title="Settings" />
    <nav uiTabNav class="settings-tabs" aria-label="Settings sections">
      @for (tab of tabs; track tab.path) {
        <a uiTab [routerLink]="tab.path" routerLinkActive ariaCurrentWhenActive="page">{{
          tab.label
        }}</a>
      }
    </nav>
    <router-outlet />
  `,
  styles: `
    :host {
      display: block;
    }
    .settings-tabs {
      margin-block: var(--ems-space-5) var(--ems-space-6);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  protected readonly tabs = [
    { path: 'companies', label: 'Companies' },
    { path: 'offices', label: 'Offices' },
    { path: 'departments', label: 'Departments' },
    { path: 'positions', label: 'Positions' },
    { path: 'access-levels', label: 'Access levels' },
  ] as const;
}
