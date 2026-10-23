import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Button } from '@ems/ui/button';
import { DialogLayout } from './dialog';

export interface ConfirmOptions {
  /** The question, naming the thing: "Archive Kwame Asante?" */
  heading: string;
  /** What will happen and whether it can be undone. */
  description?: string;
  /** Verb for the confirming button: "Archive". Default "Confirm". */
  confirmLabel?: string;
  /** Default "Cancel". */
  cancelLabel?: string;
  /** Styles the confirm button as danger. Focus still starts on Cancel. */
  destructive?: boolean;
}

/**
 * The dialog behind `DialogService.confirm()`: an `alertdialog` with Cancel and a confirm button.
 * Closes with `true` (confirmed) or `false`/`undefined` (Cancel, Escape, scrim).
 */
@Component({
  selector: 'ui-confirm-dialog',
  imports: [DialogLayout, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-dialog [heading]="options.heading" [description]="options.description" [showClose]="false">
      <button
        uiDialogAction
        uiButton
        class="ui-confirm-dialog__cancel"
        variant="secondary"
        type="button"
        (click)="ref.close(false)"
      >
        {{ options.cancelLabel ?? 'Cancel' }}
      </button>
      <button
        uiDialogAction
        uiButton
        type="button"
        [variant]="options.destructive ? 'danger' : 'primary'"
        (click)="ref.close(true)"
      >
        {{ options.confirmLabel ?? 'Confirm' }}
      </button>
    </ui-dialog>
  `,
})
export class ConfirmDialog {
  protected readonly options = inject<ConfirmOptions>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
}
