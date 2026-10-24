import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';

export type MenuItemVariant = 'default' | 'danger';

/**
 * Opens a `ui-menu` template from a button (WAI-ARIA APG *Menu Button*, via Angular CDK Menu):
 * sets `aria-haspopup="menu"` and `aria-expanded`; Enter, Space and ArrowDown open the menu with
 * focus on the first item, ArrowUp on the last; Escape closes it and returns focus here.
 *
 * @example
 * <button uiButton variant="secondary" [uiMenuTrigger]="actions">More actions</button>
 * <ng-template #actions><ui-menu>…</ui-menu></ng-template>
 */
@Directive({
  selector: '[uiMenuTrigger]',
  exportAs: 'uiMenuTrigger',
  hostDirectives: [
    {
      directive: CdkMenuTrigger,
      inputs: ['cdkMenuTriggerFor: uiMenuTrigger', 'cdkMenuPosition: uiMenuPosition'],
      outputs: ['cdkMenuOpened: menuOpened', 'cdkMenuClosed: menuClosed'],
    },
  ],
  host: { class: 'ui-menu-trigger' },
})
export class MenuTrigger {}

/**
 * The menu panel (`role="menu"`): ArrowUp/ArrowDown move between items (wrapping), Home/End jump,
 * typing a letter jumps to a matching item, Escape and Tab close it.
 */
@Component({
  selector: 'ui-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: CdkMenu, outputs: ['closed'] }],
  template: `<ng-content />`,
  styles: `
    @layer components {
      :host {
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        min-inline-size: var(--ems-size-popover-min-width);
        max-inline-size: calc(100vw - var(--ems-space-8));
        padding: var(--ems-space-1);
        border-radius: var(--ems-radius-lg);
        background-color: var(--ems-color-bg-raised);
        box-shadow: var(--ems-elevation-raised);
        color: var(--ems-color-text-primary);
        font-family: var(--ems-font-family-sans);
        font-size: var(--ems-type-body-size);
        line-height: var(--ems-type-body-line-height);
        outline: none;
        animation: ui-menu-in var(--ems-duration-base) var(--ems-easing-emphasized);
      }

      @media (prefers-reduced-motion: reduce) {
        :host {
          animation: none;
        }
      }

      @media (forced-colors: active) {
        :host {
          border: var(--ems-border-width-hairline) solid CanvasText;
        }
      }

      @keyframes ui-menu-in {
        from {
          opacity: 0;
          transform: translateY(calc(var(--ems-space-1) * -1));
        }
      }
    }
  `,
  host: { class: 'ui-menu' },
})
export class Menu {}

/**
 * A menu item on a native `<button>` (`role="menuitem"`). Use `(triggered)` for the action; it
 * fires on click, Enter and Space, after which the menu closes. `variant="danger"` for
 * destructive actions (put them last, after a separator, and confirm them).
 */
@Component({
  // Attribute selector on purpose: the host stays a native <button>.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[uiMenuItem]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CdkMenuItem,
      inputs: ['cdkMenuItemDisabled: disabled'],
      outputs: ['cdkMenuItemTriggered: triggered'],
    },
  ],
  template: `
    <span class="ui-menu-item__icon" aria-hidden="true"
      ><ng-content select="[uiMenuItemIcon]"
    /></span>
    <span class="ui-menu-item__label"><ng-content /></span>
  `,
  styles: `
    @layer components {
      :host {
        --_fg: var(--ems-color-text-primary);
        --_bg-active: var(--ems-color-accent-soft);
        --_fg-active: var(--ems-color-accent-soft-text);

        display: flex;
        align-items: center;
        gap: var(--ems-space-3);
        box-sizing: border-box;
        inline-size: 100%;
        min-block-size: var(--ems-control-md-height);
        margin: 0;
        padding-inline: var(--ems-space-3);
        border: 0;
        border-radius: var(--ems-radius-md);
        background: transparent;
        color: var(--_fg);
        font: inherit;
        font-weight: var(--ems-type-body-strong-weight);
        text-align: start;
        white-space: nowrap;
        cursor: pointer;
        outline: none;
      }

      :host([data-variant='danger']) {
        --_fg: var(--ems-color-status-danger-text);
        --_bg-active: var(--ems-color-status-danger-bg);
        --_fg-active: var(--ems-color-status-danger-text);
      }

      :host(:hover),
      :host(:focus) {
        background-color: var(--_bg-active);
        color: var(--_fg-active);
      }

      :host(:focus-visible) {
        outline: var(--ems-focus-ring-width) solid var(--ems-focus-ring-color);
        outline-offset: calc(var(--ems-focus-ring-width) * -1);
      }

      :host([aria-disabled='true']) {
        background: transparent;
        color: var(--ems-color-text-disabled);
        cursor: not-allowed;
      }

      .ui-menu-item__icon {
        --ui-icon-size: var(--ems-icon-size-sm);

        display: inline-flex;
        color: inherit;
      }

      .ui-menu-item__icon:empty {
        display: none;
      }

      @media (forced-colors: active) {
        :host(:focus),
        :host(:hover) {
          outline: var(--ems-border-width-hairline) solid Highlight;
        }

        :host([aria-disabled='true']) {
          color: GrayText;
        }
      }
    }
  `,
  host: {
    class: 'ui-menu-item',
    type: 'button',
    '[attr.data-variant]': 'variant()',
    // A static `disabled` goes to CdkMenuItem (aria-disabled); drop the native attribute so the
    // item stays focusable and discoverable, as the APG recommends for menus.
    '[attr.disabled]': 'null',
  },
})
export class MenuItem {
  readonly variant = input<MenuItemVariant>('default');
}

/** A divider between groups of items (`role="separator"`). */
@Component({
  selector: 'ui-menu-separator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``,
  styles: `
    @layer components {
      :host {
        display: block;
        block-size: var(--ems-border-width-hairline);
        margin: var(--ems-space-1) calc(var(--ems-space-1) * -1);
        background-color: var(--ems-color-border-subtle);
      }

      @media (forced-colors: active) {
        :host {
          background-color: CanvasText;
        }
      }
    }
  `,
  host: { class: 'ui-menu-separator', role: 'separator' },
})
export class MenuSeparator {}
