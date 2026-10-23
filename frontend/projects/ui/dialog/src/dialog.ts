import { type CdkDialogContainer, DialogRef } from '@angular/cdk/dialog';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  type OnInit,
} from '@angular/core';
import { DialogContainer } from './dialog-container';

let nextId = 0;

/**
 * Layout for dialog content: heading, optional description, scrollable body and a footer for
 * actions (mark each button `uiDialogAction`). Use it as the root of a component or template opened with
 * `DialogService.open()`.
 *
 * It names the dialog: the heading becomes `aria-labelledby` and the description
 * `aria-describedby` of the dialog container. The close button (`showClose`) closes the dialog
 * with no result, like Escape and a click on the scrim.
 *
 * @example
 * <ui-dialog heading="Edit office" description="Changes apply to everyone in this office.">
 *   …form…
 *   <button uiDialogAction uiButton variant="secondary" (click)="ref.close()">Cancel</button>
 *   <button uiDialogAction uiButton (click)="save()">Save changes</button>
 * </ui-dialog>
 */
@Component({
  selector: 'ui-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="ui-dialog__header">
      <div class="ui-dialog__titles">
        <h2 class="ui-dialog__heading" [id]="headingId" tabindex="-1">{{ heading() }}</h2>
        @if (description()) {
          <p class="ui-dialog__description" [id]="descriptionId">{{ description() }}</p>
        }
      </div>
      @if (showClose()) {
        <button
          type="button"
          class="ui-dialog__close"
          [attr.aria-label]="closeLabel()"
          (click)="close()"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      }
    </header>
    <div class="ui-dialog__body"><ng-content /></div>
    <footer class="ui-dialog__footer"><ng-content select="[uiDialogAction]" /></footer>
  `,
  styleUrl: './dialog.css',
  host: { class: 'ui-dialog' },
})
export class DialogLayout implements OnInit {
  /** Dialog title; also its accessible name. */
  readonly heading = input.required<string>();
  /** One or two sentences under the heading; also the accessible description. */
  readonly description = input<string>();
  /** Shows the close (×) button. */
  readonly showClose = input(true, { transform: booleanAttribute });
  /** Accessible name of the close button. */
  readonly closeLabel = input('Close');

  protected readonly headingId = `ui-dialog-heading-${nextId}`;
  protected readonly descriptionId = `ui-dialog-description-${nextId++}`;
  private readonly ref = inject(DialogRef, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const container = this.ref?.containerInstance as CdkDialogContainer | undefined;
    if (!container) return;
    // After this change-detection pass (like Angular Material's dialog title), so the container's
    // host bindings do not change while they are being checked.
    queueMicrotask(() => {
      container._addAriaLabelledBy(this.headingId);
      if (container instanceof DialogContainer && this.description()) {
        container.describeBy(this.descriptionId);
      }
    });
    this.destroyRef.onDestroy(() => container._removeAriaLabelledBy(this.headingId));
  }

  /** Closes the dialog without a result. */
  close(): void {
    this.ref?.close();
  }
}
