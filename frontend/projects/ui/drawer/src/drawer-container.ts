import { CdkPortalOutlet } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { DialogContainer } from '@ems/ui/dialog';

/**
 * The side-sheet surface: the same CDK dialog behaviour as `DialogContainer` (focus trap, focus
 * return, Escape, `aria-modal`), docked to the inline end and full height; full screen on small
 * viewports. Created by `DrawerService`.
 */
@Component({
  selector: 'ui-drawer-container',
  imports: [CdkPortalOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-template cdkPortalOutlet />`,
  styleUrl: './drawer-container.css',
  host: { class: 'ui-drawer-container' },
})
export class DrawerContainer extends DialogContainer {}
