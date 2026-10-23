import { CdkDialogContainer } from '@angular/cdk/dialog';
import { CdkPortalOutlet } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Renderer2,
  ViewEncapsulation,
} from '@angular/core';

/**
 * The dialog surface: CDK's dialog container (focus trap, initial focus, focus return, ARIA
 * `role`/`aria-modal`/`aria-labelledby`) with EMS styling. Created by `DialogService`; not used in
 * templates directly.
 *
 * Its stylesheet is global (`ViewEncapsulation.None`) because it also styles the CDK overlay pane
 * and the scrim (`.ui-dialog-backdrop`), which live outside any component.
 */
@Component({
  selector: 'ui-dialog-container',
  imports: [CdkPortalOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-template cdkPortalOutlet />`,
  styleUrl: './dialog-container.css',
  host: { class: 'ui-dialog-container' },
})
export class DialogContainer extends CdkDialogContainer {
  private readonly renderer = inject(Renderer2);

  /**
   * Points `aria-describedby` at the dialog's description. (CDK only supports a fixed id in the
   * config; the layout component registers its own generated id here.)
   */
  describeBy(id: string | null): void {
    const host = this._elementRef.nativeElement;
    if (id) {
      this.renderer.setAttribute(host, 'aria-describedby', id);
    } else {
      this.renderer.removeAttribute(host, 'aria-describedby');
    }
  }
}
