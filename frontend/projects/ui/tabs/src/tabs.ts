import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  ElementRef,
  inject,
  input,
  model,
  viewChildren,
} from '@angular/core';

let nextId = 0;

/** One panel of `ui-tabs`; its `label` becomes the tab. */
@Component({
  selector: 'ui-tab-panel',
  exportAs: 'uiTabPanel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: `
    @layer components {
      :host {
        display: block;
      }

      :host([hidden]) {
        display: none;
      }

      :host(:focus-visible) {
        outline: calc(var(--ems-border-width-hairline) * 2) solid var(--ems-color-border-focus);
        outline-offset: calc(var(--ems-border-width-hairline) * 2);
        border-radius: var(--ems-radius-sm);
      }
    }
  `,
  host: {
    class: 'ui-tab-panel',
    role: 'tabpanel',
    tabindex: '0',
    '[id]': 'id',
    '[attr.aria-labelledby]': 'tabId',
    '[hidden]': '!active()',
  },
})
export class TabPanel {
  /** Tab text. */
  readonly label = input.required<string>();

  readonly id = `ui-tab-panel-${nextId++}`;
  readonly tabId = `${this.id}-tab`;

  private readonly tabs = inject(Tabs);
  readonly active = computed(() => this.tabs.selectedPanel() === this);
}

/**
 * In-page tabs (WAI-ARIA APG *Tabs* with automatic activation): a `tablist` of pill tabs
 * generated from the `ui-tab-panel` children.
 *
 * Keyboard: Tab enters the selected tab, then moves into the panel. Left/Right arrows move
 * between tabs (wrapping) and select them, Home/End jump to the first/last tab.
 *
 * Use routed `nav[uiTabNav]` + `a[uiTab]` instead when each tab has its own URL.
 *
 * @example
 * <ui-tabs label="Profile sections" [(selectedIndex)]="tab">
 *   <ui-tab-panel label="Overview">…</ui-tab-panel>
 *   <ui-tab-panel label="Job">…</ui-tab-panel>
 * </ui-tabs>
 */
@Component({
  selector: 'ui-tabs',
  exportAs: 'uiTabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ui-tabs__list" role="tablist" [attr.aria-label]="label()">
      @for (panel of panels(); track panel.id; let i = $index) {
        <button
          #tab
          type="button"
          role="tab"
          class="ui-tabs__tab"
          [id]="panel.tabId"
          [attr.aria-selected]="i === selected()"
          [attr.aria-controls]="panel.id"
          [attr.tabindex]="i === selected() ? 0 : -1"
          (click)="select(i)"
          (keydown)="onKeydown($event, i)"
        >
          {{ panel.label() }}
        </button>
      }
    </div>
    <div class="ui-tabs__panels"><ng-content /></div>
  `,
  styleUrl: './tabs.css',
  host: { class: 'ui-tabs' },
})
export class Tabs {
  /** Accessible name of the tablist. */
  readonly label = input.required<string>();
  /** Index of the selected tab (two-way: `[(selectedIndex)]`). */
  readonly selectedIndex = model(0);

  protected readonly panels = contentChildren(TabPanel);
  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tab');

  /** The selected index, clamped to the panels that exist. */
  protected readonly selected = computed(() => {
    const count = this.panels().length;
    return count === 0 ? -1 : Math.min(Math.max(0, this.selectedIndex()), count - 1);
  });
  readonly selectedPanel = computed(() => this.panels()[this.selected()] ?? null);

  select(index: number): void {
    this.selectedIndex.set(index);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const count = this.panels().length;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % count;
        break;
      case 'ArrowLeft':
        next = (index - 1 + count) % count;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.select(next);
    this.tabButtons()[next]?.nativeElement.focus();
  }
}
