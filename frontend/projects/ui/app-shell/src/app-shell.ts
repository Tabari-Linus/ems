import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';

let nextId = 0;

/** Below this width the sidebar becomes an off-canvas drawer (keep in sync with app-shell.css). */
export const APP_SHELL_COMPACT_QUERY = '(max-width: 899.98px)';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Application frame: light sidebar (brand, navigation, footer), top bar (search, actions, user
 * menu) and the main content area.
 *
 * Slots (content projection by attribute):
 * - `[uiShellBrand]` logo and organisation name, top of the sidebar.
 * - `[uiShellNav]` the `a[uiNavItem]` links; wrapped in `<nav aria-label="Main">` (`navLabel`).
 * - `[uiShellFooter]` bottom of the sidebar (e.g. a second `<nav aria-label="Workspace">`).
 * - `[uiShellSearch]`, `[uiShellActions]`, `[uiShellUser]` the top bar (inside `<header>`).
 * - default content: the page, inside `<main id="main-content">`.
 *
 * Behaviour:
 * - "Skip to content" link first in the tab order; it moves focus to `<main>`.
 * - Desktop: the sidebar collapses to icons (`collapsed`, two-way bindable).
 * - Below 900px the sidebar is an off-canvas drawer opened by the menu button: the rest of the
 *   page is `inert` while it is open, Escape or the scrim closes it and focus returns to the
 *   menu button. Following a link inside the drawer closes it.
 */
@Component({
  selector: 'ui-app-shell',
  exportAs: 'uiAppShell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
  host: {
    class: 'ui-app-shell',
    '[attr.data-sidebar]': 'sidebarState()',
    '[attr.data-layout]': 'compact() ? "compact" : "wide"',
  },
})
export class AppShell {
  /** Accessible name of the main navigation landmark. */
  readonly navLabel = input('Main');
  /** Whether desktop users can collapse the sidebar to icons. */
  readonly collapsible = input(true, { transform: booleanAttribute });
  /** Desktop sidebar collapsed to icons (two-way: `[(collapsed)]`). */
  readonly collapsed = model(false);
  /** Mobile drawer open (two-way: `[(drawerOpen)]`). Only has an effect below 900px. */
  readonly drawerOpen = model(false);
  /** Id of the `<main>` element, the skip link target. */
  readonly mainId = input('main-content');
  readonly skipLinkLabel = input('Skip to content');
  readonly openMenuLabel = input('Open navigation');
  readonly closeMenuLabel = input('Close navigation');
  readonly collapseLabel = input('Collapse sidebar');
  readonly expandLabel = input('Expand sidebar');

  protected readonly sidebarId = `ui-app-shell-sidebar-${nextId++}`;

  /** True below the compact breakpoint (drawer mode). */
  readonly compact = signal(false);

  protected readonly sidebarState = computed(() => {
    if (this.compact()) {
      return this.drawerOpen() ? 'open' : 'closed';
    }
    return this.collapsible() && this.collapsed() ? 'collapsed' : 'expanded';
  });
  protected readonly drawerVisible = computed(() => this.compact() && this.drawerOpen());

  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly sidebar = viewChild.required<ElementRef<HTMLElement>>('sidebar');
  private readonly menuButton = viewChild<ElementRef<HTMLButtonElement>>('menuButton');
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const view = this.document.defaultView;
      if (!view?.matchMedia) {
        return;
      }
      const query = view.matchMedia(APP_SHELL_COMPACT_QUERY);
      const sync = () => {
        this.compact.set(query.matches);
        if (!query.matches) {
          this.drawerOpen.set(false);
        }
      };
      sync();
      query.addEventListener('change', sync);
      destroyRef.onDestroy(() => query.removeEventListener('change', sync));
    });
  }

  /** Moves focus to `<main>` (skip link). */
  protected skipToContent(event: Event): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }

  toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
  }

  openDrawer(): void {
    this.drawerOpen.set(true);
    // Move focus into the drawer once it is rendered visible (no longer inert).
    afterNextRender(
      () => {
        const first = this.sidebar().nativeElement.querySelector<HTMLElement>(FOCUSABLE);
        (first ?? this.sidebar().nativeElement).focus();
      },
      { injector: this.injector },
    );
  }

  closeDrawer(returnFocus = true): void {
    if (!this.drawerOpen()) {
      return;
    }
    this.drawerOpen.set(false);
    if (returnFocus) {
      afterNextRender(() => this.menuButton()?.nativeElement.focus(), { injector: this.injector });
    }
  }

  protected onSidebarKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.drawerVisible()) {
      event.stopPropagation();
      this.closeDrawer();
    }
  }

  /** Following a link in the drawer closes it (the route changes underneath). */
  protected onSidebarClick(event: MouseEvent): void {
    if (this.drawerVisible() && (event.target as Element | null)?.closest('a[href]')) {
      this.closeDrawer(false);
    }
  }
}
