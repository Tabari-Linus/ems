import { Dialog, type DialogRef } from '@angular/cdk/dialog';
import type { ComponentType } from '@angular/cdk/portal';
import {
  inject,
  Injectable,
  type Injector,
  type TemplateRef,
  type ViewContainerRef,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog, type ConfirmOptions } from './confirm-dialog';
import { DialogContainer } from './dialog-container';

export type DialogSize = 'sm' | 'md' | 'lg';

export interface DialogOptions<D = unknown> {
  /** Injected as `DIALOG_DATA`. */
  data?: D;
  /** 416, 512 or 704 px wide (always fits the viewport). Default `md`. */
  size?: DialogSize;
  /** `dialog` (default) or `alertdialog` for confirmations that interrupt. */
  role?: 'dialog' | 'alertdialog';
  /** Accessible name when the content has no `ui-dialog` heading. */
  ariaLabel?: string;
  /**
   * Where focus goes on open: `first-heading` (default: the title is read first),
   * `first-tabbable`, `dialog`, or a CSS selector such as `'#first-name'`.
   */
  autoFocus?: string | boolean;
  /** Prevents Escape and scrim clicks from closing (use for unsaved forms with a guard). */
  disableClose?: boolean;
  viewContainerRef?: ViewContainerRef;
  injector?: Injector;
}

/**
 * Opens modal dialogs on the Angular CDK Dialog: focus is trapped inside, moves to the heading on
 * open and returns to the element that opened it on close; Escape and a click on the scrim close
 * it; the rest of the page is hidden from assistive technology (`aria-modal`).
 *
 * Content is any component or template; use `ui-dialog` inside it for the layout.
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(Dialog);

  open<R = unknown, D = unknown, C = unknown>(
    content: ComponentType<C> | TemplateRef<C>,
    options: DialogOptions<D> = {},
  ): DialogRef<R, C> {
    const size = options.size ?? 'md';
    return this.dialog.open<R, D, C>(content, {
      container: DialogContainer,
      data: options.data,
      role: options.role ?? 'dialog',
      ariaModal: true,
      ariaLabel: options.ariaLabel ?? null,
      autoFocus: options.autoFocus ?? 'first-heading',
      restoreFocus: true,
      disableClose: options.disableClose ?? false,
      hasBackdrop: true,
      // The container sizes itself (size.dialog.*, full screen below breakpoint.narrow).
      maxWidth: '100vw',
      backdropClass: 'ui-dialog-backdrop',
      panelClass: ['ui-dialog-pane', `ui-dialog-pane--${size}`],
      viewContainerRef: options.viewContainerRef,
      injector: options.injector,
    });
  }

  /**
   * Asks a yes/no question. Resolves `true` only when the confirm button is used; Cancel, Escape
   * and a scrim click resolve `false`. Focus starts on Cancel, the least destructive choice.
   *
   * @example
   * if (await dialogs.confirm({ heading: 'Archive Kwame Asante?', confirmLabel: 'Archive', destructive: true })) { … }
   */
  confirm(
    options: ConfirmOptions,
    config: Pick<DialogOptions, 'viewContainerRef' | 'injector'> = {},
  ): Promise<boolean> {
    const ref = this.open<boolean, ConfirmOptions>(ConfirmDialog, {
      ...config,
      data: options,
      size: 'sm',
      role: 'alertdialog',
      autoFocus: '.ui-confirm-dialog__cancel',
    });
    return firstValueFrom(ref.closed).then((result) => result === true);
  }

  /** Closes every open dialog. */
  closeAll(): void {
    this.dialog.closeAll();
  }
}
