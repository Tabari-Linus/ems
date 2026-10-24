import { DialogRef } from '@angular/cdk/dialog';
import { ApplicationRef, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DrawerLayout } from './drawer';
import { DrawerService } from './drawer.service';

@Component({
  imports: [DrawerLayout],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-drawer heading="Add person" description="They get an invitation by email.">
      <label>First name <input id="first-name" /></label>
      <button uiDrawerAction type="button" (click)="ref.close()">Cancel</button>
      <button uiDrawerAction type="button" (click)="ref.close('added')">Add person</button>
    </ui-drawer>
  `,
})
class AddPerson {
  readonly ref = inject(DialogRef);
}

async function settle() {
  const appRef = TestBed.inject(ApplicationRef);
  appRef.tick();
  await new Promise((r) => setTimeout(r));
  appRef.tick();
}

describe('DrawerService', () => {
  afterEach(() => TestBed.inject(DrawerService).closeAll());

  it('opens a modal side sheet named by its heading, with actions in the footer', async () => {
    TestBed.inject(DrawerService).open(AddPerson, { size: 'lg' });
    await settle();

    const el = document.querySelector('ui-drawer-container') as HTMLElement;
    expect(el.getAttribute('role')).toBe('dialog');
    expect(el.getAttribute('aria-modal')).toBe('true');
    const heading = el.querySelector('h2') as HTMLElement;
    expect(heading.textContent).toBe('Add person');
    expect(el.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(el.getAttribute('aria-describedby')).toBe(
      el.querySelector('.ui-dialog__description')?.id,
    );
    const footer = Array.from(el.querySelectorAll('.ui-dialog__footer button')).map((b) =>
      b.textContent?.trim(),
    );
    expect(footer).toEqual(['Cancel', 'Add person']);
    expect(el.querySelector('.ui-dialog__body input')).not.toBeNull();
    expect(el.closest('.cdk-overlay-pane')?.classList).toContain('ui-drawer-pane--lg');
    expect(document.querySelector('.ui-drawer-backdrop')).not.toBeNull();
    expect(document.activeElement).toBe(heading);
  });

  it('honours autoFocus and closes with the result', async () => {
    const ref = TestBed.inject(DrawerService).open<string>(AddPerson, { autoFocus: '#first-name' });
    await settle();
    expect(document.activeElement?.id).toBe('first-name');
    const closed = vi.fn();
    ref.closed.subscribe(closed);
    const add = Array.from(document.querySelectorAll('ui-drawer-container button')).find(
      (b) => b.textContent?.trim() === 'Add person',
    ) as HTMLButtonElement;
    add.click();
    expect(closed).toHaveBeenCalledWith('added');
  });
});
