import { DialogRef } from '@angular/cdk/dialog';
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  inject,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DialogLayout } from './dialog';
import { DialogService } from './dialog.service';
import { press } from '../../testing/keyboard';

@Component({
  imports: [DialogLayout],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-dialog heading="Edit office" description="Changes apply to everyone in Accra.">
      <label>Office name <input id="office-name" value="Accra" /></label>
      <button uiDialogAction type="button" (click)="ref.close('saved')">Save changes</button>
    </ui-dialog>
  `,
})
class EditOffice {
  readonly ref = inject(DialogRef);
}

@Component({
  imports: [DialogLayout],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button id="opener" type="button">Open</button>
    <ng-template #tpl><ui-dialog heading="No description" [showClose]="false" /></ng-template>
  `,
})
class Host {
  readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
}

async function settle() {
  const appRef = TestBed.inject(ApplicationRef);
  appRef.tick();
  await new Promise((r) => setTimeout(r));
  appRef.tick();
}

function container(): HTMLElement {
  return document.querySelector('ui-dialog-container') as HTMLElement;
}

describe('DialogService', () => {
  afterEach(() => TestBed.inject(DialogService).closeAll());

  it('opens a component in the styled container, named and described by the layout', async () => {
    const dialogs = TestBed.inject(DialogService);
    dialogs.open(EditOffice, { size: 'lg' });
    await settle();

    const el = container();
    expect(el.getAttribute('role')).toBe('dialog');
    expect(el.getAttribute('aria-modal')).toBe('true');
    const heading = el.querySelector('h2') as HTMLElement;
    expect(heading.textContent).toBe('Edit office');
    expect(el.getAttribute('aria-labelledby')).toBe(heading.id);
    const description = el.querySelector('.ui-dialog__description') as HTMLElement;
    expect(el.getAttribute('aria-describedby')).toBe(description.id);
    expect(el.closest('.cdk-overlay-pane')?.classList).toContain('ui-dialog-pane--lg');
    expect(document.querySelector('.ui-dialog-backdrop')).not.toBeNull();
    // Initial focus: the heading, so the title is read first.
    expect(document.activeElement).toBe(heading);
  });

  it('closes with a result from the content, and with undefined from the close button', async () => {
    const dialogs = TestBed.inject(DialogService);
    const ref = dialogs.open<string>(EditOffice);
    await settle();
    const closed = vi.fn();
    ref.closed.subscribe(closed);
    (container().querySelector('.ui-dialog__footer button') as HTMLButtonElement).click();
    expect(closed).toHaveBeenCalledWith('saved');

    const second = dialogs.open<string>(EditOffice);
    await settle();
    const closedSecond = vi.fn();
    second.closed.subscribe(closedSecond);
    const close = container().querySelector('.ui-dialog__close') as HTMLButtonElement;
    expect(close.getAttribute('aria-label')).toBe('Close');
    close.click();
    expect(closedSecond).toHaveBeenCalledWith(undefined);
    await settle();
    expect(container()).toBeNull();
  });

  it('opens a template; without a description there is no aria-describedby', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    TestBed.inject(DialogService).open(fixture.componentInstance.tpl(), { ariaLabel: undefined });
    await settle();
    expect(container().hasAttribute('aria-describedby')).toBe(false);
    expect(container().querySelector('.ui-dialog__close')).toBeNull();
  });

  it('describeBy(null) removes the description reference', async () => {
    const ref = TestBed.inject(DialogService).open(EditOffice);
    await settle();
    (ref.containerInstance as unknown as { describeBy(id: string | null): void }).describeBy(null);
    expect(container().hasAttribute('aria-describedby')).toBe(false);
  });

  it.each<[string, boolean | undefined]>([
    ['confirm', true],
    ['cancel', false],
  ])('confirm() resolves after %s', async (choice, expected) => {
    const dialogs = TestBed.inject(DialogService);
    const answer = dialogs.confirm({
      heading: 'Archive Kwame Asante?',
      description: 'Kwame loses access to EMS right away.',
      confirmLabel: 'Archive',
      destructive: true,
    });
    await settle();

    const el = container();
    expect(el.getAttribute('role')).toBe('alertdialog');
    const [cancel, confirm] = Array.from(el.querySelectorAll('button'));
    expect(cancel.textContent?.trim()).toBe('Cancel');
    expect(confirm.textContent?.trim()).toBe('Archive');
    expect(confirm.dataset['variant']).toBe('danger');
    expect(document.activeElement).toBe(cancel);

    (choice === 'confirm' ? confirm : cancel).click();
    await expect(answer).resolves.toBe(expected);
  });

  it('confirm() resolves false on Escape; non-destructive uses the primary button', async () => {
    const dialogs = TestBed.inject(DialogService);
    const answer = dialogs.confirm({ heading: 'Send the invitation again?' });
    await settle();
    const buttons = container().querySelectorAll('button');
    expect(buttons[1].textContent?.trim()).toBe('Confirm');
    expect(buttons[1].dataset['variant']).toBe('primary');

    press('Escape', document.body);
    await expect(answer).resolves.toBe(false);
  });
});
