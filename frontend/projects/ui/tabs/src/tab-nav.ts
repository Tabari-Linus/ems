import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Routed pill tabs: a `<nav>` of links where the current page is a soft indigo pill.
 * Each link is an `a[uiTab]`; mark the current one with `aria-current="page"`, or let the router
 * do it: `routerLinkActive ariaCurrentWhenActive="page"`. Give the nav an `aria-label`.
 *
 * These are links, not an ARIA tablist: each tab is its own URL. For panels that switch in
 * place use `ui-tabs` instead.
 *
 * @example
 * <nav uiTabNav aria-label="Settings sections">
 *   <a uiTab routerLink="companies" routerLinkActive ariaCurrentWhenActive="page">Companies</a>
 * </nav>
 */
@Component({
  // Attribute selector on purpose: the host stays a native <nav> landmark.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'nav[uiTabNav]',
  exportAs: 'uiTabNav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: `
    @layer components {
      :host {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ems-space-1);
        min-inline-size: 0;
      }
    }
  `,
  host: { class: 'ui-tab-nav' },
})
export class TabNav {}

/** A routed tab link inside `nav[uiTabNav]`. Current page = `aria-current="page"`. */
@Component({
  // Attribute selector on purpose: the host stays a native <a> (link semantics, routerLink).
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'a[uiTab]',
  exportAs: 'uiTab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styleUrl: './tab.css',
  host: { class: 'ui-tab' },
})
export class TabLink {}
