import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Pagination, type PaginationVariant } from './pagination';

@Component({
  imports: [Pagination],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ui-pagination
    [(page)]="page"
    [pageSize]="20"
    [total]="total()"
    [variant]="variant()"
    [loading]="loading()"
    [itemLabel]="itemLabel()"
    (loadMore)="more.set($event)"
  />`,
})
class Host {
  readonly page = signal(1);
  readonly total = signal(134);
  readonly variant = signal<PaginationVariant>('pages');
  readonly loading = signal(false);
  readonly itemLabel = signal('people');
  readonly more = signal<number | null>(null);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const el = (fixture.nativeElement as HTMLElement).querySelector('ui-pagination') as HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const update = async (change: (h: Host) => void) => {
    change(fixture.componentInstance);
    await settle();
  };
  const buttons = () => Array.from(el.querySelectorAll('button'));
  const summary = () => el.querySelector('.ui-pagination__summary')?.textContent;
  const instance = fixture.debugElement.children[0].componentInstance as Pagination;
  return { el, settle, update, buttons, summary, instance, host: fixture.componentInstance };
}

describe('Pagination', () => {
  it('shows the range in a labelled nav with a live summary', async () => {
    const { el, summary, buttons } = await setup();
    expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe('Pagination');
    expect(el.querySelector('[aria-live="polite"]')).not.toBeNull();
    expect(summary()).toBe('Showing 1–20 of 134 people');
    const [previous, next] = buttons();
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(false);
  });

  it('pages forward and back, clamped to the range', async () => {
    const { buttons, settle, summary, host, instance } = await setup();
    buttons()[1].click();
    await settle();
    expect(host.page()).toBe(2);
    expect(summary()).toBe('Showing 21–40 of 134 people');
    buttons()[0].click();
    await settle();
    expect(host.page()).toBe(1);

    instance.goTo(99);
    await settle();
    expect(host.page()).toBe(7);
    expect(summary()).toBe('Showing 121–134 of 134 people');
    instance.goTo(7);
    expect(host.page()).toBe(7);
    expect(instance.pageCount()).toBe(7);
  });

  it('moves focus to the other button when the pressed one becomes disabled', async () => {
    const { buttons, settle, update } = await setup();
    await update((h) => h.page.set(6));
    buttons()[1].focus();
    buttons()[1].click();
    await settle();
    expect(buttons()[1].disabled).toBe(true);
    expect(document.activeElement).toBe(buttons()[0]);

    await update((h) => h.page.set(2));
    buttons()[0].click();
    await settle();
    expect(document.activeElement).toBe(buttons()[1]);
  });

  it('clamps an invalid page and handles no results', async () => {
    const { update, summary } = await setup();
    await update((h) => h.page.set(Number.NaN));
    expect(summary()).toBe('Showing 1–20 of 134 people');
    await update((h) => {
      h.total.set(0);
      h.itemLabel.set('');
    });
    expect(summary()).toBe('No results');
  });

  it('load-more variant: count so far and a button that asks for the next page', async () => {
    const { update, summary, buttons, settle, host } = await setup();
    await update((h) => h.variant.set('load-more'));
    expect(summary()).toBe('Showing 20 of 134 people');
    expect(buttons()).toHaveLength(1);
    buttons()[0].click();
    await settle();
    expect(host.more()).toBe(2);

    await update((h) => {
      h.more.set(null);
      h.loading.set(true);
    });
    buttons()[0].click();
    expect(host.more()).toBeNull();

    await update((h) => h.page.set(7));
    expect(buttons()).toHaveLength(0);
  });

  it('omits the noun when no item label is given', async () => {
    const { update, summary } = await setup();
    await update((h) => h.itemLabel.set(''));
    expect(summary()).toBe('Showing 1–20 of 134');
  });
});
