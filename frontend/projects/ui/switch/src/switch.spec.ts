import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Switch, type SwitchLabelPosition } from './switch';

@Component({
  imports: [Switch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-switch
      name="digest"
      describedBy="digest-hint"
      [(checked)]="on"
      [disabled]="disabled()"
      [labelPosition]="position()"
      >Email me a weekly summary</ui-switch
    >
  `,
})
class Host {
  readonly on = signal(false);
  readonly disabled = signal(false);
  readonly position = signal<SwitchLabelPosition>('after');
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    host: fixture.componentInstance,
    root,
    input: root.querySelector('input') as HTMLInputElement,
    element: root.querySelector('ui-switch') as HTMLElement,
  };
}

describe('Switch', () => {
  it('is a native checkbox with role=switch and a label', async () => {
    const { root, input, element } = await setup();
    expect(input.type).toBe('checkbox');
    expect(input.getAttribute('role')).toBe('switch');
    expect(input.name).toBe('digest');
    expect(input.getAttribute('aria-describedby')).toBe('digest-hint');
    expect((root.querySelector('label') as HTMLLabelElement).htmlFor).toBe(input.id);
    expect(element.dataset['labelPosition']).toBe('after');
  });

  it('toggles and updates the binding; reflects disabled and label position', async () => {
    const { fixture, host, input, element } = await setup();
    input.click();
    expect(host.on()).toBe(true);

    host.disabled.set(true);
    host.position.set('before');
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
    expect(element.hasAttribute('data-disabled')).toBe(true);
    expect(element.dataset['labelPosition']).toBe('before');
  });

  it('focus() focuses the switch', async () => {
    const { fixture, input } = await setup();
    document.body.appendChild(fixture.nativeElement);
    (fixture.debugElement.children[0].componentInstance as Switch).focus();
    expect(document.activeElement).toBe(input);
    fixture.nativeElement.remove();
  });

  it('works with reactive forms', async () => {
    @Component({
      imports: [Switch, ReactiveFormsModule],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<ui-switch [formControl]="control">Dark mode</ui-switch>`,
    })
    class Forms {
      readonly control = new FormControl(true);
    }

    const fixture = TestBed.createComponent(Forms);
    await fixture.whenStable();
    fixture.detectChanges();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input') as HTMLInputElement;
    expect(input.checked).toBe(true);
    input.click();
    expect(fixture.componentInstance.control.value).toBe(false);
    input.dispatchEvent(new Event('blur'));
    expect(fixture.componentInstance.control.touched).toBe(true);
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
  });
});
