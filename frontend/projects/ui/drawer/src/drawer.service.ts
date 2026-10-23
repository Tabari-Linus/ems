import { Dialog, type DialogRef } from '@angular/cdk/dialog';
import { createGlobalPositionStrategy } from '@angular/cdk/overlay';
import type { ComponentType } from '@angular/cdk/portal';
import {
  inject,
  Injectable,
  Injector,
  type TemplateRef,
  type ViewContainerRef,
} from '@angular/core';
import { DrawerContainer } from './drawer-container';

export type DrawerSize = 'md' | 'lg';

export interface DrawerOptions<D = unknown> {
  /** Injected as `DIALOG_DATA`. */
  data?: D;
  /** 480 px (default) or 640 px wide; always full screen below 640 px. */
  size?: DrawerSize;
  /** Accessible name when the content has no `ui-drawer` heading. */
  ariaLabel?: string;
  /**
   * Initial focus: `first-heading` (default), `first-tabbable`, or a selector such as
   * `'#first-name'` to start typing straight away.
   */
  autoFocus?: string | boolean;
  /** Prevents Escape and scrim clicks from closing (unsaved changes guard). */
  disableClose?: boolean;
  viewContainerRef?: ViewContainerRef;
  injector?: Injector;
}

/**
 * Opens a side sheet docked to the inline end (full screen on phones) for create/edit forms,
 * on the Angular CDK Dialog: modal, focus trapped, Escape and scrim close, focus returns to the
 * trigger. Use `ui-drawer` for the layout.
 */
@Injectable({ providedIn: 'root' })
export class DrawerService {
  private readonly dialog = inject(Dialog);
  private readonly injector = inject(Injector);

  open<R = unknown, D = unknown, C = unknown>(
    content: ComponentType<C> | TemplateRef<C>,
    options: DrawerOptions<D> = {},
  ): DialogRef<R, C> {
    return this.dialog.open<R, D, C>(content, {
      container: DrawerContainer,
      data: options.data,
      role: 'dialog',
      ariaModal: true,
      ariaLabel: options.ariaLabel ?? null,
      autoFocus: options.autoFocus ?? 'first-heading',
      restoreFocus: true,
      disableClose: options.disableClose ?? false,
      hasBackdrop: true,
      backdropClass: 'ui-drawer-backdrop',
      panelClass: ['ui-drawer-pane', `ui-drawer-pane--${options.size ?? 'md'}`],
      positionStrategy: createGlobalPositionStrategy(this.injector).end('0').top('0'),
      height: '100%',
      maxWidth: '100vw',
      viewContainerRef: options.viewContainerRef,
      injector: options.injector,
    });
  }

  /** Closes every open dialog and drawer. */
  closeAll(): void {
    this.dialog.closeAll();
  }
}
