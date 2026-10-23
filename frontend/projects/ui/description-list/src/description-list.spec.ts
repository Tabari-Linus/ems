import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DescriptionItem, DescriptionList } from './description-list';

@Component({
  imports: [DescriptionList, DescriptionItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dl uiDescriptionList [columns]="columns()">
      <div uiDescriptionItem label="Department" span="full">Platform Engineering</div>
      <div
        uiDescriptionItem
        label="Employee no."
        mono
        copyable
        [copyValue]="copyValue()"
        [feedbackDuration]="50"
      >
        GH-ACC-0042
      </div>
      <div uiDescriptionItem label="Work email" span="3">kwame.asante&#64;akwaabalabs.example</div>
    </dl>
  `,
})
class Host {
  readonly columns = signal<unknown>(3);
  readonly copyValue = signal<string | null>(null);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const dl = root.querySelector('dl') as HTMLElement;
  const button = root.querySelector('button') as HTMLButtonElement;
  const items = root.querySelectorAll('[uiDescriptionItem]');
  const copier = fixture.debugElement
    .queryAll(By.directive(DescriptionItem))
    .find((de) => (de.nativeElement as HTMLElement).hasAttribute('data-mono'))
    ?.injector.get(DescriptionItem) as DescriptionItem;
  const update = async (change: (h: Host) => void) => {
    change(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { fixture, root, dl, button, items, copier, update, settle };
}

describe('DescriptionList', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders dt/dd pairs with columns, span and mono', async () => {
    const { dl, items } = await setup();
    expect(dl.dataset['columns']).toBe('3');
    expect(items[0].querySelector('dt')?.textContent).toBe('Department');
    expect(items[0].querySelector('dd')?.textContent?.trim()).toBe('Platform Engineering');
    expect(items[0].getAttribute('data-span')).toBe('full');
    expect(items[1].hasAttribute('data-mono')).toBe(true);
    expect(items[0].querySelector('button')).toBeNull();
  });

  it.each([
    [1, '1'],
    ['2', '2'],
    [9, '2'],
  ])('columns %s → %s', async (value, expected) => {
    const { dl, update } = await setup();
    await update((h) => h.columns.set(value));
    expect(dl.dataset['columns']).toBe(expected);
    // A span never exceeds the column count.
    expect(dl.querySelectorAll('[uiDescriptionItem]')[2].getAttribute('data-span')).toBe(expected);
  });

  it('names the copy button after the label', async () => {
    const { button } = await setup();
    expect(button.getAttribute('aria-label')).toBe('Copy employee no.');
  });

  it('copies with the Clipboard API and announces "Copied", then resets', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    const { copier, root, settle } = await setup();

    await expect(copier.copy()).resolves.toBe(true);
    await settle();
    expect(writeText).toHaveBeenCalledWith('GH-ACC-0042');
    expect(root.querySelector('[role="status"]')?.textContent).toBe('Copied');
    expect(root.querySelector('button')?.getAttribute('data-state')).toBe('copied');

    await new Promise((resolve) => setTimeout(resolve, 80));
    await settle();
    expect(root.querySelector('[role="status"]')?.textContent).toBe('');
    vi.unstubAllGlobals();
  });

  it('copies copyValue when given', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    const { copier, update } = await setup();
    await update((h) => h.copyValue.set('0042'));
    await copier.copy();
    expect(writeText).toHaveBeenCalledWith('0042');
    vi.unstubAllGlobals();
  });

  it('falls back to execCommand when the Clipboard API fails', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    const exec = vi.fn().mockReturnValue(true);
    (document as unknown as { execCommand: unknown }).execCommand = exec;
    const { copier, root, settle, button } = await setup();
    button.focus();

    await expect(copier.copy()).resolves.toBe(true);
    await settle();
    expect(exec).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
    expect(document.activeElement).toBe(button);
    expect(root.querySelector('[role="status"]')?.textContent).toBe('Copied');
    vi.unstubAllGlobals();
  });

  it('reports failure when no copy method works', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: undefined });
    (document as unknown as { execCommand: unknown }).execCommand = vi.fn(() => {
      throw new Error('nope');
    });
    const { copier, root, settle } = await setup();

    await expect(copier.copy()).resolves.toBe(false);
    await settle();
    expect(root.querySelector('[role="status"]')?.textContent).toContain('Copy failed');
    expect(root.querySelector('button')?.getAttribute('data-state')).toBe('failed');
    vi.unstubAllGlobals();
  });

  it('clicking the button copies', async () => {
    const { copier, button } = await setup();
    const spy = vi.spyOn(copier, 'copy').mockResolvedValue(true);
    button.click();
    expect(spy).toHaveBeenCalled();
  });
});
