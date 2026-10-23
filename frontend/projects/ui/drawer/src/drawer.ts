import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DialogLayout } from '@ems/ui/dialog';

/**
 * Layout for drawer content (create/edit forms): heading, optional description, a body that
 * scrolls, and footer actions pinned to the bottom (mark each button `uiDrawerAction`). Names the
 * drawer like `ui-dialog` does (`aria-labelledby` / `aria-describedby`).
 *
 * @example
 * <ui-drawer heading="Add person" description="They get an invitation by email.">
 *   …form fields…
 *   <button uiDrawerAction uiButton variant="secondary" (click)="ref.close()">Cancel</button>
 *   <button uiDrawerAction uiButton (click)="save()">Add person</button>
 * </ui-drawer>
 */
@Component({
  selector: 'ui-drawer',
  imports: [DialogLayout],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-dialog
      [heading]="heading()"
      [description]="description()"
      [showClose]="showClose()"
      [closeLabel]="closeLabel()"
    >
      <ng-content />
      <ng-content select="[uiDrawerAction]" ngProjectAs="[uiDialogAction]" />
    </ui-dialog>
  `,
  styles: `
    :host {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-block-size: 0;
    }
  `,
  host: { class: 'ui-drawer' },
})
export class DrawerLayout {
  readonly heading = input.required<string>();
  readonly description = input<string>();
  readonly showClose = input(true, { transform: booleanAttribute });
  readonly closeLabel = input('Close');
}
